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
  ACCOUNT_SUSPENDED: 'This account has been suspended. Please contact support.',
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
  'errors.auth.suspended': 'This account has been suspended. Please contact support.',
  'errors.auth.otpInvalid': 'That code is invalid or expired.',
};

/** Build a friendly message from a raw error code + message (i18n key or text). */
export function friendlyError(code: string, message: string): string {
  if (KEY_MESSAGES[message]) return KEY_MESSAGES[message];
  if (CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  // If the message looks like an untranslated i18n key, don't show it raw.
  if (/^errors\./.test(message)) return CODE_MESSAGES.INTERNAL_ERROR;
  return message || CODE_MESSAGES.INTERNAL_ERROR;
}
