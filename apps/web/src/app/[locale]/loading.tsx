/** Route-level loading skeleton shown during navigation/data fetch. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-24 rounded-base bg-gray-100 dark:bg-gray-800" />
      <div className="h-24 rounded-base bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}
