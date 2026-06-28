'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type Booking, type Message } from '@/lib/booking-api';
import { getToken, getSession } from '@/lib/session';
import { Button, Card, Spinner, ErrorBanner, SuccessBanner, StatusBadge, PageHeader, Money, Field, BookingProgress, inputCls } from '@/components/ui';

export default function BookingDetailPage() {
  const p = useParams();
  const id = p.id as string;
  const locale = (p.locale as string) ?? 'en';
  const t = useTranslations('dash');
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
  const [busy, setBusy] = useState<null | 'quote' | 'accept' | 'pay' | 'review' | 'cancel' | 'send'>(null);

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
    try { await bookingApi.quote(id, Math.round(amount * 100)); setMsg(t('quoteSaved')); await load(); } catch (e) { fail(e); } finally { setBusy(null); }
  }
  async function acceptQuote() {
    setErr('');
    if (busy) return;
    setBusy('accept');
    try { await bookingApi.acceptQuote(id); setMsg(t('quoteAccepted')); await load(); } catch (e) { fail(e); } finally { setBusy(null); }
  }
  async function settle(method: 'cash' | 'in_app') {
    setErr('');
    if (busy) return;
    setBusy('pay');
    try { await bookingApi.settle(id, method); setSettled(true); setMsg(t('paymentSettled')); } catch (e) { fail(e); } finally { setBusy(null); }
  }
  async function leaveReview() {
    if (busy) return;
    setBusy('review');
    try { await bookingApi.review(id, Number(stars), 'Reviewed via app'); setReviewed(true); } catch (e) { fail(e); } finally { setBusy(null); }
  }
  async function cancel() {
    if (busy) return;
    setBusy('cancel');
    try { await bookingApi.cancel(id); await load(); } catch (e) { fail(e); } finally { setBusy(null); }
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

      <Card className="rounded-2xl">
        <BookingProgress
          status={booking.status}
          labels={[t('stepRequested'), t('stepMatched'), t('stepAccepted'), t('stepInProgress'), t('stepCompleted')]}
        />
        {(booking.acceptedAt || booking.startedAt || booking.completedAt) && (
          <ul className="mt-3 space-y-0.5 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {booking.acceptedAt && <li>{t('stepAccepted')}: {new Date(booking.acceptedAt).toLocaleString()}</li>}
            {booking.startedAt && <li>{t('stepInProgress')}: {new Date(booking.startedAt).toLocaleString()}</li>}
            {booking.completedAt && <li>{t('stepCompleted')}: {new Date(booking.completedAt).toLocaleString()}</li>}
          </ul>
        )}
      </Card>

      <Card className="rounded-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-400">{t('details')}</p>
        <p className="mt-1.5 text-sm text-gray-700 dark:text-gray-300">{booking.description || t('noDescription')}</p>
        {canCancel && <Button variant="ghost" className="mt-4" disabled={busy === 'cancel'} onClick={cancel}>{busy === 'cancel' ? t('saving') : t('cancelBooking')}</Button>}
      </Card>

      {/* Quote — provider sets a price; customer accepts it. */}
      {canQuote && (
        <Card className="space-y-3 rounded-2xl">
          <h2 className="font-semibold">{t('setYourPrice')}</h2>
          {quoteStatus === 'quoted' && booking.priceCents != null && (
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('currentQuote')}: <Money cents={booking.priceCents} /></p>
          )}
          <Field label={t('yourPrice')} hint={t('setYourPriceHint')}>
            <div className="flex items-center gap-2">
              <span className="rounded-base border bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-900">LKR</span>
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={`${inputCls} max-w-[10rem]`} />
              <Button onClick={saveQuote} disabled={busy === 'quote'}>{busy === 'quote' ? t('saving') : t('saveQuote')}</Button>
            </div>
          </Field>
        </Card>
      )}

      {/* Customer view of the quote — accept it before the provider starts. */}
      {!isProvider && quoteStatus === 'quoted' && booking.status !== 'completed' && (
        <Card className="space-y-3 rounded-2xl border-l-4 border-l-primary">
          <h2 className="font-semibold">{t('quoteSection')}</h2>
          {booking.priceCents != null && (
            <p className="text-lg font-semibold"><span className="text-sm font-normal text-gray-500">{t('quotedPrice')}: </span><Money cents={booking.priceCents} /></p>
          )}
          <Button onClick={acceptQuote} disabled={busy === 'accept'}>{busy === 'accept' ? t('saving') : t('acceptQuote')}</Button>
        </Card>
      )}

      {/* Customer waiting for a quote. */}
      {!isProvider && quoteStatus === 'none' && ['matched', 'accepted'].includes(booking.status) && (
        <Card className="rounded-2xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('awaitingQuote')}</p>
        </Card>
      )}

      {/* Chat — available once a provider is assigned */}
      {booking.status !== 'requested' && (
        <Card className="rounded-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{t('chat')} <span className="text-xs font-normal text-gray-400">{t('numbersMasked')}</span></h2>
            <button onClick={() => bookingApi.messages(id).then(setMessages)} className="text-xs font-medium text-primary hover:underline">{t('refresh')}</button>
          </div>
          <ul className="mb-3 max-h-60 space-y-1.5 overflow-y-auto text-sm">
            {messages.length === 0 && <li className="py-4 text-center text-xs text-gray-400">{t('noMessages')}</li>}
            {messages.map((m, i) => (
              <li key={`${m.created_at}-${i}`} className="rounded-base bg-gray-50 px-3 py-2 dark:bg-gray-700">{m.body}</li>
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
        <Card className="space-y-4 rounded-2xl border-l-4 border-l-success">
          <h2 className="font-semibold">{t('jobComplete')}</h2>
          {booking.priceCents != null && (
            <p className="text-lg font-semibold"><span className="text-sm font-normal text-gray-500">{t('agreedPrice')}: </span><Money cents={booking.priceCents} /></p>
          )}
          {!settled ? (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('payExplainer')}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="success" onClick={() => settle('in_app')} disabled={busy === 'pay'}>{busy === 'pay' ? t('saving') : t('payInApp')}</Button>
                <Button variant="ghost" onClick={() => settle('cash')} disabled={busy === 'pay'}>{busy === 'pay' ? t('saving') : t('payCash')}</Button>
              </div>
            </>
          ) : <SuccessBanner message={t('pointsEarnedNote')} />}

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
