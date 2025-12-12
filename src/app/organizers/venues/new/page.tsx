"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import "@/app/filepond-custom.css";
import Select from "react-select";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/features";

import { uploadImageToImgbb } from "@/services/imgbb/storeImg";
import { useAppDispatch } from "@/lib/hooks";
import { addVenueRedux } from "@/lib/features/venueSlice";
import Spinner from "@/components/Spinner";

registerPlugin(FilePondPluginImagePreview);

const countryOptions = [
  { value: "Egypt", label: "Egypt" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
];

const citiesByCountry: Record<string, { value: string; label: string }[]> = {
  Egypt: [
    { value: "Cairo", label: "Cairo" },
    { value: "Giza", label: "Giza" },
    { value: "Alexandria", label: "Alexandria" },
    { value: "Mansoura", label: "Mansoura" },
    { value: "Tanta", label: "Tanta" },
  ],
  "Saudi Arabia": [
    { value: "Riyadh", label: "Riyadh" },
    { value: "Jeddah", label: "Jeddah" },
    { value: "Dammam", label: "Dammam" },
    { value: "Khobar", label: "Khobar" },
    { value: "Mecca", label: "Mecca" },
    { value: "Medina", label: "Medina" },
  ],
};

const venueSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Max 50 characters"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(100, "Max 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(600, "Max 600 characters"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  capacity: z.number().min(0, "Capacity must be >= 0"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// ✅ Updated Select Styles (copied from CreateEventPage)
const selectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: "42px",
    borderRadius: "0.5rem",
    borderColor: "var(--color-border, #e5e7eb)",
    backgroundColor: "var(--color-background-light, white)",
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: "var(--color-background-light, white)",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--color-primary, #3b82f6)"
      : state.isFocused
      ? "var(--color-primary-light, #dbeafe)"
      : "transparent",
    color: state.isSelected ? "white" : "inherit",
    cursor: "pointer",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#9ca3af",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "#111827",
  }),
};

