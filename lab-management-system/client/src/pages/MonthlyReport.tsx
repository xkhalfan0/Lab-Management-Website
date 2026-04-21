import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import {
  ClipboardList, CheckCircle2, XCircle, Clock, Award,
  TrendingUp, Users, Printer, ChevronLeft, ChevronRight,
  FlaskConical, Timer, FileDown, Loader2,
} from "lucide-react";

// ─── Category labels ──────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  concrete:   { ar: "خرسانة",  en: "Concrete",   color: "#3b82f6" },
  soil:       { ar: "تربة",    en: "Soil",        color: "#f59e0b" },
  steel:      { ar: "حديد",    en: "Steel",       color: "#6b7280" },
  asphalt:    { ar: "أسفلت",   en: "Asphalt",     color: "#1f2937" },
  aggregates: { ar: "ركام",    en: "Aggregates",  color: "#10b981" },
};

const SAMPLE_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  concrete:   { ar: "خرسانة",  en: "Concrete" },
  soil:       { ar: "تربة",    en: "Soil" },
  steel:      { ar: "حديد",    en: "Steel" },
  asphalt:    { ar: "أسفلت",   en: "Asphalt" },
  aggregates: { ar: "ركام",    en: "Aggregates" },
  metal:      { ar: "معدن",    en: "Metal" },
};

