"use client";

import { useEffect, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, deleteCategory } from "@/lib/features/categorySlice";
import { Category } from "@/types/category";
import { AppDispatch, RootState } from "@/lib/features";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import EditModal from "./EditModal";
import Swal from "sweetalert2";

interface TableColumnType<T> extends TableColumn<T> {
  name: string;
  selector?: (row: T) => any;
  sortable?: boolean;
  cell?: (row: T) => React.ReactNode;
  ignoreRowClick?: boolean;
  width?: string;
}

const Table = (): React.ReactElement => {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading, error } = useSelector(
    (state: RootState) => state.categories
  );
  const [search, setSearch] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const filtered = categories.filter((c: Category) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error,
        confirmButtonColor: '#3b82f6',
      });
    }
  }, [error]);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to delete this category. This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusConfirm: false,
      focusCancel: true
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteCategory(id)).unwrap();
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Category has been deleted successfully.',
          confirmButtonColor: '#3b82f6',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      } catch (error: any) {
        const errorText =
          typeof error === 'string'
            ? error
            : error?.message || '';
        const hasAssociatedEvents = errorText.toLowerCase().includes('associated events');

        const errorMessage = hasAssociatedEvents
          ? 'Cannot delete category because it has associated events. Please remove or reassign the events first.'
          : errorText || 'Failed to delete category. Please try again.';

        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };

  const columns: TableColumnType<Category>[] = [
    {
      name: "Image",
      selector: (row: Category) => row.image,
      cell: (row: Category) => (
        <div className="relative h-10 w-10 rounded-lg overflow-hidden">
          <Image src={row.image} alt={row.name} fill className="object-cover" />
        </div>
      ),
      width: "80px",
    },
    {
      name: "Category",
      selector: (row: Category) => row.name,
      sortable: true,
    },
    {
      name: "Events Count",
      selector: (row: Category) => row.eventsCount ?? 0,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row: Category) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5 text-blue-500" />
          </button>
          <button
            onClick={() => row.id && handleDelete(row.id)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Delete"
          >
            <TrashIcon className="h-5 w-5 text-red-500" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      width: "100px",
    },
  ];

  const customStyles = {
    header: {
      style: {
        backgroundColor: "#eef0fd",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#152c6c",
        textAlign: "center" as const,
        padding: 0,
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    headRow: {
      style: {
        backgroundColor: "#eef0fd",
        minHeight: "56px",
      },
    },
    headCells: {
      style: {
        fontWeight: "bold",
        fontSize: "14px",
        color: "#152c6c",
        padding: "8px 16px",
        justifyContent: "center",
        textAlign: "center" as const,
      },
    },
    cells: {
      style: {
        padding: "8px 16px",
        fontSize: "14px",
        color: "#374151",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center" as const,
      },
    },
  };

  return (
    <div className="">
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
      />

      {/* Search */}
      <div className="relative mb-4 w-full sm:max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-4 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <DataTable<Category>
          columns={columns}
          data={filtered}
          highlightOnHover={true}
          responsive={true}
          pagination={true}
          progressPending={loading}
          paginationPerPage={12}
          paginationRowsPerPageOptions={[]}
          paginationComponentOptions={{
            rowsPerPageText: "",
            rangeSeparatorText: "of",
          }}
          progressComponent={
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
          }
          noDataComponent={
            <div className="p-4 text-center text-gray-500">
              No categories found
            </div>
          }
          customStyles={customStyles}
          paginationComponent={Pagination}
        />
      </div>
    </div>
  );
};

export default Table;
