import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Result = "pass" | "fail" | "pending";

interface PassFailBadgeProps {
  result: Result;
  value?: string | number;
  unit?: string;
  required?: string | number;
  className?: string;
  size?: "sm" | "md" | "lg";
  lang?: "ar" | "en";
}

export function PassFailBadge({
  result,
  value,
  unit,
  required,
  className,
  size = "md",
  lang = "ar",
}: PassFailBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-2 gap-2",
  };

  const iconSize = { sm: 12, md: 14, lg: 16 }[size];

  if (result === "pass") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full font-semibold",
          "bg-emerald-50 text-emerald-700 border border-emerald-200",
          sizeClasses[size],
          className
        )}
      >
        <CheckCircle2 size={iconSize} className="shrink-0" />
        <span>{lang === "ar" ? "مطابق" : "PASS"}</span>
        {value !== undefined && (
          <span className="font-mono opacity-80">
            {value}{unit ? ` ${unit}` : ""}
          </span>
        )}
      </span>
    );
  }

  if (result === "fail") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full font-semibold",
          "bg-red-50 text-red-700 border border-red-200",
          sizeClasses[size],
          className
        )}
      >
        <XCircle size={iconSize} className="shrink-0" />
        <span>{lang === "ar" ? "غير مطابق" : "FAIL"}</span>
        {value !== undefined && (
          <span className="font-mono opacity-80">
            {value}{unit ? ` ${unit}` : ""}
          </span>
        )}
        {required !== undefined && (
          <span className="opacity-60 text-xs">
            ({lang === "ar" ? "المطلوب" : "req"}: {required}{unit ? ` ${unit}` : ""})
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        "bg-slate-100 text-slate-500 border border-slate-200",
        sizeClasses[size],
        className
      )}
    >
      <MinusCircle size={iconSize} className="shrink-0" />
      <span>—</span>
    </span>
  );
}

// ─── Overall Result Banner ────────────────────────────────────────────────────
interface ResultBannerProps {
  result: Result;
  testName?: string;
  standard?: string;
  className?: string;
  lang?: "ar" | "en";
}

export function ResultBanner({ result, testName, standard, className, lang = "ar" }: ResultBannerProps) {
  if (result === "pass") {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-xl p-4",
        "bg-emerald-50 border-2 border-emerald-300",
        className
      )}>
        <CheckCircle2 className="text-emerald-600 shrink-0" size={28} />
        <div>
          <p className="font-bold text-emerald-800 text-lg">
            {lang === "ar" ? "مطابق — يستوفي متطلبات المواصفة" : "PASS — Complies with Specification"}
          </p>
          {(testName || standard) && (
            <p className="text-emerald-600 text-sm">
              {testName}{testName && standard ? " · " : ""}{standard}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (result === "fail") {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-xl p-4",
        "bg-red-50 border-2 border-red-300",
        className
      )}>
        <XCircle className="text-red-600 shrink-0" size={28} />
        <div>
          <p className="font-bold text-red-800 text-lg">
            {lang === "ar" ? "غير مطابق — لا يستوفي متطلبات المواصفة" : "FAIL — Does Not Comply with Specification"}
          </p>
          {(testName || standard) && (
            <p className="text-red-600 text-sm">
              {testName}{testName && standard ? " · " : ""}{standard}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl p-4",
      "bg-slate-50 border-2 border-slate-200",
      className
    )}>
      <MinusCircle className="text-slate-400 shrink-0" size={28} />
      <div>
        <p className="font-semibold text-slate-600 text-lg">
          {lang === "ar" ? "في انتظار النتائج" : "Awaiting Results"}
        </p>
        {(testName || standard) && (
          <p className="text-slate-400 text-sm">
            {testName}{testName && standard ? " · " : ""}{standard}
          </p>
        )}
      </div>
    </div>
  );
}
