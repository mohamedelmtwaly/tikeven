"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import Table from "@/components/admin/categories/Table";
import { useState } from "react";
import AddModal from "@/components/admin/categories/AddModal";

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap gap-2">
          <a
            href="#"
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
              All Categories
            </p>
            <p className="text-base text-neutral-400">
              Manage and explore all your categories here.
            </p>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-blue-800">
            <PlusIcon className="h-5 w-5" />
            Add New Category
          </button>
        </div>

        {/* DataTable */}
        <Table />

        <AddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </main>
  );
}
