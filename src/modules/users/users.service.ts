import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { AuditTargetType } from '../../common/enums/audit-target-type.enum';
import { User } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async findMe(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return this.toResponse(user);
  }

  async updateMe(id: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.preload({ id, ...dto });
    if (!user) throw new NotFoundException('User not found');
    const result = await this.usersRepository.save(user);
    await this.auditService.record({
      actorUserId: id,
      action: AuditAction.UserProfileUpdated,
      targetType: AuditTargetType.User,
      targetId: id,
      details: { fields: Object.keys(dto) },
    });
    return this.toResponse(result);
  }

  async updateAvatar(id: string, avatarUrl: string) {
    await this.usersRepository.update(id, { avatarUrl });
    await this.auditService.record({
      actorUserId: id,
      action: AuditAction.UserAvatarUpdated,
      targetType: AuditTargetType.User,
      targetId: id,
      details: { avatarUrl },
    });
    return { url: avatarUrl };
  }

  private toResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
      status: user.status,
    };
  }
}
