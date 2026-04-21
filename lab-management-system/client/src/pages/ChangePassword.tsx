import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

const T = {
  ar: {
    title: "تغيير كلمة المرور",
    subtitle: "قم بتحديث كلمة المرور الخاصة بك بشكل دوري للحفاظ على أمان حسابك",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور الجديدة",
    currentPlaceholder: "أدخل كلمة المرور الحالية",
    newPlaceholder: "أدخل كلمة المرور الجديدة (6 أحرف على الأقل)",
    confirmPlaceholder: "أعد إدخال كلمة المرور الجديدة",
    submit: "تغيير كلمة المرور",
    submitting: "جارٍ التغيير...",
    successTitle: "تم التغيير بنجاح",
    successMsg: "تم تغيير كلمة المرور بنجاح. يُرجى استخدام كلمة المرور الجديدة في المرة القادمة.",
    errMismatch: "كلمة المرور الجديدة وتأكيدها غير متطابقَين",
    errMinLength: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل",
    errSameAsCurrent: "كلمة المرور الجديدة يجب أن تختلف عن الحالية",
    errIncorrect: "كلمة المرور الحالية غير صحيحة",
    errGeneric: "حدث خطأ أثناء تغيير كلمة المرور",
    tipTitle: "نصائح لكلمة مرور قوية",
    tip1: "استخدم 8 أحرف أو أكثر",
    tip2: "امزج بين الأحرف الكبيرة والصغيرة والأرقام",
    tip3: "تجنب المعلومات الشخصية كاسمك أو تاريخ ميلادك",
    tip4: "لا تستخدم نفس كلمة المرور في مواقع أخرى",
    strength: "قوة كلمة المرور:",
    strengthWeak: "ضعيفة",
    strengthFair: "مقبولة",
    strengthGood: "جيدة",
    strengthStrong: "قوية",
  },
  en: {
    title: "Change Password",
    subtitle: "Update your password regularly to keep your account secure",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    currentPlaceholder: "Enter your current password",
    newPlaceholder: "Enter new password (min. 6 characters)",
    confirmPlaceholder: "Re-enter your new password",
    submit: "Change Password",
    submitting: "Changing...",
    successTitle: "Password Changed",
    successMsg: "Your password has been changed successfully. Please use the new password next time you log in.",
    errMismatch: "New password and confirmation do not match",
    errMinLength: "New password must be at least 6 characters",
    errSameAsCurrent: "New password must be different from the current one",
    errIncorrect: "Current password is incorrect",
    errGeneric: "An error occurred while changing the password",
    tipTitle: "Tips for a strong password",
    tip1: "Use 8 or more characters",
    tip2: "Mix uppercase, lowercase letters and numbers",
    tip3: "Avoid personal information like your name or birthday",
    tip4: "Don't reuse passwords from other sites",
    strength: "Password strength:",
    strengthWeak: "Weak",
    strengthFair: "Fair",
    strengthGood: "Good",
    strengthStrong: "Strong",
  },
};

function getPasswordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length === 0) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 2;
  return 3;
}

export default function ChangePassword() {
  const { lang } = useLanguage();
  const t = T[lang];

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const changePassword = trpc.users.changePassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    },
    onError: (err) => {
      if (err.message.includes("incorrect") || err.message.includes("incorrect")) {
        setError(t.errIncorrect);
      } else {
        setError(err.message || t.errGeneric);
      }
    },
  });

  const strength = getPasswordStrength(newPassword);
  const strengthLabel = [t.strengthWeak, t.strengthWeak, t.strengthFair, t.strengthGood, t.strengthStrong][strength + 1] ?? "";
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"][strength] ?? "";
  const strengthWidth = ["0%", "25%", "50%", "75%", "100%"][strength];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError(t.errMinLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.errMismatch);
      return;
    }
    if (newPassword === currentPassword) {
      setError(t.errSameAsCurrent);
      return;
    }

    changePassword.mutate({ currentPassword, newPassword });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <KeyRound className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          {/* Form Card */}
          <Card className="md:col-span-3 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                {t.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {success && (
                <Alert className="mb-5 border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    <span className="font-semibold">{t.successTitle}.</span> {t.successMsg}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="mb-5 border-red-200 bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="current-password" className="text-sm font-medium">
                    {t.currentPassword} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t.currentPlaceholder}
                      required
                      className="pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    {t.newPassword} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t.newPlaceholder}
                      required
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {newPassword.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                            style={{ width: strengthWidth }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {t.strength} <span className="font-medium">{strengthLabel}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    {t.confirmPassword} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.confirmPlaceholder}
                      required
                      className={`pr-10 ${
                        confirmPassword && confirmPassword !== newPassword
                          ? "border-red-400 focus-visible:ring-red-400"
                          : confirmPassword && confirmPassword === newPassword
                          ? "border-green-400 focus-visible:ring-green-400"
                          : ""
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 mt-1">{t.errMismatch}</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {lang === "ar" ? "كلمتا المرور متطابقتان" : "Passwords match"}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
                >
                  {changePassword.isPending ? t.submitting : t.submit}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="md:col-span-2 shadow-sm h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t.tipTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[t.tip1, t.tip2, t.tip3, t.tip4].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
