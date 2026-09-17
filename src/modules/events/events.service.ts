import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Brackets, Repository } from 'typeorm';
import { EventStatus } from '../../common/enums/event-status.enum';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { AuditTargetType } from '../../common/enums/audit-target-type.enum';
import { Event, Registration, TicketType } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { CreateEventDto } from './dto/create-event.dto';
import { SearchEventsDto } from './dto/search-events.dto';
import { SearchRegistrationsDto } from './dto/search-registrations.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly eventsRepository: Repository<Event>,
    private readonly auditService: AuditService,
  ) {}

  async search(query: SearchEventsDto) {
    const builder = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.ticketTypes', 'ticketType')
      .leftJoin('event.organizer', 'organizer')
      .addSelect(['organizer.id', 'organizer.fullName'])
      .where('event.status = :published', { published: EventStatus.Published })
      .orderBy('event.startAt', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.q) {
      builder.andWhere(new Brackets((sub) => {
        sub.where('LOWER(event.title) LIKE LOWER(:q)', { q: `%${query.q}%` })
          .orWhere('LOWER(event.venue) LIKE LOWER(:q)', { q: `%${query.q}%` });
      }));
    }
    if (query.categoryId) builder.andWhere('event.categoryId = :categoryId', { categoryId: query.categoryId });
    if (query.from) builder.andWhere('event.startAt >= :from', { from: new Date(query.from) });
    if (query.to) builder.andWhere('event.startAt <= :to', { to: new Date(query.to) });

    const [items, total] = await builder.getManyAndCount();
    return { items, meta: { page: query.page, limit: query.limit, total } };
  }

  async findBySlug(slug: string) {
    const event = await this.eventsRepository.findOne({
      where: { slug, status: EventStatus.Published },
      relations: { category: true, ticketTypes: true, organizer: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(organizerId: string, dto: CreateEventDto) {
    this.validateDates(dto.startAt, dto.endAt);
    const event = this.eventsRepository.create({
      ...dto,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      organizerId,
      slug: `${this.slugify(dto.title)}-${randomUUID().slice(0, 8)}`,
      ticketTypes: dto.ticketTypes.map((item) => Object.assign(new TicketType(), item)),
    });
    const result = await this.eventsRepository.save(event);
    await this.auditService.record({
      actorUserId: organizerId,
      action: AuditAction.EventCreated,
      targetType: AuditTargetType.Event,
      targetId: result.id,
      details: { title: result.title, status: result.status },
    });
    return result;
  }

  async update(id: string, organizerId: string, dto: UpdateEventDto) {
    const event = await this.findOwned(id, organizerId);
    if (event.status !== EventStatus.Draft) throw new BadRequestException('Only draft events can be edited');
    if (event.version !== dto.version) throw new ConflictException('Event was modified by another request');
    const startAt = dto.startAt ?? event.startAt.toISOString();
    const endAt = dto.endAt ?? event.endAt.toISOString();
    this.validateDates(startAt, endAt);
    Object.assign(event, dto, {
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      slug: dto.title ? `${this.slugify(dto.title)}-${event.id.slice(0, 8)}` : event.slug,
    });
    const result = await this.eventsRepository.save(event);
    await this.auditService.record({
      actorUserId: organizerId,
      action: AuditAction.EventUpdated,
      targetType: AuditTargetType.Event,
      targetId: id,
      details: { fields: Object.keys(dto) },
    });
    return result;
  }

  async publish(id: string, organizerId: string) {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: { ticketTypes: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenException('You do not own this event');
    if (event.status !== EventStatus.Draft || !event.ticketTypes.length || event.startAt <= new Date()) {
      throw new BadRequestException('Event is not ready to publish');
    }
    event.status = EventStatus.Published;
    await this.eventsRepository.save(event);
    await this.auditService.record({
      actorUserId: organizerId,
      action: AuditAction.EventPublished,
      targetType: AuditTargetType.Event,
      targetId: id,
    });
    return { id: event.id, status: event.status };
  }

  async setCover(id: string, organizerId: string, coverUrl: string) {
    const event = await this.findOwned(id, organizerId);
    event.coverUrl = coverUrl;
    await this.eventsRepository.save(event);
    await this.auditService.record({
      actorUserId: organizerId,
      action: AuditAction.EventCoverUpdated,
      targetType: AuditTargetType.Event,
      targetId: id,
      details: { coverUrl },
    });
    return { fileId: coverUrl.split('/').at(-1), url: coverUrl };
  }

  async registrations(id: string, organizerId: string, query: SearchRegistrationsDto) {
    await this.findOwned(id, organizerId);
    const builder = this.eventsRepository.manager
      .createQueryBuilder(Registration, 'registration')
      .innerJoin('registration.user', 'user')
      .addSelect(['user.id', 'user.email', 'user.fullName'])
      .leftJoinAndSelect('registration.tickets', 'ticket')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .where('registration.eventId = :id', { id })
      .orderBy('registration.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    if (query.status) builder.andWhere('registration.status = :status', { status: query.status });
    if (query.q) {
      builder.andWhere(
        '(LOWER(user.email) LIKE LOWER(:q) OR LOWER(user.fullName) LIKE LOWER(:q))',
        { q: `%${query.q}%` },
      );
    }
    const [items, total] = await builder.getManyAndCount();
    return { items, meta: { page: query.page, limit: query.limit, total } };
  }

  private async findOwned(id: string, organizerId: string) {
    const event = await this.eventsRepository.findOneBy({ id });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId) throw new ForbiddenException('You do not own this event');
    return event;
  }

  private validateDates(startAt: string, endAt: string): void {
    if (new Date(startAt) >= new Date(endAt)) {
      throw new BadRequestException('endAt must be after startAt');
    }
  }

  private slugify(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
