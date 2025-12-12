"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Calendar,
  Ticket,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  RegisterSchemaType,
} from "@/lib/validation/registerSchema";
import { registerUser } from "@/services/firebase/Auth/users";
import { useRouter } from "next/navigation";
import storeImage from "@/services/imgbb/storeImg";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<"organizer" | "attendee" | "">("attendee");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "ar">("en");

  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: RegisterSchemaType) => {
    try {
      setLoading(true);
      let imageUrl = "";

      if (imageFile) {
        imageUrl = await storeImage(imageFile);
      }

      const res = await registerUser(
        data.name,
        data.email,
        data.password,
        data.role,
        imageUrl
      );

      if (res.success && res.user) {
        Swal.fire({
          title:
            language === "en"
              ? "Registered Successfully!"
              : "تم إنشاء الحساب بنجاح!",
          text:
            language === "en"
              ? "Your account has been created successfully."
              : "تم إنشاء حسابك بنجاح.",
          icon: "success",
          confirmButtonText: language === "en" ? "Continue" : "استمرار",
          confirmButtonColor: "#09c",
          timer: 2000,
          timerProgressBar: true,
        });

        // Save user data to localStorage
        localStorage.setItem("user", JSON.stringify(res.user));

        // Set role and user data in cookies
        try {
          const role = (res.user as any)?.role || (res.user as any)?.userRole;
          const id = (res.user as any)?.uid || (res.user as any)?.id;

          if (role) {
            document.cookie = `role=${encodeURIComponent(
              role
            )}; path=/; max-age=2592000; samesite=lax`;
          }

          if (id) {
            const compact = { id, role: role || undefined };
            document.cookie = `user=${encodeURIComponent(
              JSON.stringify(compact)
            )}; path=/; max-age=2592000; samesite=lax`;
          }

          // Handle redirection based on role
          const params =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search)
              : undefined;
          let redirect = params?.get("redirect");

          if (!redirect) {
            if (role === "organizer") {
              redirect = "/organizers";
            } else {
              redirect = "/";
            }
          }

          setTimeout(() => router.replace(redirect), 2000);
        } catch (error) {
          console.error("Error setting cookies:", error);
          // Fallback to home if there's an error with cookies
          setTimeout(() => router.replace("/"), 2000);
        }
      } else {
        console.log(res);
        Swal.fire({
          title: language === "en" ? "Registration Failed" : "فشل التسجيل",
          text:
            res.message ||
            (language === "en"
              ? "Something went wrong. Please try again."
              : "حدث خطأ ما. حاول مرة أخرى."),
          icon: "error",
          confirmButtonColor: "#EF4444",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong during registration";

      console.error("Registration error:", message);

      Swal.fire({
        title: language === "en" ? "Error" : "خطأ",
        text: message,
        icon: "error",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setValue("image", file);
    }
  };

  return (
    <main
      dir={language === "ar" ? "rtl" : "ltr"}
      className="flex min-h-screen items-center justify-center  p-4 overflow-hidden"
    >
      <div className="grid w-full max-w-7xl grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex flex-col justify-between text-center lg:text-left"
        >
          <div className="flex flex-col items-center pt-4 mx-8 gap-6 max-w-md">
            <p className="text-4xl tracking-widest font-bold text-primary-700">
              <Link href="/" className="hover:underline font-serif">
                TikEven
              </Link>
            </p>
            <h1 className="text-3xl md:text-3=4xl text-center font-serif font-bold leading-snug text-gray-900">
              {language === "en" ? (
                <div>
                  Discover and host{" "}
                  <span className="text-primary-700"> Events</span> Now.
                </div>
              ) : (
                <div>
                  اكتشف واستضف{" "}
                  <span className="text-primary-700"> الفعاليات</span> الآن.
                </div>
              )}
            </h1>
            <p className="text-gray-600">
              {language === "en"
                ? "Already have an account?"
                : "لديك حساب بالفعل؟"}{" "}
              <a
                href="/login"
                className="underline font-bold hover:text-primary-700"
              >
                {language === "en" ? "Login →" : "تسجيل الدخول →"}
              </a>
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="relative mt-5 md:mt-37"
          >
            <Image
              src="/images/login.jpg"
              alt="Fashion Event"
              width={700}
              height={600}
              className="rounded-3xl object-cover w-full h-[320px]"
            />
            <div className="absolute inset-0 bg-black/25 rounded-3xl flex flex-col justify-end p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">
                {language === "en" ? "Upcoming Events" : "الفعاليات القادمة"}
              </h2>
              <p className="text-sm">
                {language === "en"
                  ? "Discover new fashion events and exclusive runway experiences."
                  : "اكتشف فعاليات الموضة الجديدة وتجارب عروض الأزياء الحصرية."}
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2 }}
          className="relative flex justify-center items-center h-[700px] md:h-[780px] lg:h-[740px]"
        >
          <div className="relative w-[380px] md:w-[450px] lg:w-[500px] h-full overflow-hidden rounded-[30px]">
            <Image
              src="/images/22.png"
              alt="Background"
              width={500}
              height={750}
              className="object-cover w-full h-full"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute inset-x-0 bottom-6 md:bottom-10 mx-auto bg-white rounded-3xl shadow-2xl w-[85%] max-w-[420px] p-6 md:p-7"
            >
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() =>
                    setLanguage((prev) => (prev === "en" ? "ar" : "en"))
                  }
                  className="text-xs border rounded-full px-3 py-1 hover:bg-gray-100"
                >
                  {language === "en" ? "العربية" : "English"}
                </button>
              </div>
              <h2 className="text-lg font-bold text-center text-primary mb-4">
                {language === "en" ? "Create your account" : "أنشئ حسابك"}
              </h2>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 overflow-visible"
              >
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {language === "en" ? "Profile Image" : "صورة الملف الشخصي"}
                  </Label>
                  <div className="flex items-center gap-3">
                    <Upload size={18} className="text-gray-500" />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="border-none p-0"
                    />
                  </div>
                  {imagePreview && (
                    <div className="w-20 h-20 mb-4 rounded-full overflow-hidden border shadow-md mx-auto">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={100}
                        height={100}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {language === "en" ? "Full Name" : "الاسم الكامل"}
                  </Label>
                  <div className="relative">
                    <User
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      type="text"
                      placeholder={
                        language === "en" ? "Your name" : "اسمك الكامل"
                      }
                      {...register("name")}
                      className="pl-8 border-b py-1"
                    />
                  </div>
                  {errors.name && (
                    <p className="bg-red-400 p-3 rounded-lg text-white text-xs mt-2">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {language === "en" ? "Email" : "البريد الإلكتروني"}
                  </Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      type="email"
                      placeholder={
                        language === "en" ? "Your email" : "بريدك الإلكتروني"
                      }
                      {...register("email")}
                      className="pl-8 border-b py-1"
                    />
                  </div>
                  {errors.email && (
                    <p className="bg-red-400 p-3 rounded-lg text-white text-xs mt-2">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {language === "en" ? "Password" : "كلمة المرور"}
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      {...register("password")}
                      className="pl-8 pr-8 border-b py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="bg-red-400 p-3 rounded-lg text-white text-xs mt-2">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    {language === "en"
                      ? "Confirm Password"
                      : "تأكيد كلمة المرور"}
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="********"
                      {...register("confirm")}
                      className="pl-8 pr-8 border-b py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      aria-label={
                        showConfirm
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirm && (
                    <p className="bg-red-400 p-3 rounded-lg text-white text-xs mt-2">
                      {errors.confirm.message}
                    </p>
                  )}
                </div>

                <div className="relative flex items-center justify-between bg-gray-100 rounded-full p-1">
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`absolute top-1 bottom-1 rounded-full bg-primary ${
                      role === "organizer"
                        ? "left-1 right-1/2"
                        : "left-1/2 right-1"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setRole("organizer");
                      setValue("role", "organizer", { shouldValidate: true });
                    }}
                    aria-pressed={role === "organizer"}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-full transition ${
                      role === "organizer" ? "text-white" : "text-gray-600"
                    }`}
                  >
                    <Calendar size={16} />
                    {language === "en" ? "Organizer" : "منظم"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole("attendee");
                      setValue("role", "attendee", { shouldValidate: true });
                    }}
                    aria-pressed={role === "attendee"}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-full transition ${
                      role === "attendee" ? "text-white" : "text-gray-600"
                    }`}
                  >
                    <Ticket size={16} />
                    {language === "en" ? "Attendee" : "حضور"}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-white rounded-full py-2 mt-2 hover:bg-primary-600"
                  disabled={!isValid || loading}
                >
                  {loading
                    ? language === "en"
                      ? "Creating Account..."
                      : "جارٍ إنشاء الحساب..."
                    : language === "en"
                    ? "Create Account"
                    : "إنشاء حساب"}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-3">
                {language === "en" ? "Do have an account?" : "هل لديك حساب؟"}{" "}
                <a
                  href="/login"
                  className="text-primary font-semibold hover:underline"
                >
                  {language === "en" ? "Log in" : "تسجيل الدخول"}
                </a>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
