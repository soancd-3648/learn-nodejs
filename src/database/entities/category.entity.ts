import { Column, DeleteDateColumn, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Event } from './event.entity';

@Entity('event_categories')
@Index('IDX_event_categories_name', ['name'])
export class Category extends BaseEntity {
  @Column({ length: 100 })
  name!: string;

  @Index('UQ_event_categories_slug', { unique: true })
  @Column({ length: 120 })
  slug!: string;

  @DeleteDateColumn({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => Event, (event) => event.category)
  events!: Event[];
}
