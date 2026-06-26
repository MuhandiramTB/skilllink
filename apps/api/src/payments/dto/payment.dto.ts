import { IsInt, IsObject, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class InitiatePaymentDto {
  @IsUUID() bookingId!: string;
  @IsInt() @Min(1) amountCents!: number;
}

export class WebhookDto {
  @IsObject() payload!: Record<string, unknown>;
  // Signature is REQUIRED — the webhook is unauthenticated otherwise.
  @IsString() @MinLength(1) signature!: string;
}