export default function AddVenuePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const user = useSelector((s: RootState) => s.users.currentUser);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [venue, setVenue] = useState({
    title: "",
    address: "",
    description: "",
    city: "",
    country: "",
    capacity: 0,
    latitude: undefined,
    longitude: undefined,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<z.infer<typeof venueSchema>>({
    resolver: zodResolver(venueSchema),
    mode: "onChange",
    defaultValues: {
      title: venue.title,
      address: venue.address,
      description: venue.description,
      city: venue.city,
      country: venue.country,
      capacity: venue.capacity,
      latitude: venue.latitude,
      longitude: venue.longitude,
    },
  });

  const selectedCountry = watch("country");

  // Guard: prevent blocked users from accessing the create venue page
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user?.blocked) {
      Swal.fire({
        icon: "info",
        title: t('blocked.title'),
        text: t('blocked.create_venue'),
        confirmButtonColor: "var(--color-primary-700)",
      }).then(() => router.push("/organizers/venues"));
    }
  }, [user, router]);

  const onSubmit = async (data: z.infer<typeof venueSchema>) => {
    setLoading(true);
    setFileError("");

    try {
      // Require at least one image before saving
      if (files.length === 0) {
        setFileError(t("venues_new_error_no_image", { defaultValue: "Please upload at least one image" }));
        setLoading(false);
        return;
      }

      const uploadedImages: string[] = [];
      for (const file of files) {
        const fileItem = file.file;
        if (fileItem) {
          if (!fileItem.type?.startsWith("image/")) {
            setFileError(t("venues_new_error_only_images", { defaultValue: "Only images are allowed" }));
            setLoading(false);
            return;
          }
          const imageUrl = await uploadImageToImgbb(fileItem);
          uploadedImages.push(imageUrl);
        }
      }

      const newVenue = {
        ...data,
        images: uploadedImages,
        ownerUid: (() => {
          try {
            const raw =
              typeof window !== "undefined"
                ? localStorage.getItem("user")
                : null;
            if (!raw) return "";
            const parsed = JSON.parse(raw);
            return parsed?.id || '';
          } catch {
            return "";
          }
        })(),
      };

      try {
        await dispatch(addVenueRedux(newVenue as any)).unwrap();
        await Swal.fire({
          icon: "success",
          title: t("venues_new_success_title", { defaultValue: "Venue added successfully" }),
          confirmButtonColor: "var(--color-primary-700)",
        });
        router.push("/organizers/venues");
      } catch (err: any) {
        // keep error toast for backend failures
        await Swal.fire({
          icon: "error",
          title: t("venues_new_error_title", { defaultValue: "Failed to add venue" }),
          text: err?.message || t("venues_new_error_text", { defaultValue: "Something went wrong, please try again." }),
          confirmButtonColor: "var(--color-primary-700)",
        });
      }
    } catch (error) {
      console.error("Error adding venue:", error);
    } finally {
      setLoading(false);
    }
  };

  // Plain Leaflet map (no react-leaflet) to avoid peer dependency conflicts
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapRef.current) return;
    if (leafletMapRef.current) return; // already initialized

    // Dynamic import so Leaflet only runs in the browser
    let mounted = true;
    import("leaflet").then((L) => {
      if (!mounted || !mapRef.current) return;

      // Use CDN-hosted marker images to avoid bundler/require issues
      const DefaultIcon = L.icon({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      const map = L.map(mapRef.current).setView([30.0444, 31.2357], 6);
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      function onMapClick(e: any) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setValue("latitude", lat, { shouldValidate: true });
        setValue("longitude", lng, { shouldValidate: true });

        if (!markerRef.current) {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }
      }

      map.on("click", onMapClick);

      // if already have coords in form (e.g., from 'Use my location'), show marker
      const initLat = watch("latitude");
      const initLng = watch("longitude");
      if (initLat && initLng) {
        markerRef.current = L.marker([
          initLat as number,
          initLng as number,
        ]).addTo(map);
        map.setView([initLat as number, initLng as number], 12);
      }

      // keep a reference to cleanup
      // add leaflet-geosearch control dynamically
      import("leaflet-geosearch").then((GeoSearch) => {
        try {
          const { OpenStreetMapProvider, GeoSearchControl } = GeoSearch as any;
          const provider = new OpenStreetMapProvider();
          const searchControl = new GeoSearchControl({
            provider,
            style: "bar",
            showMarker: false,
            retainZoomLevel: false,
            autoComplete: true,
            autoCompleteDelay: 250,
          });
          map.addControl(searchControl);

          // when a location is selected by the geosearch control, an event is fired
          // listen for it and update form + marker
          map.on("geosearch/showlocation", (result: any) => {
            const loc = result?.location || result;
            const lat = loc?.y ?? loc?.lat ?? (loc?.bounds && loc.bounds[0]);
            const lon = loc?.x ?? loc?.lon ?? (loc?.bounds && loc.bounds[1]);
            const label = loc?.label || loc?.name || "";
            if (lat && lon) {
              setValue("latitude", Number(lat), { shouldValidate: true });
              setValue("longitude", Number(lon), { shouldValidate: true });
              setValue("address", label, { shouldValidate: true });

              if (!markerRef.current) {
                markerRef.current = L.marker([Number(lat), Number(lon)]).addTo(
                  map
                );
              } else {
                markerRef.current.setLatLng([Number(lat), Number(lon)]);
              }
              map.setView([Number(lat), Number(lon)], 15);
            }
          });
        } catch (err) {
          // non-blocking
          // console.warn("leaflet-geosearch failed to initialize", err);
        }
      });

      return () => {
        map.off();
        map.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      };
    });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef.current]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-neutral-900 dark:text-white min-h-screen w-full flex">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex flex-wrap gap-2 text-sm md:text-base">
                <Link
                  href="#"
                  className="font-medium text-neutral-400 hover:text-primary"
                >
                  {t("dashboard_breadcrumb", { defaultValue: "Dashboard" })}
                </Link>
                <span className="font-medium text-neutral-400">/</span>
                <Link
                  href="/organizers/venues"
                  className="font-medium text-neutral-400 hover:text-primary"
                >
                  {t("venues_breadcrumb", { defaultValue: "Venues" })}
                </Link>
                <span className="font-medium text-neutral-400">/</span>
                <span className="font-medium text-primary dark:text-white">
                  {t("venues_new_breadcrumb_add", { defaultValue: "Add Venue" })}
                </span>
              </div>

              <div className="mb-8 flex flex-wrap justify-between gap-3">
                <div className="flex min-w-60 md:min-w-72 flex-col gap-3">
                  <p className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white">
                    {t("venues_new_title", { defaultValue: "Add a new venue" })}
                  </p>
                  <p className="text-sm md:text-base font-normal text-neutral-400">
                    {t("venues_new_subtitle", { defaultValue: "Create a venue profile with photos, address and capacity." })}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="relative rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                {loading && (
                  <div className="absolute inset-0 z-10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                    <Spinner size="h-10 w-10" padding="py-0" />
                  </div>
                )}
                <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
                  <div className="border-b border-neutral-200 p-6 md:p-8 dark:border-neutral-800 lg:col-span-2 lg:border-b-0 lg:border-r">
                    <h2 className="pb-6 text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">
                      {t("venues_new_section_info", { defaultValue: "Venue information" })}
                    </h2>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <label className="flex flex-col md:col-span-2">
                        <p className="pb-2 text-sm font-medium">
                          {t("venues_new_field_title", { defaultValue: "Title" })}
                        </p>
                        <input
                          {...register("title")}
                          className="form-input h-12 rounded-lg border border-neutral-300 bg-background-light p-[15px] text-base dark:border-neutral-700 dark:bg-background-dark"
                          placeholder={t("venues_new_placeholder_title", { defaultValue: "Venue title" })}
                        />
                        {errors.title && (
                          <span className="mt-1 text-sm text-red-600">
                            {t("venues_new_validation_title", { defaultValue: "Title is required" })}
                          </span>
                        )}
                      </label>

                      {/* Map picker - spans full width */}
                      <div className="flex flex-col md:col-span-2">
                        <p className="pb-2 text-sm font-medium">
                          {t("venues_new_field_location", {
                            defaultValue: "Pick location on map",
                          })}
                        </p>
                        <div className="w-full h-56 rounded-lg overflow-hidden border border-neutral-300">
                          <div
                            ref={mapRef}
                            style={{ height: "100%", width: "100%" }}
                          />
                        </div>

                        <div className="mt-2 flex gap-2 items-center">
                          <div className="text-sm text-muted-foreground">
                            {t("venues_new_lat_label", {
                              defaultValue: "Latitude",
                            })}
                            :{" "}
                            <span className="font-medium">
                              {watch("latitude") ?? "—"}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t("venues_new_lng_label", {
                              defaultValue: "Longitude",
                            })}
                            :{" "}
                            <span className="font-medium">
                              {watch("longitude") ?? "—"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                  (pos) => {
                                    setValue("latitude", pos.coords.latitude, {
                                      shouldValidate: true,
                                    });
                                    setValue(
                                      "longitude",
                                      pos.coords.longitude,
                                      { shouldValidate: true }
                                    );
                                  }
                                );
                              }
                            }}
                            className="ml-auto text-sm text-primary underline"
                          >
                            {t("venues_new_use_my_location", {
                              defaultValue: "Use my location",
                            })}
                          </button>
                        </div>
                      </div>

                      <label className="flex flex-col md:col-span-2">
                        <p className="pb-2 text-sm font-medium">
                          {t("venues_new_field_address", { defaultValue: "Address" })}
                        </p>
                        <input
                          {...register("address")}
                          className="form-input h-12 rounded-lg border border-neutral-300 bg-background-light p-[15px] text-base dark:border-neutral-700 dark:bg-background-dark"
                          placeholder={t("venues_new_placeholder_address", { defaultValue: "Street address, building, etc." })}
                        />
                        {errors.address && (
                          <span className="mt-1 text-sm text-red-600">
                            {t("venues_new_validation_address", { defaultValue: "Address is required" })}
                          </span>
                        )}
                      </label>

                      <label className="flex flex-col md:col-span-2">
                        <p className="pb-2 text-sm font-medium">
                          {t("venues_new_field_description", { defaultValue: "Description" })}
                        </p>
                        <textarea
                          {...register("description")}
                          className="form-textarea h-32 rounded-lg border border-neutral-300 bg-background-light p-[15px] text-base dark:border-neutral-700 dark:bg-background-dark"
                          placeholder={t("venues_new_placeholder_description", { defaultValue: "Describe the venue, facilities, parking..." })}
                        />
                        {errors.description && (
                          <span className="mt-1 text-sm text-red-600">
                            {t("venues_new_validation_description", { defaultValue: "Description is required" })}
                          </span>
                        )}
                      </label>

                      {/* Country Select */}
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">
                          {t("venues_new_field_country", { defaultValue: "Country" })}
                        </p>
                        <Controller
                          control={control}
                          name="country"
                          render={({ field }) => (
                            <Select
                              {...field}
                              value={
                                countryOptions.find(
                                  (c) => c.value === field.value
                                ) || null
                              }
                              onChange={(option) => {
                                const val = option?.value || "";
                                field.onChange(val);
                                setValue("city", "");
                              }}
                              options={countryOptions}
                              placeholder={t("venues_new_placeholder_country", { defaultValue: "Select a country" })}
                              styles={selectStyles}
                            />
                          )}
                        />
                        {errors.country && (
                          <span className="mt-1 text-sm text-red-600">
                            {t("venues_new_validation_country", { defaultValue: "Country is required" })}
                          </span>
                        )}
                      </label>

                      {/* City Select */}
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">
                          {t("venues_new_field_city", { defaultValue: "City" })}
                        </p>
                        <Controller
                          control={control}
                          name="city"
                          render={({ field }) => (
                            <Select
                              isSearchable={true}
                              isDisabled={!selectedCountry}
                              value={
                                field.value
                                  ? (
                                      citiesByCountry[selectedCountry] || []
                                    ).find((c) => c.value === field.value) ||
                                    null
                                  : null
                              }
                              onChange={(option) =>
                                field.onChange(option?.value || "")
                              }
                              options={citiesByCountry[selectedCountry] || []}
                              placeholder={
                                selectedCountry
                                  ? t("venues_new_placeholder_city", { defaultValue: "Select a city" })
                                  : t(
                                      "venues_new_placeholder_choose_country_first",
                                      { defaultValue: "Choose a country first" }
                                    )
                              }
                              styles={selectStyles}
                            />
                          )}
                        />
                        {errors.city && (
                          <span className="mt-1 text-sm text-red-600">
                            {t("venues_new_validation_city", { defaultValue: "City is required" })}
                          </span>
                        )}
                      </label>

                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">
                          {t("venues_new_field_capacity", { defaultValue: "Capacity" })}
                        </p>
                        <input
                          type="number"
                          {...register("capacity", { valueAsNumber: true })}
                          className="form-input h-12 rounded-lg border border-neutral-300 bg-background-light p-[15px] text-base dark:border-neutral-700 dark:bg-background-dark"
                          placeholder={t("venues_new_placeholder_capacity", { defaultValue: "Enter capacity (e.g., 500)" })}
                        />
                        {errors.capacity && (
                          <span className="mt-1 text-sm text-red-600">
                            {t("venues_new_validation_capacity", { defaultValue: "Capacity must be greater than or equal to 0" })}
                          </span>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    <h2 className="pb-6 text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">
                      {t("venues_new_section_photos", { defaultValue: "Photos" })}
                    </h2>

                    <div className="mb-6">
                      <FilePond
                        files={files}
                        onupdatefiles={setFiles}
                        allowMultiple={true}
                        maxFiles={5}
                        name="files"
                        labelIdle={t("venues_new_filepond_label", { defaultValue: "Drag & drop images or click to browse (up to 5)" })}
                        credits={false}
                        allowReorder={true}
                        imagePreviewMaxHeight={200}
                        acceptedFileTypes={["image/*"]}
                      />
                      {fileError && (
                        <p className="mt-2 text-sm text-red-600">{fileError}</p>
                      )}
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                      <button
                        type="submit"
                        disabled={loading || files.length === 0}
                        className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-white font-bold hover:bg-blue-800 cursor-pointer disabled:opacity-50"
                      >
                        {loading
                          ? t("venues_new_button_saving", { defaultValue: "Saving..." })
                          : t("venues_new_button_save", { defaultValue: "Save Venue" })}
                      </button>

                      <Link
                        href="/organizers/venues"
                        className="flex h-12 w-full items-center justify-center rounded-lg border border-neutral-300 text-neutral-400 font-bold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        {t("venues_new_button_cancel", { defaultValue: "Cancel" })}
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
