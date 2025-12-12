/** @format */
"use client";

import "@/i18n/client";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/client";
import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MapPin } from "lucide-react";
import { RootState, AppDispatch } from "@/lib/features";
import {
  fetchUserFromFirebase,
  setUser,
  startUserRealtimeListener,
} from "@/lib/features/userSlice";
import { Eye, EyeOff } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import {
  updateDoc,
  setDoc,
  doc as firestoreDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase/config";
import Swal from "sweetalert2";
import { uploadImageToImgbb } from "@/services/imgbb/storeImg";

export default function EditProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, loading } = useSelector(
    (state: RootState) => state.users
  );
  const auth = getAuth();
  const { t } = useTranslation();
  const isRTL = typeof document !== "undefined" ? document.documentElement.dir === "rtl" : (i18n.language || "en").startsWith("ar");

  // helper to build a deterministic default avatar URL (simple white circle)
  const getDefaultAvatar = (seed?: string | number) => {
    // Return a simple white circle placeholder image
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ccircle cx='100' cy='70' r='50' fill='%23ffffff'/%3E%3Cellipse cx='100' cy='140' rx='60' ry='50' fill='%23ffffff'/%3E%3C/svg%3E`;
  };

  const [photo, setPhoto] = useState<string>(
    currentUser?.image || getDefaultAvatar(currentUser?.id || currentUser?.name)
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    gender: currentUser?.gender || "Female",
    age: currentUser?.age || "",
    country: currentUser?.country || "",
    city: currentUser?.city || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchUserFromFirebase());
    dispatch(startUserRealtimeListener());
  }, [dispatch]);

  useEffect(() => {
    if (currentUser) {
      // update local photo fallback and form fields when currentUser loads
      setPhoto(
        currentUser.image ||
          getDefaultAvatar(currentUser.id || currentUser.name)
      );
      setFormData((prev) => ({
        ...prev,
        name: currentUser.name || "",
        email: currentUser.email || "",
        gender: currentUser.gender || "Female",
        age: currentUser.age || "",
        country: currentUser.country || "",
        city: currentUser.city || "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(URL.createObjectURL(file)); // preview
      setPhotoFile(file);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // 🖼️ رفع الصورة: imgbb أولًا، لو فشل fallback على Firebase
  const uploadProfileImage = async (): Promise<string> => {
    if (!photoFile || !currentUser?.id)
      return (
        currentUser?.image ||
        getDefaultAvatar(currentUser?.id || currentUser?.name)
      );
    try {
      return await uploadImageToImgbb(photoFile);
    } catch (imgbbErr) {
      console.warn(
        "imgbb upload failed, falling back to Firebase Storage:",
        imgbbErr
      );
      const storage = getStorage();
      const fileRef = ref(storage, `profilePhotos/${currentUser.id}.jpg`);
      await uploadBytes(fileRef, photoFile);
      return await getDownloadURL(fileRef);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    Swal.fire({
      title: t("saving_title", { defaultValue: "Saving..." }),
      text: t("saving_text", { defaultValue: "Please wait while we update your profile." }),
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      setSaving(true);
      const updatedData: any = {
        name: formData.name,
        email: formData.email,
        gender: formData.gender,
        age: formData.age,
        country: formData.country,
        city: formData.city,
      };

      // تحديث الصورة
      updatedData.image = await uploadProfileImage();

      // 🔐 تحديث الباسورد و/أو الايميل
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      // Check if email or password is being changed
      const isEmailChanged =
        formData.email && formData.email !== currentUser?.email;
      const isPasswordChanged =
        formData.currentPassword &&
        formData.newPassword &&
        formData.newPassword === formData.confirmPassword;

      let authUpdateError = null;
      let verificationEmailSent = false;

      // If either email or password is being changed, reauthenticate first
      if (isEmailChanged || isPasswordChanged) {
        if (!user.email) throw new Error("User email not found");

        // Current password is required for reauthentication
        if (!formData.currentPassword) {
          throw new Error(
            "Current password is required to change email or password"
          );
        }

        try {
          const credential = EmailAuthProvider.credential(
            user.email,
            formData.currentPassword
          );
          await reauthenticateWithCredential(user, credential);

          // Update password if provided
          if (isPasswordChanged) {
            try {
              await updatePassword(user, formData.newPassword);
              console.log("✓ Password updated in Firebase Auth");
            } catch (pwErr: any) {
              console.error("Password update error:", pwErr);
              throw new Error(`Failed to update password: ${pwErr.message}`);
            }
          }

          // Update email if changed via verification flow
          if (isEmailChanged) {
            try {
              await verifyBeforeUpdateEmail(user, formData.email);
              verificationEmailSent = true;
              // Do not write the new email to Firestore until user verifies
              delete (updatedData as any).email;
              console.log("✓ Verification email sent to:", formData.email);
            } catch (emailErr: any) {
              console.warn("Sending verification email failed:", emailErr);
              // Keep Firestore email unchanged if verification email couldn't be sent
              delete (updatedData as any).email;
              authUpdateError = `Could not send verification email: ${emailErr.message}`;
            }
          }
        } catch (authErr: any) {
          if (authErr.code === "auth/invalid-credential") {
            throw new Error("Current password is incorrect. Please try again.");
          }
          // For other auth errors during reauthentication, throw to block
          throw authErr;
        }
      }

      // تحديث بيانات Firestore
      if (currentUser?.id) {
        const userRef = firestoreDoc(db, "users", currentUser.id);
        await setDoc(userRef, updatedData, { merge: true });

        // Re-read the saved document to confirm the write succeeded
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const saved = snap.data();
            console.log("Firestore saved user document:", saved);
            // Sanitize Timestamp fields (createdAt/updatedAt) to ISO strings
            const savedSanitized: any = { ...(saved as any) };
            if ((savedSanitized.createdAt as any)?.toDate) {
              try {
                savedSanitized.createdAt = (savedSanitized.createdAt as any)
                  .toDate()
                  .toISOString();
              } catch (_) {
                // leave as-is if conversion fails
              }
            }
            if ((savedSanitized.updatedAt as any)?.toDate) {
              try {
                savedSanitized.updatedAt = (savedSanitized.updatedAt as any)
                  .toDate()
                  .toISOString();
              } catch (_) {}
            }

            // Update Redux and localStorage from authoritative source
            const merged = {
              ...(currentUser || {}),
              ...savedSanitized,
              id: currentUser!.id,
              email: updatedData.email || currentUser!.email,
            } as any;
            dispatch(setUser(merged));
            try {
              localStorage.setItem("user", JSON.stringify(merged));
            } catch (lsErr) {
              console.warn("Could not write user to localStorage:", lsErr);
            }
          } else {
            console.warn("User document not found after save.");
          }
        } catch (readErr) {
          console.error("Error reading user doc after save:", readErr);
        }
      }

      // Sync local UI state immediately
      if (updatedData.image) setPhoto(updatedData.image);
      setPhotoFile(null);
      setFormData((prev) => ({
        ...prev,
        name: updatedData.name ?? prev.name,
        email: updatedData.email ?? prev.email,
        gender: updatedData.gender ?? prev.gender,
        age: updatedData.age ?? prev.age,
        country: updatedData.country ?? prev.country,
        city: updatedData.city ?? prev.city,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      // Ensure Redux state stays consistent with Firebase
      await dispatch(fetchUserFromFirebase() as any);

      Swal.close();
      await Swal.fire({
        icon: "success",
        title: t("profile_updated_title", { defaultValue: "Profile Updated!" }),
        text: authUpdateError
          ? authUpdateError
          : verificationEmailSent
          ? t("verification_sent_text", { email: formData.email, defaultValue: `We sent a verification link to ${formData.email}. Please confirm to complete changing your email.` })
          : t("profile_updated_success_text", { defaultValue: "Your profile has been updated successfully." }),
        confirmButtonColor: "#4CAF50",
      });
    } catch (error: any) {
      console.error(error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: t("update_failed_title", { defaultValue: "Update Failed" }),
        text:
          error.message || t("update_failed_text_generic", { defaultValue: "Something went wrong while updating your profile." }),
        confirmButtonColor: "#d33",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t("profile_loading", { defaultValue: "Loading your profile..." })}</p>
        </div>
      </main>
    );
  }

  // compute avatar src: prefer preview file -> stored image -> dicebear default
  const avatarSrc = photoFile
    ? URL.createObjectURL(photoFile)
    : currentUser?.image
    ? currentUser.image
    : getDefaultAvatar(currentUser?.id || currentUser?.name);

  return (
    <main className="min-h-screen bg-background text-foreground font-body py-12 animate-fadeIn">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-primary">{t("profile_edit_title", { defaultValue: "Edit Profile" })}</h1>
          <p className="text-subtitle mt-2">
            {t("profile_edit_subtitle", { defaultValue: "Manage your personal information and account settings." })}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Info */}
          <section className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              <div className="relative">
                {/* Avatar: preview image or user image or DiceBear default */}
                <img
                  src={avatarSrc}
                  alt={t("profile_alt", { defaultValue: "Profile" })}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/30 bg-gray-100"
                />
                <label
                  htmlFor="photo"
                  className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white cursor-pointer hover:opacity-90 transition"
                  title={t("change_photo", { defaultValue: "Change photo" })}
                >
                  ✎
                </label>
                <input
                  type="file"
                  id="photo"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold">{t("personal_info_title", { defaultValue: "Personal Information" })}</h2>
                <p className="text-sm text-subtitle mt-1">
                  {t("personal_info_subtitle", { defaultValue: "Update your photo and basic details." })}
                </p>
                {currentUser && (
                  <p className="text-xs text-subtitle mt-2">
                    {t("role_label", { defaultValue: "Role" })}: {currentUser.role}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {["name", "email", "gender", "age", "country", "city"].map(
                (field) => (
                  <div key={field}>
                    <label
                      htmlFor={field}
                      className="block text-sm font-medium mb-2 capitalize"
                    >
                      {field === "city"
                        ? t("city_label", { defaultValue: "City" })
                        : field === "country"
                        ? t("country_label", { defaultValue: "Country" })
                        : field === "age"
                        ? t("age_label", { defaultValue: "Age" })
                        : field === "gender"
                        ? t("gender_label", { defaultValue: "Gender" })
                        : field === "email"
                        ? t("email_label", { defaultValue: "Email" })
                        : t("full_name_label", { defaultValue: "Full Name" })}
                    </label>

                    {field === "gender" ? (
                      <select
                        id={field}
                        value={formData.gender}
                        onChange={handleChange}
                        className="form-select w-full"
                      >
                        <option>{t("gender_female", { defaultValue: "Female" })}</option>
                        <option>{t("gender_male", { defaultValue: "Male" })}</option>
                        <option>{t("gender_other", { defaultValue: "Other" })}</option>
                        <option>{t("gender_prefer_not_say", { defaultValue: "Prefer not to say" })}</option>
                      </select>
                    ) : (
                      <input
                        id={field}
                        type={
                          field === "age"
                            ? "number"
                            : field === "email"
                            ? "email"
                            : "text"
                        }
                        value={(formData as any)[field]}
                        onChange={handleChange}
                        className="form-input w-full"
                        placeholder={t("enter_field_placeholder", {
                          field:
                            field === "name"
                              ? t("full_name_label", { defaultValue: "Full Name" })
                              : field === "email"
                              ? t("email_label", { defaultValue: "Email" })
                              : field === "gender"
                              ? t("gender_label", { defaultValue: "Gender" })
                              : field === "age"
                              ? t("age_label", { defaultValue: "Age" })
                              : field === "country"
                              ? t("country_label", { defaultValue: "Country" })
                              : t("city_label", { defaultValue: "City" }),
                          defaultValue: `Enter your ${field}`,
                        })}
                      />
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          {/* Password Section */}
          <section className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-4">{t("change_password_title", { defaultValue: "Change Password" })}</h2>
            <p className="text-sm text-subtitle mb-6">
              {t("change_password_subtitle", { defaultValue: "For your security, do not share your password with anyone." })}
            </p>

            <div className="space-y-6">
              {[
                { id: "currentPassword", label: t("current_password_label", { defaultValue: "Current Password" }), field: "current", placeholder: t("enter_current_password", { defaultValue: "Enter current password" }) },
                { id: "newPassword", label: t("new_password_label", { defaultValue: "New Password" }), field: "new", placeholder: t("enter_new_password", { defaultValue: "Enter new password" }) },
                { id: "confirmPassword", label: t("confirm_new_password_label", { defaultValue: "Confirm New Password" }), field: "confirm", placeholder: t("enter_confirm_new_password", { defaultValue: "Enter confirm new password" }) },
              ].map(({ id, label, field, placeholder }) => (
                <div key={id} className="relative">
                  <label
                    htmlFor={id}
                    className="block text-sm font-medium mb-2"
                  >
                    {label}
                  </label>
                  <input
                    id={id}
                    type={
                      showPassword[field as keyof typeof showPassword]
                        ? "text"
                        : "password"
                    }
                    value={(formData as any)[id]}
                    onChange={handleChange}
                    className={`form-input w-full ${isRTL ? "pl-10" : "pr-10"}`}
                    placeholder={placeholder}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field as any)}
                    className={`absolute ${isRTL ? "left-3" : "right-3"} top-9 text-gray-500 hover:text-primary`}
                  >
                    {showPassword[field as keyof typeof showPassword] ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                Swal.fire({
                  title: t("confirm_are_you_sure", { defaultValue: "Are you sure?" }),
                  text: t("confirm_unsaved_lost", { defaultValue: "Any unsaved changes will be lost." }),
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#3085d6",
                  cancelButtonColor: "#d33",
                  confirmButtonText: t("confirm_yes_cancel", { defaultValue: "Yes, cancel" }),
                  cancelButtonText: t("cancel", { defaultValue: "Cancel" }),
                }).then((result) => {
                  if (result.isConfirmed) {
                    Swal.fire({
                      title: t("cancelled_title", { defaultValue: "Cancelled" }),
                      text: t("cancelled_text", { defaultValue: "Your changes were discarded." }),
                      icon: "info",
                      confirmButtonColor: "#3085d6",
                    });
                  }
                })
              }
            >
              {t("cancel", { defaultValue: "Cancel" })}
            </button>

            <button type="submit" className="btn" disabled={saving}>
              {saving ? t("saving", { defaultValue: "Saving..." }) : t("save_changes", { defaultValue: "Save Changes" })}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
