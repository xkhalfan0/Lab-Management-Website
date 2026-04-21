import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLanguage, formatDateForLang } from "@/contexts/LanguageContext";
import { SAMPLE_TYPE_LABELS, STATUS_LABELS, SampleStatus } from "@/lib/labTypes";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, LabelList,
} from "recharts";
import {
  CheckSquare, XCircle, Clock, TrendingUp, FlaskConical,
  AlertTriangle, CheckCircle2, FileText, BarChart2, Activity,
  Target, Award, Calendar, CalendarDays, Search, ArrowRight,
  PackageOpen, Beaker, ShieldCheck, Building2, CheckCircle,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  pass: "#22c55e",
  fail: "#ef4444",
  pending: "#f59e0b",
  approved: "#3b82f6",
  revision: "#f97316",
  rejected: "#dc2626",
  concrete: "#3b82f6",
  soil: "#f59e0b",
  steel: "#6b7280",
  asphalt: "#1f2937",
  aggregates: "#10b981",
};

const STATUS_COLORS: Record<string, string> = {
  received: "#3b82f6",
  distributed: "#8b5cf6",
  tested: "#f59e0b",
  processed: "#f97316",
  reviewed: "#6366f1",
  approved: "#14b8a6",
  qc_passed: "#22c55e",
  qc_failed: "#ef4444",
  clearance_issued: "#10b981",
  rejected: "#dc2626",
  revision_requested: "#d97706",
};

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  concrete:   { ar: "خرسانة",  en: "Concrete" },
  soil:       { ar: "تربة",    en: "Soil" },
  steel:      { ar: "حديد",    en: "Steel" },
  asphalt:    { ar: "أسفلت",   en: "Asphalt" },
  aggregates: { ar: "ركام",    en: "Aggregates" },
};

