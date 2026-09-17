import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Event } from './event.entity';
import { Ticket } from './ticket.entity';

@Entity('event_ticket_types')
@Index('UQ_event_ticket_types_event_name', ['eventId', 'name'], { unique: true })
@Check('CHK_event_ticket_types_inventory', '"capacity" >= 0 AND "sold" >= 0 AND "sold" <= "capacity"')
@Check('CHK_event_ticket_types_price', '"price" >= 0')
export class TicketType extends BaseEntity {
  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price!: string;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ type: 'int', default: 0 })
  sold!: number;

  @Column({ name: 'event_id' })
  eventId!: string;

  @ManyToOne(() => Event, (event) => event.ticketTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event!: Event;

  @OneToMany(() => Ticket, (ticket) => ticket.ticketType)
  tickets!: Ticket[];
}
