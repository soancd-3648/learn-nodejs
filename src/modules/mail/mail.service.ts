import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Queue } from 'bull';
import { MAIL_QUEUE, MailJobData, SEND_MAIL_JOB } from './mail.constants';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@Optional() @InjectQueue(MAIL_QUEUE) private readonly queue?: Queue<MailJobData>) {}

  enqueueVerification(email: string, token: string) {
    return this.enqueue({
      to: email,
      subject: 'Verify your EventHub account',
      template: 'verify-email',
      context: { token },
    });
  }

  enqueuePasswordReset(email: string, token: string) {
    return this.enqueue({
      to: email,
      subject: 'Reset your EventHub password',
      template: 'reset-password',
      context: { token },
    });
  }

  enqueueEventReminder(email: string, eventTitle: string, startAt: string) {
    return this.enqueue({
      to: email,
      subject: `Reminder: ${eventTitle}`,
      template: 'event-reminder',
      context: { eventTitle, startAt },
    });
  }

  private async enqueue(data: MailJobData): Promise<void> {
    if (!this.queue) {
      this.logger.debug(`Mail queue disabled; skipped ${data.template} for ${data.to}`);
      return;
    }
    await this.queue.add(SEND_MAIL_JOB, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  }
}
