'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminApi, type PlatformSettings } from '@/lib/admin-api';
import { PageHeader, Card, Button, Field, inputCls, Spinner, ErrorBanner } from '@/components/ui';
import { useToast } from '@/components/Toast';

/**
 * Editable platform settings (spec 16). Commission is stored as a fraction (0.12)
 * but shown/edited as a percentage. Values are read live by the payment / rewards /
 * matching services, so a save takes effect on the next transaction.
 */
export default function AdminSettingsPage() {
  const t = useTranslations('admin');
  const toast = useToast();
  const [s, setS] = useState<PlatformSettings | null>(null);
  const [commissionPct, setCommissionPct] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings()
      .then((v) => { setS(v); setCommissionPct(String(+(v.commission_rate * 100).toFixed(2))); })
      .catch((e) => setErr((e as Error).message));
  }, []);

  function set<K extends keyof PlatformSettings>(k: K, v: number) {
    setS((cur) => (cur ? { ...cur, [k]: v } : cur));
  }

  async function save() {
    if (!s) return;
    setErr(''); setSaving(true);
    try {
      const pct = Number(commissionPct);
      const patch: Partial<PlatformSettings> = {
        commission_rate: Number.isFinite(pct) ? +(pct / 100).toFixed(4) : s.commission_rate,
        points_per_lkr100: s.points_per_lkr100,
        referrer_points: s.referrer_points,
        referee_points: s.referee_points,
        match_w_proximity: s.match_w_proximity,
        match_w_rating: s.match_w_rating,
        match_w_response: s.match_w_response,
      };
      const updated = await adminApi.updateSettings(patch);
      setS(updated);
      setCommissionPct(String(+(updated.commission_rate * 100).toFixed(2)));
      toast.show(t('settings.saved'), 'success');
    } catch (e) {
      setErr((e as Error).message);
      toast.show((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const weightSum = s ? +(s.match_w_proximity + s.match_w_rating + s.match_w_response).toFixed(2) : 0;

  return (
    <div className="space-y-5">
      <PageHeader title={t('settings.title')} subtitle={t('settings.editSubtitle')} />
      {err && <ErrorBanner message={err} />}
      {!s && !err && <Spinner />}

      {s && (
        <>
          {/* Commission */}
          <Card className="space-y-4">
            <h2 className="font-display text-base font-bold text-ink dark:text-gray-50">{t('settings.commissionRate')}</h2>
            <p className="text-xs text-slate">{t('settings.commissionHint')}</p>
            <Field label={t('settings.commissionRate')}>
              <div className="flex items-center gap-2">
                <input value={commissionPct} onChange={(e) => setCommissionPct(e.target.value.replace(/[^\d.]/g, ''))}
                  inputMode="decimal" className={`${inputCls} max-w-[8rem]`} />
                <span className="text-sm font-semibold text-slate">%</span>
              </div>
            </Field>
          </Card>

          {/* Rewards */}
          <Card className="space-y-4">
            <h2 className="font-display text-base font-bold text-ink dark:text-gray-50">{t('settings.rewardsGroup')}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t('settings.pointsPerLkr')} hint={t('settings.pointsPerLkrHint')}>
                <input value={s.points_per_lkr100} onChange={(e) => set('points_per_lkr100', Number(e.target.value))} inputMode="numeric" className={inputCls} />
              </Field>
              <Field label={t('settings.referrerPoints')}>
                <input value={s.referrer_points} onChange={(e) => set('referrer_points', Number(e.target.value))} inputMode="numeric" className={inputCls} />
              </Field>
              <Field label={t('settings.refereePoints')}>
                <input value={s.referee_points} onChange={(e) => set('referee_points', Number(e.target.value))} inputMode="numeric" className={inputCls} />
              </Field>
            </div>
          </Card>

          {/* Matching weights */}
          <Card className="space-y-4">
            <h2 className="font-display text-base font-bold text-ink dark:text-gray-50">{t('settings.matchingGroup')}</h2>
            <p className="text-xs text-slate">{t('settings.matchingHint')}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t('settings.wProximity')}>
                <input value={s.match_w_proximity} onChange={(e) => set('match_w_proximity', Number(e.target.value))} inputMode="decimal" className={inputCls} />
              </Field>
              <Field label={t('settings.wRating')}>
                <input value={s.match_w_rating} onChange={(e) => set('match_w_rating', Number(e.target.value))} inputMode="decimal" className={inputCls} />
              </Field>
              <Field label={t('settings.wResponse')}>
                <input value={s.match_w_response} onChange={(e) => set('match_w_response', Number(e.target.value))} inputMode="decimal" className={inputCls} />
              </Field>
            </div>
            {Math.abs(weightSum - 1) > 0.001 && (
              <p className="text-xs text-warn">{t('settings.weightsSumHint', { sum: weightSum })}</p>
            )}
          </Card>

          {/* Read-only platform facts */}
          <Card className="divide-y divide-line dark:divide-gray-800">
            {([
              [t('settings.currency'), t('settings.currencyValue')],
              [t('settings.activeRegion'), t('settings.activeRegionValue')],
              [t('settings.authentication'), t('settings.authenticationValue')],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="text-slate">{k}</span>
                <span className="text-right font-semibold text-ink dark:text-gray-100">{v}</span>
              </div>
            ))}
          </Card>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>{saving ? t('settings.saving') : t('settings.save')}</Button>
          </div>
        </>
      )}
    </div>
  );
}
