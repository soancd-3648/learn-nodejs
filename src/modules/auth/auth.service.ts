import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { RefreshToken, User } from '../../database/entities';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/token.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RefreshPayload {
  sub: string;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(RefreshToken) private readonly tokensRepository: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.usersRepository.exist({ where: { email } })) {
      throw new ConflictException('Email already exists');
    }
    const user = this.usersRepository.create({
      email,
      fullName: dto.fullName.trim(),
      passwordHash: await bcrypt.hash(dto.password, 12),
      roles: [Role.Attendee],
      status: UserStatus.PendingVerification,
    });
    await this.usersRepository.save(user);
    const verificationToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'verify-email' },
      { secret: this.accessSecret, expiresIn: 86400 },
    );
    await this.mailService.enqueueVerification(user.email, verificationToken);
    return { userId: user.id, email: user.email, status: user.status };
  }

  async verifyEmail(token: string) {
    const payload = await this.verifyTypedToken(token, 'verify-email');
    const result = await this.usersRepository.update(
      { id: payload.sub, status: UserStatus.PendingVerification },
      { status: UserStatus.Active, verifiedAt: new Date() },
    );
    if (result.affected !== 1) throw new UnauthorizedException('Verification token was already used');
    return { verified: true };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email: dto.email.trim() })
      .getOne();
    if (!user || user.status !== UserStatus.Active || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async refresh(rawToken: string): Promise<TokenPair> {
    const payload = await this.jwtService.verifyAsync<RefreshPayload>(rawToken, {
      secret: this.refreshSecret,
    });
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid refresh token');
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.tokensRepository.findOne({
      where: { tokenHash, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      relations: { user: true },
    });
    if (!stored || stored.user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Refresh token was revoked');
    }
    return this.dataSource.transaction(async (manager) => {
      stored.revokedAt = new Date();
      await manager.save(stored);
      return this.issueTokens(stored.user, manager.getRepository(RefreshToken));
    });
  }

  async logout(rawToken: string): Promise<void> {
    await this.tokensRepository.update({ tokenHash: this.hashToken(rawToken) }, { revokedAt: new Date() });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOneBy({ email: dto.email.trim().toLowerCase() });
    if (user) {
      const token = await this.jwtService.signAsync(
        { sub: user.id, type: 'reset-password' },
        { secret: this.accessSecret, expiresIn: 1800 },
      );
      await this.mailService.enqueuePasswordReset(user.email, token);
    }
    return { message: 'If the account exists, a reset email has been queued' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const payload = await this.verifyTypedToken(dto.token, 'reset-password');
    await this.dataSource.transaction(async (manager) => {
      await manager.update(User, payload.sub, { passwordHash: await bcrypt.hash(dto.newPassword, 12) });
      await manager.update(RefreshToken, { userId: payload.sub, revokedAt: IsNull() }, { revokedAt: new Date() });
    });
    return { changed: true };
  }

  private async issueTokens(user: User, repository = this.tokensRepository): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        { secret: this.accessSecret, expiresIn: 900 },
      ),
      this.jwtService.signAsync(
        { sub: user.id, type: 'refresh' },
        { secret: this.refreshSecret, expiresIn: 604800 },
      ),
    ]);
    await repository.save(repository.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 604800000),
    }));
    return { accessToken, refreshToken };
  }

  private async verifyTypedToken(token: string, type: string): Promise<{ sub: string; type: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; type: string }>(token, {
        secret: this.accessSecret,
      });
      if (payload.type !== type) throw new UnauthorizedException('Invalid token type');
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private toPublicUser(user: User) {
    return { id: user.id, email: user.email, fullName: user.fullName, roles: user.roles };
  }

  private get accessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  private get refreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }
}
