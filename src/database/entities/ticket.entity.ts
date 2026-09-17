import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Registration } from './registration.entity';
import { TicketType } from './ticket-type.entity';

@Entity('tickets')
@Index('IDX_tickets_registration_id', ['registrationId'])
@Index('IDX_tickets_ticket_type_id', ['ticketTypeId'])
export class Ticket extends BaseEntity {
  @Index('UQ_tickets_qr_token', { unique: true })
  @Column({ name: 'qr_token', length: 64 })
  qrToken!: string;

  @Column({ name: 'checked_in_at', type: Date, nullable: true })
  checkedInAt!: Date | null;

  @Column({ name: 'registration_id' })
  registrationId!: string;

  @ManyToOne(() => Registration, (registration) => registration.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registration_id' })
  registration!: Registration;

  @Column({ name: 'ticket_type_id' })
  ticketTypeId!: string;

  @ManyToOne(() => TicketType, (ticketType) => ticketType.tickets, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType!: TicketType;
}
