'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, homeForMode } from '@/lib/session';
import { providerApi, type ProviderMe, type WalletSummary, type WalletLedgerEntry } from '@/lib/provider-api';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { Button, AccentButton, Card, Money, StatusBadge, Spinner, EmptyState, ErrorBanner, SuccessBanner, inputCls } from '@/components/ui';
import { ICONS } from '@/components/nav-config';
import { AreaChart, KpiCard, CountUp, Sparkline } from '@/components/charts';
import { Reveal } from '@/components/Reveal';
import WorkPhotosManager from '@/components/WorkPhotosManager';
import ProviderReviews from '@/components/ProviderReviews';

/**
 * Provider dashboard — the "next-level" signature screen. Full-canvas on desktop
 * (KPI row → earnings chart + side rail → job requests), phone column on mobile.
 * Data-viz is built from REAL data: the wallet ledger drives the earnings trend
 * and the KPI sparklines; nothing is fabricated.
 */

// Bucket ledger credits into N recent weekly totals (LKR). Credits = money in.
function weeklyEarnings(ledger: WalletLedgerEntry[], weeks = 6): number[] {
  const now = Date.now();
  const wk = 7 * 24 * 60 * 60 * 1000;
  const buckets = new Array(weeks).fill(0);
  for (const e of ledger) {
    const amt = e.amount_cents;
    if (amt <= 0) continue; // only earnings (credits)
    const age = now - new Date(e.created_at).getTime();
    const idx = weeks - 1 - Math.floor(age / wk);
    if (idx >= 0 && idx < weeks) buckets[idx] += amt / 100;
  }
  return buckets;
}

// Milliseconds from now until the end of today (local time) — for "Rest of day".
function endOfDayMs(): number {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return Math.max(0, end.getTime() - Date.now());
}

