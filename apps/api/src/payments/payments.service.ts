import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentGateway } from './gateway/payment-gateway';

@Injectable()
export class PaymentsService {
  private readonly rate = Number(process.env.PAYMENT_COMMISSION_RATE ?? 0.12);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PaymentGateway,
  ) {}

  /** Req 1/2: initiate payment for a completed booking (idempotent on booking). */
  async initiate(customerId: string, bookingId: string, amountCents: number) {
    const booking = await this.prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.payment.bookingNotFound' });
    if (booking.customer_id !== customerId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.payment.notYours' });
    }
    if (booking.status !== 'completed') {
      throw new BadRequestException({ code: 'PAYMENT_BOOKING_NOT_COMPLETED', message: 'errors.payment.notCompleted' });
    }

    // idempotent: return existing payment if any
    const existing = await this.prisma.payments.findUnique({ where: { booking_id: bookingId } });
    if (existing) {
      return { paymentId: existing.id, status: existing.status, gatewayRef: existing.gateway_ref };
    }

    const commission = Math.round(amountCents * this.rate);
    const created = await this.prisma.payments.create({
      data: {
        booking_id: bookingId,
        provider: 'payhere',
        amount_cents: amountCents,
        commission_cents: commission,
        status: 'pending',
      },
    });
    const session = await this.gateway.createSession({ paymentId: created.id, amountCents });
    await this.prisma.payments.update({
      where: { id: created.id },
      data: { gateway_ref: session.gatewayRef, idempotency_key: session.idempotencyKey },
    });
    return {
      paymentId: created.id,
      amountCents,
      commissionCents: commission,
      netCents: amountCents - commission,
      redirectUrl: session.redirectUrl,
      status: 'pending',
    };
  }

  /** Req 3: idempotent webhook confirmation. */
  async handleWebhook(payload: Record<string, unknown>, signature?: string) {
    const result = this.gateway.verifyWebhook(payload, signature);
    if (!result.ok) {
      throw new BadRequestException({ code: 'PAYMENT_WEBHOOK_INVALID', message: 'errors.payment.webhookInvalid' });
    }
    const payment = await this.prisma.payments.findFirst({
      where: { idempotency_key: result.idempotencyKey },
    });
    if (!payment) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.payment.notFound' });

    if (payment.status === 'paid') {
      return { paymentId: payment.id, status: 'paid', credited: false }; // idempotent no-op
    }
    await this.prisma.payments.update({ where: { id: payment.id }, data: { status: 'paid' } });
    return { paymentId: payment.id, status: 'paid', credited: true };
  }

  /** Req 4: provider earnings (net of commission, paid only). */
  async earnings(providerId: string) {
    // join via bookings.provider_id
    const rows = await this.prisma.$queryRawUnsafe<
      { total_net: bigint | null; paid_jobs: bigint }[]
    >(
      `SELECT COALESCE(SUM(p.amount_cents - p.commission_cents),0) AS total_net,
              COUNT(*) AS paid_jobs
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       WHERE b.provider_id = $1::uuid AND p.status = 'paid'`,
      providerId,
    );
    const recent = await this.prisma.$queryRawUnsafe<
      { amount_cents: number; commission_cents: number; status: string; created_at: Date }[]
    >(
      `SELECT p.amount_cents, p.commission_cents, p.status, p.created_at
       FROM payments p JOIN bookings b ON b.id = p.booking_id
       WHERE b.provider_id = $1::uuid ORDER BY p.created_at DESC LIMIT 10`,
      providerId,
    );
    return {
      totalNetCents: Number(rows[0]?.total_net ?? 0),
      paidJobs: Number(rows[0]?.paid_jobs ?? 0),
      recent,
    };
  }
}
