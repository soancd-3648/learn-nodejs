export const MAIL_QUEUE = 'mail';
export const SEND_MAIL_JOB = 'send-mail';

export interface MailJobData {
  to: string;
  subject: string;
  template: 'verify-email' | 'reset-password' | 'event-reminder' | 'daily-summary';
  context: Record<string, string>;
}
