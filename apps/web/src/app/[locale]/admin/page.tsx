export default function AdminDashboard() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Owner / Admin Console</h1>
      <p className="text-sm text-gray-600">Maintain platform master data without SQL.</p>
      <ul className="grid grid-cols-1 gap-3">
        <li>
          <a href="admin/categories" className="block rounded-base border bg-white p-4 shadow-sm hover:border-primary dark:border-gray-700 dark:bg-gray-800">
            <span className="font-medium">Categories &amp; Sub-services</span>
            <span className="block text-xs text-gray-500">Add, edit, deactivate, nest under a parent (e.g. Solar)</span>
          </a>
        </li>
        <li>
          <a href="admin/districts" className="block rounded-base border bg-white p-4 shadow-sm hover:border-primary dark:border-gray-700 dark:bg-gray-800">
            <span className="font-medium">Districts (Coverage)</span>
            <span className="block text-xs text-gray-500">Activate a new district to expand beyond Kandy</span>
          </a>
        </li>
        <li>
          <a href="admin/verifications" className="block rounded-base border bg-white p-4 shadow-sm hover:border-primary dark:border-gray-700 dark:bg-gray-800">
            <span className="font-medium">Verification Queue</span>
            <span className="block text-xs text-gray-500">Approve or reject provider documents</span>
          </a>
        </li>
        <li>
          <a href="admin/disputes" className="block rounded-base border bg-white p-4 shadow-sm hover:border-primary dark:border-gray-700 dark:bg-gray-800">
            <span className="font-medium">Disputes</span>
            <span className="block text-xs text-gray-500">Resolve customer/provider disputes</span>
          </a>
        </li>
        <li>
          <a href="admin/analytics" className="block rounded-base border bg-white p-4 shadow-sm hover:border-primary dark:border-gray-700 dark:bg-gray-800">
            <span className="font-medium">Analytics</span>
            <span className="block text-xs text-gray-500">Bookings, revenue, providers, KPIs</span>
          </a>
        </li>
        <li>
          <a href="admin/audit" className="block rounded-base border bg-white p-4 shadow-sm hover:border-primary dark:border-gray-700 dark:bg-gray-800">
            <span className="font-medium">Audit Log</span>
            <span className="block text-xs text-gray-500">History of all admin actions</span>
          </a>
        </li>
      </ul>
    </div>
  );
}
