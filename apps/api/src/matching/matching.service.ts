import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MatchResult {
  provider_id: string;
  business_name: string | null;
  distance_m: number;
  rating_avg: number;
  avg_response_seconds: number;
  score: number;
}

/**
 * Matching engine (spec: .kiro/specs/04-matching-engine).
 * Filters: status=approved, is_available=true, category matches, within service radius.
 * Ranks by weighted proximity (0.5) + rating (0.3) + responsiveness (0.2).
 * Weights are config-driven (env), defaulting to the spec values.
 */
@Injectable()
export class MatchingService {
  private readonly wProximity = Number(process.env.MATCH_W_PROXIMITY ?? 0.5);
  private readonly wRating = Number(process.env.MATCH_W_RATING ?? 0.3);
  private readonly wResponse = Number(process.env.MATCH_W_RESPONSE ?? 0.2);

  constructor(private readonly prisma: PrismaService) {}

  async match(params: {
    categoryKey: string;
    lat: number;
    lng: number;
    limit?: number;
  }): Promise<MatchResult[]> {
    const { categoryKey, lat, lng } = params;
    const limit = params.limit ?? 20;

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
             p.avg_response_seconds,
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
      ORDER BY score DESC
      LIMIT $7
      `,
      lng,
      lat,
      this.wProximity,
      this.wRating,
      this.wResponse,
      categoryKey,
      limit,
    );

    return rows.map((r) => ({
      ...r,
      distance_m: Math.round(r.distance_m),
      score: Number(r.score.toFixed(3)),
    }));
  }
}
