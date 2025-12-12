"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/features";
import { createEvent, updateEvent, fetchEvents } from "@/lib/features/eventSlice";
import { fetchCategories } from "@/lib/features/categorySlice";
import { fetchVenues } from "@/lib/features/venueSlice";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import "@/app/filepond-custom.css";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/datepicker-custom.css";
import { Event } from "@/types/event";
import { FilePondFile } from "filepond";
import { StylesConfig } from "react-select";
import type { CreateEventData } from "@/types/event";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from 'react-i18next';

registerPlugin(FilePondPluginImagePreview);

interface EventFormProps {
  mode: "create" | "edit";
  eventId?: string;
  initialEvent?: Event;
}

type SelectOption = { value: string; label: string } | null;

interface OptionType {
  value: string;
  label: string;
}

// Validation Schema (i18n-enabled)
const buildEventSchema = (t: (key: string, opts?: Record<string, any>) => string) =>
  z
    .object({
      title: z
        .string()
        .min(1, t('organizer_events.form.validation.title_required'))
        .max(100, t('organizer_events.form.validation.title_max', { max: 100 })),
      description: z
        .string()
        .min(1, t('organizer_events.form.validation.description_required'))
        .max(1000, t('organizer_events.form.validation.description_max', { max: 1000 })),
      venue: z.string().min(1, t('organizer_events.form.validation.venue_required')),
      category: z.string().min(1, t('organizer_events.form.validation.category_required')),
      startDate: z.date().nullable(),
      endDate: z.date().nullable(),
      price: z.number().min(0, t('organizer_events.form.validation.price_min')),
      isFree: z.boolean(),
      ticketsCount: z
        .coerce
        .number()
        .refine((v) => Number.isFinite(v), t('organizer_events.form.validation.tickets_min'))
        .int()
        .min(1, t('organizer_events.form.validation.tickets_min')),
    })
    .superRefine((data, ctx) => {
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('organizer_events.form.validation.start_required'),
          path: ["startDate"],
        });
      }
      if (!data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('organizer_events.form.validation.end_required'),
          path: ["endDate"],
        });
      }
      if (data.startDate && data.endDate && data.endDate < data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('organizer_events.form.validation.end_after_start'),
          path: ["endDate"],
        });
      }
      // Price required when not free
      const priceNum = Number(data.price);
      if (!data.isFree && (!Number.isFinite(priceNum) || priceNum <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('organizer_events.form.validation.price_required', { defaultValue: 'Price is required' }),
          path: ["price"],
        });
      }
    });

const selectStyles: StylesConfig<OptionType, false> = {
  control: (base) => ({
    ...base,
    minHeight: "42px",
    borderRadius: "0.5rem",
    borderColor: "var(--color-border, #e5e7eb)",
    backgroundColor: "var(--color-background-light, white)",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-background-light, white)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isDisabled
      ? "transparent"
      : state.isSelected
      ? "var(--color-primary, #3b82f6)"
      : state.isFocused
      ? "var(--color-primary-light, #dbeafe)"
      : "transparent",
    color: state.isDisabled
      ? "#9ca3af"
      : state.isSelected
      ? "white"
      : "inherit",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    opacity: state.isDisabled ? 0.6 : 1,
    pointerEvents: state.isDisabled ? "none" : "auto",
  }),
};

