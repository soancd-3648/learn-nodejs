import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities';
import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuditModule, FilesModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
