import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MAIL_QUEUE } from './mail.constants';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';

const queueImports = process.env.NODE_ENV === 'test' ? [] : [BullModule.registerQueue({ name: MAIL_QUEUE })];
const queueProviders = process.env.NODE_ENV === 'test' ? [] : [MailProcessor];

@Module({
  imports: queueImports,
  providers: [MailService, ...queueProviders],
  exports: [MailService],
})
export class MailModule {}
