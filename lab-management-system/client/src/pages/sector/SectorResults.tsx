import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { SectorLayout, useSectorLang } from "./SectorLayout";
import { FlaskConical, CheckCircle2, XCircle, Circle, ChevronLeft, ChevronRight, Eye, Search, X, Calendar } from "lucide-react";
import { Loader2 } from "lucide-react";

const t = {
  ar: {
    title: "نتائج الاختبارات",
    subtitle: "نتائج الاختبارات المعتمدة من قطاعكم",
    sampleCode: "رمز العينة",
    contractNumber: "رقم العقد",
    contractName: "اسم العقد",
    testType: "نوع الاختبار",
    result: "النتيجة",
    testedBy: "الفني",
    testDate: "تاريخ الفحص",
    status: "الحالة",
    noData: "لا توجد نتائج بعد",
    prev: "السابق",
    next: "التالي",
    page: "صفحة",
    of: "من",
    total: "الإجمالي",
    unread: "غير مقروء",
    read: "مقروء",
    pass: "ناجح",
    fail: "راسب",
    markRead: "تحديد كمقروء",
    unreadCount: "نتائج غير مقروءة",
    allRead: "تم قراءة جميع النتائج",
    search: "بحث برمز العينة أو رقم العقد أو نوع الاختبار...",
    clearFilters: "مسح الفلاتر",
    allResults: "الكل",
    from: "من تاريخ",
    to: "إلى تاريخ",
    unreadOnly: "غير مقروءة",
    readOnly: "مقروءة",
    passOnly: "ناجحة",
    failOnly: "راسبة",
  },
  en: {
    title: "Test Results",
    subtitle: "Approved test results for your sector",
    sampleCode: "Sample Code",
    contractNumber: "Contract No.",
    contractName: "Contract Name",
    testType: "Test Type",
    result: "Result",
    testedBy: "Technician",
    testDate: "Test Date",
    status: "Status",
    noData: "No results yet",
    prev: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    total: "Total",
    unread: "Unread",
    read: "Read",
    pass: "Pass",
    fail: "Fail",
    markRead: "Mark as read",
    unreadCount: "Unread results",
    allRead: "All results have been read",
    search: "Search by sample code, contract no., or test type...",
    clearFilters: "Clear Filters",
    allResults: "All",
    from: "From Date",
    to: "To Date",
    unreadOnly: "Unread",
    readOnly: "Read",
    passOnly: "Pass",
    failOnly: "Fail",
  },
};

