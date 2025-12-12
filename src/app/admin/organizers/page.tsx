import Table from "@/components/admin/organizers/Table";


export default function CategoriesPage() {
  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap gap-2">
          <a
            href="/admin"
            className="text-base font-medium text-neutral-400 hover:text-primary"
          >
            Dashboard
          </a>
          <span className="text-base font-medium text-neutral-400">/</span>
          <span className="text-base font-medium text-primary dark:text-white">
            Categories
          </span>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-black text-primary dark:text-white">
              All Organizers
            </p>
            <p className="text-base text-neutral-400">
              Manage and explore all Organizers.
            </p>
          </div>
        </div>

        {/* DataTable */}
        <Table />
      </div>
    </main>
  );
}
