export default function Loading() {
  return (
    <main className="container mx-auto my-12 px-4 sm:px-6 lg:px-8 flex-grow pt-8 sm:pt-12 md:pt-16">
      <div className="flex flex-col gap-8 animate-pulse">
        {/* Banner skeleton */}
        <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left content skeleton */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="space-y-4">
              <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-11/12 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-3">
                  <div className="h-6 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar card skeleton */}
          <div className="lg:col-span-1 lg:max-w-sm w-full lg:justify-self-end">
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 ring-1 ring-blue-900/5 shadow-[#1e3a8a]/10 flex flex-col gap-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="space-y-3">
                  <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="space-y-3">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6 flex flex-col gap-4">
                <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
