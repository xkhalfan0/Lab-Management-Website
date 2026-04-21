// Shared types for the lab management system

export type SampleStatus =
  | "received"
  | "distributed"
  | "tested"
  | "processed"
  | "reviewed"
  | "approved"
  | "qc_passed"
  | "qc_failed"
  | "clearance_issued"
  | "rejected"
  | "revision_requested";

export type UserRole =
  | "admin"
  | "reception"
  | "lab_manager"
  | "technician"
  | "sample_manager"
  | "qc_inspector"
  | "user";

export const STATUS_LABELS: Record<SampleStatus, string> = {
  received: "Received",
  distributed: "Distributed",
  tested: "Tested",
  processed: "Processed",
  reviewed: "Reviewed",
  approved: "Supervisor Approved",
  qc_passed: "QC Passed",
  qc_failed: "QC Failed",
  clearance_issued: "Clearance Issued",
  rejected: "Rejected",
  revision_requested: "Revision Requested",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  reception: "Reception Staff",
  lab_manager: "Supervisor",
  technician: "Technician",
  sample_manager: "Sample Manager",
  qc_inspector: "QC Inspector",
  user: "User",
};

export const SAMPLE_TYPE_LABELS: Record<string, string> = {
  concrete: "Concrete",
  soil: "Soil",
  metal: "Metal",
  asphalt: "Asphalt",
};

export const WORKFLOW_STAGES = [
  { key: "received", label: "Reception", labelAr: "الاستقبال", step: 1 },
  { key: "distributed", label: "Distribution", labelAr: "التوزيع", step: 2 },
  { key: "tested", label: "Testing", labelAr: "الاختبار", step: 3 },
  { key: "processed", label: "Processing", labelAr: "المعالجة", step: 4 },
  { key: "approved", label: "Supervisor Review", labelAr: "مراجعة المشرف", step: 5 },
  { key: "qc_passed", label: "QC Control", labelAr: "ضبط الجودة", step: 6 },
  { key: "clearance_issued", label: "Clearance", labelAr: "براءة الذمة", step: 7 },
];

export const STATUS_LABELS_AR: Record<SampleStatus, string> = {
  received: "مستلم",
  distributed: "موزع",
  tested: "تم الاختبار",
  processed: "قيد المعالجة",
  reviewed: "قيد المراجعة",
  approved: "معتمد من المشرف",
  qc_passed: "اجتاز ضبط الجودة",
  qc_failed: "رفض ضبط الجودة",
  clearance_issued: "صدرت براءة الذمة",
  rejected: "مرفوض",
  revision_requested: "طلب مراجعة",
};

export function getStatusStep(status: SampleStatus): number {
  const map: Partial<Record<SampleStatus, number>> = {
    received: 1,
    distributed: 2,
    tested: 3,
    processed: 4,
    reviewed: 5,
    approved: 5,
    qc_passed: 6,
    qc_failed: 6,
    clearance_issued: 7,
    rejected: 0,
    revision_requested: 0,
  };
  return map[status] ?? 0;
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};
