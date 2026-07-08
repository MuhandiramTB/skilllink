import { NavCard, PageHeader } from '@/components/ui';
import { ICONS } from '@/components/nav-config';
import { Reveal } from '@/components/Reveal';

export default function AdminDashboard() {
  const cards = [
    { href: 'admin/categories', icon: ICONS.grid, title: 'Categories & Sub-services', desc: 'Add, edit, deactivate, nest under a parent (e.g. Solar)' },
    { href: 'admin/districts', icon: ICONS.map, title: 'Districts (Coverage)', desc: 'Activate a new district to expand beyond Kandy' },
    { href: 'admin/verifications', icon: ICONS.shield, title: 'Verification Queue', desc: 'Approve or reject provider documents' },
    { href: 'admin/disputes', icon: ICONS.flag, title: 'Disputes', desc: 'Resolve customer/provider disputes' },
    { href: 'admin/analytics', icon: ICONS.receipt, title: 'Analytics', desc: 'Bookings, revenue, providers, KPIs' },
    { href: 'admin/audit', icon: ICONS.receipt, title: 'Audit Log', desc: 'History of all admin actions' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Owner / Admin Console" subtitle="Maintain platform master data without SQL." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.href} delay={i * 40}>
            <NavCard href={c.href} icon={c.icon} title={c.title} desc={c.desc} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
