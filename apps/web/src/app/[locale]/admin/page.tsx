export default function AdminDashboard() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-gray-50">Owner / Admin Console</h1>
        <p className="mt-1 text-sm text-slate">Maintain platform master data without SQL.</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <li>
          <a href="admin/categories" className="block rounded-xl2 border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900">
            <span className="font-semibold text-ink dark:text-gray-100">Categories &amp; Sub-services</span>
            <span className="mt-1 block text-xs text-slate">Add, edit, deactivate, nest under a parent (e.g. Solar)</span>
          </a>
        </li>
        <li>
          <a href="admin/districts" className="block rounded-xl2 border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900">
            <span className="font-semibold text-ink dark:text-gray-100">Districts (Coverage)</span>
            <span className="mt-1 block text-xs text-slate">Activate a new district to expand beyond Kandy</span>
          </a>
        </li>
        <li>
          <a href="admin/verifications" className="block rounded-xl2 border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900">
            <span className="font-semibold text-ink dark:text-gray-100">Verification Queue</span>
            <span className="mt-1 block text-xs text-slate">Approve or reject provider documents</span>
          </a>
        </li>
        <li>
          <a href="admin/disputes" className="block rounded-xl2 border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900">
            <span className="font-semibold text-ink dark:text-gray-100">Disputes</span>
            <span className="mt-1 block text-xs text-slate">Resolve customer/provider disputes</span>
          </a>
        </li>
        <li>
          <a href="admin/analytics" className="block rounded-xl2 border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900">
            <span className="font-semibold text-ink dark:text-gray-100">Analytics</span>
            <span className="mt-1 block text-xs text-slate">Bookings, revenue, providers, KPIs</span>
          </a>
        </li>
        <li>
          <a href="admin/audit" className="block rounded-xl2 border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift dark:border-gray-800 dark:bg-gray-900">
            <span className="font-semibold text-ink dark:text-gray-100">Audit Log</span>
            <span className="mt-1 block text-xs text-slate">History of all admin actions</span>
          </a>
        </li>
      </ul>
    </div>
  );
}
