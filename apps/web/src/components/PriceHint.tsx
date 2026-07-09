import type { CategoryPrice } from '@/lib/api';
import { Money } from '@/components/ui';

/**
 * Understated price-band hint shown BEFORE booking (pricing transparency).
 * Renders "from LKR X" for a flat floor, or "LKR X–Y {unit}" for a range.
 * Deliberately small + slate — this is guidance, not a hard quote. Pair with
 * a one-line disclaimer at the call site.
 *
 * Labels are passed in (already translated) so this works in both server and
 * client components without binding to a fixed i18n namespace.
 */
export function PriceHint({
  price,
  fromLabel,
  rangeLabel,
  className = '',
}: {
  price: CategoryPrice | null | undefined;
  /** e.g. t('priceFrom') — prefix word like "from" */
  fromLabel: string;
  /** e.g. t('priceRange') — connector like "–" (usually just the dash) */
  rangeLabel: string;
  className?: string;
}) {
  if (!price) return null;
  const { minCents, maxCents, unit } = price;
  const showRange = maxCents > minCents;
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-1 text-xs text-slate ${className}`}>
      {showRange ? (
        <>
          <Money cents={minCents} />
          <span aria-hidden="true">{rangeLabel}</span>
          <Money cents={maxCents} />
        </>
      ) : (
        <>
          <span>{fromLabel}</span>
          <Money cents={minCents} />
        </>
      )}
      {unit && <span className="text-slate/80">{unit}</span>}
    </span>
  );
}
