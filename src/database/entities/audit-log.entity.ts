import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
@Index('IDX_audit_logs_actor_created_at', ['actorUserId', 'createdAt'])
@Index('IDX_audit_logs_target', ['targetType', 'targetId'])
@Index('IDX_audit_logs_created_at', ['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser!: User | null;

  @Column({ length: 80 })
  action!: string;

  @Column({ name: 'target_type', length: 80 })
  targetType!: string;

  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  details!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
