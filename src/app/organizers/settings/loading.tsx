// loading.tsx
export default function Loading() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen w-full p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6 flex items-center space-x-2">
          <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
          <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
          <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
        </div>

        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="mb-2 h-10 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
          <div className="h-5 w-96 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
        </div>

        {/* Main Content Skeleton */}
        <div className="space-y-8">
          {/* Profile Section */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-6 h-7 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
            <div className="space-y-6">
              <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0">
                <div className="h-20 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800"></div>
                <div className="flex space-x-3">
                  <div className="h-10 w-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
                  <div className="h-10 w-24 animate-pulse rounded-lg border border-neutral-200 bg-transparent dark:border-neutral-800"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
                    <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-6 h-7 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
            </div>
          </div>

          {/* Social Section */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-6 h-7 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
                  <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone Section */}
          <div className="rounded-xl border border-red-500/40 bg-red-50 p-6 dark:border-red-500/50 dark:bg-red-900/20">
            <div className="mb-6 h-7 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
            <div className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0">
              <div>
                <div className="h-5 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
                <div className="mt-1 h-4 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
              </div>
              <div className="h-12 w-32 animate-pulse rounded-lg border border-red-600 bg-transparent dark:border-red-400"></div>
            </div>
          </div>

          {/* Save Button Skeleton */}
          <div className="flex justify-end pt-2">
            <div className="h-12 w-32 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
          </div>
        </div>
      </div>
    </div>
  );
}