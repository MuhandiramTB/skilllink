'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingApi, type Booking, type Message } from '@/lib/booking-api';
import { getToken, getSession } from '@/lib/session';
import { Button, Card, Spinner, ErrorBanner, SuccessBanner, SuccessBurst, StatusBadge, PageHeader, Money, Field, BookingProgress, inputCls } from '@/components/ui';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { LiveTrackingMap } from '@/components/LiveTrackingMap';
import { haptic } from '@/lib/haptics';
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
  const [thanksOpen, setThanksOpen] = useState(false);
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
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDone, setDisputeDone] = useState(false);
  const [sharingLoc, setSharingLoc] = useState(false);
  // Non-zero when a cancellation resulted in a fee — shown as a banner.
  const [feeCents, setFeeCents] = useState<number | null>(null);

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

  // Merge server messages with any still-pending local (optimistic) ones so a
  // just-sent bubble never flickers away before the server has persisted it. A
  // local message is "pending" until a server message with the same sender+body
  // appears; then the server copy (with real timestamp) takes over.
  function mergeMessages(server: Message[]) {
    setMessages((local) => {
      const serverKeys = new Set(server.map((m) => `${m.sender_id}|${m.body}`));
      const pending = local.filter((m) => m.pending && !serverKeys.has(`${m.sender_id}|${m.body}`));
      return [...server, ...pending];
    });
  }

  // Chat auto-poll: refresh messages every 4s so a conversation feels live without
  // websockets. Pauses when the tab is hidden; merges (never blindly overwrites)
  // so optimistic messages survive. Cleared on unmount.
  useEffect(() => {
    if (!getToken()) return;
    const tick = () => {
      if (document.hidden) return;
      bookingApi.messages(id).then(mergeMessages).catch(() => {});
      // Refresh the booking too while a job is active, so the customer's live map
      // + status keep updating (provider location, status changes).
      if (booking && ['accepted', 'in_progress'].includes(booking.status)) {
        bookingApi.detail(id).then(setBooking).catch(() => {});
      }
    };
    const iv = setInterval(tick, 4000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, booking?.status]);

  // Provider: while "sharing location" is on, stream GPS to the booking so the
  // customer sees the pin move. Stops on toggle-off / unmount.
  useEffect(() => {
    if (!sharingLoc || !('geolocation' in navigator)) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => { bookingApi.updateLocation(id, pos.coords.latitude, pos.coords.longitude).catch(() => {}); },
      () => { setSharingLoc(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [sharingLoc, id]);

  async function send() {
    if (!chat.trim() || busy) return;
    const body = chat.trim();
    const me = getSession()?.userId ?? '';
    // Optimistic: flag it `pending` so the poll-merge keeps it until the server
    // returns the persisted copy.
    setMessages((prev) => [...prev, { sender_id: me, body, created_at: new Date().toISOString(), pending: true }]);
    setChat('');
    setBusy('send');
    try { await bookingApi.sendMessage(id, body); mergeMessages(await bookingApi.messages(id)); } catch (e) { fail(e); } finally { setBusy(null); }
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
    try { await bookingApi.review(id, Number(stars), 'Reviewed via app'); setReviewed(true); haptic.celebrate(); setThanksOpen(true); toast.show(t('reviewThanks', { stars }), 'success'); } catch (e) { fail(e); haptic.warn(); toast.show((e as Error).message, 'error'); } finally { setBusy(null); }
  }
  async function cancel() {
    if (busy) return;
    setBusy('cancel');
    setErr(''); setMsg('');
    try {
      const res = await bookingApi.cancel(id, cancelReason || undefined);
      setCancelOpen(false); setCancelReason('');
      // Surface any cancellation fee explicitly (LKR cents from the API).
      setFeeCents(res.cancelFeeCents > 0 ? res.cancelFeeCents : null);
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
  async function openDispute() {
    if (!disputeReason.trim()) return;
    try {
      await bookingApi.openDispute(id, disputeReason.trim());
      setDisputeDone(true);
      setDisputeOpen(false);
      toast.show(t('disputeOpened'), 'success');
    } catch (e) { fail(e); toast.show((e as Error).message, 'error'); }
  }

  if (err && !booking) return <ErrorBanner message={err} />;
  if (!booking) return <Spinner />;

  const me = getSession()?.userId;
  const isProvider = !!me && booking.providerId === me;
  const isCustomer = !!me && !isProvider;
  const quoteStatus = booking.quoteStatus ?? 'none';
  const canCancel = ['requested', 'matched', 'accepted'].includes(booking.status);
  // A committed provider ('accepted') means a cancellation fee may apply.
  const cancelMayHaveFee = booking.status === 'accepted';
  // Customer safety/policy actions on an active/assigned job.
  const showSos = isCustomer && ['accepted', 'in_progress'].includes(booking.status);
  const canReportNoShow = isCustomer && ['matched', 'accepted'].includes(booking.status);
  // Either party may raise a dispute once there's something to dispute (a job that
  // progressed or ended). Hidden once one is filed this session.
  const canDispute = !disputeDone && ['in_progress', 'completed', 'cancelled', 'no_show'].includes(booking.status);
  // Provider can quote once a job is assigned (matched/accepted) and not yet accepted by the customer.
  const canQuote = isProvider && ['matched', 'accepted'].includes(booking.status) && quoteStatus !== 'accepted';

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <a href={`/${locale}/bookings`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">{t('backToMyBookings')}</a>
      <PageHeader title={t('booking')} action={<StatusBadge status={booking.status} />} />
      {err && <ErrorBanner message={err} />}
      {msg && <SuccessBanner message={msg} />}
      {feeCents != null && feeCents > 0 && (
        <div className="flex items-center gap-1.5 rounded-xl2 border border-warn/30 bg-warn/10 px-4 py-3 text-sm font-semibold text-ink dark:text-gray-100">
          <span>{t('cancelFeeCharged')}</span>
          <Money cents={feeCents} />
        </div>
      )}

      {/* SOS — prominent for the customer during an active in-home job. */}
      {showSos && (
        <div className="flex items-center justify-end rounded-xl2 border border-danger/20 bg-danger/5 px-4 py-3">
          <SafetyButton bookingId={booking.id} />
        </div>
      )}

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

      {/* Live tracking — active job only. Customer watches; provider shares. */}
      {['accepted', 'in_progress'].includes(booking.status) && booking.destLat != null && booking.destLng != null && (
        <>
          {isCustomer && (
            <LiveTrackingMap
              provider={booking.providerLat != null && booking.providerLng != null ? { lat: booking.providerLat, lng: booking.providerLng } : null}
              destination={{ lat: booking.destLat, lng: booking.destLng }}
              etaMinutes={booking.providerEtaMinutes}
              updatedAt={booking.providerLocAt}
            />
          )}
          {isProvider && (
            <Card className="rounded-xl2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-gray-50">{t('shareLocationTitle')}</p>
                  <p className="mt-0.5 text-xs text-slate">{t('shareLocationSub')}</p>
                </div>
                <button
                  type="button" role="switch" aria-checked={sharingLoc}
                  onClick={() => { haptic.tap(); setSharingLoc((v) => !v); }}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${sharingLoc ? 'bg-success' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-all ${sharingLoc ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {sharingLoc && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />{t('sharingLocationOn')}</p>}
            </Card>
          )}
        </>
      )}

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

        {/* Service address — what the provider needs to actually find the customer. */}
        {(booking.addressText || booking.addressNotes) && (
          <div className="mt-3 flex items-start gap-2 border-t border-line-soft pt-3 text-sm dark:border-gray-800">
            <svg viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6" /></svg>
            <div>
              {booking.addressText && <p className="font-medium text-ink dark:text-gray-100">{booking.addressText}</p>}
              {booking.addressNotes && <p className="mt-0.5 text-slate">{booking.addressNotes}</p>}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {canCancel && <Button variant="ghost" disabled={busy === 'cancel'} onClick={() => { setCancelReason(''); setCancelOpen(true); }}>{busy === 'cancel' ? t('saving') : t('cancelBooking')}</Button>}
          {canReportNoShow && (
            <button type="button" onClick={() => setNoShowOpen(true)}
              className="text-sm font-semibold text-danger hover:underline">{t('noShowAction')}</button>
          )}
        </div>
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

      {/* Provider: positively-framed cash-settlement self-report. */}
      {isProvider && booking.status === 'completed' && (
        <Card className="space-y-3 rounded-xl2 border-l-4 border-l-primary">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary dark:bg-primary/15 [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{ICONS.wallet}</span>
            <h2 className="font-display font-bold text-ink dark:text-gray-50">{t('reportCashTitle')}</h2>
          </div>
          <p className="text-sm text-slate dark:text-gray-300">{t('reportCashBody')}</p>
          {!cashReported ? (
            <Button onClick={reportCash} disabled={busy === 'pay'}>{busy === 'pay' ? t('saving') : t('reportCashCta')}</Button>
          ) : (
            <SuccessBanner message={t('reportCashDone')} />
          )}
        </Card>
      )}

      {/* Cancel — confirm, warn about a possible fee when a provider is committed. */}
      <ConfirmModal
        open={cancelOpen}
        tone="danger"
        title={t('cancelConfirmTitle')}
        body={(
          <span className="block space-y-3 text-left">
            <span className="block text-center text-sm text-slate">{cancelMayHaveFee ? t('cancelFeeWarning') : t('cancelConfirmBody')}</span>
            <span className="block">
              <span className="mb-1 block text-xs font-medium text-slate">{t('cancelReason')}</span>
              <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className={`${inputCls} w-full`}>
                <option value="">{t('cancelReasonOther')}</option>
                <option value="changed_mind">{t('cancelReasonChanged')}</option>
                <option value="found_other">{t('cancelReasonFound')}</option>
                <option value="timing">{t('cancelReasonTiming')}</option>
              </select>
            </span>
          </span>
        )}
        confirmLabel={t('cancelConfirmYes')}
        cancelLabel={t('keepBooking')}
        busy={busy === 'cancel'}
        onConfirm={cancel}
        onCancel={() => { if (busy !== 'cancel') setCancelOpen(false); }}
      />

      {/* No-show — customer reports the provider never arrived. */}
      <ConfirmModal
        open={noShowOpen}
        tone="danger"
        title={t('noShowConfirmTitle')}
        body={t('noShowConfirmBody')}
        confirmLabel={t('noShowConfirmYes')}
        cancelLabel={t('keepBooking')}
        busy={busy === 'cancel'}
        onConfirm={reportNoShow}
        onCancel={() => { if (busy !== 'cancel') setNoShowOpen(false); }}
      />

      {/* Report a problem / open a dispute — either party, once the job progressed. */}
      {canDispute && (
        <div className="border-t border-line-soft pt-4 text-center dark:border-gray-800">
          <button
            type="button"
            onClick={() => setDisputeOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate transition hover:text-danger"
          >
            <span className="[&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden="true">{ICONS.flag}</span>
            {t('reportProblem')}
          </button>
        </div>
      )}
      {disputeDone && (
        <div className="border-t border-line-soft pt-4 dark:border-gray-800">
          <SuccessBanner message={t('disputeOpened')} />
        </div>
      )}

      {/* Dispute modal — collects a reason, then POSTs. */}
      {disputeOpen && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={t('reportProblem')}>
          <button type="button" aria-label={t('keepBooking')} tabIndex={-1} className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-sm" onClick={() => setDisputeOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl2 border border-line bg-white p-6 shadow-lift dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warn/12 text-warn [&>svg]:h-[18px] [&>svg]:w-[18px]" aria-hidden="true">{ICONS.flag}</span>
              <h2 className="font-display text-base font-bold text-ink dark:text-gray-50">{t('reportProblem')}</h2>
            </div>
            <p className="mt-2 text-sm text-slate">{t('disputeHelp')}</p>
            <Field label={t('disputeReasonLabel')}>
              <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} rows={3} className={inputCls} placeholder={t('disputePlaceholder')} />
            </Field>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={() => setDisputeOpen(false)} className="flex-1 rounded-base border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink hover:bg-surface dark:border-gray-700 dark:bg-transparent dark:text-gray-100">{t('keepBooking')}</button>
              <Button variant="danger" className="flex-1" disabled={!disputeReason.trim()} onClick={openDispute}>{t('disputeSubmit')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Peak moment: thanks-for-reviewing celebration. */}
      <CelebrationOverlay
        open={thanksOpen}
        title={t('reviewCelebrateTitle')}
        sub={t('reviewCelebrateSub')}
        icon={<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187z" /></svg>}
        onClose={() => setThanksOpen(false)}
      />
    </div>
  );
}
