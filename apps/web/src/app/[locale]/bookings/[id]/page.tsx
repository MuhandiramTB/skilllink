'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type Booking, type Message } from '@/lib/booking-api';
import { getToken, getSession } from '@/lib/session';
import { Button, Card, Spinner, ErrorBanner, SuccessBanner, SuccessBurst, StatusBadge, PageHeader, Money, Field, BookingProgress, inputCls } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { SafetyButton } from '@/components/SafetyButton';
import { ICONS } from '@/components/nav-config';

export default function BookingDetailPage() {
  const p = useParams();
  const id = p.id as string;
  const locale = (p.locale as string) ?? 'en';
  const t = useTranslations('dash');
  const toast = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [settled, setSettled] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [stars, setStars] = useState('5');
  const [price, setPrice] = useState('');
  // Guards against double-submitting money/state actions (a real double-tap risk on mobile).
  const [busy, setBusy] = useState<null | 'quote' | 'accept' | 'pay' | 'review' | 'cancel' | 'send' | 'reschedule'>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newTime, setNewTime] = useState('');
  // Safety + policy dialogs / one-shot states.
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [cashReported, setCashReported] = useState(false);

  function fail(e: unknown) { setErr((e as Error).message); }

  async function load() {
    try {
      setBooking(await bookingApi.detail(id));
      setMessages(await bookingApi.messages(id));
    } catch (e) { fail(e); }
  }
  useEffect(() => {
    if (!getToken()) { window.location.href = `/${locale}/login?next=/${locale}/bookings/${id}`; return; }
    void load();
  }, []);

  async function send() {
    if (!chat.trim() || busy) return;
    setBusy('send');
    try { await bookingApi.sendMessage(id, chat); setChat(''); setMessages(await bookingApi.messages(id)); } catch (e) { fail(e); } finally { setBusy(null); }
  }
  async function saveQuote() {
    setErr('');
    const amount = Number(price);
    if (!amount || amount <= 0) { setErr(t('enterValidPrice')); return; }
    if (busy) return;
    setBusy('quote');
    try { await bookingApi.quote(id, Math.round(amount * 100)); setMsg(t('quoteSaved')); toast.show(t('quoteSaved'), 'success'); await load(); } catch (e) { fail(e); toast.show((e as Error).message, 'error'); } finally { setBusy(null); }
  }
  async function acceptQuote() {
    setErr('');
    if (busy) return;
    setBusy('accept');
    try { await bookingApi.acceptQuote(id); setMsg(t('quoteAccepted')); toast.show(t('quoteAccepted'), 'success'); await load(); } catch (e) { fail(e); toast.show((e as Error).message, 'error'); } finally { setBusy(null); }
  }
  async function settle(method: 'cash' | 'in_app') {
    setErr('');
    if (busy) return;
    setBusy('pay');
    try { await bookingApi.settle(id, method); setSettled(true); setMsg(t('paymentSettled')); toast.show(t('paymentSettled'), 'success'); } catch (e) { fail(e); toast.show((e as Error).message, 'error'); } finally { setBusy(null); }
  }
  async function leaveReview() {
    if (busy) return;
    setBusy('review');
    try { await bookingApi.review(id, Number(stars), 'Reviewed via app'); setReviewed(true); toast.show(t('reviewThanks', { stars }), 'success'); } catch (e) { fail(e); toast.show((e as Error).message, 'error'); } finally { setBusy(null); }
  }
  async function cancel() {
    if (busy) return;
    setBusy('cancel');
    setErr(''); setMsg('');
    try {
      const res = await bookingApi.cancel(id, cancelReason || undefined);
      setCancelOpen(false); setCancelReason('');
      if (res.cancelFeeCents > 0) {
        setErr('');
        setMsg('');
        // Surface the fee explicitly rather than a generic success.
        setFeeCents(res.cancelFeeCents);
      } else {
        setFeeCents(null);
      }
      await load();
    } catch (e) { fail(e); } finally { setBusy(null); }
  }
  async function reportNoShow() {
    if (busy) return;
    setBusy('cancel');
    setErr(''); setMsg('');
    try {
      await bookingApi.noShow(id);
      setNoShowOpen(false);
      setMsg(t('noShowReported'));
      toast.show(t('noShowReported'), 'success');
      await load();
    } catch (e) { fail(e); toast.show((e as Error).message, 'error'); } finally { setBusy(null); }
  }
  async function reportCash() {
    if (busy) return;
    setBusy('pay');
    setErr('');
    try {
      await bookingApi.reportCash(id);
      setCashReported(true);
      toast.show(t('reportCashDone'), 'success');
    } catch (e) { fail(e); toast.show((e as Error).message, 'error'); } finally { setBusy(null); }
  }
  async function doReschedule() {
    if (busy || !newTime) return;
    setBusy('reschedule');
    try {
      await bookingApi.reschedule(id, new Date(newTime).toISOString());
      toast.show(t('rescheduled'), 'success');
      setRescheduleOpen(false); setNewTime('');
      await load();
    } catch (e) { fail(e); toast.show((e as Error).message, 'error'); } finally { setBusy(null); }
  }

  if (err && !booking) return <ErrorBanner message={err} />;
  if (!booking) return <Spinner />;

  const me = getSession()?.userId;
  const isProvider = !!me && booking.providerId === me;
  const quoteStatus = booking.quoteStatus ?? 'none';
  const canCancel = ['requested', 'matched', 'accepted'].includes(booking.status);
  // Provider can quote once a job is assigned (matched/accepted) and not yet accepted by the customer.
  const canQuote = isProvider && ['matched', 'accepted'].includes(booking.status) && quoteStatus !== 'accepted';

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <a href={`/${locale}/bookings`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">{t('backToMyBookings')}</a>
      <PageHeader title={t('booking')} action={<StatusBadge status={booking.status} />} />
      {err && <ErrorBanner message={err} />}
      {msg && <SuccessBanner message={msg} />}

      <Card className="rounded-xl2">
        <BookingProgress
          status={booking.status}
          labels={[t('stepRequested'), t('stepMatched'), t('stepAccepted'), t('stepInProgress'), t('stepCompleted')]}
        />
        {(booking.acceptedAt || booking.startedAt || booking.completedAt) && (
          <ul className="mt-3 space-y-0.5 border-t border-line-soft pt-3 text-xs text-slate dark:border-gray-800 dark:text-gray-400">
            {booking.acceptedAt && <li>{t('stepAccepted')}: {new Date(booking.acceptedAt).toLocaleString()}</li>}
            {booking.startedAt && <li>{t('stepInProgress')}: {new Date(booking.startedAt).toLocaleString()}</li>}
            {booking.completedAt && <li>{t('stepCompleted')}: {new Date(booking.completedAt).toLocaleString()}</li>}
          </ul>
        )}
      </Card>

      <Card className="rounded-xl2">
        <p className="text-sm font-medium uppercase tracking-wide text-slate">{t('details')}</p>
        <p className="mt-1.5 text-sm text-slate dark:text-gray-300">{booking.description || t('noDescription')}</p>

        {/* Scheduled time (or ASAP) + reschedule. */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3 text-sm dark:border-gray-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <span className="font-medium text-ink dark:text-gray-100">
            {booking.scheduledFor ? new Date(booking.scheduledFor).toLocaleString() : t('scheduledAsap')}
          </span>
          {canCancel && !rescheduleOpen && (
            <button type="button" onClick={() => { setRescheduleOpen(true); setNewTime(booking.scheduledFor ? new Date(booking.scheduledFor).toISOString().slice(0, 16) : ''); }}
              className="text-xs font-semibold text-primary hover:underline">{t('reschedule')}</button>
          )}
        </div>
        {rescheduleOpen && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input type="datetime-local" value={newTime}
              min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
              onChange={(e) => setNewTime(e.target.value)} className={`${inputCls} max-w-[16rem]`} />
            <Button disabled={busy === 'reschedule' || !newTime} onClick={doReschedule}>{busy === 'reschedule' ? t('saving') : t('saveTime')}</Button>
            <Button variant="ghost" onClick={() => setRescheduleOpen(false)}>{t('cancelBooking') === '' ? '' : t('cancel')}</Button>
          </div>
        )}

        {canCancel && <Button variant="ghost" className="mt-4" disabled={busy === 'cancel'} onClick={cancel}>{busy === 'cancel' ? t('saving') : t('cancelBooking')}</Button>}
      </Card>

      {/* Quote — provider sets a price; customer accepts it. */}
      {canQuote && (
        <Card className="space-y-3 rounded-xl2">
          <h2 className="font-display font-bold text-ink dark:text-gray-50">{t('setYourPrice')}</h2>
          {quoteStatus === 'quoted' && booking.priceCents != null && (
            <p className="text-sm text-slate dark:text-gray-300">{t('currentQuote')}: <Money cents={booking.priceCents} /></p>
          )}
          <Field label={t('yourPrice')} hint={t('setYourPriceHint')}>
            <div className="flex items-center gap-2">
              <span className="rounded-base border border-line bg-surface px-3 py-2.5 text-sm font-medium text-slate dark:border-gray-600 dark:bg-gray-900">LKR</span>
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={`${inputCls} max-w-[10rem]`} />
              <Button onClick={saveQuote} disabled={busy === 'quote'}>{busy === 'quote' ? t('saving') : t('saveQuote')}</Button>
            </div>
          </Field>
        </Card>
      )}

      {/* Customer view of the quote — accept it before the provider starts. */}
      {!isProvider && quoteStatus === 'quoted' && booking.status !== 'completed' && (
        <Card className="space-y-3 rounded-xl2 border-l-4 border-l-primary">
          <h2 className="font-display font-bold text-ink dark:text-gray-50">{t('quoteSection')}</h2>
          {booking.priceCents != null && (
            <p className="text-lg font-semibold"><span className="text-sm font-normal text-slate">{t('quotedPrice')}: </span><Money cents={booking.priceCents} /></p>
          )}
          <Button onClick={acceptQuote} disabled={busy === 'accept'}>{busy === 'accept' ? t('saving') : t('acceptQuote')}</Button>
        </Card>
      )}

      {/* Customer waiting for a quote. */}
      {!isProvider && quoteStatus === 'none' && ['matched', 'accepted'].includes(booking.status) && (
        <Card className="rounded-xl2">
          <p className="text-sm text-slate dark:text-gray-400">{t('awaitingQuote')}</p>
        </Card>
      )}

      {/* Chat — available once a provider is assigned */}
      {booking.status !== 'requested' && (
        <Card className="rounded-xl2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display font-bold text-ink dark:text-gray-50">{t('chat')} <span className="text-xs font-normal text-slate">{t('numbersMasked')}</span></h2>
            <button onClick={() => bookingApi.messages(id).then(setMessages)} className="text-xs font-medium text-primary hover:underline">{t('refresh')}</button>
          </div>
          <ul className="mb-3 max-h-60 space-y-1.5 overflow-y-auto text-sm">
            {messages.length === 0 && <li className="py-4 text-center text-xs text-slate">{t('noMessages')}</li>}
            {messages.map((m, i) => (
              <li key={`${m.created_at}-${i}`} className="rounded-base bg-surface px-3 py-2 dark:bg-gray-700">{m.body}</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input value={chat} onChange={(e) => setChat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              className={inputCls} placeholder={t('typeMessage')} />
            <Button onClick={send} disabled={busy === 'send'}>{t('send')}</Button>
          </div>
        </Card>
      )}

      {/* Pay + review on completion (customer). Settle the agreed price as cash or in-app. */}
      {booking.status === 'completed' && !isProvider && (
        <Card className="space-y-4 rounded-xl2 border-l-4 border-l-success">
          <h2 className="font-display font-bold text-ink dark:text-gray-50">{t('jobComplete')}</h2>
          {booking.priceCents != null && (
            <p className="text-lg font-semibold"><span className="text-sm font-normal text-slate">{t('agreedPrice')}: </span><Money cents={booking.priceCents} /></p>
          )}
          {!settled ? (
            <>
              <p className="text-xs text-slate dark:text-gray-400">{t('payExplainer')}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="success" onClick={() => settle('in_app')} disabled={busy === 'pay'}>{busy === 'pay' ? t('saving') : t('payInApp')}</Button>
                <Button variant="ghost" onClick={() => settle('cash')} disabled={busy === 'pay'}>{busy === 'pay' ? t('saving') : t('payCash')}</Button>
              </div>
            </>
          ) : <SuccessBurst title={t('jobComplete')} sub={t('pointsEarnedNote')} />}

          {settled && !reviewed && (
            <div>
              <p className="mb-1.5 block text-sm font-medium">{t('rateProvider')}</p>
              <div className="flex items-center gap-2">
                <select value={stars} onChange={(e) => setStars(e.target.value)} className={`${inputCls} max-w-[7rem]`}>
                  {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} ★</option>)}
                </select>
                <Button onClick={leaveReview} disabled={busy === 'review'}>{busy === 'review' ? t('saving') : t('leaveReview')}</Button>
              </div>
            </div>
          )}
          {reviewed && <SuccessBanner message={t('reviewThanks', { stars })} />}
        </Card>
      )}
    </div>
  );
}
