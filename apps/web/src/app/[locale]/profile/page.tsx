'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  getSession, fetchMe, fetchDistricts, saveProfile, uploadAvatar, removeAvatar,
  clearToken, logoutAllDevices, type Me, type District, type Role,
} from '@/lib/session';
import { Card, Button, Spinner, ErrorBanner, SuccessBanner } from '@/components/ui';
import ReferralCard from '@/components/ReferralCard';

type Theme = 'light' | 'dark';
const THEME_KEY = 'skilllink_theme';
const NOTIF_KEY = 'skilllink_notif_prefs';

const ROLE_LABEL: Record<Role, string> = { customer: 'Customer', provider: 'Provider', admin: 'Admin' };

export default function ProfilePage() {
  const locale = (useParams().locale as string) ?? 'en';
  const t = useTranslations('profile');

  const [me, setMe] = useState<Me | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  // editable fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [language, setLanguage] = useState<'si' | 'ta' | 'en'>('en');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [notif, setNotif] = useState({ bookings: true, messages: true, promos: false });

  useEffect(() => {
    if (!getSession()) { window.location.href = `/${locale}/login?next=/${locale}/profile`; return; }
    (async () => {
      const [m, d] = await Promise.all([fetchMe(), fetchDistricts()]);
      if (!m) { setErr('Could not load your profile.'); return; }
      setMe(m);
      setDistricts(d);
      setFullName(m.fullName ?? '');
      setEmail(m.email ?? '');
      setDistrictId(m.districtId ?? '');
      setLanguage(m.language);
      setAvatarUrl(m.avatarUrl);
    })();
    setTheme((window.localStorage.getItem(THEME_KEY) as Theme) ?? 'light');
    try {
      const saved = window.localStorage.getItem(NOTIF_KEY);
      if (saved) setNotif({ ...{ bookings: true, messages: true, promos: false }, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, [locale]);

  function applyTheme(next: Theme) {
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  function setNotifPref(key: keyof typeof notif, value: boolean) {
    const updated = { ...notif, [key]: value };
    setNotif(updated);
    window.localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(''); setUploading(true);
    // Optimistic local preview while we persist.
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
    try {
      const stored = await uploadAvatar(file);
      setAvatarUrl(stored);
      setOk(t('saved'));
    } catch {
      setErr(t('uploadError'));
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setOk(''); setBusy(true);
    try {
      await saveProfile({ fullName, email, districtId, language });
      setOk(t('saved'));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!me) {
    return <div className="flex min-h-[40vh] items-center justify-center">{err ? <ErrorBanner message={err} /> : <Spinner />}</div>;
  }

  // Initials only from a real name; with no name yet we show a person icon (not phone digits).
  const initials = fullName.trim()
    ? fullName.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
    : '';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-gray-50">{t('title')}</h1>
        <p className="text-sm text-slate dark:text-gray-400">{t('subtitle')}</p>
      </header>

      {ok && <SuccessBanner message={ok} />}
      {err && <ErrorBanner message={err} />}

      {/* Photo */}
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">{t('photo')}</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-bold text-primary dark:bg-primary/20">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : initials ? (
              <span>{initials}</span>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-base border border-line px-4 py-2 text-sm font-medium transition hover:border-primary dark:border-gray-600">
              {uploading ? t('saving') : t('changePhoto')}
              <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} disabled={uploading} />
            </label>
            {avatarUrl && (
              <button
                type="button"
                onClick={async () => { setAvatarUrl(null); await removeAvatar().catch(() => {}); }}
                className="rounded-base px-4 py-2 text-sm text-slate hover:text-danger"
              >
                {t('removePhoto')}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">{t('details')}</h2>
        <form onSubmit={save} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('fullName')}</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-base border border-line px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('emailOptional')}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full rounded-base border border-line px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('district')}</span>
            <select value={districtId} onChange={(e) => setDistrictId(e.target.value)}
              className="w-full rounded-base border border-line px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900">
              <option value="">{t('selectDistrict')}</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d[`name_${language}` as 'name_en'] ?? d.name_en}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('language')}</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value as 'si' | 'ta' | 'en')}
              className="w-full rounded-base border border-line px-3 py-2.5 dark:border-gray-600 dark:bg-gray-900">
              <option value="en">English</option>
              <option value="si">සිංහල</option>
              <option value="ta">தமிழ்</option>
            </select>
          </label>
          <Button type="submit" disabled={busy} className="flex items-center justify-center gap-2">
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
            {busy ? t('saving') : t('save')}
          </Button>
        </form>
      </Card>

      {/* Refer & earn — customers only (admins don't refer). Full referral UI lives
          here in the profile; the dashboard shows a compact promo that links here. */}
      {!me.roles.includes('admin') && <div id="referrals"><ReferralCard /></div>}

      {/* Preferences: theme */}
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">{t('preferences')}</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('theme')}</span>
          <div className="flex gap-1 rounded-base bg-surface p-0.5 dark:bg-gray-800">
            {(['light', 'dark'] as Theme[]).map((m) => (
              <button key={m} type="button" onClick={() => applyTheme(m)}
                aria-pressed={theme === m}
                className={`rounded-base px-3 py-1 text-sm font-medium transition ${theme === m ? 'bg-white text-primary shadow-sm dark:bg-gray-700' : 'text-slate dark:text-gray-400'}`}>
                {m === 'light' ? t('themeLight') : t('themeDark')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">{t('notifications')}</h2>
        {([['bookings', t('notifyBookings')], ['messages', t('notifyMessages')], ['promos', t('notifyPromos')]] as const).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between py-1">
            <span className="text-sm">{label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={notif[key]}
              aria-label={label}
              onClick={() => setNotifPref(key, !notif[key])}
              className={`relative h-6 w-11 rounded-full transition ${notif[key] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${notif[key] ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>
        ))}
      </Card>

      {/* Account & security */}
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">{t('account')}</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate">{t('phone')}</dt><dd className="font-medium tabular-nums">{me.phone}</dd></div>
          <div className="flex justify-between"><dt className="text-slate">{t('memberSince')}</dt><dd>{new Date(me.createdAt).toLocaleDateString()}</dd></div>
          <div className="flex items-center justify-between">
            <dt className="text-slate">{t('roles')}</dt>
            <dd className="flex gap-1.5">
              {me.roles.map((r) => (
                <span key={r} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/20">{ROLE_LABEL[r]}</span>
              ))}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2 border-t border-line pt-3 dark:border-gray-700">
          <Button variant="ghost" onClick={() => { clearToken(); window.location.href = `/${locale}`; }}>{t('signOut')}</Button>
          <button
            onClick={async () => { await logoutAllDevices(); window.location.href = `/${locale}`; }}
            className="rounded-base px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
          >
            {t('signOutAll')}
          </button>
        </div>
      </Card>
    </div>
  );
}