export default function EventForm({
  mode,
  eventId,
  initialEvent,
}: EventFormProps) {
  const { t, ready } = useTranslation('common', { useSuspense: false });
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { categories } = useSelector((state: RootState) => state.categories);
  const { venues } = useSelector((state: RootState) => state.venues);
  const user = useSelector((state: RootState) => state.users.currentUser);
  const eventsList = useSelector((state: RootState) => state.events.events);

  const [files, setFiles] = useState<FilePondFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // i18n-aware validation schema
  const eventSchemaMemo = useMemo(() => buildEventSchema(t), [t]);

  // React Hook Form
  const {
    register,
    handleSubmit: handleFormSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(eventSchemaMemo),
    mode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      title: "",
      description: "",
      venue: "",
      category: "",
      startDate: null,
      endDate: null,
      price: 0,
      isFree: false,
      ticketsCount: 1,
    },
  });

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchVenues());
    dispatch(fetchEvents());
  }, [dispatch]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait until i18n translations are ready to avoid SSR/client text mismatch
  if (!ready) {
    return null;
  }

  const categoryOptions: OptionType[] = useMemo(
    () => categories.map((cat) => ({ value: cat.id!, label: cat.name })),
    [categories]
  );

  const watchedStartDate = watch("startDate");
  const watchedEndDate = watch("endDate");

  const unavailableVenueIds: string[] = useMemo(() => {
    if (!watchedStartDate || !watchedEndDate) return [];
    const selStart = watchedStartDate.getTime();
    const selEnd = watchedEndDate.getTime();
    const excludeId = mode === "edit" ? eventId : undefined;

    const set = new Set<string>();
    for (const e of eventsList) {
      if (excludeId && e.id === excludeId) continue;
      const evStart = new Date(e.startDate).getTime();
      const evEnd = new Date(e.endDate).getTime();
      if (!Number.isFinite(evStart) || !Number.isFinite(evEnd)) continue;
      const overlaps = evStart < selEnd && evEnd > selStart;
      if (overlaps && e.venue) set.add(String(e.venue));
    }
    return Array.from(set);
  }, [eventsList, watchedStartDate, watchedEndDate, mode, eventId]);

  const unavailableVenueSet = useMemo(
    () => new Set(unavailableVenueIds),
    [unavailableVenueIds]
  );

  const venueOptions: OptionType[] = useMemo(() => {
    const base = venues.map((v) => ({ value: v.id!, label: v.title }));
    if (!watchedStartDate || !watchedEndDate) {
      return [...base, { value: "__create__", label: "other(create new venue)" }];
    }
    const available = base.filter((o) => !unavailableVenueSet.has(o.value));
    const unavailable = base.filter((o) => unavailableVenueSet.has(o.value));
    return [
      ...available,
      ...unavailable,
      { value: "__create__", label: "other(create new venue)" },
    ];
  }, [venues, watchedStartDate, watchedEndDate, unavailableVenueSet]);

  const watchedIsFree = watch("isFree");
  const watchedVenueId = watch("venue");
  const watchedTicketsCount = watch("ticketsCount");

  const selectedVenue = useMemo(
    () => venues.find((v) => v.id === watchedVenueId) || null,
    [venues, watchedVenueId]
  );
  const venueCapacity = useMemo(() => {
    const n = Number((selectedVenue as any)?.capacity);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [selectedVenue]);

  // Redirect blocked users away from create page
  useEffect(() => {
    if (mode === "create" && user?.blocked) {
      Swal.fire({
        icon: "info",
        title: t('blocked.title', { defaultValue: 'Account blocked' }),
        text: t('blocked.create_event', { defaultValue: 'You cannot create an event because your account is currently blocked.' }),
        confirmButtonColor: "var(--color-primary-700)",
      }).then(() => router.push("/organizers/events"));
    }
  }, [mode, user?.blocked, router]);

  // Populate form for edit mode
  useEffect(() => {
    if (
      mode === "edit" &&
      initialEvent &&
      categories.length > 0 &&
      venues.length > 0
    ) {
      reset({
        title: initialEvent.title,
        description: initialEvent.description,
        venue: initialEvent.venue,
        category: initialEvent.category,
        startDate: new Date(initialEvent.startDate),
        endDate: new Date(initialEvent.endDate),
        price: initialEvent.price,
        isFree: initialEvent.isFree,
        ticketsCount: initialEvent.ticketsCount || 1,
      });
    }
  }, [initialEvent, categories, venues, mode, reset]);

  // --------------------------------------------------------------
  // ✅ AI Auto-Fill Function
  // --------------------------------------------------------------
  const generateAIFields = async () => {
    const title = watch("title");

    if (!title.trim()) {
      Swal.fire({
        title: t('organizer_events.ai.error_title'),
        text: t('organizer_events.ai.enter_title_first'),
        icon: "error",
      });
      return;
    }

    setAiLoading(true);

    try {
      const res = await fetch("/api/generate-event-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate AI data");

      setValue("description", data?.description || "");

      const venueIdFromApi: string | undefined = data?.venueId;
      const categoryIdFromApi: string | undefined = data?.categoryId;

      // Fallback: match by label if IDs are not provided
      const matchedVenue = venueOptions.find(
        (opt) => opt.label.toLowerCase() === (data?.venue || "").toLowerCase()
      );
      const matchedCategory = categoryOptions.find(
        (opt) => opt.label.toLowerCase() === (data?.category || "").toLowerCase()
      );

      // Prefer IDs from API, fallback to matched labels, else ""
      setValue("venue", venueIdFromApi || matchedVenue?.value || "");
      setValue("category", categoryIdFromApi || matchedCategory?.value || "");

      setValue("ticketsCount", data?.ticketsCount || 1);


    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: t('organizer_events.ai.success_title'),
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    } catch (error: any) {
      Swal.fire({
        title: t('organizer_events.ai.error_title'),
        text: error.message,
        icon: "error",
      });
    }

    setAiLoading(false);
  };

  // Submit handler
  const onSubmit = async (data: any) => {
    const imageFiles = files.map((f) => f.file as File).filter(Boolean);

    if (venueCapacity && data.ticketsCount > venueCapacity) {
      Swal.fire({
        icon: 'error',
        title: 'Tickets exceed capacity',
        text: `Max capacity is ${venueCapacity} tickets`,
        confirmButtonColor: 'var(--color-primary-700)'
      });
      return;
    }

    const baseEventData = {
      title: data.title,
      description: data.description,
      startDate: data.startDate!.toISOString(),
      endDate: data.endDate!.toISOString(),
      venue: data.venue,
      category: data.category,
      price: data.isFree ? 0 : data.price,
      isFree: data.isFree,
      ticketsCount: data.ticketsCount,
    };

    let eventData:
      | CreateEventData
      | ({ id: string } & Partial<CreateEventData>);

    if (mode === "edit") {
      eventData = {
        id: eventId!,
        ...baseEventData,
        ...(imageFiles.length > 0 && { images: imageFiles }),
      };
    } else {
      eventData = {
        ...baseEventData,
        images: imageFiles,
      } as CreateEventData;
    }

    setIsSubmitting(true);
    try {
      if (mode === "edit") {
        await dispatch(
          updateEvent(eventData as { id: string } & Partial<CreateEventData>)
        ).unwrap();
        Swal.fire({
          title: t('organizer_events.submit.success_title'),
          text: t('organizer_events.submit.update_success'),
          icon: "success",
          confirmButtonColor: "var(--color-primary-700)",
        }).then(() => router.push("/organizers/events"));
      } else {
        await dispatch(createEvent(eventData as CreateEventData)).unwrap();
        Swal.fire({
          title: t('organizer_events.submit.success_title'),
          text: t('organizer_events.submit.create_success'),
          icon: "success",
          confirmButtonColor: "var(--color-primary-700)",
        }).then(() => router.push("/organizers/events"));
      }
    } catch (error) {
      Swal.fire({
        title: t('organizer_events.submit.error_title'),
        text: (error as string) || (mode === 'edit' ? t('organizer_events.submit.update_error_generic') : t('organizer_events.submit.create_error_generic')),
        icon: "error",
        confirmButtonColor: "var(--color-primary-700)",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-neutral-900 dark:text-white min-h-screen w-full flex">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="mx-auto max-w-7xl">
              {/* Breadcrumb */}
              <div className="mb-6 flex flex-wrap gap-2">
                <Link
                  href="#"
                  className="text-base font-medium text-neutral-400 hover:text-primary"
                >
                  {t('Dashboard')}
                </Link>
                <span className="text-base font-medium text-neutral-400">
                  /
                </span>
                <Link
                  href="/organizers/events"
                  className="text-base font-medium text-neutral-400 hover:text-primary"
                >
                  {t('Events')}
                </Link>
                <span className="text-base font-medium text-neutral-400">
                  /
                </span>
                <span className="text-base font-medium text-primary dark:text-white">
                  {mode === 'create' ? t('organizer_events.breadcrumb_create') : t('organizer_events.breadcrumb_edit')}
                </span>
              </div>

              {/* Page Title */}
              <div className="mb-8 flex flex-wrap justify-between gap-3">
                <div className="flex min-w-72 flex-col gap-3">
                  <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white">
                    {mode === 'create' ? t('organizer_events.create_title') : t('organizer_events.edit_title')}
                  </p>
                  <p className="text-base font-normal text-neutral-400">
                    {mode === 'create' ? t('organizer_events.create_subtitle') : t('organizer_events.edit_subtitle')}
                  </p>
                </div>
              </div>

              {/* Form Card */}
              <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
                  {/* Left: Event Info */}
                  <div className="border-b border-neutral-200 p-8 dark:border-neutral-800 lg:col-span-2 lg:border-b-0 lg:border-r">
                    <h2 className="pb-6 text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">
                      {t('organizer_events.form.section_info')}
                    </h2>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* EVENT TITLE + AI BUTTON */}
                      <label className="flex flex-col md:col-span-2">
                        <div className="flex items-center justify-between gap-2 pb-4">
                          <p className="text-sm font-medium">{t('organizer_events.form.title_label')}</p>

                          {/* AI BUTTON */}
                          <button
                            type="button"
                            onClick={generateAIFields}
                            disabled={aiLoading}
                            title={t('organizer_events.form.ai_button_title')}
                            className={`
                              relative flex items-center justify-center
                              cursor-pointer px-1 py-1
                              transition-all duration-200
                              hover:-translate-y-[2px]
                              active:scale-[0.95]
                              disabled:opacity-50
                            `}
                          >
                            {/* Bigger Robot Icon */}
                            <Image
                              src="/ai-robot.png"
                              alt="AI"
                              width={48}     // bigger robot
                              height={48}
                              className="rounded-full"
                            />

                            {/* Thought Bubble */}
                            <div
                              className={`
                                absolute
                                -top-[40px] left-1/2 -translate-x-1/2
                                px-3 py-1.5
                                bg-white/90 dark:bg-gray-900/90
                                text-primary text-[9px] font-semibold
                                shadow-xl border border-white/40 dark:border-gray-500/30
                                rounded-3xl backdrop-blur-md
                                animate-[float_3s_ease-in-out_infinite]
                                whitespace-nowrap
                              `}
                              style={{
                                boxShadow:
                                  "0 4px 12px rgba(0,0,0,0.08), inset 0 0 8px rgba(255,255,255,0.40)",
                              }}
                            >
                              {/* Small Text or Loading */}
                              {aiLoading ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px]">{t('organizer_events.form.ai_thinking')}</span>
                                </div>
                              ) : (
                                t('organizer_events.form.ai_ask')
                              )}

                              {/* Dots */}
                              <div className="flex gap-0.5 mt-[2px] justify-center">
                                <span className="w-1 h-1 rounded-full bg-primary/70 animate-bounce"></span>
                                <span className="w-1 h-1 rounded-full bg-primary/70 animate-bounce delay-150"></span>
                                <span className="w-1 h-1 rounded-full bg-primary/70 animate-bounce delay-300"></span>
                              </div>

                              {/* Tail */}
                              <div
                                className="
                                  absolute bottom-[-5px] left-1/2 -translate-x-1/2
                                  w-2.5 h-2.5 bg-white/90 dark:bg-gray-900/90
                                  border-b border-r border-white/40 dark:border-gray-500/30
                                  rotate-45
                                "
                              ></div>
                            </div>
                          </button>

                        </div>

                        <input
                          {...register("title")}
                          className="form-input"
                          placeholder={t('organizer_events.form.title_placeholder')}
                        />

                        {errors.title && (
                          <span className="mt-1 text-sm text-red-600">
                            {errors.title.message}
                          </span>
                        )}
                      </label>

                      {/* DESCRIPTION */}
                      <label className="flex flex-col md:col-span-2">
                        <p className="pb-2 text-sm font-medium">
                          {t('organizer_events.form.description_label')}
                        </p>
                        <textarea
                          {...register("description")}
                          className="form-textarea"
                          placeholder={t('organizer_events.form.description_placeholder')}
                          rows={4}
                        />
                        {errors.description && (
                          <span className="mt-1 text-sm text-red-600">
                            {errors.description.message}
                          </span>
                        )}
                      </label>

                      {/* START DATE */}
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">
                          {t('organizer_events.form.start_label')}
                        </p>
                        <Controller
                          control={control}
                          name="startDate"
                          render={({ field }) => (
                            mounted ? (
                              <DatePicker
                                selected={field.value}
                                onChange={(date) => field.onChange(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="MMMM d, yyyy h:mm aa"
                                placeholderText={t('organizer_events.form.start_placeholder')}
                                className="form-input w-full"
                                minDate={new Date()}
                              />
                            ) : (
                              <input
                                className="form-input w-full"
                                placeholder={t('organizer_events.form.start_placeholder')}
                                disabled
                              />
                            )
                          )}
                        />
                        {errors.startDate && (
                          <span className="mt-1 text-sm text-red-600">
                            {String(errors.startDate.message)}
                          </span>
                        )}
                      </label>

                      {/* END DATE */}
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">
                          {t('organizer_events.form.end_label')}
                        </p>
                        <Controller
                          control={control}
                          name="endDate"
                          render={({ field }) => (
                            mounted ? (
                              <DatePicker
                                selected={field.value}
                                onChange={(date) => field.onChange(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="MMMM d, yyyy h:mm aa"
                                placeholderText={t('organizer_events.form.end_placeholder')}
                                className="form-input w-full"
                                minDate={watch("startDate") || new Date()}
                              />
                            ) : (
                              <input
                                className="form-input w-full"
                                placeholder={t('organizer_events.form.end_placeholder')}
                                disabled
                              />
                            )
                          )}
                        />
                        {errors.endDate && (
                          <span className="mt-1 text-sm text-red-600">
                            {String(errors.endDate.message)}
                          </span>
                        )}
                      </label>

                      {/* VENUE */}
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">{t('organizer_events.form.venue_label')}</p>
                        <Controller
                          control={control}
                          name="venue"
                          render={({ field }: any) => {
                            const fieldValue = field.value as string;
                            const selectedOption = (
                              venueOptions as OptionType[]
                            ).find(
                              (opt: OptionType) => opt.value === fieldValue
                            ) as OptionType | undefined;
                            return (
                              <Select<OptionType, false>
                                instanceId="venue-select"
                                inputId="venue-select-input"
                                value={selectedOption || null}
                                onChange={(option: OptionType | null) => {
                                  const val = option?.value || "";
                                  if (val === "__create__") {
                                    router.push("/organizers/venues/new");
                                    return;
                                  }
                                  field.onChange(val);
                                }}
                                options={venueOptions}
                                placeholder={t('organizer_events.form.venue_placeholder')}
                                isClearable
                                styles={selectStyles}
                                isOptionDisabled={(opt: any) => opt.value !== "__create__" && unavailableVenueSet.has(opt.value)}
                                formatOptionLabel={(opt: any, meta: any) => {
                                  if (opt?.value === "__create__" && meta?.context === "menu") {
                                    return (
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          width: '100%',
                                          borderTop: '1px solid var(--color-border, #e5e7eb)',
                                          paddingTop: 6,
                                          color: 'var(--color-primary-700)'
                                        }}
                                      >
                                        <span>other(create new venue)</span>
                                        <span style={{ fontWeight: 700, fontSize: 16 }}>+</span>
                                      </div>
                                    );
                                  }
                                  if (meta?.context === "menu" && unavailableVenueSet.has(opt?.value)) {
                                    return (
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <span>{opt?.label}</span>
                                        <span
                                          style={{
                                            fontSize: 11,
                                            color: '#b91c1c',
                                            backgroundColor: '#fee2e2',
                                            border: '1px solid #fecaca',
                                            borderRadius: 9999,
                                            padding: '2px 8px',
                                            fontWeight: 600,
                                          }}
                                        >
                                          Busy
                                        </span>
                                      </div>
                                    );
                                  }
                                  return opt?.label ?? '';
                                }}
                              />
                            );
                          }}
                        />
                        {errors.venue && (
                          <span className="mt-1 text-sm text-red-600">
                            {errors.venue.message}
                          </span>
                        )}
                      </label>

                      {/* CATEGORY */}
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">{t('organizer_events.form.category_label')}</p>
                        <Controller
                          control={control}
                          name="category"
                          render={({ field }: any) => {
                            const fieldValue = field.value as string;
                            const selectedOption = (
                              categoryOptions as OptionType[]
                            ).find(
                              (opt: OptionType) => opt.value === fieldValue
                            ) as OptionType | undefined;
                            return (
                              <Select<OptionType, false>
                                instanceId="category-select"
                                inputId="category-select-input"
                                value={selectedOption || null}
                                onChange={(option: OptionType | null) =>
                                  field.onChange(option?.value || "")
                                }
                                options={categoryOptions}
                                placeholder={t('organizer_events.form.category_placeholder')}
                                isClearable
                                styles={selectStyles}
                              />
                            );
                          }}
                        />
                        {errors.category && (
                          <span className="mt-1 text-sm text-red-600">
                            {errors.category.message}
                          </span>
                        )}
                      </label>

                      {/* PRICE */}
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">
                          {t('organizer_events.form.price_label')}
                        </p>
                        <input
                          {...register("price", { valueAsNumber: true })}
                          type="number"
                          disabled={watchedIsFree}
                          className="form-input"
                          placeholder={t('organizer_events.form.price_placeholder')}
                          min="0"
                          step="0.01"
                        />
                        {errors.price && (
                          <span className="mt-1 text-sm text-red-600">
                            {errors.price.message}
                          </span>
                        )}
                      </label>

                      {/* TICKETS COUNT */}
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium">
                          {t('organizer_events.form.tickets_label')}
                        </p>
                        <input
                          {...register("ticketsCount", { 
                            validate: (raw: any) => {
                              const value = Number(raw);
                              if (!venueCapacity) return true;
                              if (!Number.isFinite(value)) return true; // let Zod handle non-number
                              return value <= venueCapacity || `Max capacity is ${venueCapacity} tickets`;
                            },
                          })}
                          type="number"
                          className="form-input"
                          placeholder={t('organizer_events.form.tickets_placeholder')}
                          min={1}
                          max={venueCapacity ?? undefined}
                          step={1}
                        />
                        {venueCapacity !== undefined && Number.isFinite(Number(watchedTicketsCount)) && Number(watchedTicketsCount) > venueCapacity && (
                          <span className="mt-1 text-sm text-red-600">{`Max capacity is ${venueCapacity} tickets`}</span>
                        )}
                        {venueCapacity !== undefined && !(Number.isFinite(Number(watchedTicketsCount)) && Number(watchedTicketsCount) > venueCapacity) && (
                          <span className="mt-1 text-xs text-neutral-500">{t('organizer_events.form.tickets_capacity_hint', { max: venueCapacity, defaultValue: `Max: ${venueCapacity}` })}</span>
                        )}
                      </label>

                      {/* FREE EVENT */}
                      <label className="flex items-center gap-2">
                        <input {...register("isFree")} type="checkbox" /> {t('organizer_events.form.free_label')}
                      </label>
                    </div>
                  </div>

                  {/* Right: Event Photos */}
                  <div className="p-6 md:p-8">
                    <h2 className="pb-6 text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">
                      {t('organizer_events.form.photos_title')}
                    </h2>

                    <div className="mb-6">
                      <FilePond
                        files={files as unknown as (string | Blob)[]}
                        onupdatefiles={(fileItems) =>
                          setFiles(fileItems as FilePondFile[])
                        }
                        allowMultiple={true}
                        maxFiles={5}
                        name="files"
                        labelIdle={t('organizer_events.form.filepond_label') as unknown as string}
                        credits={false}
                        allowReorder={true}
                        imagePreviewMaxHeight={200}
                        acceptedFileTypes={["image/*"]}
                      />
                    </div>

                    {mode === 'edit' && initialEvent?.images && initialEvent.images.length > 0 && (
                      <div className="mt-4">
                        <h3 className="pb-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('organizer_events.form.current_photos')}</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {initialEvent.images.map((src, idx) => (
                            <div key={idx} className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                              <img src={src} alt={`Event image ${idx + 1}`} className="w-full h-auto" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-8 flex flex-col gap-3">
                      <button
                        onClick={handleFormSubmit(onSubmit)}
                        type="button"
                        disabled={isSubmitting}
                        className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-white font-bold hover:bg-blue-800 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting
                          ? mode === 'create'
                            ? t('organizer_events.form.button_saving')
                            : t('organizer_events.form.button_updating')
                          : mode === 'create'
                          ? t('organizer_events.form.button_create')
                          : t('organizer_events.form.button_update')}
                      </button>

                      <Link
                        href="/organizers/events"
                        className="flex h-12 w-full items-center justify-center rounded-lg border border-neutral-300 text-neutral-400 font-bold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        {t('organizer_events.form.button_cancel')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