export default function ProviderDashboard() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('dash');
  const [me, setMe] = useState<ProviderMe | null>(null);
  const [earnings, setEarnings] = useState<{ totalNetCents: number; paidJobs: number } | null>(null);
  const [jobs, setJobs] = useState<BookingListItem[] | null>(null);
  const [err, setErr] = useState('');
  const [savingAvail, setSavingAvail] = useState(false);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [toppingUp, setToppingUp] = useState(false);
  const [walletMsg, setWalletMsg] = useState('');
  const [busyMsg, setBusyMsg] = useState('');
  const [settingBusy, setSettingBusy] = useState(false);
  // Editable schedule/details (working days/hours/emergency), loaded from `me`.
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [emergency, setEmergency] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState('');

  useEffect(() => {
    const s = getSession();
    if (s && s.mode !== 'provider') {
      window.location.href = homeForMode(locale, s.mode);
      return;
    }
    if (s && !s.roles.includes('provider')) {
      window.location.href = homeForMode(locale, 'customer');
      return;
    }
    Promise.all([providerApi.me(), providerApi.earnings()])
      .then(([m, e]) => {
        setMe(m); setEarnings(e);
        setDays(m.workingDays ?? ''); setHours(m.workingHours ?? ''); setEmergency(!!m.emergencyService);
      })
      .catch((e) => setErr((e as Error).message));
    bookingApi.providerJobs().then(setJobs).catch((e) => setErr((e as Error).message));
    providerApi.wallet().then(setWallet).catch(() => {});
  }, [locale]);

  async function topUp() {
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) return;
    setToppingUp(true);
    setWalletMsg('');
    try {
      const w = await providerApi.topup(Math.round(amount * 100));
      setWallet(w);
      setTopupAmount('');
      setWalletMsg(t('topUpSuccess'));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setToppingUp(false);
    }
  }

  // Availability realism: mark busy for a window (or clear). ISO computed client-side.
  async function setBusy(ms: number | null, label: string) {
    setErr('');
    setSettingBusy(true);
    try {
      const until = ms === null ? null : new Date(Date.now() + ms).toISOString();
      await providerApi.setBusyUntil(until);
      setBusyMsg(label);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSettingBusy(false);
    }
  }

  // Edit the static schedule/details after signup (was only settable at register).
  async function saveDetails() {
    setErr(''); setSavingDetails(true);
    try {
      await providerApi.setDetails({ workingDays: days, workingHours: hours, emergencyService: emergency });
      setDetailsMsg(t('detailsSaved'));
    } catch (e) { setErr((e as Error).message); }
    finally { setSavingDetails(false); }
  }

  async function toggleAvailability() {
    if (!me) return;
    setErr('');
    setSavingAvail(true);
    try {
      await providerApi.setAvailability(!me.isAvailable);
      setMe({ ...me, isAvailable: !me.isAvailable });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSavingAvail(false);
    }
  }

  const approved = me?.status === 'approved';
  const verificationIncomplete =
    !!me && (me.verifications.length === 0 || me.verifications.some((v) => v.status !== 'approved'));

  // Real earnings series from the wallet ledger (empty-safe).
  const series = useMemo(() => weeklyEarnings(wallet?.ledger ?? []), [wallet]);
  const hasTrend = series.some((v) => v > 0);
  const activeJobs = jobs?.filter((j) => j.status !== 'completed' && j.status !== 'cancelled').length ?? 0;

  return (
    <div className="space-y-5">
      {/* Bold dark hero — near-black ground with a lime availability CTA (the signature move). */}
      <div className="relative overflow-hidden rounded-xl2 bg-ink p-5 shadow-lift sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/20 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-extrabold tracking-tightest text-white sm:text-4xl">{t('providerTitle')}</h1>
            <p className="mt-1 truncate text-sm font-medium text-white/60">{me?.businessName ?? t('yourServices')}</p>
          </div>
          {me?.isAvailable ? (
            <Button
              variant="success"
              disabled={!approved || savingAvail}
              onClick={toggleAvailability}
              className="min-w-[9rem] px-5 py-3 text-base"
            >
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
              {savingAvail ? t('saving') : t('available')}
            </Button>
          ) : (
            <AccentButton
              disabled={!approved || savingAvail}
              onClick={toggleAvailability}
              className="min-w-[9rem] px-5 py-3 text-base"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-brand-ink/60" aria-hidden="true" />
              {savingAvail ? t('saving') : t('unavailable')}
            </AccentButton>
          )}
        </div>
      </div>

      {err && <ErrorBanner message={err} />}

      {me === null && earnings === null && !err ? (
        <Spinner label={t('loadingProfile')} />
      ) : (
        <>
          {/* ===== KPI ROW — 2-up on mobile, 4-up on desktop ===== */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              icon={ICONS.wallet}
              tone="primary"
              label={t('walletBalance')}
              value={<Money cents={earnings?.totalNetCents ?? 0} />}
              spark={hasTrend ? { data: series } : undefined}
            />
            <KpiCard
              icon={ICONS.briefcase}
              tone="success"
              label={t('paidJobs')}
              value={<CountUp value={earnings?.paidJobs ?? 0} />}
            />
            <KpiCard
              icon={ICONS.star}
              tone="warn"
              label={t('rating')}
              value={<CountUp value={me?.ratingAvg ?? 0} decimals={1} />}
            />
            <KpiCard
              icon={ICONS.chat}
              tone="sky"
              label={t('jobRequests')}
              value={<CountUp value={activeJobs} />}
            />
          </div>

          {/* ===== Chart (2/3) + side rail (1/3) ===== */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Earnings trend */}
            <Card className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-extrabold tracking-tight text-ink dark:text-gray-50">{t('earnings')}</h2>
                  <p className="text-xs font-medium text-slate">{t('last6Weeks')}</p>
                </div>
                <span className="rounded-pill bg-brand px-3 py-1.5 font-display text-lg font-extrabold tabular-nums text-brand-ink shadow-brand">
                  <Money cents={earnings?.totalNetCents ?? 0} />
                </span>
              </div>
              {hasTrend ? (
                <AreaChart data={series} height={200} ariaLabel={t('earnings')} labels={['-5w', '-4w', '-3w', '-2w', '-1w', t('now')]} />
              ) : (
                <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-base bg-surface text-center dark:bg-gray-800/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary [&>svg]:h-5 [&>svg]:w-5 dark:bg-primary/15" aria-hidden="true">{ICONS.wallet}</span>
                  <p className="text-sm text-slate">{t('noEarningsYet')}</p>
                </div>
              )}
            </Card>

            {/* Side rail: availability + wallet */}
            <div className="flex flex-col gap-4">
              <Card className={wallet && wallet.balanceCents < 0 ? 'border-l-4 border-l-danger' : ''}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate">{t('walletBalance')}</div>
                <div className={`mt-1 font-display text-2xl font-extrabold tabular-nums ${wallet && wallet.balanceCents < 0 ? 'text-danger' : 'text-ink dark:text-gray-100'}`}>
                  <Money cents={wallet?.balanceCents ?? 0} />
                </div>
                {wallet && wallet.balanceCents < 0 && (
                  <p className="mt-2.5 rounded-base bg-warn/10 p-2 text-xs font-medium text-warn dark:bg-warn/20">{t('owesCommission')}</p>
                )}
                <div className="mt-3 flex items-end gap-2">
                  <label className="flex-1">
                    <span className="mb-1 block text-[11px] font-medium text-slate">{t('topUpAmount')}</span>
                    <input value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} inputMode="numeric" className={inputCls} />
                  </label>
                  <Button disabled={toppingUp} onClick={topUp}>{toppingUp ? t('toppingUp') : t('topUp')}</Button>
                </div>
                {walletMsg && <div className="mt-3"><SuccessBanner message={walletMsg} /></div>}
              </Card>

              {/* Availability status pill card */}
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate/10 text-slate [&>svg]:h-[18px] [&>svg]:w-[18px]" aria-hidden="true">{ICONS.shield}</span>
                  <StatusBadge status={me?.status ?? 'pending'} />
                </div>
                <div className="mt-3 text-sm font-medium text-ink dark:text-gray-50">{t('availability')}</div>
                <p className="mt-0.5 text-xs text-slate">
                  {approved ? (me?.isAvailable ? t('availabilityVisible') : t('availabilityHidden')) : t('availabilityPending')}
                </p>

                {/* Busy-until quick controls — availability realism. */}
                <div className="mt-3 border-t border-line pt-3 dark:border-gray-800">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate">{t('busyUntil')}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button variant="ghost" disabled={!approved || settingBusy} onClick={() => setBusy(60 * 60 * 1000, t('busySet'))} className="px-3 py-1.5 text-xs">{t('busy1h')}</Button>
                    <Button variant="ghost" disabled={!approved || settingBusy} onClick={() => setBusy(3 * 60 * 60 * 1000, t('busySet'))} className="px-3 py-1.5 text-xs">{t('busy3h')}</Button>
                    <Button variant="ghost" disabled={!approved || settingBusy} onClick={() => setBusy(endOfDayMs(), t('busySet'))} className="px-3 py-1.5 text-xs">{t('busyRestOfDay')}</Button>
                    <Button variant="brand" disabled={!approved || settingBusy} onClick={() => setBusy(null, t('busySet'))} className="px-3 py-1.5 text-xs">{t('imFree')}</Button>
                  </div>
                  {busyMsg && <p className="mt-2 text-xs font-medium text-success">{busyMsg}</p>}
                </div>
              </Card>
            </div>
          </div>

          {verificationIncomplete && (
            <a href={`/${locale}/provider/register`} className="block">
              <Card className="border-warn/40 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                <div className="flex items-center gap-2 text-sm font-medium text-warn">
                  <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{ICONS.shield}</span>
                  {t('completeVerification')}
                </div>
              </Card>
            </a>
          )}

          {/* ===== Job requests + verification, side by side on desktop ===== */}
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <h2 className="mb-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-ink dark:text-gray-100">{t('jobRequests')}</h2>
              {jobs === null && !err ? (
                <Spinner label={t('loadingJobs')} inline />
              ) : jobs && jobs.length === 0 ? (
                <EmptyState>{t('noJobRequests')}</EmptyState>
              ) : (
                <ul className="space-y-2.5">
                  {jobs?.map((j, i) => (
                    <li key={j.id}>
                      <Reveal delay={i * 40}>
                        <a href={`/${locale}/bookings/${j.id}`} className="block">
                          <Card className="transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary [&>svg]:h-[18px] [&>svg]:w-[18px] dark:bg-primary/15" aria-hidden="true">{ICONS.briefcase}</span>
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-semibold capitalize text-ink dark:text-gray-50">{j.categoryKey?.replace(/[._]/g, ' ') ?? t('service')}</div>
                                <div className="text-xs text-slate">{new Date(j.created_at).toLocaleDateString()}</div>
                              </div>
                              <StatusBadge status={j.status} />
                            </div>
                          </Card>
                        </a>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-ink dark:text-gray-100">{t('verification')}</h2>
              {me && me.verifications.length === 0 ? (
                <EmptyState>{t('noVerificationDocs')}</EmptyState>
              ) : (
                <ul className="space-y-2.5">
                  {me?.verifications.map((v) => (
                    <li key={v.type}>
                      <Card>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium capitalize text-ink dark:text-gray-100">{v.type.replace(/_/g, ' ')}</span>
                          <StatusBadge status={v.status} />
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Schedule & details — editable after signup (product gap fix). */}
          <Card>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary [&>svg]:h-4 [&>svg]:w-4 dark:bg-primary/15" aria-hidden="true">{ICONS.settings}</span>
              <h2 className="font-display text-base font-bold text-ink dark:text-gray-50">{t('scheduleDetails')}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-ink dark:text-gray-200">{t('workingDays')}</span>
                <input value={days} onChange={(e) => setDays(e.target.value)} placeholder="Mon–Sat" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-ink dark:text-gray-200">{t('workingHours')}</span>
                <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="08:00–18:00" className={inputCls} />
              </label>
            </div>
            <label className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-ink dark:text-gray-100">{t('emergencyService')}</span>
              <button
                type="button" role="switch" aria-checked={emergency}
                onClick={() => setEmergency((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition ${emergency ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-all ${emergency ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </label>
            <div className="mt-4 flex items-center gap-3">
              <Button disabled={savingDetails} onClick={saveDetails}>{savingDetails ? t('saving') : t('saveDetails')}</Button>
              {detailsMsg && <span className="text-sm font-medium text-success">{detailsMsg}</span>}
            </div>
          </Card>

          <WorkPhotosManager />

          {/* Reviews received + reply (reputation management). */}
          {(() => { const uid = getSession()?.userId; return uid ? <ProviderReviews providerId={uid} /> : null; })()}
        </>
      )}
    </div>
  );
}
