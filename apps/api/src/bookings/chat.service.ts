import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { scrubPhones } from './chat-scrub';

/** Masked in-app chat, one conversation per booking (Spec Req 4). */
@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async conversationFor(bookingId: string) {
    const existing = await this.prisma.conversations.findUnique({ where: { booking_id: bookingId } });
    if (existing) return existing;
    return this.prisma.conversations.create({ data: { booking_id: bookingId } });
  }

  private async assertParticipant(userId: string, bookingId: string) {
    const b = await this.prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!b) throw new NotFoundException({ code: 'NOT_FOUND', message: 'errors.booking.notFound' });
    if (b.customer_id !== userId && b.provider_id !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'errors.booking.notYours' });
    }
  }

  async list(userId: string, bookingId: string) {
    await this.assertParticipant(userId, bookingId);
    const convo = await this.conversationFor(bookingId);
    return this.prisma.messages.findMany({
      where: { conversation_id: convo.id },
      select: { sender_id: true, body: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async send(userId: string, bookingId: string, body: string) {
    await this.assertParticipant(userId, bookingId);
    const convo = await this.conversationFor(bookingId);
    const safe = scrubPhones(body); // never store real phone numbers
    const msg = await this.prisma.messages.create({
      data: { conversation_id: convo.id, sender_id: userId, body: safe },
      select: { sender_id: true, body: true, created_at: true },
    });
    return msg;
  }
}