const SECTORS = [
  { value: "sector_1", ar: "قطاع/1", en: "Sector 1" },
  { value: "sector_2", ar: "قطاع/2", en: "Sector 2" },
  { value: "sector_3", ar: "قطاع/3", en: "Sector 3" },
  { value: "sector_4", ar: "قطاع/4", en: "Sector 4" },
  { value: "sector_5", ar: "قطاع/5", en: "Sector 5" },
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-foreground",
  borderColor = "border-l-slate-300",
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  borderColor?: string;
}) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <Icon className={`w-7 h-7 ${color} opacity-80`} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const { lang, t, dir } = useLanguage();
  const [, setLocation] = useLocation();

  // Date range for analytics (last 3 months)
  const [dateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Daily work filter
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [appliedFrom, setAppliedFrom] = useState(todayStr);
  const [appliedTo, setAppliedTo] = useState(todayStr);
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  const queryInput = useMemo(() => ({ dateFrom, dateTo }), [dateFrom, dateTo]);

  const { data: stats, isLoading: statsLoading } = trpc.analytics.testStats.useQuery(queryInput);
  const { data: samples, isLoading: samplesLoading } = trpc.samples.list.useQuery();
  const { data: sampleStats } = trpc.samples.stats.useQuery();
  const { data: dailyData, isLoading: dailyLoading } = trpc.samples.dailyWork.useQuery({
    fromDate: appliedFrom,
    toDate: appliedTo,
  });

  const now = new Date();

  // ─── Summary KPIs (old dashboard) ─────────────────────────────────────────
  const total = sampleStats?.total ?? 0;
  const active = samples?.filter(
    (s) => !["clearance_issued", "rejected", "qc_failed"].includes(s.status)
  ).length ?? 0;
  const completed = samples?.filter((s) => s.status === "clearance_issued").length ?? 0;
  const needsAction = samples?.filter(
    (s) => ["received", "processed", "approved", "revision_requested"].includes(s.status)
  ).length ?? 0;

  // ─── Supervisor KPIs ───────────────────────────────────────────────────────
  const pendingReviews = useMemo(() => {
    if (!samples) return 0;
    return samples.filter(s => s.status === "approved").length;
  }, [samples]);

  const pendingQC = useMemo(() => {
    if (!samples) return 0;
    return samples.filter(s => s.status === "qc_passed").length;
  }, [samples]);

  const awaitingApproval = useMemo(() => {
    if (!samples) return 0;
    return samples.filter(s => ["distributed", "testing"].includes(s.status)).length;
  }, [samples]);

  const passRate = stats?.summary
    ? Math.round((stats.summary.passed / Math.max(stats.summary.total, 1)) * 100)
    : 0;

  // ─── Chart data ────────────────────────────────────────────────────────────
  const statusChartData = sampleStats?.byStatus?.map((s) => ({
    name: t(`status.${s.status}`) !== `status.${s.status}` ? t(`status.${s.status}`) : (STATUS_LABELS[s.status as SampleStatus] ?? s.status),
    value: Number(s.count),
    fill: STATUS_COLORS[s.status] ?? "#94a3b8",
  })) ?? [];

  const typeChartData = sampleStats?.byType?.map((t2) => ({
    name: SAMPLE_TYPE_LABELS[t2.sampleType] ?? t2.sampleType,
    count: Number(t2.count),
  })) ?? [];

  const categoryPieData = useMemo(() => {
    return (stats?.byCategory ?? []).map(c => ({
      name: lang === "ar" ? (CATEGORY_LABELS[c.category]?.ar ?? c.category) : (CATEGORY_LABELS[c.category]?.en ?? c.category),
      value: c.count,
      pass: c.passed,
      fail: c.failed,
      color: COLORS[c.category as keyof typeof COLORS] ?? "#94a3b8",
    }));
  }, [stats?.byCategory, lang]);

  const monthlyData = useMemo(() => {
    return (stats?.byMonth ?? []).map(m => ({
      name: m.month.slice(5),
      count: m.count,
    }));
  }, [stats?.byMonth]);

  const topTests = useMemo(() => (stats?.byTestType ?? []).slice(0, 6), [stats?.byTestType]);

  // ─── Daily work ────────────────────────────────────────────────────────────
  function sectorLabel(val: string | null | undefined) {
    if (!val) return "—";
    const s = SECTORS.find(x => x.value === val);
    return s ? (lang === "ar" ? s.ar : s.en) : val;
  }

  const dailySamples = (sectorFilter === "all"
    ? dailyData?.samples
    : dailyData?.samples?.filter(s => (s as any).sector === sectorFilter)) ?? [];
  const dailySummary = dailyData?.summary;
  const isSingleDay = appliedFrom === appliedTo;

  const recentSamples = (sectorFilter === "all"
    ? samples?.slice(0, 8)
    : samples?.filter(s => (s as any).sector === sectorFilter).slice(0, 8)) ?? [];

  const periodLabel = isSingleDay && appliedFrom === todayStr()
    ? t("dashboard.todayWork")
    : isSingleDay
    ? `${t("dashboard.workOn")} ${new Date(appliedFrom).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", { day: "numeric", month: "short", year: "numeric" })}`
    : `${t("dashboard.workFrom")} ${new Date(appliedFrom).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", { day: "numeric", month: "short" })} ${lang === "ar" ? "إلى" : "to"} ${new Date(appliedTo).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", { day: "numeric", month: "short", year: "numeric" })}`;

  const handleApplyFilter = () => { setAppliedFrom(fromDate); setAppliedTo(toDate); };
  const handleTodayFilter = () => {
    const td = todayStr();
    setFromDate(td); setToDate(td); setAppliedFrom(td); setAppliedTo(td);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={dir}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t("app.subtitle")}</p>
          </div>
          {/* Date/Time Card */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3 shadow-sm">
              <Calendar className="w-6 h-6 text-primary shrink-0" />
              <div className={dir === "rtl" ? "text-right" : "text-left"}>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {formatDateForLang(now, lang)}
                </p>
                <p className="text-3xl font-extrabold text-primary tabular-nums mt-1 tracking-tight">
                  {now.toLocaleTimeString(lang === "ar" ? "ar-AE" : "en-AE", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.uaeTime")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Alerts ───────────────────────────────────────────────── */}
        {(pendingReviews > 0 || pendingQC > 0 || awaitingApproval > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {pendingReviews > 0 && (
              <button
                onClick={() => setLocation("/manager-review")}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors text-start"
              >
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    {pendingReviews} {lang === "ar" ? "نتيجة بانتظار مراجعتك" : "results awaiting review"}
                  </p>
                  <p className="text-xs text-amber-600">{lang === "ar" ? "انقر للمراجعة" : "Click to review"}</p>
                </div>
              </button>
            )}
            {pendingQC > 0 && (
              <button
                onClick={() => setLocation("/qc-review")}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors text-start"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FlaskConical className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-800">
                    {pendingQC} {lang === "ar" ? "عينة بانتظار ضبط الجودة" : "samples awaiting QC"}
                  </p>
                  <p className="text-xs text-blue-600">{lang === "ar" ? "انقر لضبط الجودة" : "Click for QC"}</p>
                </div>
              </button>
            )}
            {awaitingApproval > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 bg-slate-50">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Clock className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {awaitingApproval} {lang === "ar" ? "عينة قيد الفحص" : "samples under testing"}
                  </p>
                  <p className="text-xs text-slate-500">{lang === "ar" ? "موزعة على الفنيين" : "Distributed to technicians"}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Main KPI Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label={t("dashboard.totalSamples")} value={total} icon={FlaskConical} color="text-blue-500" borderColor="border-l-blue-500" />
          <KpiCard label={t("dashboard.active")} value={active} icon={Activity} color="text-orange-500" borderColor="border-l-orange-500" />
          <KpiCard label={t("dashboard.completed")} value={completed} icon={CheckCircle} color="text-green-500" borderColor="border-l-green-500" />
          <KpiCard label={t("dashboard.needsAction")} value={needsAction} icon={AlertTriangle} color="text-amber-500" borderColor="border-l-amber-500" />
        </div>

        {/* ── Supervisor KPIs ─────────────────────────────────────────────── */}
        {!statsLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label={lang === "ar" ? "إجمالي الاختبارات (3 أشهر)" : "Total Tests (3 months)"}
              value={stats?.summary.total ?? 0}
              icon={BarChart2}
              color="text-blue-600"
              borderColor="border-l-blue-400"
            />
            <KpiCard
              label={lang === "ar" ? "نجح" : "Passed"}
              value={stats?.summary.passed ?? 0}
              sub={`${passRate}% ${lang === "ar" ? "نسبة النجاح" : "pass rate"}`}
              icon={CheckCircle2}
              color="text-green-600"
              borderColor="border-l-green-400"
            />
            <KpiCard
              label={lang === "ar" ? "رسب" : "Failed"}
              value={stats?.summary.failed ?? 0}
              icon={XCircle}
              color="text-red-600"
              borderColor="border-l-red-400"
            />
            <KpiCard
              label={lang === "ar" ? "نسبة النجاح" : "Pass Rate"}
              value={`${passRate}%`}
              icon={Target}
              color={passRate >= 80 ? "text-green-600" : passRate >= 60 ? "text-amber-600" : "text-red-600"}
              borderColor={passRate >= 80 ? "border-l-green-500" : passRate >= 60 ? "border-l-amber-500" : "border-l-red-500"}
            />
          </div>
        )}

        {/* ── Quick Actions ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: CheckSquare, label: lang === "ar" ? "مراجعة النتائج" : "Review Results", sub: `${pendingReviews} ${lang === "ar" ? "بانتظار" : "pending"}`, path: "/manager-review", color: "text-blue-600", urgent: pendingReviews > 0 },
            { icon: ShieldCheck, label: lang === "ar" ? "ضبط الجودة" : "Quality Control", sub: `${pendingQC} ${lang === "ar" ? "بانتظار" : "pending"}`, path: "/qc-review", color: "text-purple-600", urgent: pendingQC > 0 },
            { icon: FileText, label: lang === "ar" ? "الإحصائيات" : "Analytics", sub: lang === "ar" ? "تقارير مفصلة" : "Detailed reports", path: "/analytics", color: "text-green-600", urgent: false },
            { icon: Award, label: lang === "ar" ? "شهادات براءة الذمة" : "Clearance Certs", sub: lang === "ar" ? "إصدار الشهادات" : "Issue certificates", path: "/clearance", color: "text-amber-600", urgent: false },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => setLocation(action.path)}
              className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                action.urgent
                  ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                  : "border-border bg-card hover:border-primary/30 hover:bg-accent/30"
              }`}
            >
              <div className={`p-2 rounded-lg ${action.urgent ? "bg-amber-100" : "bg-muted/50"}`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <div className="text-start">
                <p className="text-sm font-semibold">{action.label}</p>
                <p className={`text-xs ${action.urgent ? "text-amber-700 font-medium" : "text-muted-foreground"}`}>{action.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Sector Filter ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span className="font-medium">{lang === "ar" ? "فلتر القطاع:" : "Filter by Sector:"}</span>
          </span>
          <button
            onClick={() => setSectorFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              sectorFilter === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {lang === "ar" ? "الكل" : "All Sectors"}
          </button>
          {SECTORS.map(sec => (
            <button
              key={sec.value}
              onClick={() => setSectorFilter(sec.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                sectorFilter === sec.value
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-blue-400"
              }`}
            >
              {lang === "ar" ? sec.ar : sec.en}
            </button>
          ))}
        </div>

        {/* ── Daily Work Section ────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                {periodLabel}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={handleTodayFilter} className="text-xs h-8 px-3">
                  {t("dashboard.today")}
                </Button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{t("dashboard.from")}</span>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-8 text-xs w-36" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{t("dashboard.to")}</span>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-8 text-xs w-36" />
                </div>
                <Button size="sm" onClick={handleApplyFilter} className="h-8 px-3 text-xs gap-1">
                  <Search className="w-3.5 h-3.5" />
                  {t("dashboard.apply")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: t("dashboard.received"), value: dailySummary?.received ?? 0, icon: PackageOpen, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                { label: t("dashboard.distributed"), value: dailySummary?.distributed ?? 0, icon: ArrowRight, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
                { label: t("dashboard.processed"), value: dailySummary?.processed ?? 0, icon: Beaker, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
                { label: t("dashboard.approvedIssued"), value: dailySummary?.approved ?? 0, icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`rounded-lg p-3 ${bg} flex items-center gap-3`}>
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {dailyLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">{t("dashboard.loading")}</div>
            ) : dailySamples.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">{t("dashboard.noPeriodSamples")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {[t("table.num"), t("table.sampleId"), t("table.contractNo"), t("table.contractor"), t("table.type"), lang === "ar" ? "القطاع" : "Sector", t("table.qty"), t("table.status"), t("table.receivedAt")].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailySamples.map((sample, idx) => (
                      <tr key={sample.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/sample/${sample.id}`)}>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{sample.sampleCode}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{sample.contractNumber ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{sample.contractorName ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs capitalize">{SAMPLE_TYPE_LABELS[sample.sampleType]}</td>
                        <td className="px-4 py-2.5 text-xs">
                          {(sample as any).sector ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <Building2 className="w-3 h-3" />
                              {sectorLabel((sample as any).sector)}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs">{sample.quantity}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={sample.status} /></td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {new Date(sample.receivedAt).toLocaleString(lang === "ar" ? "ar-AE" : "en-AE", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Charts Row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Donut Chart - Samples by Status */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t("dashboard.samplesByStatus")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusChartData} cx="50%" cy="46%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                      {statusChartData.map((_: any, index: number) => (
                        <Cell key={index} fill={statusChartData[index].fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 12 }} />
                    <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={9} formatter={(value: any) => <span style={{ fontSize: 11, color: "#475569" }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">{t("dashboard.noData")}</div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart - Samples by Type */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                {t("dashboard.samplesByType")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {typeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={typeChartData} margin={{ top: 20, right: 10, left: -10, bottom: 8 }} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 12 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
                      {typeChartData.map((_: any, index: number) => (
                        <Cell key={index} fill={["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"][index % 6]} />
                      ))}
                      <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 600, fill: "#475569" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">{t("dashboard.noData")}</div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                {lang === "ar" ? "الاتجاه الشهري (3 أشهر)" : "Monthly Trend (3 months)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" name={lang === "ar" ? "اختبارات" : "Tests"} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                  {lang === "ar" ? "لا توجد بيانات" : "No data"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Pass/Fail by Category ───────────────────────────────────────── */}
        {categoryPieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {lang === "ar" ? "نسبة النجاح/الرسوب حسب الفئة" : "Pass/Fail Rate by Category"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {categoryPieData.map((cat, i) => {
                  const passR = cat.value > 0 ? Math.round((cat.pass / cat.value) * 100) : 0;
                  return (
                    <div key={i} className="border rounded-lg p-3 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <p className="text-xs font-semibold">{cat.name}</p>
                      </div>
                      <p className="text-xl font-bold" style={{ color: cat.color }}>{cat.value}</p>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${passR}%`, backgroundColor: COLORS.pass }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span className="text-green-600 font-medium">{cat.pass} ✓</span>
                        <span className="text-red-600 font-medium">{cat.fail} ✗</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Top Test Types ──────────────────────────────────────────────── */}
        {topTests.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {lang === "ar" ? "أكثر الاختبارات تكراراً" : "Most Frequent Tests"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start py-2 px-3 text-muted-foreground font-medium">{lang === "ar" ? "نوع الاختبار" : "Test Type"}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{lang === "ar" ? "الفئة" : "Category"}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{lang === "ar" ? "العدد" : "Count"}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{lang === "ar" ? "ناجح" : "Pass"}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{lang === "ar" ? "راسب" : "Fail"}</th>
                      <th className="text-end py-2 px-3 text-muted-foreground font-medium">{lang === "ar" ? "نسبة النجاح" : "Pass Rate"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTests.map((t2, i) => {
                      const pr = t2.count > 0 ? Math.round((t2.passed / t2.count) * 100) : 0;
                      const catLabel = CATEGORY_LABELS[t2.category];
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-3 font-medium">{lang === "ar" ? t2.nameAr || t2.nameEn : t2.nameEn}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant="outline" className="text-[10px]">
                              {lang === "ar" ? catLabel?.ar ?? t2.category : catLabel?.en ?? t2.category}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-center font-bold">{t2.count}</td>
                          <td className="py-2 px-3 text-center text-green-700 font-medium">{t2.passed}</td>
                          <td className="py-2 px-3 text-center text-red-700 font-medium">{t2.failed || "—"}</td>
                          <td className="py-2 px-3 text-end">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pr}%`, backgroundColor: pr >= 80 ? COLORS.pass : pr >= 60 ? COLORS.pending : COLORS.fail }} />
                              </div>
                              <span className={`font-bold ${pr >= 80 ? "text-green-600" : pr >= 60 ? "text-amber-600" : "text-red-600"}`}>{pr}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Recent Samples Table ──────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">{t("dashboard.recentSamples")}</CardTitle>
            <button onClick={() => setLocation("/reception")} className="text-xs text-primary hover:underline">
              {t("dashboard.viewAll")}
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {samplesLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">{t("dashboard.loading")}</div>
            ) : recentSamples.length === 0 ? (
              <div className="p-8 text-center">
                <FlaskConical className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">{t("dashboard.noSamples")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {[t("table.sampleId"), t("table.contractor"), t("table.type"), lang === "ar" ? "القطاع" : "Sector", t("table.contractNo"), t("table.status"), t("table.date")].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentSamples.map((sample) => (
                      <tr key={sample.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/sample/${sample.id}`)}>
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{sample.sampleCode}</td>
                        <td className="px-4 py-2.5 text-xs">{sample.contractorName ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs capitalize">{SAMPLE_TYPE_LABELS[sample.sampleType]}</td>
                        <td className="px-4 py-2.5 text-xs">
                          {(sample as any).sector ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <Building2 className="w-3 h-3" />
                              {sectorLabel((sample as any).sector)}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{sample.contractNumber ?? "—"}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={sample.status} /></td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(sample.receivedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
