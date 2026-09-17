import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { AuditTargetType } from '../../common/enums/audit-target-type.enum';
import { AuditLog, Category, User } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { CategoryDto } from './dto/category.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Category) private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(AuditLog) private readonly auditRepository: Repository<AuditLog>,
    private readonly auditService: AuditService,
  ) {}

  async findUsers(query: PaginationQueryDto) {
    const [items, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items, meta: { page: query.page, limit: query.limit, total } };
  }

  async updateUser(actorId: string, id: string, dto: UpdateUserDto) {
    if (actorId === id && dto.status) throw new BadRequestException('Administrators cannot change their own status');
    const user = await this.usersRepository.preload({ id, ...dto });
    if (!user) throw new NotFoundException('User not found');
    const result = await this.usersRepository.save(user);
    await this.auditService.record({
      actorUserId: actorId,
      action: AuditAction.UserUpdated,
      targetType: AuditTargetType.User,
      targetId: id,
      details: { roles: dto.roles, status: dto.status },
    });
    return result;
  }

  async createCategory(actorUserId: string, dto: CategoryDto) {
    const category = await this.categoriesRepository.save(this.categoriesRepository.create(dto));
    await this.auditService.record({
      actorUserId,
      action: AuditAction.CategoryCreated,
      targetType: AuditTargetType.Category,
      targetId: category.id,
      details: { name: category.name, slug: category.slug },
    });
    return category;
  }

  async updateCategory(actorUserId: string, id: string, dto: CategoryDto) {
    const category = await this.categoriesRepository.preload({ id, ...dto });
    if (!category) throw new NotFoundException('Category not found');
    const result = await this.categoriesRepository.save(category);
    await this.auditService.record({
      actorUserId,
      action: AuditAction.CategoryUpdated,
      targetType: AuditTargetType.Category,
      targetId: id,
      details: { name: dto.name, slug: dto.slug },
    });
    return result;
  }

  async deleteCategory(actorUserId: string, id: string): Promise<void> {
    const result = await this.categoriesRepository.softDelete(id);
    if (result.affected !== 1) throw new NotFoundException('Category not found');
    await this.auditService.record({
      actorUserId,
      action: AuditAction.CategoryDeleted,
      targetType: AuditTargetType.Category,
      targetId: id,
    });
  }

  async auditLogs(query: PaginationQueryDto) {
    const builder = this.auditRepository
      .createQueryBuilder('auditLog')
      .leftJoin('auditLog.actorUser', 'actorUser')
      .addSelect(['actorUser.id', 'actorUser.email', 'actorUser.fullName'])
      .orderBy('auditLog.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [items, total] = await builder.getManyAndCount();
    return { items, meta: { page: query.page, limit: query.limit, total } };
  }
}
