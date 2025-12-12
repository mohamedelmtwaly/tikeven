"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendResetEmail, verifyResetCode, confirmNewPassword } from "@/services/firebase/Auth/users";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<"en" | "ar">("en");

  const router = useRouter();

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");
    try {
      await sendResetEmail(email);
      setMsg(
        language === "en"
          ? "We've sent a reset link to your email. Copy the code from the link (?oobCode=...) and paste it below."
          : "أرسلنا رابط إعادة تعيين إلى بريدك الإلكتروني. انسخ الرمز (?oobCode=...) من الرابط وضعه في الحقل بالأسفل."
      );
      setStep("code");
    } catch (err) {
      setError(
        language === "en"
          ? "Failed to send email. Check the address."
          : "فشل إرسال البريد الإلكتروني. تأكد من صحة العنوان."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    setMsg("");
    setError("");
    try {
      const verifiedEmail = await verifyResetCode(code);
      setMsg(
        language === "en"
          ? `Code verified for ${verifiedEmail}`
          : `تم تأكيد الرمز للبريد ${verifiedEmail}`
      );
      setStep("password");
    } catch (err) {
      setError(
        language === "en"
          ? "Invalid or expired code."
          : "الرمز غير صالح أو منتهي الصلاحية."
      );
    } finally {
      setLoading(false);
    }
  };

  
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");
    try {
      await confirmNewPassword(code, newPassword);
      setMsg(
        language === "en"
          ? "Password changed successfully! You can now log in."
          : "تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول."
      );
      setStep("email");
      router.push("/");
    } catch (err) {
      setError(
        language === "en"
          ? "Failed to reset password. Try again."
          : "فشل في إعادة تعيين كلمة المرور. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="min-h-screen flex justify-center items-center p-6"
    >
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 space-y-6">
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
        <h2 className="text-2xl font-bold text-center text-primary">
          {language === "en" ? "Reset Password" : "إعادة تعيين كلمة المرور"}
        </h2>

        {step === "email" && (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <Input
              placeholder={
                language === "en" ? "Enter your email" : "أدخل بريدك الإلكتروني"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={!email || loading}>
              {loading
                ? language === "en"
                  ? "Sending..."
                  : "جارٍ الإرسال..."
                : language === "en"
                ? "Send reset link"
                : "إرسال رابط إعادة التعيين"}
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <Input
              placeholder={
                language === "en"
                  ? "Paste your reset code (oobCode)"
                  : "الصق رمز إعادة التعيين (oobCode)"
              }
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={!code || loading}>
              {loading
                ? language === "en"
                  ? "Verifying..."
                  : "جارٍ التحقق..."
                : language === "en"
                ? "Verify code"
                : "تحقق من الرمز"}
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <Input
              type="password"
              placeholder={
                language === "en"
                  ? "Enter new password"
                  : "أدخل كلمة المرور الجديدة"
              }
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={!newPassword || loading}>
              {loading
                ? language === "en"
                  ? "Saving..."
                  : "جارٍ الحفظ..."
                : language === "en"
                ? "Set new password"
                : "تعيين كلمة المرور الجديدة"}
            </Button>
          </form>
        )}

        {msg && <p className="bg-green-300 p-2 rounded-2xl text-white text-sm text-center">{msg}</p>}
        {error && <p className="bg-red-600 text-sm p-2 rounded-2xl text-white text-center">{error}</p>}
      </div>
    </div>
  );
}
