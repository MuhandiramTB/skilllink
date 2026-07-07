import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentGateway } from './gateway/payment-gateway';
import { WalletService } from '../providers/wallet.service';
import { RewardsService } from '../rewards/rewards.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PaymentGateway,
    private readonly wallet: WalletService,
    private readonly rewards: RewardsService,
    private readonly settings: SettingsService,
  ) {}

  /** Live commission rate (admin-editable via app_settings). */
  private commissionRate(): Promise<number> {
    return this.settings.get('commission_rate');
  }

  /** Req 1/2: initiate payment for a completed booking (idempotent on booking). */
  async initiate(customerId: string, bookingId: string, amountCents: number, method: 'cash' | 'in_app' = 'in_app') {
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

    const commission = Math.round(amountCents * (await this.commissionRate()));
    const created = await this.prisma.payments.create({
      data: {
        booking_id: bookingId,
        provider: 'payhere',
        amount_cents: amountCents,
        commission_cents: commission,
        status: 'pending',
        method,
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

    // Spec 11 Req 6.1: award customer reward points on paid completion (idempotent).
    const booking = await this.prisma.bookings.findUnique({ where: { id: payment.booking_id } });
    if (booking) {
      await this.rewards.awardBookingCompletion(booking.customer_id, booking.id, payment.amount_cents);
    }
    return { paymentId: payment.id, status: 'paid', credited: true };
  }

  /**
   * Spec 11 Req 3: unified completion settle (cash or in-app), using the accepted quote.
   * cash → record paid + debit provider commission to wallet + award reward points.
   * in_app → existing gateway initiate path (commission auto, points on webhook paid).
   */
  async settle(customerId: string, bookingId: string, method: 'cash' | 'in_app') {
    const booking = await this.prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.payment.bookingNotFound' });
    if (booking.customer_id !== customerId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.payment.notYours' });
    }
    if (booking.status !== 'completed') {
      throw new BadRequestException({ code: 'PAYMENT_BOOKING_NOT_COMPLETED', message: 'errors.payment.notCompleted' });
    }
    if (booking.quote_status !== 'accepted' || !booking.price_cents || booking.price_cents <= 0) {
      throw new BadRequestException({ code: 'NO_QUOTE', message: 'errors.payment.noQuote' });
    }

    const amount = booking.price_cents;

    if (method === 'in_app') {
      // Reuse the gateway path; mark the payment method as in_app.
      return this.initiate(customerId, bookingId, amount, 'in_app');
    }

    // cash: idempotent per booking
    const existing = await this.prisma.payments.findUnique({ where: { booking_id: bookingId } });
    if (existing) {
      return { paymentId: existing.id, status: existing.status, method: existing.method };
    }

    const commission = Math.round(amount * (await this.commissionRate()));
    const created = await this.prisma.$transaction(async (tx) => {
      return tx.payments.create({
        data: {
          booking_id: bookingId,
          provider: 'payhere',
          amount_cents: amount,
          commission_cents: commission,
          status: 'paid',
          method: 'cash',
        },
      });
    });

    // Debit the provider's wallet for the commission on the cash job.
    if (booking.provider_id) {
      await this.wallet.debitCommission(booking.provider_id, bookingId, commission);
    }
    // Award the customer reward points (idempotent).
    await this.rewards.awardBookingCompletion(customerId, bookingId, amount);

    return {
      paymentId: created.id,
      amountCents: amount,
      commissionCents: commission,
      netCents: amount - commission,
      status: 'paid',
      method: 'cash',
    };
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
