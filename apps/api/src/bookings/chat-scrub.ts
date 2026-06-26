/**
 * Defense-in-depth: strip anything resembling a phone number from chat bodies so real
 * numbers are never persisted/exposed (Spec Req 4.1 — call masking).
 *
 * Catches: any run containing 7+ digits total once spaces/dashes/dots/parens are
 * ignored, including +94 and local 0xx formats — e.g. "077 123 4567", "0771234",
 * "+94 77 123 4567". Counting digits (not raw length) avoids the old miss where a
 * short-but-real number fell under a fixed-length threshold.
 */
export function scrubPhones(body: string): string {
  return body.replace(/\+?[\d][\d\s().-]{5,}\d/g, (m) =>
    (m.match(/\d/g)?.length ?? 0) >= 7 ? '[hidden]' : m,
  );
}
