import { NotFoundBody } from './not-found-client';

/**
 * Catch-all for any unmatched path under a locale (e.g. /en/typo). Real routes win
 * over this (lower priority). Renders the branded 404 directly — reliable across
 * dev + prod, inside the app shell.
 */
export default function CatchAll() {
  return <NotFoundBody />;
}
