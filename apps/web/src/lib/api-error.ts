'use client';

/**
 * Turns an API error envelope ({ code, message }) into a friendly, human-readable
 * string. The API returns i18n keys like "errors.booking.categoryInvalid" or codes
 * like "INTERNAL_ERROR" — neither is fit to show a user raw. This maps the common
 * ones to plain English and falls back to a safe generic message.
 */
const CODE_MESSAGES: Record<string, string> = {
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again in a moment.',
  RATE_LIMIT: 'Too many attempts. Please wait a minute and try again.',
  UNAUTHORIZED: 'Your session expired. Please sign in again.',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact SkillLink support for help.',
  FORBIDDEN: "You don't have access to do that.",
  NOT_FOUND: 'We couldn’t find what you were looking for.',
  VALIDATION_ERROR: 'Please check the details and try again.',
  PARSE: 'We couldn’t reach the server. Check your connection and try again.',
};

// i18n-key → friendly text for the messages the API returns as keys.
const KEY_MESSAGES: Record<string, string> = {
  'errors.internal': 'Something went wrong on our side. Please try again in a moment.',
  'errors.booking.categoryInvalid': 'That service isn’t available right now. Please pick another.',
  'errors.booking.providerNotApproved': 'That provider isn’t available. Please choose another.',
  'errors.booking.invalidTransition': 'That action isn’t allowed for this booking right now.',
  'errors.auth.suspended': 'Your account has been suspended. Please contact SkillLink support for help.',
  'errors.auth.otpInvalid': 'That code is invalid or expired. Please try again.',
  'errors.auth.tokenInvalid': 'Your session has expired. Please sign in again.',
  'errors.auth.noToken': 'Please sign in to continue.',
};

/** Build a friendly message from a raw error code + message (i18n key or text). */
export function friendlyError(code: string, message: string): string {
  if (KEY_MESSAGES[message]) return KEY_MESSAGES[message];
  if (CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  // If the message looks like an untranslated i18n key, don't show it raw.
  if (/^errors\./.test(message)) return CODE_MESSAGES.INTERNAL_ERROR;
  return message || CODE_MESSAGES.INTERNAL_ERROR;
}

// ---- Global session-expiry signal -----------------------------------------
// When any API call comes back 401 (expired/invalid token or a now-suspended
// account), we fire one event; a top-level listener shows the "session expired"
// modal instead of every page rendering a raw "UNAUTHORIZED" string.
const SESSION_EXPIRED_EVENT = 'skilllink:session-expired';

/** Codes that mean "your session is no longer valid — sign in again". */
export function isSessionError(code: string): boolean {
  return code === 'UNAUTHORIZED' || code === 'ACCOUNT_SUSPENDED';
}

/** Fire the global session-expired event (browser only). `reason` = suspended|expired. */
export function emitSessionExpired(reason: 'expired' | 'suspended' = 'expired') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason } }));
}

/** Subscribe to session-expiry; returns an unsubscribe fn. */
export function onSessionExpired(cb: (reason: 'expired' | 'suspended') => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => cb((e as CustomEvent).detail?.reason ?? 'expired');
  window.addEventListener(SESSION_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
}
