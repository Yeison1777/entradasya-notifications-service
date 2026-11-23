import { IsUUID } from 'class-validator';

export class PurchaseConfirmationDto {
  @IsUUID() orderId!: string;
  @IsUUID() customerId!: string;
}
