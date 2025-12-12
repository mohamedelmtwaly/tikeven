"use client";

import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { MagnifyingGlassIcon, LockClosedIcon, LockOpenIcon, ExclamationTriangleIcon, CalendarIcon, EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { TableColumn } from "react-data-table-component";
import { fetchUsers, toggleBlockUser } from "@/lib/features/userSlice";
import { fetchReports } from "@/lib/features/reportsSlice";
import { fetchEvents, fetchEventsByOrganizer } from "@/lib/features/eventSlice";
import { AppDispatch, RootState } from "@/lib/features";
import User from "@/types/user";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import Spinner from "@/components/Spinner";

const Table = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, loading } = useSelector((state: RootState) => state.users);
  const { items: reports } = useSelector((state: RootState) => state.reports);
  const { events } = useSelector((state: RootState) => state.events);
  const [search, setSearch] = useState("");

  const filtered = (users ?? []).filter((u: User) => {
    const term = search.toLowerCase();
    const name = (u.name ?? "").toLowerCase();
    const email = (u.email ?? "").toLowerCase();

    return name.includes(term) || email.includes(term);
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        dispatch(fetchUsers()),
        dispatch(fetchReports()),
        dispatch(fetchEvents())
      ]);
    };
    loadData();
  }, [dispatch]);

  // Count reports per organizer
  const organizerReportCounts = reports.reduce<Record<string, number>>((acc, report) => {
    if (report.organizerId) {
      acc[report.organizerId] = (acc[report.organizerId] || 0) + 1;
    }
    return acc;
  }, {});

  // Count events per organizer
  const organizerEventCounts = events?.reduce<Record<string, number>>((acc, event) => {
    if (event.organizerId) {
      const organizerId = event.organizerId;
      acc[organizerId] = (acc[organizerId] || 0) + 1;
    }
    return acc;
  }, {}) || {};

  const handleBlock = (user: User) => {
    console.log("Blocked user:", user.name);
    dispatch(toggleBlockUser({ userId: user.id, currentStatus: user.blocked ?? false }));
  };

  const columns: TableColumn<User>[] = [
    {
      name: "Avatar",
      selector: (row: User) => row.image ?? "",
      cell: (row: User) => (
        <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
          {row.image ? (
            <Image
              src={row.image}
              alt={row.name}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNlZWVmZmYiIC8+PC9zdmc+"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-neutral-700 dark:text-neutral-100">
              {(row.name || "?")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join("")}
            </div>
          )}
        </div>
      ),
      width: "80px",
    },
    {
      name: "Name",
      selector: (row: User) => row.name,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row: User) => row.email,
      sortable: true,
    },
    {
      name: "Events",
      cell: (row: User) => (
        <Link 
          href={`/admin/events?organizerId=${row.id}`}
          className="flex items-center gap-1 hover:text-blue-600 hover:underline"
        >
          <CalendarIcon className="h-4 w-4 text-blue-500" />
          <span>{organizerEventCounts[row.id] || 0}</span>
        </Link>
      ),
      sortable: true,
      sortFunction: (a: User, b: User) => {
        const aCount = organizerEventCounts[a.id] || 0;
        const bCount = organizerEventCounts[b.id] || 0;
        return aCount - bCount;
      },
    },
    {
      name: "Reports",
      cell: (row: User) => (
        <div className="flex items-center gap-1">
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
          <span>{organizerReportCounts[row.id] || 0}</span>
        </div>
      ),
      sortable: true,
      sortFunction: (a: User, b: User) => {
        const aCount = organizerReportCounts[a.id] || 0;
        const bCount = organizerReportCounts[b.id] || 0;
        return aCount - bCount;
      },
    },
    {
      name: "Actions",
      cell: (row: User) => (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/admin/organizers/${row.id}`} title="View Details">
            <EyeIcon className="h-5 w-5 cursor-pointer text-blue-500 hover:text-blue-700 transition" />
          </Link>
          <button
            title={row.blocked ? "Unblock" : "Block"}
            onClick={() => handleBlock(row)}
            className="ml-2"
          >
            {row.blocked ? (
              <LockClosedIcon className="h-5 w-5 cursor-pointer text-red-500 hover:text-red-700 transition" />
            ) : (
              <LockOpenIcon className="h-5 w-5 cursor-pointer text-green-500 hover:text-green-700 transition" />
            )}
          </button>
        </div>
      ),
      ignoreRowClick: true,
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
        paddingLeft: "16px",
        paddingRight: "16px",
        justifyContent: "center",
        textAlign: "center" as const, // ✅ Added `as const`
      },
    },
    cells: {
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
        fontSize: "14px",
        color: "#374151",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center" as const, // ✅ Added `as const`
      },
    },
  };

  return (
    <div className="w-full">
      {/* 🔍 Search */}
      <div className="relative mb-4 w-full sm:max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-4 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      {/* 🧑‍💼 Table */}
      <div className="border border-neutral-200 rounded-xl bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filtered}
            highlightOnHover
            progressPending={loading}
            paginationPerPage={12}
            paginationRowsPerPageOptions={[]}
            paginationComponentOptions={{
              rowsPerPageText: "",
              rangeSeparatorText: "of",
            }}
            noDataComponent={
              <div className="p-4 text-center text-gray-500">
                No Users found
              </div>
            }
            progressComponent={<Spinner />}
            customStyles={customStyles}
            pagination
            paginationComponent={Pagination}
          />
        </div>
      </div>
    </div>
  );
};

export default Table;
