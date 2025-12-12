export default function Loading() {
  return (
    <section aria-busy="true" aria-live="polite" className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="h-14 w-14 rounded-full border-4 border-[#1e3a8a]/20 border-t-[#1e3a8a] animate-spin" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display text-primary dark:text-white">Loading events</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Preparing your next experience...</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm animate-pulse"
              >
                <div className="h-56 bg-gray-200/70 dark:bg-gray-700" />
                <div className="p-5">
                  <div className="h-5 w-1/2 bg-gray-200/70 dark:bg-gray-700 rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200/70 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-2/3 bg-gray-200/70 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <div className="h-5 w-24 bg-gray-200/70 dark:bg-gray-700 rounded" />
                    <div className="h-9 w-28 bg-[#1e3a8a]/30 dark:bg-blue-700/50 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
