import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotifierService } from '../notifications/notifier.service';
import { scrubPhones } from './chat-scrub';

/** Masked in-app chat, one conversation per booking (Spec Req 4). */
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: NotifierService,
  ) {}

  private async conversationFor(bookingId: string) {
    const existing = await this.prisma.conversations.findUnique({ where: { booking_id: bookingId } });
    if (existing) return existing;
    return this.prisma.conversations.create({ data: { booking_id: bookingId } });
  }

  /** Returns the booking after asserting the user is a participant. */
  private async participantBooking(userId: string, bookingId: string) {
    const b = await this.prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!b) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.booking.notFound' });
    if (b.customer_id !== userId && b.provider_id !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.booking.notYours' });
    }
    return b;
  }

  async list(userId: string, bookingId: string) {
    await this.participantBooking(userId, bookingId);
    const convo = await this.conversationFor(bookingId);
    return this.prisma.messages.findMany({
      where: { conversation_id: convo.id },
      select: { sender_id: true, body: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async send(userId: string, bookingId: string, body: string) {
    const booking = await this.participantBooking(userId, bookingId);
    const convo = await this.conversationFor(bookingId);
    const safe = scrubPhones(body); // never store real phone numbers
    const msg = await this.prisma.messages.create({
      data: { conversation_id: convo.id, sender_id: userId, body: safe },
      select: { sender_id: true, body: true, created_at: true },
    });
    // Notify the OTHER participant (feeds the notification centre + honours the
    // user's "messages" preference for off-app delivery). Best-effort.
    const recipient = booking.customer_id === userId ? booking.provider_id : booking.customer_id;
    if (recipient) {
      await this.notifier.notify({
        userId: recipient,
        type: 'chat.message',
        title: 'New message',
        body: safe.length > 60 ? `${safe.slice(0, 57)}…` : safe,
        link: `/bookings/${bookingId}`,
      }).catch(() => { /* never fail the send on a notify error */ });
    }
    return msg;
  }
}
