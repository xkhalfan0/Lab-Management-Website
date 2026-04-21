import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { SectorLayout, useSectorLang } from "./SectorLayout";
import { TestTube2, Search, ChevronLeft, ChevronRight, Calendar, Hash, Building2, X } from "lucide-react";
import { Loader2 } from "lucide-react";

const t = {
  ar: {
    title: "العينات المستلمة",
    subtitle: "جميع العينات المقدمة من قطاعكم",
    search: "بحث برمز العينة أو رقم العقد أو المقاول...",
    sampleCode: "رمز العينة",
    contractNumber: "رقم العقد",
    contractName: "اسم العقد",
    contractor: "المقاول",
    sampleType: "نوع العينة",
    status: "الحالة",
    receivedAt: "تاريخ الاستلام",
    noData: "لا توجد عينات بعد",
    prev: "السابق",
    next: "التالي",
    page: "صفحة",
    of: "من",
    total: "الإجمالي",
    allStatuses: "الكل",
    from: "من تاريخ",
    to: "إلى تاريخ",
    clearFilters: "مسح الفلاتر",
    filters: "فلترة",
    statuses: {
      received: "مستلمة",
      distributed: "موزعة",
      in_progress: "قيد الفحص",
      processed: "تم الاختبار",
      supervisor_review: "مراجعة نتائج الاختبارات",
      approved: "معتمدة",
      needs_revision: "تحتاج مراجعة",
      rejected: "مرفوضة",
      qc_review: "ضبط الجودة",
      qc_passed: "اجتازت الجودة",
      qc_failed: "رفضت الجودة",
      clearance_issued: "صدرت شهادة براءة الذمة",
    } as Record<string, string>,
  },
  en: {
    title: "Received Samples",
    subtitle: "All samples submitted by your sector",
    search: "Search by sample code, contract no., or contractor...",
    sampleCode: "Sample Code",
    contractNumber: "Contract No.",
    contractName: "Contract Name",
    contractor: "Contractor",
    sampleType: "Sample Type",
    status: "Status",
    receivedAt: "Received At",
    noData: "No samples yet",
    prev: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    total: "Total",
    allStatuses: "All",
    from: "From Date",
    to: "To Date",
    clearFilters: "Clear Filters",
    filters: "Filters",
    statuses: {
      received: "Received",
      distributed: "Distributed",
      in_progress: "In Progress",
      processed: "Tested",
      supervisor_review: "Test Results Review",
      approved: "Approved",
      needs_revision: "Needs Revision",
      rejected: "Rejected",
      qc_review: "Quality Control",
      qc_passed: "QC Passed",
      qc_failed: "QC Failed",
      clearance_issued: "Clearance Issued",
    } as Record<string, string>,
  },
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  received:          { bg: "rgba(59,130,246,0.1)",   text: "#2563eb",  border: "#bfdbfe" },
  distributed:       { bg: "rgba(245,158,11,0.1)",   text: "#d97706",  border: "#fde68a" },
  in_progress:       { bg: "rgba(139,92,246,0.1)",   text: "#7c3aed",  border: "#ddd6fe" },
  processed:         { bg: "rgba(99,102,241,0.1)",   text: "#4f46e5",  border: "#c7d2fe" },
  supervisor_review: { bg: "rgba(245,158,11,0.1)",   text: "#d97706",  border: "#fde68a" },
  approved:          { bg: "rgba(16,185,129,0.1)",   text: "#059669",  border: "#a7f3d0" },
  needs_revision:    { bg: "rgba(245,158,11,0.15)",  text: "#b45309",  border: "#fde68a" },
  rejected:          { bg: "rgba(239,68,68,0.1)",    text: "#dc2626",  border: "#fecaca" },
  qc_review:         { bg: "rgba(245,158,11,0.1)",   text: "#d97706",  border: "#fde68a" },
  qc_passed:         { bg: "rgba(16,185,129,0.1)",   text: "#059669",  border: "#a7f3d0" },
  qc_failed:         { bg: "rgba(239,68,68,0.1)",    text: "#dc2626",  border: "#fecaca" },
  clearance_issued:  { bg: "rgba(16,185,129,0.15)",  text: "#047857",  border: "#6ee7b7" },
};

