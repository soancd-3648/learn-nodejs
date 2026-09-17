import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('user_refresh_tokens')
@Index('IDX_user_refresh_tokens_user_revoked_at', ['userId', 'revokedAt'])
export class RefreshToken extends BaseEntity {
  @Index('UQ_user_refresh_tokens_token_hash', { unique: true })
  @Column({ name: 'token_hash', length: 64 })
  tokenHash!: string;

  @Index('IDX_user_refresh_tokens_expires_at')
  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: Date, nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
