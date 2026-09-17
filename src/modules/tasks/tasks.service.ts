import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { EventStatus } from '../../common/enums/event-status.enum';
import { Event, Registration } from '../../database/entities';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Event) private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Registration) private readonly registrationsRepository: Repository<Registration>,
    private readonly mailService: MailService,
  ) {}

  @Cron('0 */15 * * * *', { name: 'event-reminders' })
  async enqueueUpcomingEventReminders(): Promise<void> {
    const now = new Date();
    const inTwentyFourHours = new Date(now.getTime() + 86400000);
    const events = await this.eventsRepository.find({
      where: {
        status: EventStatus.Published,
        reminderSentAt: IsNull(),
        startAt: Between(now, inTwentyFourHours),
      },
    });
    for (const event of events) {
      const registrations = await this.registrationsRepository.find({
        where: { eventId: event.id },
        relations: { user: true },
        select: { id: true, user: { id: true, email: true } },
      });
      await Promise.all(registrations.map(({ user }) =>
        this.mailService.enqueueEventReminder(user.email, event.title, event.startAt.toISOString()),
      ));
      await this.eventsRepository.update(event.id, { reminderSentAt: new Date() });
    }
    this.logger.log(`Processed reminders for ${events.length} event(s)`);
  }
}
