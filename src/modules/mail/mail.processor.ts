import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import nodemailer from 'nodemailer';
import { MAIL_QUEUE, MailJobData, SEND_MAIL_JOB } from './mail.constants';

@Processor(MAIL_QUEUE)
export class MailProcessor {
  constructor(private readonly configService: ConfigService) {}

  @Process(SEND_MAIL_JOB)
  async send(job: Job<MailJobData>): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: this.configService.getOrThrow<number>('MAIL_PORT'),
      secure: false,
    });
    const body = Object.entries(job.data.context)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    await transporter.sendMail({
      from: this.configService.getOrThrow<string>('MAIL_FROM'),
      to: job.data.to,
      subject: job.data.subject,
      text: body,
    });
  }
}
