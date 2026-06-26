export default function Loading() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-5 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-base bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}
