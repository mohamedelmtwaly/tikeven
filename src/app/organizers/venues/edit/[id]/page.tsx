"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import Swal from "sweetalert2";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import Select from "react-select";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { uploadImageToImgbb } from "@/services/imgbb/storeImg";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { getVenueByIdRedux, updateVenueRedux } from "@/lib/features/venueSlice";

registerPlugin(FilePondPluginImagePreview);

// Country & City options (restricted)
const countryOptions = ["Egypt", "Saudi Arabia"] as const;
const citiesByCountry: Record<string, string[]> = {
  Egypt: ["Cairo", "Giza", "Alexandria", "Mansoura", "Tanta"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca", "Medina"],
};

export default function EditVenuePage() {
  const router = useRouter();
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const selectedVenue = useAppSelector((s) => s.venues.selectedVenue);
  const loading = useAppSelector((s) => s.venues.loading);

  const [venue, setVenue] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("Cairo");
  const [selectedCountry, setSelectedCountry] = useState<string>("Egypt");
  const [fileError, setFileError] = useState<string>("");

  const fetchImageAsFile = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new File([blob], name, { type: blob.type });
    } catch (e) {
      console.warn("Failed to load image from URL:", url);
      return null;
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(getVenueByIdRedux(id as string));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedVenue) {
      const v = { ...selectedVenue } as any;
      if (!v.capacity) v.capacity = 0;
      setVenue(v);
      setSelectedCountry(countryOptions.includes(v.country as any) ? v.country : "Egypt");
      const allowedCities = citiesByCountry[v.country] || [];
      setSelectedCity(allowedCities.includes(v.city) ? v.city : allowedCities[0] || "");

      if (v.images && Array.isArray(v.images)) {
        (async () => {
          const loadFiles = (
            await Promise.all(
              v.images.map(async (url: string, i: number) => {
                const file = await fetchImageAsFile(url, `image-${i + 1}.jpg`);
                if (file) return { source: file, options: { type: "local" } };
                return null;
              })
            )
          ).filter(Boolean);
          setFiles(loadFiles as any);
        })();
      }
    }
  }, [selectedVenue]);

  // Guard: only the owner can access organizer edit page
  useEffect(() => {
    if (!selectedVenue) return;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const uid = raw ? (JSON.parse(raw)?.uid || '') : '';
      const owner = (selectedVenue as any)?.ownerUid || '';
      if (uid && owner && uid !== owner) {
        router.push('/organizers/venues');
      }
    } catch {}
  }, [selectedVenue, router]);

  const venueSchema = z.object({
    title: z.string().min(1, "Title is required").max(50, "Max 50 characters"),
    address: z.string().min(1, "Address is required").max(100, "Max 100 characters"),
    description: z.string().min(1, "Description is required").max(600, "Max 600 characters"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    capacity: z.number().min(0, "Capacity must be >= 0"),
  });

  const { register, handleSubmit, control, formState: { errors }, setValue, reset, watch } = useForm<z.infer<typeof venueSchema>>({
    resolver: zodResolver(venueSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      address: "",
      description: "",
      city: "",
      country: "",
      capacity: 0,
    },
  });

  // Sync form with fetched venue
  useEffect(() => {
    if (venue) {
      reset({
        title: venue.title || "",
        address: venue.address || "",
        description: venue.description || "",
        city: selectedCity || "",
        country: selectedCountry || "",
        capacity: Number(venue.capacity) || 0,
      });
    }
  }, [venue, selectedCity, selectedCountry, reset]);

  const onSubmit = async (data: z.infer<typeof venueSchema>) => {
    if (!venue) return;
    setFileError("");
    try {
      const uploadedUrls: string[] = [];
      for (const fileItem of files) {
        if (fileItem.file) {
          if (!fileItem.file.type?.startsWith("image/")) {
            setFileError(t("venues_new_error_only_images"));
            return;
          }
          const url = await uploadImageToImgbb(fileItem.file);
          uploadedUrls.push(url);
        } else if (fileItem.source?.name) {
          // keep existing images (local previews) - optional behavior
          uploadedUrls.push(URL.createObjectURL(fileItem.source));
        }
      }

      const updatedVenue = {
        ...venue,
        ...data,
        images: uploadedUrls,
      };

      await dispatch(updateVenueRedux({ id: id as string, data: updatedVenue })).unwrap();
      await Swal.fire({ icon: "success", title: t("venues_new_success_title"), confirmButtonColor: "var(--color-primary-700)" });
      router.push("/organizers/venues");
    } catch (error) {
      console.error("Error updating venue:", error);
      await Swal.fire({ icon: "error", title: t("venues_new_error_title"), text: t("venues_new_error_text"), confirmButtonColor: "var(--color-primary-700)" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="h-10 w-10" padding="py-0" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        {t("venues_edit_not_found")}
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-neutral-900 dark:text-white min-h-screen w-full flex">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              {/* Breadcrumb */}
              <div className="mb-6 flex flex-wrap gap-2 text-sm md:text-base">
                <Link href="#" className="font-medium text-neutral-400 hover:text-primary">{t("dashboard_breadcrumb")}</Link>
                <span className="font-medium text-neutral-400">/</span>
                <Link href="/organizers/venues" className="font-medium text-neutral-400 hover:text-primary">{t("venues_breadcrumb")}</Link>
                <span className="font-medium text-neutral-400">/</span>
                <span className="font-medium text-primary dark:text-white">{t("venues_edit_title")}</span>
              </div>

              <div className="mb-8 flex flex-wrap justify-between gap-3">
                <div className="flex min-w-60 md:min-w-72 flex-col gap-3">
                  <p className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white">{t("venues_edit_title")}</p>
                  <p className="text-sm md:text-base font-normal text-neutral-400">{t("venues_edit_subtitle")}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
                  {/* Left: Venue Info */}
                  <div className="border-b border-neutral-200 p-6 md:p-8 dark:border-neutral-800 lg:col-span-2 lg:border-b-0 lg:border-r">
                    <h2 className="pb-6 text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">{t("venues_new_section_info")}</h2>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Title */}
                      <label className="flex flex-col md:col-span-2">
                        <p className="pb-2 text-sm font-medium">{t("venues_new_field_title")}</p>
                        <input
                          {...register("title")}
                          className="form-input h-12 rounded-lg border border-neutral-300 bg-background-light p-[15px] text-base dark:border-neutral-700 dark:bg-background-dark"
                          placeholder={t("venues_new_placeholder_title")}
                        />
                        {errors.title && <span className="mt-1 text-sm text-red-600">{t("venues_new_validation_title")}</span>}
                      </label>

                      {/* Address */}
                      <label className="flex flex-col md:col-span-2">
                        <p className="pb-2 text-sm font-medium">{t("venues_new_field_address")}</p>
                        <input
                          {...register("address")}
                          className="form-input h-12 rounded-lg border border-neutral-300 bg-background-light p-[15px] text-base dark:border-neutral-700 dark:bg-background-dark"
                          placeholder={t("venues_new_placeholder_address")}
                        />
                        {errors.address && <span className="mt-1 text-sm text-red-600">{t("venues_new_validation_address")}</span>}
                      </label>

                      {/* Description */}
                      <label className="flex flex-col md:col-span-2">
                        <p className="pb-2 text-sm font-medium">{t("venues_new_field_description")}</p>
                        <textarea
                          {...register("description")}
                          className="form-textarea h-32 rounded-lg border border-neutral-300 bg-background-light p-[15px] text-base dark:border-neutral-700 dark:bg-background-dark"
                          placeholder={t("venues_new_placeholder_description")}
                        />
                        {errors.description && <span className="mt-1 text-sm text-red-600">{t("venues_new_validation_description")}</span>}
                      </label>

                      {/* City */}
                      <label className="flex flex-col">
                        <p className="pb-2 text sm font-medium">{t("venues_new_field_city")}</p>
                        <Controller
                          control={control}
                          name="city"
                          render={({ field }) => (
                            <Select
                              isSearchable={true}
                              isDisabled={!selectedCountry}
                              value={field.value ? { value: field.value, label: field.value } : null}
                              onChange={(option: any) => {
                                const v = option?.value || "";
                                setSelectedCity(v);
                                field.onChange(v);
                              }}
                              options={(citiesByCountry[selectedCountry] || []).map(city => ({ value: city, label: city }))}
                              placeholder={selectedCountry ? t("venues_new_placeholder_city") : t("venues_new_placeholder_choose_country_first")}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: '42px',
                                  borderRadius: '0.5rem',
                                  borderColor: 'var(--color-border, #e5e7eb)',
                                  backgroundColor: 'var(--color-background-light, white)',
                                }),
                                menu: (base) => ({
                                  ...base,
                                  backgroundColor: 'var(--color-background-light, white)',
                                }),
                                option: (base, state) => ({
                                  ...base,
                                  backgroundColor: state.isSelected
                                    ? 'var(--color-primary, #3b82f6)'
                                    : state.isFocused
                                    ? 'var(--color-primary-light, #dbeafe)'
                                    : 'transparent',
                                  color: state.isSelected ? 'white' : 'inherit',
                                }),
                              }}
                            />
                          )}
                        />
                        {errors.city && <span className="mt-1 text-sm text-red-600">{t("venues_new_validation_city")}</span>}
                      </label>

                      {/* Country */}
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">{t("venues_new_field_country")}</p>
                        <Controller
                          control={control}
                          name="country"
                          render={({ field }) => (
                            <Select
                              value={field.value ? { value: field.value, label: field.value } : null}
                              onChange={(option: any) => {
                                const newCountry = option?.value || "";
                                setSelectedCountry(newCountry);
                                const firstCity = (citiesByCountry[newCountry] || [])[0] || "";
                                setSelectedCity(firstCity);
                                field.onChange(newCountry);
                                setValue('city', firstCity);
                              }}
                              options={(countryOptions as readonly string[]).map(c => ({ value: c, label: c }))}
                              placeholder={t("venues_new_placeholder_country")}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: '42px',
                                  borderRadius: '0.5rem',
                                  borderColor: 'var(--color-border, #e5e7eb)',
                                  backgroundColor: 'var(--color-background-light, white)',
                                }),
                                menu: (base) => ({
                                  ...base,
                                  backgroundColor: 'var(--color-background-light, white)',
                                }),
                                option: (base, state) => ({
                                  ...base,
                                  backgroundColor: state.isSelected
                                    ? 'var(--color-primary, #3b82f6)'
                                    : state.isFocused
                                    ? 'var(--color-primary-light, #dbeafe)'
                                    : 'transparent',
                                  color: state.isSelected ? 'white' : 'inherit',
                                }),
                              }}
                            />
                          )}
                        />
                        {errors.country && <span className="mt-1 text-sm text-red-600">{t("venues_new_validation_country")}</span>}
                      </label>

                      {/* Capacity */}
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">{t("venues_new_field_capacity")}</p>
                        <input
                          type="number"
                          {...register("capacity", { valueAsNumber: true })}
                          className="form-input h-12 rounded-lg border border-neutral-300 bg-background-light p-[15px] text-base dark:border-neutral-700 dark:bg-background-dark"
                          placeholder={t("venues_new_placeholder_capacity")}
                        />
                        {errors.capacity && <span className="mt-1 text-sm text-red-600">{t("venues_new_validation_capacity")}</span>}
                      </label>
                    </div>
                  </div>

                  {/* Right: Venue Photos */}
                  <div className="p-6 md:p-8">
                    <h2 className="pb-6 text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">{t("venues_new_section_photos")}</h2>

                    <FilePond
                      files={files}
                      onupdatefiles={setFiles}
                      allowMultiple={true}
                      maxFiles={5}
                      name="files"
                      labelIdle={t("venues_new_filepond_label")}
                      credits={false}
                      allowReorder={true}
                      imagePreviewMaxHeight={200}
                      acceptedFileTypes={["image/*"]}
                    />
                    {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}

                    <div className="mt-8 flex flex-col gap-3">
                      <button
                        type="submit"
                        className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-white font-bold hover:bg-blue-800 cursor-pointer"
                      >
                        {t("venues_new_button_save")}
                      </button>

                      <Link
                        href="/organizers/venues"
                        className="flex h-12 w-full items-center justify-center rounded-lg border border-neutral-300 text-neutral-400 font-bold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        {t("venues_new_button_cancel")}
                      </Link>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
