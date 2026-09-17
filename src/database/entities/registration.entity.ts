import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { RegistrationStatus } from '../../common/enums/registration-status.enum';
import { BaseEntity } from './base.entity';
import { Event } from './event.entity';
import { Ticket } from './ticket.entity';
import { User } from './user.entity';

@Entity('event_registrations')
@Index('UQ_event_registrations_user_idempotency_key', ['userId', 'idempotencyKey'], { unique: true })
@Index('IDX_event_registrations_event_status_created_at', ['eventId', 'status', 'createdAt'])
@Index('IDX_event_registrations_user_created_at', ['userId', 'createdAt'])
@Check('CHK_event_registrations_quantity', '"quantity" > 0')
@Check('CHK_event_registrations_total_amount', '"total_amount" >= 0')
export class Registration extends BaseEntity {
  @Column({ type: 'varchar', default: RegistrationStatus.Confirmed })
  status!: RegistrationStatus;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount!: string;

  @Column({ name: 'idempotency_key', length: 80 })
  idempotencyKey!: string;

  @Column({ name: 'cancelled_at', type: Date, nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.registrations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'event_id' })
  eventId!: string;

  @ManyToOne(() => Event, (event) => event.registrations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'event_id' })
  event!: Event;

  @OneToMany(() => Ticket, (ticket) => ticket.registration, { cascade: ['insert'] })
  tickets!: Ticket[];
}
