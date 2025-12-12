import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <div className="relative w-48 h-48 md:w-64 md:h-64">
        <Image
          src="/logo.png"
          alt="Loading..."
          fill
          className="object-contain animate-pulse"
          priority
        />
      </div>
      <div className="mt-8 w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-primary-600 animate-[progress_2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}