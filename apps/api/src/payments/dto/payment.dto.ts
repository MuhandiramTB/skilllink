import { IsIn, IsInt, IsObject, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class InitiatePaymentDto {
  @IsUUID() bookingId!: string;
  @IsInt() @Min(1) amountCents!: number;
}

export class SettleDto {
  @IsUUID() bookingId!: string;
  @IsIn(['cash', 'in_app']) method!: 'cash' | 'in_app';
}

export class WebhookDto {
  @IsObject() payload!: Record<string, unknown>;
  // Signature is REQUIRED — the webhook is unauthenticated otherwise.
  @IsString() @MinLength(1) signature!: string;
}
