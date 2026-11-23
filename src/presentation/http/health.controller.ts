import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';

import { MAILER } from '../../application/ports/mailer';
import type { Mailer } from '../../application/ports/mailer';

@Controller('health')
export class HealthController {
  constructor(@Inject(MAILER) private readonly mailer: Mailer) {}

  @Get('live')
  live() {
    return { service: 'notifications-service', status: 'ok' };
  }

  @Get('ready')
  async ready() {
    try {
      await this.mailer.verify();
      return { service: 'notifications-service', status: 'ready' };
    } catch {
      throw new ServiceUnavailableException({
        service: 'notifications-service',
        status: 'not-ready',
      });
    }
  }
}
