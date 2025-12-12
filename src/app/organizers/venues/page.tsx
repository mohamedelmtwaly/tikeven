"use client";

import {
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "@/components/Spinner";
import Swal from "sweetalert2";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchVenues, deleteVenueRedux, Venue } from "@/lib/features/venueSlice";
import { fetchEventsByVenue } from "@/lib/features/eventSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/features";

export default function VenuesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const venues = useAppSelector((s) => s.venues.venues);
  const loading = useAppSelector((s) => s.venues.loading);
  const user = useSelector((s: RootState) => s.users.currentUser);
  const [search, setSearch] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ownerUid, setOwnerUid] = useState<string>("");
  const { t, i18n } = useTranslation();

  const itemsPerPage = 5;

  // Notify blocked users on listing page
  useEffect(() => {
    if (user?.blocked) {
      Swal.fire({
        icon: 'info',
        title: t('blocked.title', { defaultValue: 'Account blocked' }),
        text: t('blocked.listing_venues', { defaultValue: 'Your account is blocked, so creating new venues is disabled.' }),
        confirmButtonColor: 'var(--color-primary-700)'
      });
    }
  }, [user?.blocked, t]);

  useEffect(() => {
    // prefer Redux user id; fallback to localStorage
    if (user?.id) {
      setOwnerUid(user.id);
      return;
    }
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setOwnerUid(parsed?.id || "");
      }
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    dispatch(fetchVenues(ownerUid || undefined));
  }, [dispatch, ownerUid, user]);

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user, router]);

  const ownerOnly = ownerUid ? venues.filter(v => v.ownerUid === ownerUid) : venues;
  const filteredVenues = ownerOnly.filter((venue) =>
    `${venue.title} ${venue.address} ${venue.city} ${venue.country}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVenues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVenues = filteredVenues.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleView = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowViewModal(true);
  };

  const handleEdit = (id: string) => {
    router.push(`/organizers/venues/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const linkedEvents = await dispatch(fetchEventsByVenue(id)).unwrap();
      const hasLinkedEvents = Array.isArray(linkedEvents) && linkedEvents.length > 0;

      if (hasLinkedEvents) {
        await Swal.fire({
          title: t("venues_delete_linked_title", {
            defaultValue:
              i18n.language === "ar" ? "لا يمكن حذف هذا المكان" : "Cannot delete this venue",
          }),
          text: t("venues_delete_linked_text", {
            defaultValue:
              i18n.language === "ar"
                ? "هذا المكان مرتبط بفعاليات حالية. قم بتعديل أو حذف الفعاليات المرتبطة أولاً قبل حذف المكان."
                : "This venue is linked to existing events. Please update or delete those events first before deleting the venue.",
          }),
          icon: "warning",
          confirmButtonColor: "var(--color-primary-700)",
        });
        return;
      }
    } catch (e) {
      // لو فشل جلب الإيفنتات، نرجع لسلوك الحذف العادي بدون فحص إضافي
    }

    const result = await Swal.fire({
      title: t("venues_delete_confirm_title", {
        defaultValue:
          i18n.language === "ar" ? "هل أنت متأكد من حذف هذا المكان؟" : "Are you sure?",
      }),
      text: t("venues_delete_confirm_text", {
        defaultValue:
          i18n.language === "ar"
            ? "سيتم حذف هذا المكان نهائيًا ولا يمكن التراجع عن هذا الإجراء."
            : "This venue will be deleted permanently. This action cannot be undone.",
      }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("venues_delete_confirm_confirm", {
        defaultValue: i18n.language === "ar" ? "حذف" : "Delete",
      }),
      cancelButtonText: t("venues_delete_confirm_cancel", {
        defaultValue: i18n.language === "ar" ? "إلغاء" : "Cancel",
      }),
      confirmButtonColor: "red",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteVenueRedux(id)).unwrap();
        await Swal.fire({
          title: t("venues_delete_success_title", {
            defaultValue:
              i18n.language === "ar" ? "تم حذف المكان" : "Venue deleted",
          }),
          text: t("venues_delete_success_text", {
            defaultValue:
              i18n.language === "ar"
                ? "تم حذف المكان بنجاح."
                : "The venue has been deleted successfully.",
          }),
          icon: "success",
          confirmButtonColor: "var(--color-primary-700)",
        });
      } catch (e) {
        await Swal.fire({
          title: t("venues_delete_error_title", {
            defaultValue: i18n.language === "ar" ? "حدث خطأ" : "Error",
          }),
          text: t("venues_delete_error_text", {
            defaultValue:
              i18n.language === "ar"
                ? "حدث خطأ أثناء حذف المكان. حاول مرة أخرى."
                : "An error occurred while deleting the venue. Please try again.",
          }),
          icon: "error",
          confirmButtonColor: "var(--color-primary-700)",
        });
      }
    }
  };

  if (user === null) return null;

  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-base font-medium text-neutral-400">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            {t("dashboard_breadcrumb")}
          </Link>
          <span>/</span>
          <span className="text-primary dark:text-white">{t("venues_breadcrumb")}</span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white mb-2">
              {t("venues_title")}
            </h1>
            <p className="text-sm sm:text-base font-normal text-neutral-400">
              {t("venues_subtitle")}
            </p>
          </div>
          {user && !user.blocked && (
            <Link
              href="/organizers/venues/new"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-base font-bold sm:w-auto bg-[var(--color-primary-700)] text-white transition cursor-pointer hover:bg-[var(--color-primary-800)]"
            >
              <PlusCircleIcon className="h-6 w-6" />
              <span>{t("venues_add_new")}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-subtitle h-5 w-5" />
          <input
            type="text"
            placeholder={t("venues_search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border shadow-sm bg-white overflow-hidden">
        {loading ? (
          <div className="p-10">
            <Spinner size="h-10 w-10" padding="py-0" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9FAFB] text-gray-700 text-sm uppercase border-b">
              <tr>
                <th className="px-6 py-3">{t("venues_table_title")}</th>
                <th className="px-6 py-3">{t("venues_table_address")}</th>
                <th className="px-6 py-3">{t("venues_table_city")}</th>
                <th className="px-6 py-3">{t("venues_table_country")}</th>
                <th className="px-6 py-3 text-center">{t("venues_table_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {currentVenues.length > 0 ? (
                currentVenues.map((venue) => (
                  <tr key={venue.id} className="hover:bg-gray-50 transition bg-white">
                    <td className="px-6 py-4 font-medium">{venue.title}</td>
                    <td className="px-6 py-4">{venue.address}</td>
                    <td className="px-6 py-4">{venue.city}</td>
                    <td className="px-6 py-4">{venue.country}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(venue)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-primary cursor-pointer"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(venue.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-primary cursor-pointer"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(venue.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-red-600 cursor-pointer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    {t("venues_empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {currentVenues.length > 0 ? (
          currentVenues.map((venue) => (
            <div key={venue.id} className="border rounded-xl bg-white p-4 shadow-sm">
              <h3 className="font-bold text-lg text-[var(--color-primary-700)] mb-2">
                {venue.title}
              </h3>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{t("venues_table_address")}:</span> {venue.address}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{t("venues_table_city")}:</span> {venue.city}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{t("venues_table_country")}:</span> {venue.country}
              </p>
              <div className="flex items-center justify-end gap-3 mt-3">
                <button
                  onClick={() => handleView(venue)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-primary"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEdit(venue.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-primary"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(venue.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-red-600"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">{t("venues_empty")}</p>
        )}
      </div>

      {/* Pagination */}
      {filteredVenues.length > 0 && (
        <div className="flex flex-wrap items-center justify-between border-t p-6 gap-4">
          <p className="text-sm text-gray-600">
            {t("venues_pagination_showing")} <span className="font-semibold">{startIndex + 1}</span> {t("venues_pagination_to")} {" "}
            <span className="font-semibold">
              {Math.min(startIndex + itemsPerPage, filteredVenues.length)}
            </span>{" "}
            {t("venues_pagination_of")} <span className="font-semibold">{filteredVenues.length}</span>{" "}
            {t("venues_pagination_results")}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-lg border text-sm font-bold ${
                  currentPage === i + 1
                    ? "bg-[var(--color-primary-700)] text-white border-[var(--color-primary-700)]"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* View Venue Modal */}
      {showViewModal && selectedVenue && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full shadow-2xl transform transition-all animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--color-primary-700)] to-[var(--color-primary-600)] p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {t("venues_modal_title")}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {t("venues_modal_subtitle")}
                  </p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-primary dark:text-white">
                  {selectedVenue.title}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-[var(--color-primary-50)] dark:bg-gray-700/50 p-4 rounded-xl">
                    <p className="text-xs font-semibold text-[var(--color-primary-600)] uppercase tracking-wide mb-1">
                      {t("venues_modal_address")}
                    </p>
                    <p className="text-base font-semibold dark:text-white">
                      {selectedVenue.address}
                    </p>
                  </div>

                  <div className="bg-[var(--color-primary-50)] dark:bg-gray-700/50 p-4 rounded-xl">
                    <p className="text-xs font-semibold text-[var(--color-primary-600)] uppercase tracking-wide mb-1">
                      {t("venues_modal_city")}
                    </p>
                    <p className="text-base font-semibold dark:text-white">
                      {selectedVenue.city}
                    </p>
                  </div>

                  <div className="bg-[var(--color-primary-50)] dark:bg-gray-700/50 p-4 rounded-xl sm:col-span-2">
                    <p className="text-xs font-semibold text-[var(--color-primary-600)] uppercase tracking-wide mb-1">
                      {t("venues_modal_country")}
                    </p>
                    <p className="text-base font-semibold dark:text-white">
                      {selectedVenue.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2.5 bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-800)] text-white font-semibold rounded-lg transition-colors"
              >
                {t("venues_modal_close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
