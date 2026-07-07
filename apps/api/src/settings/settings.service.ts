import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Admin-editable platform config (spec 16). Values live in app_settings (key-value,
 * stored as text) and are read LIVE by the payment/rewards/matching services, so an
 * admin change takes effect immediately. Each key has an env/hardcoded fallback so
 * the platform works before anything is set.
 */
export const SETTING_DEFAULTS = {
  commission_rate: Number(process.env.PAYMENT_COMMISSION_RATE ?? 0.12), // 0..1
  points_per_lkr100: 1, // reward points per LKR 100 spent
  referrer_points: Number(process.env.REFERRAL_REFERRER_POINTS ?? 50),
  referee_points: Number(process.env.REFERRAL_REFEREE_POINTS ?? 30),
  match_w_proximity: Number(process.env.MATCH_W_PROXIMITY ?? 0.5),
  match_w_rating: Number(process.env.MATCH_W_RATING ?? 0.3),
  match_w_response: Number(process.env.MATCH_W_RESPONSE ?? 0.2),
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** All settings (stored value or fallback), as numbers — for the admin UI. */
  async all(): Promise<Record<SettingKey, number>> {
    const rows = await this.prisma.app_settings.findMany();
    const stored = new Map(rows.map((r) => [r.key, Number(r.value)]));
    const out = {} as Record<SettingKey, number>;
    for (const k of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
      const v = stored.get(k);
      out[k] = v !== undefined && Number.isFinite(v) ? v : SETTING_DEFAULTS[k];
    }
    return out;
  }

  /** Read one setting live (stored value or fallback). */
  async get(key: SettingKey): Promise<number> {
    const row = await this.prisma.app_settings.findUnique({ where: { key } });
    const v = row ? Number(row.value) : NaN;
    return Number.isFinite(v) ? v : SETTING_DEFAULTS[key];
  }

  /** Upsert a set of settings (admin). Unknown keys are ignored. */
  async update(adminId: string, patch: Partial<Record<SettingKey, number>>) {
    for (const [key, value] of Object.entries(patch)) {
      if (!(key in SETTING_DEFAULTS)) continue;
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      await this.prisma.app_settings.upsert({
        where: { key },
        create: { key, value: String(value), updated_by: adminId },
        update: { value: String(value), updated_by: adminId, updated_at: new Date() },
      });
    }
    return this.all();
  }
}
