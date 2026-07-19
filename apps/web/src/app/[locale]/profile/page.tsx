'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  getSession, fetchMe, fetchDistricts, saveProfile, uploadAvatar, removeAvatar,
  clearToken, logoutAllDevices, getNotifPrefs, setNotifPrefs, type Me, type District, type Role,
} from '@/lib/session';
import { Card, Button, Field, inputCls, Spinner, ErrorBanner, SuccessBanner, EmptyState } from '@/components/ui';
import { ICONS } from '@/components/nav-config';
import { Reveal } from '@/components/Reveal';
import ReferralCard from '@/components/ReferralCard';
import { safetyApi, type TrustedContact } from '@/lib/safety-api';

type Theme = 'light' | 'dark';
const THEME_KEY = 'skilllink_theme';
const NOTIF_KEY = 'skilllink_notif_prefs';

const ROLE_LABEL: Record<Role, string> = { customer: 'Customer', provider: 'Provider', admin: 'Admin' };

/** Section shell: an icon-led header + a card body. Gives the page real hierarchy
 *  instead of a stack of identical uppercase-label cards. */
function SettingsCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-ink [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{icon}</span>
        <h2 className="font-display text-base font-extrabold tracking-tight text-ink dark:text-gray-50">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

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

  // Trusted contacts (safety)
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactBusy, setContactBusy] = useState(false);

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
      safetyApi.listContacts().then(setContacts).catch(() => {});
    })();
    setTheme((window.localStorage.getItem(THEME_KEY) as Theme) ?? 'light');
    // Load notification prefs from the server (source of truth; they govern
    // real off-app delivery). Fall back to any cached local value on failure.
    getNotifPrefs()
      .then(setNotif)
      .catch(() => {
        try {
          const saved = window.localStorage.getItem(NOTIF_KEY);
          if (saved) setNotif({ ...{ bookings: true, messages: true, promos: false }, ...JSON.parse(saved) });
        } catch { /* ignore */ }
      });
  }, [locale]);

  function applyTheme(next: Theme) {
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  function setNotifPref(key: keyof typeof notif, value: boolean) {
    const updated = { ...notif, [key]: value };
    setNotif(updated); // optimistic
    window.localStorage.setItem(NOTIF_KEY, JSON.stringify(updated)); // cache
    setNotifPrefs({ [key]: value }).catch(() => {
      setNotif(notif); // revert on failure
      setErr(t('saveError'));
    });
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;
    setErr(''); setContactBusy(true);
    try {
      const c = await safetyApi.addContact(contactName.trim(), contactPhone.trim());
      setContacts((prev) => [...prev, c]);
      setContactName(''); setContactPhone('');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setContactBusy(false);
    }
  }

  async function removeContact(id: string) {
    setErr('');
    const prev = contacts;
    setContacts((cs) => cs.filter((c) => c.id !== id)); // optimistic
    try {
      await safetyApi.removeContact(id);
    } catch (e) {
      setContacts(prev); // revert
      setErr((e as Error).message);
    }
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
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tightest text-ink dark:text-gray-50 sm:text-[40px]">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate dark:text-gray-400">{t('subtitle')}</p>
      </header>

      {ok && <SuccessBanner message={ok} />}
      {err && <ErrorBanner message={err} />}

      {/* ===== Identity hero ===== */}
      <div className="relative overflow-hidden rounded-xl2 border border-line bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
        <div className="h-20 bg-ink sm:h-24">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/40 blur-3xl" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:gap-5">
          {/* Avatar overlapping the banner */}
          <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-primary/10 text-2xl font-bold text-primary dark:border-gray-900 dark:bg-primary/20 sm:h-24 sm:w-24">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : initials ? (
                <span>{initials}</span>
              ) : (
                <span className="[&>svg]:h-10 [&>svg]:w-10" aria-hidden="true">{ICONS.user}</span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 sm:pb-1">
            <h2 className="truncate font-display text-xl font-extrabold tracking-tightest text-ink dark:text-gray-50">
              {fullName.trim() || t('fullName')}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <span className="[&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden="true">{ICONS.user}</span>{me.phone}
              </span>
              <span className="text-slate-2">·</span>
              <span>{t('memberSince')} {new Date(me.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {me.roles.map((r) => (
                <span key={r} className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/15 dark:bg-primary/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{ROLE_LABEL[r]}
                </span>
              ))}
            </div>
          </div>
          {/* Photo actions */}
          <div className="flex flex-wrap gap-2 sm:pb-1">
            <label className="cursor-pointer rounded-base border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-100">
              {uploading ? t('saving') : t('changePhoto')}
              <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} disabled={uploading} />
            </label>
            {avatarUrl && (
              <button
                type="button"
                onClick={async () => { setAvatarUrl(null); await removeAvatar().catch(() => {}); }}
                className="rounded-base px-3 py-2 text-sm font-medium text-slate transition hover:text-danger"
              >
                {t('removePhoto')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== Two-column settings on desktop ===== */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left / main column */}
        <div className="space-y-6 lg:col-span-3">
          <Reveal>
          <SettingsCard icon={ICONS.user} title={t('details')}>
            <form onSubmit={save} className="space-y-4">
              <Field label={t('fullName')}>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t('emailOptional')}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('district')}>
                  <select value={districtId} onChange={(e) => setDistrictId(e.target.value)} className={inputCls}>
                    <option value="">{t('selectDistrict')}</option>
                    {districts.map((d) => <option key={d.id} value={d.id}>{d[`name_${language}` as 'name_en'] ?? d.name_en}</option>)}
                  </select>
                </Field>
                <Field label={t('language')}>
                  <select value={language} onChange={(e) => setLanguage(e.target.value as 'si' | 'ta' | 'en')} className={inputCls}>
                    <option value="en">English</option>
                    <option value="si">සිංහල</option>
                    <option value="ta">தமிழ்</option>
                  </select>
                </Field>
              </div>
              <Button type="submit" disabled={busy} className="flex items-center justify-center gap-2">
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
                {busy ? t('saving') : t('save')}
              </Button>
            </form>
          </SettingsCard>
          </Reveal>

          {/* Refer & earn — customers only (admins don't refer). */}
          {!me.roles.includes('admin') && (
            <Reveal delay={60}>
              <div id="referrals"><ReferralCard /></div>
            </Reveal>
          )}
        </div>

        {/* Right / preferences column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Preferences: theme */}
          <Reveal delay={40}>
          <SettingsCard icon={ICONS.settings} title={t('preferences')}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink dark:text-gray-100">{t('theme')}</span>
              <div className="flex gap-1 rounded-base bg-surface p-0.5 dark:bg-gray-800">
                {(['light', 'dark'] as Theme[]).map((m) => (
                  <button key={m} type="button" onClick={() => applyTheme(m)}
                    aria-pressed={theme === m}
                    className={`rounded-base px-3 py-1.5 text-sm font-bold transition ${theme === m ? 'bg-brand text-brand-ink shadow-brand' : 'text-slate dark:text-gray-400'}`}>
                    {m === 'light' ? t('themeLight') : t('themeDark')}
                  </button>
                ))}
              </div>
            </div>
          </SettingsCard>
          </Reveal>

          {/* Notifications */}
          <Reveal delay={80}>
          <SettingsCard icon={ICONS.bell} title={t('notifications')}>
            <div className="space-y-1">
              {([['bookings', t('notifyBookings')], ['messages', t('notifyMessages')], ['promos', t('notifyPromos')]] as const).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-base px-1 py-2">
                  <span className="text-sm text-ink dark:text-gray-100">{label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notif[key]}
                    aria-label={label}
                    onClick={() => setNotifPref(key, !notif[key])}
                    className={`relative h-6 w-11 rounded-full transition ${notif[key] ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-brand-ink shadow-card transition-all ${notif[key] ? 'left-[22px]' : 'left-0.5 bg-white'}`} />
                  </button>
                </label>
              ))}
            </div>
          </SettingsCard>
          </Reveal>

          {/* Account & security */}
          <Reveal delay={120}>
          <SettingsCard icon={ICONS.shield} title={t('account')}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate">{t('phone')}</dt><dd className="font-medium tabular-nums text-ink dark:text-gray-100">{me.phone}</dd></div>
              <div className="flex justify-between"><dt className="text-slate">{t('memberSince')}</dt><dd className="text-ink dark:text-gray-100">{new Date(me.createdAt).toLocaleDateString()}</dd></div>
            </dl>
            <div className="flex flex-col gap-2 border-t border-line-soft pt-3 dark:border-gray-800">
              <Button variant="ghost" onClick={() => { clearToken(); window.location.href = `/${locale}`; }}>{t('signOut')}</Button>
              <button
                onClick={async () => { await logoutAllDevices(); window.location.href = `/${locale}`; }}
                className="rounded-base px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/10"
              >
                {t('signOutAll')}
              </button>
            </div>
          </SettingsCard>
          </Reveal>

          {/* Safety & trusted contacts */}
          <Reveal delay={160}>
          <SettingsCard icon={ICONS.shield} title={t('safetyContactsTitle')}>
            <p className="text-sm text-slate">{t('safetyContactsHint')}</p>

            {contacts.length === 0 ? (
              <EmptyState>{t('noContacts')}</EmptyState>
            ) : (
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-base border border-line-soft bg-surface px-3 py-2.5 dark:border-gray-800 dark:bg-gray-800/50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink dark:text-gray-100">{c.name}</span>
                      <span className="block truncate text-xs tabular-nums text-slate">{c.phone}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeContact(c.id)}
                      className="shrink-0 rounded-base px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10"
                    >
                      {t('removeContact')}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={addContact} className="space-y-3 border-t border-line-soft pt-3 dark:border-gray-800">
              <Field label={t('contactName')}>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t('contactPhone')}>
                <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+94…" className={inputCls} />
              </Field>
              <Button type="submit" variant="ghost" disabled={contactBusy || !contactName.trim() || !contactPhone.trim()} className="w-full">
                {contactBusy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/40 border-t-current" aria-hidden />}
                {t('addContact')}
              </Button>
            </form>
          </SettingsCard>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
