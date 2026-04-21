import { SampleStatus, STATUS_LABELS } from "@/lib/labTypes";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatusBadgeProps {
  status: SampleStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { t } = useLanguage();
  const translationKey = `status.${status}`;
  const translated = t(translationKey);
  // If translation key not found, fall back to STATUS_LABELS or raw status
  const label = translated !== translationKey ? translated : (STATUS_LABELS[status as SampleStatus] ?? status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${status} ${className}`}
    >
      {label}
    </span>
  );
}
