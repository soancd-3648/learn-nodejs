import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EventStatus } from '../../common/enums/event-status.enum';
import { BaseEntity } from './base.entity';
import { Category } from './category.entity';
import { Registration } from './registration.entity';
import { TicketType } from './ticket-type.entity';
import { User } from './user.entity';

@Entity('events')
@Index('IDX_events_status_start_at', ['status', 'startAt'])
@Index('IDX_events_category_status_start_at', ['categoryId', 'status', 'startAt'])
@Index('IDX_events_organizer_created_at', ['organizerId', 'createdAt'])
@Check('CHK_events_date_range', '"end_at" > "start_at"')
export class Event extends BaseEntity {
  @Column({ length: 180 })
  title!: string;

  @Index('UQ_events_slug', { unique: true })
  @Column({ length: 200 })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 255 })
  venue!: string;

  @Column({ name: 'start_at' })
  startAt!: Date;

  @Column({ name: 'end_at' })
  endAt!: Date;

  @Column({ type: 'varchar', default: EventStatus.Draft })
  status!: EventStatus;

  @Column({ name: 'cover_url', type: 'varchar', nullable: true })
  coverUrl!: string | null;

  @Column({ name: 'reminder_sent_at', type: Date, nullable: true })
  reminderSentAt!: Date | null;

  @Column({ name: 'organizer_id' })
  organizerId!: string;

  @ManyToOne(() => User, (user) => user.events, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organizer_id' })
  organizer!: User;

  @Column({ name: 'category_id' })
  categoryId!: string;

  @ManyToOne(() => Category, (category) => category.events, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @OneToMany(() => TicketType, (ticketType) => ticketType.event, { cascade: ['insert'] })
  ticketTypes!: TicketType[];

  @OneToMany(() => Registration, (registration) => registration.event)
  registrations!: Registration[];
}
