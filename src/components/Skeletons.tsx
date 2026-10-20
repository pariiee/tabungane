export function TableRowsSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="py-4 px-4">
              <div
                className={`h-3.5 bg-gray-200 dark:bg-zinc-800 rounded ${
                  cIdx === 0 ? "w-28" : cIdx === 1 ? "w-36" : "w-20"
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-6 w-44 bg-gray-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-3.5 w-60 bg-gray-100 dark:bg-zinc-800/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-28 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-800 rounded" />
              <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-zinc-800" />
            </div>
            <div className="h-7 w-36 bg-gray-300 dark:bg-zinc-700 rounded-md" />
            <div className="h-2.5 w-48 bg-gray-100 dark:bg-zinc-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded" />
        <div className="h-36 bg-gray-100 dark:bg-zinc-800/40 rounded-lg" />
      </div>

      {/* List / Table Section */}
      <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
        <div className="h-4 w-40 bg-gray-200 dark:bg-zinc-800 rounded" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 bg-gray-50 dark:bg-zinc-800/40 rounded-lg border border-gray-100 dark:border-zinc-800/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Podium Skeleton */}
      <div className="pt-6 pb-2">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end max-w-2xl mx-auto h-64 sm:h-72">
          {/* #2 Rank (Left) */}
          <div className="flex flex-col items-center h-48 justify-end">
            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-zinc-800 mb-2" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800 rounded mb-2" />
            <div className="w-full h-28 bg-gray-200 dark:bg-zinc-800 rounded-t-2xl" />
          </div>

          {/* #1 Rank (Center, Elevated) */}
          <div className="flex flex-col items-center h-60 justify-end">
            <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-zinc-700 mb-2" />
            <div className="h-3.5 w-20 bg-gray-300 dark:bg-zinc-700 rounded mb-2" />
            <div className="w-full h-40 bg-gray-300 dark:bg-zinc-700 rounded-t-2xl" />
          </div>

          {/* #3 Rank (Right) */}
          <div className="flex flex-col items-center h-40 justify-end">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-zinc-800 mb-2" />
            <div className="h-3 w-14 bg-gray-200 dark:bg-zinc-800 rounded mb-2" />
            <div className="w-full h-20 bg-gray-200 dark:bg-zinc-800 rounded-t-2xl" />
          </div>
        </div>
      </div>

      {/* Strip Cards Skeleton */}
      <div className="space-y-2 max-w-2xl mx-auto pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-14 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-gray-200 dark:bg-zinc-800" />
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800" />
              <div className="space-y-1">
                <div className="h-3 w-28 bg-gray-200 dark:bg-zinc-800 rounded" />
                <div className="h-2.5 w-16 bg-gray-100 dark:bg-zinc-800/60 rounded" />
              </div>
            </div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-zinc-800" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 bg-gray-200 dark:bg-zinc-800 rounded" />
              <div className="h-2.5 w-20 bg-gray-100 dark:bg-zinc-800/60 rounded" />
            </div>
          </div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-800 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      {/* Header bar */}
      <div className="space-y-2">
        <div className="h-6 w-36 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-3 w-56 bg-gray-100 dark:bg-zinc-800/60 rounded" />
      </div>

      {/* User Card Skeleton */}
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-zinc-800 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-40 bg-gray-200 dark:bg-zinc-800 rounded" />
          <div className="h-3.5 w-48 bg-gray-100 dark:bg-zinc-800/60 rounded" />
        </div>
      </div>

      {/* Virtual Card Skeleton */}
      <div className="h-48 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-900/60" />

      {/* Academic Info Grid Skeleton */}
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2.5 w-16 bg-gray-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-28 bg-gray-300 dark:bg-zinc-700 rounded" />
          </div>
        ))}
      </div>

      {/* Form Skeleton */}
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded" />
        <div className="h-10 bg-gray-100 dark:bg-zinc-800/40 rounded-lg" />
        <div className="h-10 bg-gray-100 dark:bg-zinc-800/40 rounded-lg" />
      </div>
    </div>
  );
}
