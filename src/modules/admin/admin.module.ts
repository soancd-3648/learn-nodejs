import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Category, User } from '../../database/entities';
import { AuditModule } from '../audit/audit.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Category, AuditLog]), AuditModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
