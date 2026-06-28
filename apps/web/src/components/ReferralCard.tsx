'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { referralsApi, type ReferralInfo } from '@/lib/referrals-api';
import { Button, Card, SuccessBanner, ErrorBanner, inputCls } from '@/components/ui';

/** Referral card (spec 15): share your code + apply a friend's code for points. */
export default function ReferralCard() {
  const t = useTranslations('dash');
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    referralsApi.me().then(setInfo).catch(() => {});
  }, []);

  async function copy() {
    if (!info?.code) return;
    try { await navigator.clipboard.writeText(info.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  }

  async function apply() {
    if (!code.trim() || busy) return;
    setErr(''); setMsg(''); setBusy(true);
    try {
      const r = await referralsApi.apply(code.trim());
      setMsg(t('referralApplied', { points: r.pointsEarned }));
      setCode('');
      referralsApi.me().then(setInfo).catch(() => {});
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!info) return null;
  // Once referred, hide the apply field (referred_by is set once).

  return (
    <section>
      <Card className="rounded-xl2">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate">{t('referFriends')}</div>
        <p className="mt-1 text-sm text-slate dark:text-gray-300">
          {t('referExplainer', { referrer: info.referrerPoints, referee: info.refereePoints })}
        </p>

        {info.code && (
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-base border border-line bg-surface px-3 py-2 text-center text-lg font-bold tracking-widest text-primary dark:border-gray-700 dark:bg-gray-900">
              {info.code}
            </code>
            <Button variant="ghost" onClick={copy}>{copied ? t('copied') : t('copy')}</Button>
          </div>
        )}

        <p className="mt-2 text-xs text-slate">{t('referredCount', { count: info.referredCount })}</p>

        <div className="mt-4 border-t border-line pt-3 dark:border-gray-800">
          <label className="mb-1.5 block text-sm font-medium">{t('haveACode')}</label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SK______"
              className={`${inputCls} uppercase tracking-widest`}
            />
            <Button onClick={apply} disabled={busy}>{busy ? t('saving') : t('apply')}</Button>
          </div>
          {msg && <div className="mt-2"><SuccessBanner message={msg} /></div>}
          {err && <div className="mt-2"><ErrorBanner message={err} /></div>}
        </div>
      </Card>
    </section>
  );
}
