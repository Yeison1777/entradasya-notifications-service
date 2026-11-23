import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { NotificationsService } from '../../application/notifications.service';
import { InternalApiKeyGuard } from './auth/internal-api-key.guard';
import { PurchaseConfirmationDto } from './dto/purchase-confirmation.dto';

@Controller('internal/notifications')
@UseGuards(InternalApiKeyGuard)
export class InternalNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('purchase-confirmation')
  sendPurchaseConfirmation(@Body() input: PurchaseConfirmationDto) {
    return this.notifications.sendPurchaseConfirmation(
      input.orderId,
      input.customerId,
    );
  }
}
