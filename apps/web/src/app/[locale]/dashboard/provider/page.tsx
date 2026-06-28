'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, homeForMode } from '@/lib/session';
import { providerApi, type ProviderMe, type WalletSummary } from '@/lib/provider-api';
import { bookingApi, type BookingListItem } from '@/lib/booking-api';
import { Button, Card, StatCard, Money, StatusBadge, Spinner, EmptyState, ErrorBanner, SuccessBanner, inputCls } from '@/components/ui';
import WorkPhotosManager from '@/components/WorkPhotosManager';

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
      .then(([m, e]) => { setMe(m); setEarnings(e); })
      .catch((e) => setErr((e as Error).message));
    bookingApi.providerJobs().then(setJobs).catch((e) => setErr((e as Error).message));
    // Wallet failure shouldn't break the dashboard — show inline only.
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink dark:text-gray-50">{t('providerTitle')}</h1>
        <p className="text-sm text-slate">{me?.businessName ?? t('yourServices')}</p>
      </div>

      {err && <ErrorBanner message={err} />}

      {me === null && earnings === null && !err ? (
        <Spinner label={t('loadingProfile')} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <div className="text-sm"><StatusBadge status={me?.status ?? 'pending'} /></div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate">{t('status')}</div>
            </Card>
            <StatCard label={t('rating')} value={(me?.ratingAvg ?? 0).toFixed(1)} tone="primary" />
            <StatCard label={t('paidJobs')} value={earnings?.paidJobs ?? 0} />
          </div>

          <section>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-ink dark:text-gray-50">{t('availability')}</div>
                  <div className="text-xs text-slate">
                    {approved
                      ? me?.isAvailable
                        ? t('availabilityVisible')
                        : t('availabilityHidden')
                      : t('availabilityPending')}
                  </div>
                </div>
                <Button
                  variant={me?.isAvailable ? 'success' : 'ghost'}
                  disabled={!approved || savingAvail}
                  onClick={toggleAvailability}
                >
                  {savingAvail ? t('saving') : me?.isAvailable ? t('available') : t('unavailable')}
                </Button>
              </div>
            </Card>
          </section>

          {wallet && (
            <section>
              <Card className={wallet.balanceCents < 0 ? 'border-l-4 border-l-danger' : ''}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate">{t('walletBalance')}</div>
                    <div className={`text-xl font-bold tabular-nums sm:text-2xl ${wallet.balanceCents < 0 ? 'text-danger' : 'text-ink dark:text-gray-100'}`}>
                      <Money cents={wallet.balanceCents} />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate">{t('topUpAmount')}</label>
                      <input
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        inputMode="numeric"
                        className={`${inputCls} max-w-[8rem]`}
                      />
                    </div>
                    <Button disabled={toppingUp} onClick={topUp}>{toppingUp ? t('toppingUp') : t('topUp')}</Button>
                  </div>
                </div>
                {wallet.balanceCents < 0 && (
                  <p className="mt-3 rounded-base bg-warn/10 p-2 text-sm text-warn dark:bg-warn/20">{t('owesCommission')}</p>
                )}
                {walletMsg && <div className="mt-3"><SuccessBanner message={walletMsg} /></div>}
              </Card>
            </section>
          )}

          {verificationIncomplete && (
            <a href={`/${locale}/provider/register`}>
              <Card className="border-warn/40 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                <div className="text-sm font-medium text-warn">
                  {t('completeVerification')}
                </div>
              </Card>
            </a>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate">
              {t('verification')}
            </h2>
            {me && me.verifications.length === 0 ? (
              <EmptyState>{t('noVerificationDocs')}</EmptyState>
            ) : (
              <ul className="space-y-2">
                {me?.verifications.map((v) => (
                  <li key={v.type}>
                    <Card>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium capitalize">{v.type.replace(/_/g, ' ')}</span>
                        <StatusBadge status={v.status} />
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <WorkPhotosManager />

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate">
              {t('jobRequests')}
            </h2>
            {jobs === null && !err ? (
              <Spinner label={t('loadingJobs')} />
            ) : jobs && jobs.length === 0 ? (
              <EmptyState>{t('noJobRequests')}</EmptyState>
            ) : (
              <ul className="space-y-2">
                {jobs?.map((j) => (
                  <li key={j.id}>
                    <a href={`/${locale}/bookings/${j.id}`}>
                      <Card className="transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-ink dark:text-gray-50">{j.categoryKey ?? t('service')}</div>
                            <div className="text-xs text-slate">
                              {new Date(j.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <StatusBadge status={j.status} />
                        </div>
                      </Card>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
