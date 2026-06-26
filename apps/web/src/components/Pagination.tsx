'use client';

import { Button } from './ui';

/** Shared pagination control. Offset-based; shows current range of total. */
export function Pagination({
  total,
  limit,
  offset,
  onChange,
}: {
  total: number;
  limit: number;
  offset: number;
  onChange: (newOffset: number) => void;
}) {
  if (total <= limit) return null;
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);
  const from = offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="flex items-center justify-between pt-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{from}–{to} of {total}</span>
      <div className="flex gap-2">
        <Button variant="ghost" disabled={page <= 1} onClick={() => onChange(Math.max(0, offset - limit))}>
          ← Prev
        </Button>
        <Button variant="ghost" disabled={page >= pages} onClick={() => onChange(offset + limit)}>
          Next →
        </Button>
      </div>
    </div>
  );
}
