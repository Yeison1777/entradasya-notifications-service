import type { MailAttachment } from './mailer';

export const NOTIFICATION_METADATA_GATEWAY = Symbol(
  'NOTIFICATION_METADATA_GATEWAY',
);

export interface NotificationMetadata {
  customerName: string;
  customerEmail: string;
  ticketIds: string[];
  attachments: MailAttachment[];
}

export interface NotificationMetadataGateway {
  get(orderId: string, customerId: string): Promise<NotificationMetadata>;
}
