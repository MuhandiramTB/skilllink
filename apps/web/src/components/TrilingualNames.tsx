'use client';

import { useState } from 'react';
import { Field, inputCls } from './ui';

/**
 * Trilingual name input (English / සිංහල / தமிழ்) with English-first auto-fill:
 * as the admin types the English name, the Sinhala & Tamil fields mirror it UNTIL
 * the admin manually edits one (then that field is "dirty" and stops auto-filling).
 * This keeps the form valid instantly without forcing three manual entries, while
 * still letting staff put real translations in.
 */
export interface TrilingualState {
  en: string;
  si: string;
  ta: string;
  setEn: (v: string) => void;
  setSi: (v: string) => void;
  setTa: (v: string) => void;
  reset: () => void;
}

export function useTrilingual(): TrilingualState {
  const [en, setEnRaw] = useState('');
  const [si, setSiRaw] = useState('');
  const [ta, setTaRaw] = useState('');
  const [siDirty, setSiDirty] = useState(false);
  const [taDirty, setTaDirty] = useState(false);

  return {
    en, si, ta,
    setEn: (v: string) => {
      setEnRaw(v);
      if (!siDirty) setSiRaw(v); // mirror until edited
      if (!taDirty) setTaRaw(v);
    },
    setSi: (v: string) => { setSiRaw(v); setSiDirty(true); },
    setTa: (v: string) => { setTaRaw(v); setTaDirty(true); },
    reset: () => { setEnRaw(''); setSiRaw(''); setTaRaw(''); setSiDirty(false); setTaDirty(false); },
  };
}

/** The three name fields. English is the source; Si/Ta auto-fill and remain editable. */
export function TrilingualNames({
  state,
  autoFocus,
  placeholder = 'e.g. Electrician',
}: {
  state: TrilingualState;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-3">
      <Field label="Name (English)" hint="Sinhala & Tamil auto-fill from this — edit them if you have the translations.">
        <input autoFocus={autoFocus} value={state.en} onChange={(e) => state.setEn(e.target.value)} className={inputCls} placeholder={placeholder} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="සිංහල">
          <input value={state.si} onChange={(e) => state.setSi(e.target.value)} className={inputCls} placeholder="සිංහල නම" />
        </Field>
        <Field label="தமிழ்">
          <input value={state.ta} onChange={(e) => state.setTa(e.target.value)} className={inputCls} placeholder="தமிழ் பெயர்" />
        </Field>
      </div>
    </div>
  );
}
