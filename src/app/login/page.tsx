"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { loginSchema, LoginSchemaType } from "@/lib/validation/loginSchema";
import { loginUser } from "@/services/firebase/Auth/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState<"en" | "ar">("en");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setLoading(true);
    try {
      const result = await loginUser(data.email, data.password);
      if (result.success && result.user) {
        let role: string | undefined;
        let id: string | undefined;
        Swal.fire({
          title: language === "en" ? "Welcome Back!" : "مرحبًا بعودتك!",
          text:
            language === "en"
              ? "You have logged in successfully."
              : "تم تسجيل الدخول بنجاح.",
          icon: "success",
          confirmButtonText: language === "en" ? "Continue" : "استمرار",
          confirmButtonColor: "#09c",
          timer: 2000,
          timerProgressBar: true,
        });
        localStorage.setItem("user", JSON.stringify(result.user));
        try {
          role = (result.user as any)?.role || (result.user as any)?.userRole;
          id = (result.user as any)?.uid || (result.user as any)?.id;
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
        } catch {}
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
      } else {
        Swal.fire({
          title: language === "en" ? "Login Failed" : "فشل تسجيل الدخول",
          text:
            result.message ||
            (language === "en"
              ? "Invalid email or password."
              : "البريد الإلكتروني أو كلمة المرور غير صحيحة."),
          icon: "error",
          confirmButtonColor: "#EF4444",
        });
      }
    } catch (err) {
      Swal.fire({
        title: language === "en" ? "Error" : "خطأ",
        text:
          language === "en"
            ? "An unexpected error occurred. Please try again."
            : "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
        icon: "error",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="flex items-center justify-center bg-primary-50/20 min-h-screen mx-0overflow-hidden"
    >
      <div className="grid w-full max-w-7xl grid-cols-1 md:grid-cols-2 h-full items-center w-full gap-3">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex flex-col justify-center items-center text-center lg:text-left px-6 md:px-2 h-full"
        >
          <div className="flex flex-col items-center md:items-start gap-6">
            <p className="text-lg px-32  tracking-widest font-bold text-primary-600">
              {language === "en" ? "Welcome Back" : "مرحبًا بعودتك"}
            </p>
            <h1 className="text-4xl md:text-5xl text-center font-serif font-bold leading-snug text-gray-900">
              {language === "en" ? (
                <>
                  Log in & Continue <br />
                  Your <span className="text-primary-700">Journey</span>
                </>
              ) : (
                <>
                  سجّل الدخول وواصل <br />
                  <span className="text-primary-700">رحلتك</span>
                </>
              )}
            </h1>
            <p className="text-gray-600 px-20">
              {language === "en" ? "Don’t have an account?" : "ليس لديك حساب؟"}{" "}
              <a
                href="/register"
                className="underline font-bold hover:text-primary-700"
              >
                {language === "en" ? "Register →" : "سجّل الآن →"}
              </a>
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="relative mt-10 lg:mt-35 self-end"
          >
            <Image
              src="/images/login.jpg"
              alt="Fashion Event"
              width={800}
              height={600}
              className="rounded-3xl object-cover lg:w-[500px]w-full h-[320px]"
            />
            <div
              className="absolute inset-0 bg-black/25 rounded-3xl flex
             flex-col justify-end p-6 text-white"
            >
              <h2 className="text-2xl font-bold mb-2">
                {language === "en"
                  ? "Discover New Events"
                  : "اكتشف فعاليات جديدة"}
              </h2>
              <p className="text-sm">
                {language === "en"
                  ? "Manage your tickets and enjoy exclusive experiences."
                  : "إدِر تذاكرك واستمتع بتجارب حصرية."}
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2 }}
          className="relative flex justify-center items-center h-full mt-6 md:mt-1 md:mb-3"
        >
          <Image
            src="/images/22.png"
            alt="Background"
            width={500}
            height={600}
            className="object-cover w-[360px] h-[620px] md:w-[430px] md:h-[680px] lg:w-[560px] lg:h-[700px] rounded-[30px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute top-1/6 left-1/2 -translate-x-1/2 bg-white z-10 
  rounded-3xl shadow-2xl w-[80%] max-w-[320px] p-4 md:w-[85%] md:max-w-[400px] md:p-7"
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
            <div className="flex flex-col items-center mb-4">
              <Link
                href="/"
                aria-label="Go to home"
                className="flex flex-col items-center"
              >
                <div
                  className="w-20 h-20 rounded-full overflow-hidden shadow-sm border border-gray-200 
                flex items-center justify-center bg-white"
                >
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={60}
                    height={60}
                    className="object-cover"
                  />
                </div>
                <h2 className="mt-2 text-xl font-bold text-primary">TikEven</h2>
              </Link>
            </div>

            <h2 className="text-lg font-bold text-center text-primary mb-4">
              {language === "en"
                ? "Log in to your account"
                : "سجّل الدخول إلى حسابك"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                      language === "en"
                        ? "Enter your email"
                        : "أدخل بريدك الإلكتروني"
                    }
                    {...register("email")}
                    className="pl-8 border-b py-2"
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
                    className="pl-8 pr-8 border-b py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="bg-red-400 p-3 rounded-lg text-white text-xs mt-2">
                    {errors.password.message}
                  </p>
                )}
                <p className="mt-3 text-right">
                  <a
                    href="/forgetpassword"
                    className="font-bold text-primary hover:underline text-sm"
                  >
                    {language === "en"
                      ? "Forgot password?"
                      : "هل نسيت كلمة المرور؟"}
                  </a>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-white
                 rounded-full py-2 mt-2 hover:bg-primary-600"
                disabled={!isValid || loading}
              >
                {loading
                  ? language === "en"
                    ? "Logging in..."
                    : "جارٍ تسجيل الدخول..."
                  : language === "en"
                  ? "Log In"
                  : "تسجيل الدخول"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-3">
              {language === "en" ? "Don’t have an account?" : "ليس لديك حساب؟"}{" "}
              <a
                href="/register"
                className="text-primary font-semibold hover:underline"
              >
                {language === "en" ? "Create one" : "أنشئ حسابًا"}
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
