import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Provider wallet & commission capture (Spec 11 Req 4). Balance may go negative
 * (provider owes the platform). Ledger is append-only. Balance + ledger writes
 * are atomic via $transaction.
 */
@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /** Req 4.2: debit the provider wallet by the commission on a cash job. */
  async debitCommission(providerId: string, bookingId: string, commissionCents: number) {
    await this.prisma.$transaction([
      this.prisma.providers.update({
        where: { user_id: providerId },
        data: { wallet_balance_cents: { decrement: commissionCents } },
      }),
      this.prisma.wallet_ledger.create({
        data: {
          provider_id: providerId,
          type: 'commission',
          amount_cents: -commissionCents,
          booking_id: bookingId,
        },
      }),
    ]);
  }

  /** Req 4.3: provider tops up — credit balance + ledger row. */
  async topup(providerId: string, amountCents: number) {
    await this.prisma.$transaction([
      this.prisma.providers.update({
        where: { user_id: providerId },
        data: { wallet_balance_cents: { increment: amountCents } },
      }),
      this.prisma.wallet_ledger.create({
        data: { provider_id: providerId, type: 'topup', amount_cents: amountCents },
      }),
    ]);
    return this.summary(providerId);
  }

  /** Req 4.5: balance + ledger (last 50), queryable by the provider. */
  async summary(providerId: string) {
    const provider = await this.prisma.providers.findUnique({ where: { user_id: providerId } });
    const ledger = await this.prisma.wallet_ledger.findMany({
      where: { provider_id: providerId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    return { balanceCents: provider?.wallet_balance_cents ?? 0, ledger };
  }
}
