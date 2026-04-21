import { SampleStatus, WORKFLOW_STAGES, getStatusStep } from "@/lib/labTypes";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WorkflowProgressProps {
  status: SampleStatus;
}

export function WorkflowProgress({ status }: WorkflowProgressProps) {
  const { lang } = useLanguage();
  const currentStep = getStatusStep(status);
  const isRejected = status === "rejected" || status === "qc_failed";
  const isRevision = status === "revision_requested";
  const isRTL = lang === "ar";
  const totalSteps = WORKFLOW_STAGES.length;

  // For RTL, reverse stages so they display right-to-left visually
  const stages = isRTL ? [...WORKFLOW_STAGES].reverse() : WORKFLOW_STAGES;
  const progressPct = Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="w-full" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between relative">
        {/* Background line */}
        <div className="absolute top-4 start-0 end-0 h-0.5 bg-gray-200 z-0" />
        {/* Progress line — for RTL starts from right */}
        <div
          className="absolute top-4 h-0.5 bg-blue-600 z-0 transition-all duration-500"
          style={isRTL
            ? { right: 0, width: `${progressPct}%` }
            : { left: 0, width: `${progressPct}%` }
          }
        />
        {stages.map((stage) => {
          const isDone = currentStep > stage.step;
          const isCurrent = currentStep === stage.step;
          const isFailed = isRejected && isCurrent;
          const label = isRTL ? (stage as any).labelAr ?? stage.label : stage.label;

          return (
            <div key={stage.key} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                  ${isDone ? "bg-blue-600 border-blue-600 text-white" : ""}
                  ${isCurrent && !isFailed ? "bg-white border-blue-600 text-blue-600" : ""}
                  ${isFailed ? "bg-red-100 border-red-500 text-red-500" : ""}
                  ${!isDone && !isCurrent ? "bg-white border-gray-300 text-gray-400" : ""}
                `}
              >
                {isDone ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isFailed ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-bold">{stage.step}</span>
                )}
              </div>
              <span
                className={`mt-1 text-xs text-center leading-tight max-w-[64px]
                  ${isDone ? "text-blue-600 font-medium" : ""}
                  ${isCurrent && !isFailed ? "text-blue-700 font-semibold" : ""}
                  ${isFailed ? "text-red-500" : ""}
                  ${!isDone && !isCurrent ? "text-gray-400" : ""}
                `}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      {(isRejected || isRevision) && (
        <div className={`mt-3 text-xs text-center font-medium ${isRejected ? "text-red-600" : "text-amber-600"}`}>
          {isRejected
            ? (isRTL ? "تم رفض العينة" : "Sample Rejected")
            : (isRTL ? "طلب مراجعة — أُعيدت إلى الفني" : "Revision Requested — Returned to Technician")}
        </div>
      )}
    </div>
  );
}
