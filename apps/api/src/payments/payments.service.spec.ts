import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PaymentsService } from './payments.service';
import { MockPaymentGateway } from './gateway/payment-gateway';

describe('PaymentsService (Req 1–3)', () => {
  const gateway = new MockPaymentGateway();

  /** Produce the HMAC the gateway expects for a payload (dev secret in test env). */
  function sign(payload: Record<string, unknown>): string {
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    return createHmac('sha256', 'dev-pay-secret').update(canonical).digest('hex');
  }

  function build(booking: Record<string, unknown> | null, existingPayment: Record<string, unknown> | null = null) {
    const prisma = {
      bookings: { findUnique: jest.fn().mockResolvedValue(booking) },
      payments: {
        findUnique: jest.fn().mockResolvedValue(existingPayment),
        findFirst: jest.fn().mockResolvedValue(existingPayment),
        create: jest.fn().mockResolvedValue({ id: 'pay1' }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    return { svc: new PaymentsService(prisma as never, gateway), prisma };
  }

  it('computes 12% commission and net (Req 2)', async () => {
    const { svc } = build({ id: 'b1', customer_id: 'c1', status: 'completed' });
    const out = await svc.initiate('c1', 'b1', 10000); // LKR 100.00
    expect(out.commissionCents).toBe(1200);
    expect(out.netCents).toBe(8800);
  });

  it('rejects payment on a non-completed booking (Req 1.2)', async () => {
    const { svc } = build({ id: 'b1', customer_id: 'c1', status: 'accepted' });
    await expect(svc.initiate('c1', 'b1', 10000)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-owner (Req security)', async () => {
    const { svc } = build({ id: 'b1', customer_id: 'c1', status: 'completed' });
    await expect(svc.initiate('other', 'b1', 10000)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('initiate is idempotent — returns existing payment (Req 1.3)', async () => {
    const { svc, prisma } = build(
      { id: 'b1', customer_id: 'c1', status: 'completed' },
      { id: 'payX', status: 'pending', gateway_ref: 'mockpay_x' },
    );
    const out = await svc.initiate('c1', 'b1', 10000);
    expect(out.paymentId).toBe('payX');
    expect(prisma.payments.create).not.toHaveBeenCalled();
  });

  it('webhook is idempotent — already paid → no double credit (Req 3.2)', async () => {
    const { svc } = build(null, { id: 'payX', status: 'paid' });
    const payload = { gatewayRef: 'mockpay_x', idempotencyKey: 'mockpay_x' };
    const out = await svc.handleWebhook(payload, sign(payload));
    expect(out.credited).toBe(false);
  });

  it('webhook with a valid HMAC signature credits a pending payment (Req 3.1)', async () => {
    const { svc, prisma } = build(null, { id: 'payX', status: 'pending' });
    const payload = { gatewayRef: 'mockpay_x', idempotencyKey: 'mockpay_x' };
    const out = await svc.handleWebhook(payload, sign(payload));
    expect(out.credited).toBe(true);
    expect(prisma.payments.update).toHaveBeenCalled();
  });

  it('webhook with bad signature → 400 (Req 3.3)', async () => {
    const { svc } = build(null, { id: 'payX', status: 'pending' });
    await expect(svc.handleWebhook({ gatewayRef: 'x', idempotencyKey: 'x' }, 'wrong')).rejects.toBeInstanceOf(BadRequestException);
  });
});