export default function SectorResults() {
  const { lang } = useSectorLang();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState(""); // "pass" | "fail" | ""
  const [readFilter, setReadFilter] = useState(""); // "unread" | "read" | ""
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);
  const T = t[lang];
  const isRtl = lang === "ar";
  const limit = 15;

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.sector.getTestResults.useQuery({ page, limit });

  const markRead = trpc.sector.markResultRead.useMutation({
    onSuccess: () => {
      utils.sector.getTestResults.invalidate();
      utils.sector.getUnreadCount.invalidate();
      utils.sector.getDashboardStats.invalidate();
    },
  });

  const allResults = data?.results ?? [];

  // Counts for filter buttons
  const unreadCount = allResults.filter(r => !r.isRead).length;
  const readCount = allResults.filter(r => r.isRead).length;
  const passCount = allResults.filter(r => r.overallResult?.toLowerCase() === "pass" || r.overallResult === "ناجح").length;
  const failCount = allResults.filter(r => r.overallResult?.toLowerCase() === "fail" || r.overallResult === "راسب").length;

  const filtered = allResults.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        r.sampleCode?.toLowerCase().includes(q) ||
        r.contractNumber?.toLowerCase().includes(q) ||
        r.testType?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (resultFilter === "pass") {
      const isPass = r.overallResult?.toLowerCase() === "pass" || r.overallResult === "ناجح";
      if (!isPass) return false;
    }
    if (resultFilter === "fail") {
      const isFail = r.overallResult?.toLowerCase() === "fail" || r.overallResult === "راسب";
      if (!isFail) return false;
    }
    if (readFilter === "unread" && r.isRead) return false;
    if (readFilter === "read" && !r.isRead) return false;
    if (dateFrom && r.testDate) {
      if (new Date(r.testDate) < new Date(dateFrom)) return false;
    }
    if (dateTo && r.testDate) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(r.testDate) > toDate) return false;
    }
    return true;
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);
  const hasDateFilters = dateFrom || dateTo;
  const hasActiveFilters = resultFilter || readFilter || hasDateFilters || search;

  const clearFilters = () => {
    setResultFilter("");
    setReadFilter("");
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

        {/* Search */}
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

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* All */}
          <button
            onClick={() => { setResultFilter(""); setReadFilter(""); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: !resultFilter && !readFilter ? "#3b82f6" : "#fff",
              border: `1px solid ${!resultFilter && !readFilter ? "#3b82f6" : "#e2e8f0"}`,
              color: !resultFilter && !readFilter ? "#fff" : "#475569",
            }}>
            {T.allResults}
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: !resultFilter && !readFilter ? "rgba(255,255,255,0.25)" : "#f1f5f9", color: !resultFilter && !readFilter ? "#fff" : "#64748b" }}>
              {allResults.length}
            </span>
          </button>

          {/* Unread */}
          <button
            onClick={() => { setReadFilter(readFilter === "unread" ? "" : "unread"); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: readFilter === "unread" ? "#3b82f6" : "#fff",
              border: `1px solid ${readFilter === "unread" ? "#3b82f6" : "#bfdbfe"}`,
              color: readFilter === "unread" ? "#fff" : "#2563eb",
            }}>
            <Circle className="w-3 h-3 fill-blue-500" style={{ color: "#3b82f6" }} />
            {T.unreadOnly}
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: readFilter === "unread" ? "rgba(255,255,255,0.25)" : "rgba(59,130,246,0.1)", color: readFilter === "unread" ? "#fff" : "#2563eb" }}>
              {unreadCount}
            </span>
          </button>

          {/* Read */}
          <button
            onClick={() => { setReadFilter(readFilter === "read" ? "" : "read"); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: readFilter === "read" ? "#64748b" : "#fff",
              border: `1px solid ${readFilter === "read" ? "#64748b" : "#e2e8f0"}`,
              color: readFilter === "read" ? "#fff" : "#64748b",
            }}>
            <Eye className="w-3.5 h-3.5" />
            {T.readOnly}
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: readFilter === "read" ? "rgba(255,255,255,0.25)" : "#f1f5f9", color: readFilter === "read" ? "#fff" : "#64748b" }}>
              {readCount}
            </span>
          </button>

          {/* Pass */}
          <button
            onClick={() => { setResultFilter(resultFilter === "pass" ? "" : "pass"); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: resultFilter === "pass" ? "#059669" : "#fff",
              border: `1px solid ${resultFilter === "pass" ? "#059669" : "#a7f3d0"}`,
              color: resultFilter === "pass" ? "#fff" : "#059669",
            }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {T.passOnly}
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: resultFilter === "pass" ? "rgba(255,255,255,0.25)" : "rgba(16,185,129,0.1)", color: resultFilter === "pass" ? "#fff" : "#059669" }}>
              {passCount}
            </span>
          </button>

          {/* Fail */}
          <button
            onClick={() => { setResultFilter(resultFilter === "fail" ? "" : "fail"); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: resultFilter === "fail" ? "#dc2626" : "#fff",
              border: `1px solid ${resultFilter === "fail" ? "#dc2626" : "#fecaca"}`,
              color: resultFilter === "fail" ? "#fff" : "#dc2626",
            }}>
            <XCircle className="w-3.5 h-3.5" />
            {T.failOnly}
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: resultFilter === "fail" ? "rgba(255,255,255,0.25)" : "rgba(239,68,68,0.1)", color: resultFilter === "fail" ? "#fff" : "#dc2626" }}>
              {failCount}
            </span>
          </button>

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

          {/* Clear all */}
          {hasActiveFilters && (
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
            <FlaskConical className="w-10 h-10" style={{ color: "#cbd5e1" }} />
            <p className="text-sm" style={{ color: "#94a3b8" }}>{T.noData}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={isRtl ? "rtl" : "ltr"}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th className="px-4 py-3 font-semibold text-start w-4" style={{ color: "#475569" }}></th>
                  {[T.sampleCode, T.contractNumber, T.testType, T.result, T.testedBy, T.testDate, ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold text-start" style={{ color: "#475569", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const isPass = r.overallResult?.toLowerCase() === "pass" || r.overallResult === "ناجح";
                  const isFail = r.overallResult?.toLowerCase() === "fail" || r.overallResult === "راسب";
                  return (
                    <tr key={r.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: !r.isRead
                          ? "rgba(59,130,246,0.04)"
                          : i % 2 === 0 ? "#fff" : "#fafafa",
                      }}>
                      <td className="px-3 py-3">
                        {!r.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto" />}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium" style={{ color: "#1e293b" }}>
                        {r.sampleCode}
                        {!r.isRead && (
                          <span className="ms-2 px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{ background: "rgba(59,130,246,0.1)", color: "#2563eb" }}>
                            {T.unread}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#475569" }}>{r.contractNumber ?? "—"}</td>
                      <td className="px-4 py-3" style={{ color: "#475569" }}>{r.testType ?? "—"}</td>
                      <td className="px-4 py-3">
                        {r.overallResult ? (
                          <span className="flex items-center gap-1.5 font-medium"
                            style={{ color: isPass ? "#059669" : isFail ? "#dc2626" : "#475569" }}>
                            {isPass && <CheckCircle2 className="w-4 h-4" />}
                            {isFail && <XCircle className="w-4 h-4" />}
                            {isPass ? T.pass : isFail ? T.fail : r.overallResult}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#475569" }}>{r.testedBy ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748b" }}>
                        {r.testDate ? new Date(r.testDate).toLocaleDateString(isRtl ? "ar-AE" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {!r.isRead && (
                          <button
                            onClick={() => markRead.mutate({ resultId: r.id })}
                            disabled={markRead.isPending}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: "rgba(59,130,246,0.08)",
                              border: "1px solid rgba(59,130,246,0.2)",
                              color: "#2563eb",
                              cursor: "pointer",
                            }}>
                            <Eye className="w-3.5 h-3.5" />
                            {T.markRead}
                          </button>
                        )}
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
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
