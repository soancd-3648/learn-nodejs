import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { EventStatus } from '../../common/enums/event-status.enum';
import { RegistrationStatus } from '../../common/enums/registration-status.enum';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { AuditTargetType } from '../../common/enums/audit-target-type.enum';
import { Event, Registration, Ticket, TicketType } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { CheckInDto } from './dto/check-in.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Registration) private readonly registrationsRepository: Repository<Registration>,
    @InjectRepository(Ticket) private readonly ticketsRepository: Repository<Ticket>,
    private readonly auditService: AuditService,
  ) {}

  async create(eventId: string, userId: string, dto: CreateRegistrationDto) {
    const existing = await this.registrationsRepository.findOne({
      where: { userId, idempotencyKey: dto.idempotencyKey },
      relations: { tickets: true },
    });
    if (existing) return existing;

    return this.dataSource.transaction(async (manager) => {
      const event = await manager.findOne(Event, { where: { id: eventId } });
      if (!event || event.status !== EventStatus.Published) throw new NotFoundException('Published event not found');
      if (event.startAt <= new Date()) throw new BadRequestException('Registration is closed');

      const ticketType = await manager
        .createQueryBuilder(TicketType, 'ticketType')
        .setLock('pessimistic_write')
        .where('ticketType.id = :ticketTypeId AND ticketType.eventId = :eventId', {
          ticketTypeId: dto.ticketTypeId,
          eventId,
        })
        .getOne();
      if (!ticketType) throw new NotFoundException('Ticket type not found');
      if (ticketType.sold + dto.quantity > ticketType.capacity) throw new ConflictException('Not enough tickets');

      ticketType.sold += dto.quantity;
      await manager.save(ticketType);
      const registration = manager.create(Registration, {
        userId,
        eventId,
        quantity: dto.quantity,
        totalAmount: (Number(ticketType.price) * dto.quantity).toFixed(2),
        idempotencyKey: dto.idempotencyKey,
        status: RegistrationStatus.Confirmed,
      });
      registration.tickets = Array.from({ length: dto.quantity }, () => manager.create(Ticket, {
        ticketTypeId: ticketType.id,
        qrToken: createHash('sha256').update(randomUUID()).digest('hex'),
      }));
      const result = await manager.save(registration);
      await this.auditService.record({
        actorUserId: userId,
        action: AuditAction.RegistrationCreated,
        targetType: AuditTargetType.Registration,
        targetId: result.id,
        details: { eventId, ticketTypeId: ticketType.id, quantity: dto.quantity },
      }, manager);
      return result;
    });
  }

  async findMine(userId: string, page: number, limit: number) {
    const [items, total] = await this.registrationsRepository.findAndCount({
      where: { userId },
      relations: { event: true, tickets: { ticketType: true } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: { page, limit, total } };
  }

  async cancel(id: string, userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const registration = await manager.findOne(Registration, {
        where: { id, userId },
        relations: { event: true, tickets: true },
      });
      if (!registration) throw new NotFoundException('Registration not found');
      if (registration.status === RegistrationStatus.Cancelled) return;
      if (registration.event.startAt.getTime() - Date.now() < 86400000) {
        throw new BadRequestException('Cannot cancel within 24 hours of the event');
      }
      registration.status = RegistrationStatus.Cancelled;
      registration.cancelledAt = new Date();
      await manager.save(registration);
      await manager.decrement(TicketType, { id: registration.tickets[0].ticketTypeId }, 'sold', registration.quantity);
      await this.auditService.record({
        actorUserId: userId,
        action: AuditAction.RegistrationCancelled,
        targetType: AuditTargetType.Registration,
        targetId: registration.id,
        details: { eventId: registration.eventId },
      }, manager);
    });
  }

  async checkIn(actorUserId: string, dto: CheckInDto) {
    const checkedInAt = new Date();
    const result = await this.ticketsRepository
      .createQueryBuilder()
      .update(Ticket)
      .set({ checkedInAt })
      .where('qrToken = :qrToken AND checkedInAt IS NULL', { qrToken: dto.qrToken })
      .execute();
    if (result.affected !== 1) throw new ConflictException('Ticket is invalid or already checked in');
    const ticket = await this.ticketsRepository.findOneBy({ qrToken: dto.qrToken });
    await this.auditService.record({
      actorUserId,
      action: AuditAction.TicketCheckedIn,
      targetType: AuditTargetType.Ticket,
      targetId: ticket?.id,
    });
    return { ticketId: ticket?.id, checkedInAt };
  }
}
