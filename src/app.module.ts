import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NotificationsService } from './application/notifications.service';
import { MAILER } from './application/ports/mailer';
import { NOTIFICATION_METADATA_GATEWAY } from './application/ports/notification-metadata.gateway';
import { validateEnvironment } from './infrastructure/config/environment';
import { HttpNotificationMetadataGateway } from './infrastructure/http/http-notification-metadata.gateway';
import { NodemailerMailer } from './infrastructure/mail/nodemailer-mailer';
import { InternalApiKeyGuard } from './presentation/http/auth/internal-api-key.guard';
import { HealthController } from './presentation/http/health.controller';
import { InternalNotificationsController } from './presentation/http/internal-notifications.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
  ],
  controllers: [InternalNotificationsController, HealthController],
  providers: [
    NotificationsService,
    HttpNotificationMetadataGateway,
    NodemailerMailer,
    InternalApiKeyGuard,
    { provide: MAILER, useExisting: NodemailerMailer },
    {
      provide: NOTIFICATION_METADATA_GATEWAY,
      useExisting: HttpNotificationMetadataGateway,
    },
  ],
})
export class AppModule {}
