'use client';

import { Card } from '@/components/ui';

/** Platform settings overview. Read-only for v1 — values come from server config/env. */
export default function AdminSettingsPage() {
  const rows: [string, string][] = [
    ['Commission rate', '12% per completed booking'],
    ['Currency', 'LKR (Sri Lankan Rupee)'],
    ['Active region', 'Kandy District (v1)'],
    ['Languages', 'Sinhala · Tamil · English'],
    ['Authentication', 'Phone OTP (no passwords)'],
    ['Payment gateway', 'PayHere / Genie (mock in dev)'],
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Platform configuration. Editable settings (commission, regions) move here as they&apos;re built;
        district activation is under <a href="districts" className="text-primary underline">Districts</a>.
      </p>
      <Card className="divide-y dark:divide-gray-700">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-gray-500 dark:text-gray-400">{k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
