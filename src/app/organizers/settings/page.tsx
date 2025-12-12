"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/features";
import { updateOrganizer } from "@/lib/features/userSlice";
import { uploadImageToImgbb } from "@/services/imgbb/storeImg";
import { fetchSettings, updateSettings } from "@/lib/features/settingsSlice";
import { useForm, SubmitHandler, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import Spinner from "@/components/Spinner";
import Loading from "./loading";

const organizerSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  description: z.string().optional(),
  defaultTicketQuantity: z.coerce.number().min(0),
  defaultTicketPrice: z.coerce.number().min(0),
  defaultVisibility: z.enum(["public", "private", "unlisted"]),
  emailNotifications: z.boolean(),
  inAppAlerts: z.boolean(),
  accountId: z.string().optional().or(z.literal("")),
  facebookUrl: z.string().optional().or(z.literal("")),
  instagramUrl: z.string().optional().or(z.literal("")),
  twitterUrl: z.string().optional().or(z.literal("")),
  websiteUrl: z.string().optional().or(z.literal("")),
});

type OrganizerSettingsForm = z.infer<typeof organizerSettingsSchema>;

export default function OrganizerSettingsPage() {
  const { t } = useTranslation("common");
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.users.currentUser);
  const settings = useSelector((s: RootState) => s.settings.settings);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [removeImagePending, setRemoveImagePending] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountActive, setAccountActive] = useState(false);
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<OrganizerSettingsForm>({
    resolver: zodResolver(organizerSettingsSchema) as Resolver<OrganizerSettingsForm>,
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      description: user?.description || "",
      defaultTicketQuantity: settings?.defaultTicketQuantity ?? 100,
      defaultTicketPrice: settings?.defaultTicketPrice ?? 25,
      defaultVisibility: settings?.defaultVisibility ?? "public",
      emailNotifications: settings?.emailNotifications ?? true,
      inAppAlerts: settings?.inAppAlerts ?? false,
      accountId: settings?.accountId ?? "",
      facebookUrl: settings?.facebookUrl ?? "",
      instagramUrl: settings?.instagramUrl ?? "",
      twitterUrl: settings?.twitterUrl ?? "",
      websiteUrl: settings?.websiteUrl ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const emailNotifs = watch("emailNotifications");
  const inAppAlerts = watch("inAppAlerts");

  // First, handle any success parameter in the URL
  useEffect(() => {
    const success = searchParams.get('success');
    if (success && user?.id) {
      setAccountActive(true);      
      dispatch(
        updateSettings({
          userId: user.id,
          data: { accountActive: true }
        })
      )
      .then(() => {
        return dispatch(fetchSettings({ userId: user.id })).unwrap();
      })
      .then(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        window.history.replaceState({}, '', url.toString());
        Swal.fire({
          icon: 'success',
          title: 'Account Activated',
          text: 'Your account has been successfully activated!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      })
      .catch(error => {
        console.error('Failed to update account status:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update account status. Please try again.',
          toast: true,
          position: 'top-end'
        });
      });
    }
  }, [dispatch, searchParams, user?.id]);

  // Then fetch settings if we have a user
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchSettings({ userId: user.id }));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    setPreview(user?.image || undefined);
  }, [user?.image]);

  useEffect(() => {
    reset({
      name: user?.name || "",
      email: user?.email || "",
      defaultTicketQuantity: settings?.defaultTicketQuantity ?? 100,
      defaultTicketPrice: settings?.defaultTicketPrice ?? 25,
      defaultVisibility: settings?.defaultVisibility ?? "public",
      emailNotifications: settings?.emailNotifications ?? true,
      inAppAlerts: settings?.inAppAlerts ?? false,
      accountId: settings?.accountId ?? "",
      facebookUrl: settings?.facebookUrl ?? "",
      instagramUrl: settings?.instagramUrl ?? "",
      twitterUrl: settings?.twitterUrl ?? "",
      websiteUrl: settings?.websiteUrl ?? "",
    });
    
    // Initialize accountActive from settings if available
    if (settings?.accountActive !== undefined) {
      setAccountActive(settings.accountActive);
    }
  }, [reset, user?.name, user?.email, settings]);

  const handlePickImage = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageFile(file);
    setRemoveImagePending(false);
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
  };
  const handleRemoveImage = async () => {
    // Only update local state; actual removal from Firestore happens on Save Changes
    setPreview(undefined);
    setPendingImageFile(null);
    setRemoveImagePending(true);
  };

  const onSubmit: SubmitHandler<OrganizerSettingsForm> = async (values) => {
    if (!user?.id) return;

    let imageUrl: string | undefined = undefined;
    if (pendingImageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadImageToImgbb(pendingImageFile);
      } finally {
        setUploading(false);
      }
    }

    await dispatch(
      updateOrganizer({
        userId: user.id,
        data: {
          name: values.name,
          email: values.email,
          description: values.description || "",
          ...(imageUrl
            ? { image: imageUrl }
            : removeImagePending
            ? { image: "" }
            : {}),
        },
      } as any)
    );

    await dispatch(
      updateSettings({
        userId: user.id,
        data: {
          defaultTicketQuantity: values.defaultTicketQuantity,
          defaultTicketPrice: values.defaultTicketPrice,
          defaultVisibility: values.defaultVisibility,
          emailNotifications: values.emailNotifications,
          inAppAlerts: values.inAppAlerts,
          accountId: values.accountId,
          facebookUrl: values.facebookUrl,
          instagramUrl: values.instagramUrl,
          twitterUrl: values.twitterUrl,
          websiteUrl: values.websiteUrl,
        },
      }) as any
    );
    Swal.fire({
      icon: 'success',
      title: 'Profile Updated',
      text: 'Your profile has been updated successfully!',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  };

  const handleCreateAccount = async () => {
    try {
      setIsCreatingAccount(true);
      
      // 1. Create Stripe account and get onboarding URL
      const response = await fetch('/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account');
      }
      
      const data = await response.json();
      
      // 2. Save account ID to form and set as inactive initially
      setValue('accountId', data.accountId);
      setAccountActive(data.accountActive || false);
      // Auto-save the settings after setting the account ID
      await handleSubmit(onSubmit)();
      
      // 4. Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        throw new Error('Onboarding URL not provided');
      }

    } catch (error) {
      console.error('Error in payment setup:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to set up payment account. Please try again.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if(!user) {
    return (<Loading />);
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-neutral-900 dark:text-white min-h-screen w-full flex">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex flex-wrap gap-2 text-sm md:text-base">
                <Link href="#" className="font-medium text-neutral-400 hover:text-primary">
                  {t("dashboard_breadcrumb")}
                </Link>
                <span className="font-medium text-neutral-400">/</span>
                <span className="font-medium text-primary dark:text-white">{t("organizer_settings.title")}</span>
              </div>

              <div className="mb-8 flex flex-wrap justify-between gap-3">
                <div className="flex w-full sm:min-w-60 md:min-w-72 flex-col gap-3">
                  <p className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-primary dark:text-white">
                    {t("organizer_settings.title")}
                  </p>
                  <p className="text-sm md:text-base font-normal text-neutral-400">
                    {t("organizer_settings.subtitle")}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="border-b border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
                    <h2 className="text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">{t("organizer_settings.sections.profile")}</h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="space-y-6">
                      <div>
                        <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.profile_image.label")}</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-20"
                            style={{
                              backgroundImage: `url("${preview || "/images/placeholder.jpg"}")`,
                            }}
                          />
                          <div className="flex items-center gap-2 w-full sm:w-auto flex-col sm:flex-row">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                            <button
                              type="button"
                              onClick={handlePickImage}
                              disabled={uploading}
                              className="flex h-10 w-full sm:w-auto cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                            >
                              <span className="truncate">{t("organizer_settings.profile_image.upload")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              disabled={uploading}
                              className="flex h-10 w-full sm:w-auto cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-transparent px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 disabled:opacity-60"
                            >
                              <span className="truncate">{t("organizer_settings.profile_image.remove")}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <label className="flex flex-col">
                          <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.full_name.label")}</p>
                          <input
                            className="form-input"
                            placeholder={t("organizer_settings.fields.full_name.placeholder")}
                            {...register("name")}
                          />
                          {errors.name && (
                            <span className="mt-1 text-sm text-red-500">{errors.name.message as string}</span>
                          )}
                        </label>
                        <label className="flex flex-col">
                          <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.organizer_name.label")}</p>
                          <input
                            className="form-input"
                            placeholder={t("organizer_settings.fields.organizer_name.placeholder")}
                          />
                        </label>
                        <label className="flex flex-col">
                          <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.email.label")}</p>
                          <input
                            className="form-input"
                            placeholder={t("organizer_settings.fields.email.placeholder")}
                            type="email"
                            {...register("email")}
                          />
                          {errors.email && (
                            <span className="mt-1 text-sm text-red-500">{errors.email.message as string}</span>
                          )}
                        </label>
                        <label className="flex flex-col md:col-span-2">
                          <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.description.label")}</p>
                          <textarea 
                            className="form-textarea min-h-32" 
                            placeholder={t("organizer_settings.fields.description.placeholder")} 
                            {...register("description")}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="border-b border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
                    <h2 className="text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">{t("organizer_settings.sections.event_defaults")}</h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <p className="mb-6 text-sm md:text-base text-neutral-400">{t("organizer_settings.event_defaults.description")}</p>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.default_ticket_quantity.label")}</p>
                        <input
                          className="form-input"
                          placeholder={t("organizer_settings.fields.default_ticket_quantity.placeholder")}
                          type="number"
                          {...register("defaultTicketQuantity")}
                        />
                        {errors.defaultTicketQuantity && (
                          <span className="mt-1 text-sm text-red-500">
                            {errors.defaultTicketQuantity.message as string}
                          </span>
                        )}
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.default_ticket_price.label")}</p>
                        <input
                          className="form-input"
                          placeholder={t("organizer_settings.fields.default_ticket_price.placeholder")}
                          type="number"
                          {...register("defaultTicketPrice")}
                        />
                        {errors.defaultTicketPrice && (
                          <span className="mt-1 text-sm text-red-500">
                            {errors.defaultTicketPrice.message as string}
                          </span>
                        )}
                      </label>
                      <label className="flex flex-col md:col-span-2">
                        <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.default_visibility.label")}</p>
                        <select
                          className="form-select flex h-12 min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-neutral-300 bg-background-light p-[15px] text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-neutral-700 dark:bg-background-dark dark:text-white"
                          {...register("defaultVisibility")}
                        >
                          <option value="public">{t("organizer_settings.fields.default_visibility.options.public")}</option>
                          <option value="private">{t("organizer_settings.fields.default_visibility.options.private")}</option>
                          <option value="unlisted">{t("organizer_settings.fields.default_visibility.options.unlisted")}</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div> */}

                {/* <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="border-b border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
                    <h2 className="text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">{t("organizer_settings.sections.notifications")}</h2>
                  </div>
                  <div className="divide-y divide-neutral-200 p-4 sm:p-6 dark:divide-neutral-800">
                    <div className="flex items-center justify-between py-4 flex-wrap gap-3">
                      <p className="font-medium text-neutral-900 dark:text-white">{t("organizer_settings.notifications.email")}</p>
                      <button
                        type="button"
                        onClick={() => setValue("emailNotifications", !emailNotifs)}
                        aria-checked={emailNotifs}
                        role="switch"
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          emailNotifs ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            emailNotifs ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-4 flex-wrap gap-3">
                      <p className="font-medium text-neutral-900 dark:text-white">{t("organizer_settings.notifications.in_app")}</p>
                      <button
                        type="button"
                        onClick={() => setValue("inAppAlerts", !inAppAlerts)}
                        aria-checked={inAppAlerts}
                        role="switch"
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          inAppAlerts ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            inAppAlerts ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div> */}

                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="border-b border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
                    <h2 className="text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">{t("organizer_settings.sections.payment")}</h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <p className="mb-6 text-sm md:text-base text-neutral-400">{t("organizer_settings.payment.description")}</p>
                    <div className="grid grid-cols-1 gap-6">
                      {watch("accountId") ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                Stripe account connected
                              </span>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              accountActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                            }`}>
                              {accountActive ? 'Active' : 'Pending'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Your Stripe account is connected and ready to accept payments.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {watch("accountId")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Set up your payment account to start receiving payouts for your events.
                          </p>
                          <button
                            type="button"
                            onClick={handleCreateAccount}
                            disabled={isCreatingAccount}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium ${
                              isCreatingAccount
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white transition-colors`}
                          >
                            {isCreatingAccount ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Account...
                              </>
                            ) : (
                              'Create Payment Account'
                            )}
                          </button>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            By creating an account, you agree to Stripe's Terms of Service
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="border-b border-neutral-200 p-4 sm:p-6 dark:border-neutral-800">
                    <h2 className="text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-primary dark:text-white">{t("organizer_settings.sections.social")}</h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.facebook.label")}</p>
                        <input
                          className="form-input"
                          placeholder={t("organizer_settings.fields.facebook.placeholder")}
                          type="url"
                          {...register("facebookUrl")}
                        />
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.instagram.label")}</p>
                        <input
                          className="form-input"
                          placeholder={t("organizer_settings.fields.instagram.placeholder")}
                          type="url"
                          {...register("instagramUrl")}
                        />
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.twitter.label")}</p>
                        <input
                          className="form-input"
                          placeholder={t("organizer_settings.fields.twitter.placeholder")}
                          type="url"
                          {...register("twitterUrl")}
                        />
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium text-neutral-900 dark:text-white">{t("organizer_settings.fields.website.label")}</p>
                        <input
                          className="form-input"
                          placeholder={t("organizer_settings.fields.website.placeholder")}
                          type="url"
                          {...register("websiteUrl")}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-red-500/40 bg-red-50 shadow-sm dark:border-red-500/50 dark:bg-red-900/20">
                  <div className="border-b border-red-200 p-4 sm:p-6 dark:border-red-800/60">
                    <h2 className="text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-red-600 dark:text-red-400">{t("organizer_settings.sections.account")}</h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{t("organizer_settings.account.delete_title")}</p>
                        <p className="text-sm text-neutral-400">{t("organizer_settings.account.delete_description")}</p>
                      </div>
                      <button className="flex h-12 cursor-pointer items-center justify-center overflow-hidden rounded-lg border bg-transparent px-6 text-base font-bold border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/30">
                        <span className="truncate">{t("organizer_settings.account.delete_button")}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 md:pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary px-6 text-base font-bold tracking-[0.015em] text-white hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
                  >
                    <span className="truncate">{isSubmitting ? t("organizer_settings.actions.saving") : t("organizer_settings.actions.save_changes")}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
