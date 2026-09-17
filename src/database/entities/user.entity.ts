import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { BaseEntity } from './base.entity';
import { AuditLog } from './audit-log.entity';
import { Event } from './event.entity';
import { RefreshToken } from './refresh-token.entity';
import { Registration } from './registration.entity';

@Entity('users')
@Index('IDX_users_created_at', ['createdAt'])
export class User extends BaseEntity {
  @Index('UQ_users_email', { unique: true })
  @Column({ length: 255 })
  email!: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash!: string;

  @Column({ name: 'full_name', length: 120 })
  fullName!: string;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  phone!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'simple-array', default: Role.Attendee })
  roles!: Role[];

  @Column({ type: 'varchar', default: UserStatus.PendingVerification })
  status!: UserStatus;

  @Column({ name: 'verified_at', type: Date, nullable: true })
  verifiedAt!: Date | null;

  @OneToMany(() => AuditLog, (auditLog) => auditLog.actorUser)
  auditLogs!: AuditLog[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => Event, (event) => event.organizer)
  events!: Event[];

  @OneToMany(() => Registration, (registration) => registration.user)
  registrations!: Registration[];
}
