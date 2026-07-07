import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

export interface MatchResult {
  provider_id: string;
  business_name: string | null;
  distance_m: number;
  rating_avg: number;
  avg_response_seconds: number;
  score: number;
  photo_count: number;
  cover_photo: string | null;
  rating_count: number;
  verified: boolean;
}

/**
 * Matching engine (spec: .kiro/specs/04-matching-engine).
 * Filters: status=approved, is_available=true, category matches, within service radius.
 * Ranks by weighted proximity (0.5) + rating (0.3) + responsiveness (0.2).
 * Weights are config-driven (env), defaulting to the spec values.
 */
@Injectable()
export class MatchingService {
  // Spec 11 Req 4.4: exclude providers whose wallet is below the threshold (owe too much).
  private readonly walletMinCents = Number(process.env.WALLET_MIN_CENTS ?? -200000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async match(params: {
    categoryKey: string;
    lat: number;
    lng: number;
    limit?: number;
  }): Promise<MatchResult[]> {
    const { categoryKey, lat, lng } = params;
    const limit = params.limit ?? 20;
    // Live, admin-editable ranking weights.
    const [wProximity, wRating, wResponse] = await Promise.all([
      this.settings.get('match_w_proximity'),
      this.settings.get('match_w_rating'),
      this.settings.get('match_w_response'),
    ]);

    // Raw SQL because geography/ST_* are outside Prisma's type system.
    const rows = await this.prisma.$queryRawUnsafe<MatchResult[]>(
      `
      WITH customer AS (
        SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography AS pt
      )
      SELECT p.user_id AS provider_id,
             p.business_name,
             ST_Distance(p.base_location, customer.pt)::float8 AS distance_m,
             p.rating_avg::float8 AS rating_avg,
             p.rating_count,
             (p.status = 'approved') AS verified,
             p.avg_response_seconds,
             (SELECT count(*)::int FROM provider_photos ph WHERE ph.provider_id = p.user_id) AS photo_count,
             (SELECT ph.url FROM provider_photos ph WHERE ph.provider_id = p.user_id
                ORDER BY ph.created_at DESC LIMIT 1) AS cover_photo,
             (
               $3 * (1.0 / (1 + ST_Distance(p.base_location, customer.pt) / 1000.0))
             + $4 * (p.rating_avg / 5.0)
             + $5 * (1.0 / (1 + p.avg_response_seconds / 60.0))
             )::float8 AS score
      FROM providers p
      JOIN service_areas sa       ON sa.provider_id = p.user_id
      JOIN provider_categories pc ON pc.provider_id = p.user_id
      JOIN categories cat         ON cat.id = pc.category_id
      CROSS JOIN customer
      WHERE p.status = 'approved'
        AND p.is_available = true
        AND cat.key = $6
        AND cat.is_active = true
        -- only match in launched/active districts (config-driven rollout)
        AND EXISTS (
          SELECT 1 FROM districts d
          WHERE d.id = p.district_id AND d.is_active = true
        )
        AND ST_DWithin(sa.center, customer.pt, sa.radius_meters)
        AND p.wallet_balance_cents >= $8
      ORDER BY score DESC
      LIMIT $7
      `,
      lng,
      lat,
      wProximity,
      wRating,
      wResponse,
      categoryKey,
      limit,
      this.walletMinCents,
    );

    return rows.map((r) => ({
      ...r,
      distance_m: Math.round(r.distance_m),
      score: Number(r.score.toFixed(3)),
    }));
  }
}
