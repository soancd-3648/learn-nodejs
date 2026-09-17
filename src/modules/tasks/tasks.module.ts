import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event, Registration } from '../../database/entities';
import { MailModule } from '../mail/mail.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Registration]), MailModule],
  providers: [TasksService],
})
export class TasksModule {}
