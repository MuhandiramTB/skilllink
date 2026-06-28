import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Customer favourites (spec 14): save a provider for 1-tap rebooking. */
@Injectable()
export class FavouritesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Toggle: add the favourite if absent, remove it if present. Returns the new state. */
  async toggle(customerId: string, providerId: string) {
    const existing = await this.prisma.favourites.findUnique({
      where: { customer_id_provider_id: { customer_id: customerId, provider_id: providerId } },
    });
    if (existing) {
      await this.prisma.favourites.delete({ where: { id: existing.id } });
      return { favourited: false };
    }
    await this.prisma.favourites.create({ data: { customer_id: customerId, provider_id: providerId } });
    return { favourited: true };
  }

  async remove(customerId: string, providerId: string) {
    await this.prisma.favourites.deleteMany({ where: { customer_id: customerId, provider_id: providerId } });
    return { ok: true };
  }

  /** List the customer's favourites with provider summary + cover photo for rebooking. */
  async list(customerId: string) {
    const rows = await this.prisma.favourites.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
      include: { provider: { select: { user_id: true, business_name: true, rating_avg: true, rating_count: true, status: true } } },
    });
    const providerIds = rows.map((r) => r.provider_id);
    const covers = providerIds.length
      ? await this.prisma.provider_photos.findMany({
          where: { provider_id: { in: providerIds } },
          orderBy: { created_at: 'desc' },
          select: { provider_id: true, url: true },
        })
      : [];
    const coverByProvider = new Map<string, string>();
    for (const c of covers) if (!coverByProvider.has(c.provider_id)) coverByProvider.set(c.provider_id, c.url);

    return rows.map((r) => ({
      providerId: r.provider.user_id,
      businessName: r.provider.business_name,
      ratingAvg: Number(r.provider.rating_avg),
      ratingCount: r.provider.rating_count,
      verified: r.provider.status === 'approved',
      coverPhoto: coverByProvider.get(r.provider_id) ?? null,
    }));
  }

  /** The set of provider ids this customer has favourited (for toggling UI state). */
  async ids(customerId: string) {
    const rows = await this.prisma.favourites.findMany({
      where: { customer_id: customerId },
      select: { provider_id: true },
    });
    return rows.map((r) => r.provider_id);
  }
}