export default function SectorSamples() {
  const { lang } = useSectorLang();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);
  const T = t[lang];
  const isRtl = lang === "ar";
  const limit = 15;

  const { data, isLoading } = trpc.sector.getSamples.useQuery({ page, limit });

  const allSamples = data?.samples ?? [];

  // Count per status
  const statusCounts: Record<string, number> = {};
  for (const s of allSamples) {
    const st = s.status ?? "received";
    statusCounts[st] = (statusCounts[st] ?? 0) + 1;
  }
  const uniqueStatuses = Array.from(new Set(allSamples.map(s => s.status).filter(Boolean)));

  const filtered = allSamples.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        s.sampleCode?.toLowerCase().includes(q) ||
        s.contractNumber?.toLowerCase().includes(q) ||
        s.contractName?.toLowerCase().includes(q) ||
        s.contractorName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter && s.status !== statusFilter) return false;
    if (dateFrom && s.receivedAt) {
      if (new Date(s.receivedAt) < new Date(dateFrom)) return false;
    }
    if (dateTo && s.receivedAt) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(s.receivedAt) > toDate) return false;
    }
    return true;
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);
  const hasDateFilters = dateFrom || dateTo;

  const clearFilters = () => {
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  return (
    <SectorLayout>
      {/* Header */}
      <div className="mb-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>{T.title}</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>{T.subtitle}</p>
        </div>

        {/* Search bar */}
        <div className="relative w-full mb-4">
          <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4" style={{
            color: "#94a3b8",
            [isRtl ? "right" : "left"]: "12px",
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={T.search}
            className="w-full py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              paddingInlineStart: "36px",
              paddingInlineEnd: "12px",
              color: "#1e293b",
            }}
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => { setStatusFilter(""); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: statusFilter === "" ? "#3b82f6" : "#fff",
              border: `1px solid ${statusFilter === "" ? "#3b82f6" : "#e2e8f0"}`,
              color: statusFilter === "" ? "#fff" : "#475569",
            }}>
            {T.allStatuses}
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: statusFilter === "" ? "rgba(255,255,255,0.25)" : "#f1f5f9", color: statusFilter === "" ? "#fff" : "#64748b" }}>
              {allSamples.length}
            </span>
          </button>
          {uniqueStatuses.map(st => {
            const sc = statusColors[st ?? "received"] ?? statusColors.received;
            const isActive = statusFilter === st;
            const count = statusCounts[st ?? ""] ?? 0;
            return (
              <button
                key={st}
                onClick={() => { setStatusFilter(st ?? ""); setPage(1); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: isActive ? sc.text : "#fff",
                  border: `1px solid ${isActive ? sc.text : sc.border}`,
                  color: isActive ? "#fff" : sc.text,
                }}>
                {T.statuses[st ?? ""] ?? st}
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: isActive ? "rgba(255,255,255,0.25)" : sc.bg, color: isActive ? "#fff" : sc.text }}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* Date filter toggle */}
          <button
            onClick={() => setShowDateFilters(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showDateFilters || hasDateFilters ? "#6366f1" : "#fff",
              border: `1px solid ${showDateFilters || hasDateFilters ? "#6366f1" : "#e2e8f0"}`,
              color: showDateFilters || hasDateFilters ? "#fff" : "#475569",
            }}>
            <Calendar className="w-3.5 h-3.5" />
            {T.from} / {T.to}
            {hasDateFilters && <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />}
          </button>

          {/* Clear all filters */}
          {(statusFilter || hasDateFilters || search) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" }}>
              <X className="w-3.5 h-3.5" />
              {T.clearFilters}
            </button>
          )}
        </div>

        {/* Date filter panel */}
        {showDateFilters && (
          <div className="rounded-xl p-4 mb-3 flex flex-wrap gap-4"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-medium" style={{ color: "#64748b" }}>{T.from}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="py-2 px-3 rounded-lg text-sm outline-none"
                style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#1e293b" }}
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-medium" style={{ color: "#64748b" }}>{T.to}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="py-2 px-3 rounded-lg text-sm outline-none"
                style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#1e293b" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl overflow-hidden bg-white"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#3b82f6" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <TestTube2 className="w-10 h-10" style={{ color: "#cbd5e1" }} />
            <p className="text-sm" style={{ color: "#94a3b8" }}>{T.noData}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={isRtl ? "rtl" : "ltr"}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {[T.sampleCode, T.contractNumber, T.contractName, T.contractor, T.sampleType, T.status, T.receivedAt].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold text-start" style={{ color: "#475569", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const sc = statusColors[s.status ?? "received"] ?? statusColors.received;
                  return (
                    <tr key={s.id}
                      style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td className="px-4 py-3 font-mono font-medium" style={{ color: "#1e293b" }}>
                        <div className="flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
                          {s.sampleCode}
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#475569" }}>{s.contractNumber ?? "—"}</td>
                      <td className="px-4 py-3 max-w-[180px] truncate" style={{ color: "#475569" }}>{s.contractName ?? "—"}</td>
                      <td className="px-4 py-3" style={{ color: "#475569" }}>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
                          {s.contractorName ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#475569" }}>{s.sampleType ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: sc.bg, color: sc.text }}>
                          {T.statuses[s.status ?? "received"] ?? s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748b" }}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
                          {s.receivedAt ? new Date(s.receivedAt).toLocaleDateString("en-US") : "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(data?.total ?? 0) > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#e2e8f0" }}>
            <span className="text-xs" style={{ color: "#64748b" }}>
              {T.total}: {data?.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: page === 1 ? "#f1f5f9" : "#fff",
                  border: "1px solid #e2e8f0",
                  color: page === 1 ? "#94a3b8" : "#475569",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}>
                {isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                {T.prev}
              </button>
              <span className="text-xs" style={{ color: "#64748b" }}>
                {T.page} {page} {T.of} {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: page >= totalPages ? "#f1f5f9" : "#fff",
                  border: "1px solid #e2e8f0",
                  color: page >= totalPages ? "#94a3b8" : "#475569",
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                }}>
                {T.next}
                {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </SectorLayout>
  );
}