const ARABIC_MONTHS = [
  "", "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];
const ENGLISH_MONTHS = [
  "", "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color = "blue",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "red" | "amber" | "purple" | "slate";
}) {
  const colorMap = {
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
    green:  "bg-green-50 text-green-700 border-green-200",
    red:    "bg-red-50 text-red-700 border-red-200",
    amber:  "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    slate:  "bg-slate-50 text-slate-700 border-slate-200",
  };
  const iconBg = {
    blue:   "bg-blue-100 text-blue-600",
    green:  "bg-green-100 text-green-600",
    red:    "bg-red-100 text-red-600",
    amber:  "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
    slate:  "bg-slate-100 text-slate-600",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${iconBg[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MonthlyReport() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const now = new Date();

  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, error } = trpc.reports.monthly.useQuery(
    { year, month },
    { retry: false }
  );

  const [pdfLang, setPdfLang] = useState<"ar" | "en">(lang as "ar" | "en");
  const exportPdf = trpc.reports.monthlyPdf.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
      toast.success(isAr ? "تم إنشاء التقرير" : "Report Generated", {
        description: isAr ? "تم فتح ملف PDF في نافذة جديدة" : "PDF opened in a new tab",
      });
    },
    onError: (err) => {
      toast.error(isAr ? "خطأ في إنشاء التقرير" : "Report Generation Failed", {
        description: err.message,
      });
    },
  });

  // ── Navigate months ──────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  // ── Chart data ───────────────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    if (!data?.testBreakdown) return [];
    const map: Record<string, number> = {};
    for (const t of data.testBreakdown) {
      const cat = t.category;
      map[cat] = (map[cat] ?? 0) + t.count;
    }
    return Object.entries(map).map(([cat, count]) => ({
      name: isAr ? (CATEGORY_LABELS[cat]?.ar ?? cat) : (CATEGORY_LABELS[cat]?.en ?? cat),
      count,
      color: CATEGORY_LABELS[cat]?.color ?? "#94a3b8",
    }));
  }, [data, isAr]);

  const sampleTypeData = useMemo(() => {
    if (!data?.bySampleType) return [];
    return data.bySampleType.map(({ type, count }) => ({
      name: isAr ? (SAMPLE_TYPE_LABELS[type]?.ar ?? type) : (SAMPLE_TYPE_LABELS[type]?.en ?? type),
      count,
    }));
  }, [data, isAr]);

  const monthLabel = isAr
    ? `${ARABIC_MONTHS[month]} ${year}`
    : `${ENGLISH_MONTHS[month]} ${year}`;

  return (
    <DashboardLayout>
      {/* ── Print Header (hidden on screen) ─────────────────────────────── */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-800 pb-4">
        <div className="text-center">
          <p className="text-xs text-slate-500">مختبر الإنشاءات والمواد الهندسية</p>
          <p className="text-xs text-slate-500">Construction Materials & Engineering Laboratory</p>
          <h1 className="text-xl font-bold text-slate-900 mt-2">
            {isAr ? `تقرير الأداء الشهري — ${monthLabel}` : `Monthly Performance Report — ${monthLabel}`}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? `تاريخ الطباعة: ${new Date().toLocaleDateString("ar-AE")}` : `Printed: ${new Date().toLocaleDateString("en-AE")}`}
          </p>
        </div>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAr ? "تقرير الأداء الشهري" : "Monthly Performance Report"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAr ? "إحصائيات وأداء المختبر خلال الشهر المحدد" : "Lab statistics and performance for the selected month"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language selector for PDF */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-md overflow-hidden text-xs">
            <button
              onClick={() => setPdfLang("ar")}
              className={`px-2 py-1.5 font-medium transition-colors ${
                pdfLang === "ar" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >AR</button>
            <button
              onClick={() => setPdfLang("en")}
              className={`px-2 py-1.5 font-medium transition-colors ${
                pdfLang === "en" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >EN</button>
          </div>
          <Button
            variant="default"
            size="sm"
            disabled={exportPdf.isPending}
            onClick={() => exportPdf.mutate({ year, month, lang: pdfLang })}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {exportPdf.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FileDown className="w-4 h-4" />}
            {isAr ? "تصدير PDF" : "Export PDF"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" />
            {isAr ? "طباعة" : "Print"}
          </Button>
        </div>
      </div>

      {/* ── Month Selector ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 mb-8 print:hidden">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        <div className="text-center min-w-[160px]">
          <p className="text-xl font-bold text-slate-900">{monthLabel}</p>
          {isCurrentMonth && (
            <Badge variant="secondary" className="text-xs mt-1">
              {isAr ? "الشهر الحالي" : "Current Month"}
            </Badge>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={nextMonth} disabled={isCurrentMonth}>
          {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* ── Print Month Label ─────────────────────────────────────────────── */}
      <div className="hidden print:flex justify-center mb-6">
        <span className="text-lg font-semibold text-slate-700">{monthLabel}</span>
      </div>

      {/* ── Loading / Error ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>{isAr ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {isAr ? "حدث خطأ أثناء تحميل البيانات." : "Error loading report data."}
        </div>
      )}

      {data && (
        <div className="space-y-8">

          {/* ── Section 1: Orders KPIs ─────────────────────────────────────── */}
          <section>
            <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              {isAr ? "الطلبات والأوامر" : "Orders Summary"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard
                icon={ClipboardList}
                label={isAr ? "إجمالي الطلبات" : "Total Orders"}
                value={data.orders.total}
                color="blue"
              />
              <StatCard
                icon={CheckCircle2}
                label={isAr ? "مكتملة" : "Completed"}
                value={data.orders.completed}
                color="green"
              />
              <StatCard
                icon={Award}
                label={isAr ? "اجتازت QC" : "QC Passed"}
                value={data.orders.qcPassed}
                color="purple"
              />
              <StatCard
                icon={Clock}
                label={isAr ? "قيد التنفيذ" : "In Progress"}
                value={data.orders.pending}
                color="amber"
              />
              <StatCard
                icon={XCircle}
                label={isAr ? "مرفوضة" : "Rejected"}
                value={data.orders.rejected}
                color="red"
              />
            </div>
          </section>

          {/* ── Section 2: Tests KPIs ─────────────────────────────────────── */}
          <section>
            <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-600" />
              {isAr ? "الاختبارات" : "Tests Summary"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={FlaskConical}
                label={isAr ? "إجمالي الاختبارات" : "Total Tests"}
                value={data.tests.total}
                color="blue"
              />
              <StatCard
                icon={CheckCircle2}
                label={isAr ? "ناجحة" : "Passed"}
                value={data.tests.passed}
                color="green"
              />
              <StatCard
                icon={XCircle}
                label={isAr ? "فاشلة" : "Failed"}
                value={data.tests.failed}
                color="red"
              />
              <StatCard
                icon={TrendingUp}
                label={isAr ? "نسبة النجاح" : "Pass Rate"}
                value={data.tests.passRate !== null ? `${data.tests.passRate}%` : "—"}
                color={
                  data.tests.passRate === null ? "slate"
                  : data.tests.passRate >= 80 ? "green"
                  : data.tests.passRate >= 60 ? "amber"
                  : "red"
                }
              />
            </div>
          </section>

          {/* ── Section 3: Clearance KPIs ─────────────────────────────────── */}
          <section>
            <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              {isAr ? "براءات الذمة" : "Clearance Certificates"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={Award}
                label={isAr ? "طلبات براءة الذمة" : "Clearance Requests"}
                value={data.clearances.total}
                color="purple"
              />
              <StatCard
                icon={CheckCircle2}
                label={isAr ? "شهادات صادرة" : "Certificates Issued"}
                value={data.clearances.issued}
                color="green"
              />
              <StatCard
                icon={Clock}
                label={isAr ? "قيد الإجراء" : "Pending"}
                value={data.clearances.pending}
                color="amber"
              />
              <StatCard
                icon={Timer}
                label={isAr ? "متوسط وقت الإنجاز" : "Avg. Turnaround"}
                value={
                  data.clearances.avgDays !== null
                    ? `${data.clearances.avgDays} ${isAr ? "يوم" : "days"}`
                    : "—"
                }
                sub={isAr ? "من إنشاء الطلب حتى إصدار الشهادة" : "From request to certificate"}
                color="blue"
              />
            </div>
          </section>

          {/* ── Section 4: Charts ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Tests by Category — Pie */}
            {categoryData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700">
                    {isAr ? "الاختبارات حسب الفئة" : "Tests by Category"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Orders by Sample Type — Bar */}
            {sampleTypeData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700">
                    {isAr ? "الطلبات حسب نوع العينة" : "Orders by Sample Type"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sampleTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<BarTooltip />} />
                      <Bar dataKey="count" name={isAr ? "عدد الطلبات" : "Orders"} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Section 5: Tests Breakdown Table ─────────────────────────── */}
          {data.testBreakdown.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-600" />
                {isAr ? "تفصيل الاختبارات حسب النوع" : "Tests Breakdown by Type"}
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-start px-4 py-3 font-semibold text-slate-600">
                            {isAr ? "نوع الاختبار" : "Test Type"}
                          </th>
                          <th className="text-start px-4 py-3 font-semibold text-slate-600">
                            {isAr ? "الفئة" : "Category"}
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-600">
                            {isAr ? "العدد" : "Count"}
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-600">
                            {isAr ? "ناجحة" : "Passed"}
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-600">
                            {isAr ? "فاشلة" : "Failed"}
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-600">
                            {isAr ? "نسبة النجاح" : "Pass Rate"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.testBreakdown.map((t, i) => {
                          const rate = t.count > 0 && (t.passed + t.failed) > 0
                            ? Math.round((t.passed / (t.passed + t.failed)) * 100)
                            : null;
                          const cat = CATEGORY_LABELS[t.category];
                          return (
                            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {isAr ? t.nameAr : t.nameEn}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  style={{ borderColor: cat?.color, color: cat?.color }}
                                  className="text-xs"
                                >
                                  {isAr ? cat?.ar : cat?.en}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-900">{t.count}</td>
                              <td className="px-4 py-3 text-center text-green-700 font-semibold">{t.passed || "—"}</td>
                              <td className="px-4 py-3 text-center text-red-600 font-semibold">{t.failed || "—"}</td>
                              <td className="px-4 py-3 text-center">
                                {rate !== null ? (
                                  <span className={`font-bold ${rate >= 80 ? "text-green-700" : rate >= 60 ? "text-amber-600" : "text-red-600"}`}>
                                    {rate}%
                                  </span>
                                ) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 font-bold text-slate-800">
                            {isAr ? "الإجمالي" : "Total"}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-900">{data.tests.total}</td>
                          <td className="px-4 py-3 text-center font-bold text-green-700">{data.tests.passed || "—"}</td>
                          <td className="px-4 py-3 text-center font-bold text-red-600">{data.tests.failed || "—"}</td>
                          <td className="px-4 py-3 text-center font-bold">
                            {data.tests.passRate !== null ? (
                              <span className={data.tests.passRate >= 80 ? "text-green-700" : data.tests.passRate >= 60 ? "text-amber-600" : "text-red-600"}>
                                {data.tests.passRate}%
                              </span>
                            ) : "—"}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Section 6: Technician Performance ────────────────────────── */}
          {data.technicianPerformance.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                {isAr ? "أداء الفنيين" : "Technician Performance"}
              </h2>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-start px-4 py-3 font-semibold text-slate-600">
                          {isAr ? "الفني" : "Technician"}
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">
                          {isAr ? "إجمالي الطلبات" : "Total Orders"}
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">
                          {isAr ? "مكتملة" : "Completed"}
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-600">
                          {isAr ? "نسبة الإنجاز" : "Completion Rate"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.technicianPerformance.map((tech, i) => {
                        const rate = tech.total > 0 ? Math.round((tech.completed / tech.total) * 100) : 0;
                        return (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">{tech.name}</td>
                            <td className="px-4 py-3 text-center text-slate-700">{tech.total}</td>
                            <td className="px-4 py-3 text-center text-green-700 font-semibold">{tech.completed}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${rate >= 80 ? "text-green-700" : rate >= 60 ? "text-amber-600" : "text-red-600"}`}>
                                  {rate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Empty State ───────────────────────────────────────────────── */}
          {data.orders.total === 0 && (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">
                {isAr ? "لا توجد بيانات لهذا الشهر" : "No data for this month"}
              </p>
              <p className="text-sm mt-1">
                {isAr ? "لم يتم تسجيل أي طلبات في هذه الفترة" : "No orders were registered in this period"}
              </p>
            </div>
          )}

        </div>
      )}

      {/* ── Print Styles ──────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .sidebar, nav, header, button, [data-print-hidden] { display: none !important; }
          body { background: white !important; }
          .card { break-inside: avoid; }
        }
      `}</style>
    </DashboardLayout>
  );
}
