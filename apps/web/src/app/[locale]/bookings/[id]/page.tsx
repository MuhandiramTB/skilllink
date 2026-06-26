'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { bookingApi, type Booking, type Message } from '@/lib/booking-api';
import { getToken } from '@/lib/admin-api';
import { Button, Card, Spinner, ErrorBanner, SuccessBanner, StatusBadge } from '@/components/ui';

export default function BookingDetailPage() {
  const p = useParams();
  const id = p.id as string;
  const locale = (p.locale as string) ?? 'en';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [paid, setPaid] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [amount, setAmount] = useState('100');
  const [stars, setStars] = useState('5');

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
    if (!chat.trim()) return;
    try { await bookingApi.sendMessage(id, chat); setChat(''); setMessages(await bookingApi.messages(id)); } catch (e) { fail(e); }
  }
  async function pay() {
    try {
      const p = await bookingApi.pay(id, Math.round(Number(amount) * 100));
      setPaid(true); setMsg(`Paid LKR ${amount} (commission LKR ${(p.commissionCents / 100).toFixed(2)}).`);
    } catch (e) { fail(e); }
  }
  async function leaveReview() {
    try { await bookingApi.review(id, Number(stars), 'Reviewed via app'); setReviewed(true); } catch (e) { fail(e); }
  }
  async function cancel() {
    try { await bookingApi.cancel(id); await load(); } catch (e) { fail(e); }
  }

  if (err && !booking) return <ErrorBanner message={err} />;
  if (!booking) return <Spinner />;

  const canCancel = ['requested', 'matched', 'accepted'].includes(booking.status);

  return (
    <div className="space-y-4">
      <a href={`/${locale}/bookings`} className="text-sm text-primary hover:underline">← My bookings</a>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Booking</h1>
        <StatusBadge status={booking.status} />
      </div>
      {err && <ErrorBanner message={err} />}
      {msg && <SuccessBanner message={msg} />}

      <Card>
        <p className="text-sm text-gray-600">{booking.description || 'No description'}</p>
        {canCancel && <Button variant="ghost" className="mt-3" onClick={cancel}>Cancel booking</Button>}
      </Card>

      {/* Chat — available once a provider is assigned */}
      {booking.status !== 'requested' && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">Chat <span className="text-xs font-normal text-gray-400">(numbers masked)</span></h2>
            <button onClick={() => bookingApi.messages(id).then(setMessages)} className="text-xs text-primary">Refresh</button>
          </div>
          <ul className="mb-2 max-h-48 space-y-1 overflow-y-auto text-sm">
            {messages.length === 0 && <li className="text-xs text-gray-400">No messages yet.</li>}
            {messages.map((m, i) => <li key={i} className="rounded bg-gray-50 px-2 py-1">{m.body}</li>)}
          </ul>
          <div className="flex gap-2">
            <input value={chat} onChange={(e) => setChat(e.target.value)} className="flex-1 rounded-base border px-2 py-1" placeholder="Message…" />
            <Button onClick={send}>Send</Button>
          </div>
        </Card>
      )}

      {/* Pay + review on completion */}
      {booking.status === 'completed' && (
        <Card className="space-y-3">
          <h2 className="font-medium">Job complete</h2>
          {!paid ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">LKR</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-24 rounded-base border px-2 py-1" />
              <Button variant="success" onClick={pay}>Pay</Button>
            </div>
          ) : <SuccessBanner message="Payment complete." />}

          {paid && !reviewed && (
            <div className="flex items-center gap-2">
              <select value={stars} onChange={(e) => setStars(e.target.value)} className="rounded-base border px-2 py-1">
                {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} ★</option>)}
              </select>
              <Button onClick={leaveReview}>Leave review</Button>
            </div>
          )}
          {reviewed && <SuccessBanner message={`Thanks for your review! ★${stars}`} />}
        </Card>
      )}
    </div>
  );
}
