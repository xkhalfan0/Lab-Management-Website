import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  FlaskConical, Clock, AlertTriangle, CheckCircle2, TrendingUp,
  TrendingDown, Minus, XCircle, Users, Activity, Zap, RefreshCw,
  ChevronRight, ArrowUpRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";

type Period = "today" | "week" | "month";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-slate-400 flex items-center gap-0.5"><Minus className="w-3 h-3" /> 0%</span>;
  if (value > 0) return <span className="text-xs text-emerald-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +{value}%</span>;
  return <span className="text-xs text-red-500 flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> {value}%</span>;
}

function SeverityDot({ severity }: { severity: "critical" | "warning" | "info" }) {
  const cls = severity === "critical" ? "bg-red-500" : severity === "warning" ? "bg-amber-400" : "bg-blue-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />;
}

const STATUS_LABELS: Record<string, string> = {
  received: "Received", distributed: "Distributed", tested: "Tested",
  processed: "Processed", reviewed: "Reviewed", approved: "Approved",
  qc_passed: "QC Passed", qc_failed: "QC Failed", clearance_issued: "Clearance Issued",
  rejected: "Rejected", revision_requested: "Revision",
};

const SECTOR_LABELS: Record<string, string> = {
  sector_1: "Sector 1", sector_2: "Sector 2", sector_3: "Sector 3",
  sector_4: "Sector 4", sector_5: "Sector 5",
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: number;
  subtitle?: string;
  critical?: boolean;
  loading?: boolean;
}

function KpiCard({ title, value, icon, color, bgColor, trend, subtitle, critical, loading }: KpiCardProps) {
  return (
    <Card className={`relative overflow-hidden border-0 shadow-sm ${critical && Number(value) > 0 ? "ring-2 ring-red-400" : ""}`}>
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${bgColor}`}>
                <div className={color}>{icon}</div>
              </div>
              {trend !== undefined && <TrendBadge value={trend} />}
            </div>
            <div className={`text-2xl font-bold ${critical && Number(value) > 0 ? "text-red-600" : "text-slate-800"}`}>
              {value}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{title}</div>
            {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("today");
  const [, navigate] = useLocation();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  // Data queries
  const [passRateView, setPassRateView] = useState<"contractor" | "contract">("contractor");
  const [passRatePeriod, setPassRatePeriod] = useState<"today" | "week" | "month" | "all">("all");

  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis } = trpc.dashboard.kpis.useQuery({ period });
  const { data: flow, isLoading: flowLoading } = trpc.dashboard.sampleFlow.useQuery({ days: period === "today" ? 7 : period === "week" ? 14 : 30 });
  const { data: statusDist, isLoading: distLoading } = trpc.dashboard.statusDistribution.useQuery({ period: period === "today" ? "today" : period === "week" ? "week" : "month" });
  const { data: sectorData, isLoading: sectorLoading } = trpc.dashboard.sectorWorkload.useQuery({ period });
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = trpc.dashboard.alerts.useQuery();
  const { data: team, isLoading: teamLoading } = trpc.dashboard.teamPerformance.useQuery({ period });
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.recentActivity.useQuery({ limit: 12 });
  const { data: passByContractor, isLoading: passContractorLoading } = trpc.dashboard.passRateByContractor.useQuery({ period: passRatePeriod });
  const { data: passByContract, isLoading: passContractLoading } = trpc.dashboard.passRateByContract.useQuery({ period: passRatePeriod });

  const criticalAlerts = useMemo(() => alerts?.filter(a => a.severity === "critical") ?? [], [alerts]);
  const warningAlerts = useMemo(() => alerts?.filter(a => a.severity === "warning") ?? [], [alerts]);

  const periodLabel = period === "today" ? (isAr ? "اليوم" : "Today") : period === "week" ? (isAr ? "هذا الأسبوع" : "This Week") : (isAr ? "هذا الشهر" : "This Month");

  function handleRefresh() {
    refetchKpis();
    refetchAlerts();
  }

  return (
    <DashboardLayout>
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{isAr ? "لوحة التحكم الرئيسية" : "Main Dashboard"}</h1>
          <p className="text-sm text-slate-500">{isAr ? "مختبر الإنشاءات والمواد الهندسية" : "Construction Materials & Engineering Laboratory"}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period filter */}
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            {(["today", "week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
              >
                {p === "today" ? (isAr ? "اليوم" : "Today") : p === "week" ? (isAr ? "الأسبوع" : "Week") : (isAr ? "الشهر" : "Month")}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* ── Quick Actions Bar ── */}
      <div className="flex flex-wrap gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
        <span className="text-xs font-semibold text-slate-500 self-center mr-1 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-blue-500" />
          {isAr ? "إجراءات سريعة:" : "Quick Actions:"}
        </span>
        {[
          { label: isAr ? "تسجيل عينة" : "Register Sample",    icon: <FlaskConical className="w-3.5 h-3.5" />, path: "/reception",       cls: "bg-blue-600 hover:bg-blue-700 text-white" },
          { label: isAr ? "توزيع عينة" : "Assign Sample",       icon: <ArrowUpRight  className="w-3.5 h-3.5" />, path: "/distribution",    cls: "bg-amber-500 hover:bg-amber-600 text-white" },
          { label: isAr ? "مراجعة المشرف" : "Supervisor Review", icon: <CheckCircle2  className="w-3.5 h-3.5" />, path: "/manager-review",  cls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
          { label: isAr ? "ضبط الجودة" : "QC Review",           icon: <Activity      className="w-3.5 h-3.5" />, path: "/qc-review",       cls: "bg-violet-600 hover:bg-violet-700 text-white" },
          { label: isAr ? "براءة الذمة" : "Clearance",           icon: <ChevronRight  className="w-3.5 h-3.5" />, path: "/clearance",       cls: "bg-teal-600 hover:bg-teal-700 text-white" },
          { label: isAr ? "إدارة المستخدمين" : "Users",          icon: <Users         className="w-3.5 h-3.5" />, path: "/users",           cls: "bg-slate-700 hover:bg-slate-800 text-white" },
        ].map((a) => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${a.cls}`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* ── Alert Banner ── */}
      {!alertsLoading && criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-700">
            {criticalAlerts.length} {isAr ? "تنبيه حرج يحتاج انتباهاً فورياً" : "critical alert(s) require immediate attention"}
          </span>
          <button className="ml-auto text-xs text-red-600 underline" onClick={() => document.getElementById("alerts-section")?.scrollIntoView({ behavior: "smooth" })}>
            {isAr ? "عرض" : "View"}
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
        <KpiCard
          title={isAr ? "إجمالي العينات" : "Total Samples"}
          value={kpis?.totalSamples.value ?? 0}
          icon={<FlaskConical className="w-4 h-4" />}
          color="text-blue-600" bgColor="bg-blue-50"
          trend={kpis?.totalSamples.trend}
          subtitle={isAr ? `مقارنة بـ ${periodLabel} السابق` : `vs prev ${periodLabel}`}
          loading={kpisLoading}
        />
        <KpiCard
          title={isAr ? "قيد التنفيذ" : "In Progress"}
          value={kpis?.inProgress.value ?? 0}
          icon={<Activity className="w-4 h-4" />}
          color="text-amber-600" bgColor="bg-amber-50"
          loading={kpisLoading}
        />
        <KpiCard
          title={isAr ? "متأخرة (SLA)" : "Overdue (SLA)"}
          value={kpis?.overdue.value ?? 0}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="text-red-600" bgColor="bg-red-50"
          critical
          loading={kpisLoading}
        />
        <KpiCard
          title={isAr ? "بانتظار التوزيع" : "Pending Distribution"}
          value={kpis?.pendingDistribution.value ?? 0}
          icon={<Clock className="w-4 h-4" />}
          color="text-orange-600" bgColor="bg-orange-50"
          loading={kpisLoading}
        />
        <KpiCard
          title={isAr ? "مكتملة" : "Completed"}
          value={kpis?.completed.value ?? 0}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="text-emerald-600" bgColor="bg-emerald-50"
          trend={kpis?.completed.trend}
          loading={kpisLoading}
        />
        <KpiCard
          title={isAr ? "متوسط وقت التسليم" : "Avg TAT"}
          value={kpis ? `${kpis.avgTAT.value}h` : "—"}
          icon={<Clock className="w-4 h-4" />}
          color="text-purple-600" bgColor="bg-purple-50"
          subtitle={isAr ? "ساعة" : "hours"}
          loading={kpisLoading}
        />
        <KpiCard
          title={isAr ? "مرفوضة / فاشلة" : "Failed / Rejected"}
          value={kpis?.failed.value ?? 0}
          icon={<XCircle className="w-4 h-4" />}
          color="text-rose-600" bgColor="bg-rose-50"
          trend={kpis?.failed.trend}
          critical={Number(kpis?.failed.value ?? 0) > 0}
          loading={kpisLoading}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-700">
              {isAr ? "تدفق العينات عبر الزمن" : "Sample Flow Over Time"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {flowLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={flow ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="received" stroke="#3b82f6" strokeWidth={2} dot={false} name={isAr ? "مستلمة" : "Received"} />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} name={isAr ? "مكتملة" : "Completed"} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-700">
              {isAr ? "توزيع الحالات" : "Status Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {distLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusDist ?? []} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {(statusDist ?? []).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v, n) => [v, isAr ? (statusDist?.find(s => s.name === n)?.nameAr ?? n) : n]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => isAr ? (statusDist?.find(s => s.name === v)?.nameAr ?? v) : v} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Sector Workload ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-slate-700">
            {isAr ? "عبء العمل حسب القطاع" : "Workload by Sector"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {sectorLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={sectorData ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="active" fill="#f59e0b" radius={[4, 4, 0, 0]} name={isAr ? "نشطة" : "Active"} />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name={isAr ? "مكتملة" : "Completed"} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Alerts + Team ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts Panel */}
        <Card id="alerts-section" className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              {isAr ? "يحتاج انتباهاً" : "Attention Required"}
              {alerts && alerts.length > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">{alerts.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {alertsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !alerts || alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400" />
                <p className="text-sm">{isAr ? "لا توجد تنبيهات" : "No alerts — all clear!"}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {alerts.map((alert) => (
                  <div
                    key={`${alert.sampleId}-${alert.issueType}`}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${
                      alert.severity === "critical" ? "bg-red-50 border border-red-100" : "bg-amber-50 border border-amber-100"
                    }`}
                    onClick={() => navigate(`/samples/${alert.sampleId}`)}
                  >
                    <SeverityDot severity={alert.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{alert.sampleCode}</span>
                        <span className="text-xs text-slate-500">{SECTOR_LABELS[alert.sector] ?? alert.sector}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {isAr ? alert.issueLabelAr : alert.issueLabel}
                      </p>
                      <p className="text-xs text-slate-400">{STATUS_LABELS[alert.status] ?? alert.status}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              {isAr ? "أداء الفريق" : "Team Performance"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {teamLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !team || team.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Users className="w-8 h-8 mb-2" />
                <p className="text-sm">{isAr ? "لا يوجد فنيون نشطون" : "No active technicians"}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <div className="grid grid-cols-4 text-xs font-medium text-slate-400 pb-1 border-b border-slate-100">
                  <span>{isAr ? "الاسم" : "Name"}</span>
                  <span className="text-center">{isAr ? "إجمالي" : "Total"}</span>
                  <span className="text-center">{isAr ? "مكتملة" : "Done"}</span>
                  <span className="text-center">{isAr ? "متوسط" : "Avg TAT"}</span>
                </div>
                {team.map((t) => (
                  <div key={t.id} className="grid grid-cols-4 text-xs py-1.5 border-b border-slate-50 last:border-0">
                    <span className="font-medium text-slate-700 truncate">{t.name}</span>
                    <span className="text-center text-slate-600">{t.samplesHandled}</span>
                    <span className="text-center text-emerald-600 font-medium">{t.completed}</span>
                    <span className="text-center text-slate-500">{t.avgTAT > 0 ? `${t.avgTAT}h` : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Activity ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            {isAr ? "النشاط الأخير" : "Recent Activity"}
          </CardTitle>
          <button className="text-xs text-blue-600 flex items-center gap-0.5 hover:underline" onClick={() => navigate("/audit-log")}>
            {isAr ? "عرض الكل" : "View all"} <ArrowUpRight className="w-3 h-3" />
          </button>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {activityLoading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : !activity || activity.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{isAr ? "لا يوجد نشاط حديث" : "No recent activity"}</p>
          ) : (
            <div className="space-y-0 divide-y divide-slate-50">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-700 font-medium">{item.action}</span>
                    {item.details && <span className="text-xs text-slate-400 ml-1">— {item.details}</span>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-500">{item.userName}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Pass Rate Section ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              {isAr ? "نسبة النجاح" : "Pass Rate"}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* View toggle */}
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setPassRateView("contractor")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    passRateView === "contractor" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {isAr ? "حسب المقاول" : "By Contractor"}
                </button>
                <button
                  onClick={() => setPassRateView("contract")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    passRateView === "contract" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {isAr ? "حسب العقد" : "By Contract"}
                </button>
              </div>
              {/* Period filter */}
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                {(["all", "month", "week", "today"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPassRatePeriod(p)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      passRatePeriod === p ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {p === "all" ? (isAr ? "الكل" : "All") : p === "month" ? (isAr ? "شهر" : "Month") : p === "week" ? (isAr ? "أسبوع" : "Week") : (isAr ? "يوم" : "Today")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {(passRateView === "contractor" ? passContractorLoading : passContractLoading) ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : passRateView === "contractor" ? (
            !passByContractor || passByContractor.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">{isAr ? "لا توجد بيانات كافية" : "No data available yet"}</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-5 text-xs font-medium text-slate-400 pb-1 border-b border-slate-100">
                  <span className="col-span-2">{isAr ? "المقاول" : "Contractor"}</span>
                  <span className="text-center">{isAr ? "إجمالي" : "Total"}</span>
                  <span className="text-center">{isAr ? "نجح" : "Passed"}</span>
                  <span className="text-center">{isAr ? "نسبة النجاح" : "Pass Rate"}</span>
                </div>
                {passByContractor.map((row) => (
                  <div key={row.name} className="grid grid-cols-5 text-xs py-2 border-b border-slate-50 last:border-0 items-center">
                    <span className="col-span-2 font-medium text-slate-700 truncate" title={row.name}>{row.name}</span>
                    <span className="text-center text-slate-600">{row.total}</span>
                    <span className="text-center text-emerald-600 font-medium">{row.passed}</span>
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="flex-1 max-w-16 bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            row.passRate >= 80 ? "bg-emerald-500" : row.passRate >= 60 ? "bg-amber-400" : "bg-red-400"
                          }`}
                          style={{ width: `${row.passRate}%` }}
                        />
                      </div>
                      <span className={`font-semibold ${
                        row.passRate >= 80 ? "text-emerald-600" : row.passRate >= 60 ? "text-amber-600" : "text-red-600"
                      }`}>{row.passRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            !passByContract || passByContract.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">{isAr ? "لا توجد بيانات كافية" : "No data available yet"}</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-6 text-xs font-medium text-slate-400 pb-1 border-b border-slate-100">
                  <span>{isAr ? "رقم العقد" : "Contract No."}</span>
                  <span className="col-span-2">{isAr ? "اسم العقد" : "Contract Name"}</span>
                  <span className="text-center">{isAr ? "إجمالي" : "Total"}</span>
                  <span className="text-center">{isAr ? "نجح" : "Passed"}</span>
                  <span className="text-center">{isAr ? "نسبة النجاح" : "Pass Rate"}</span>
                </div>
                {passByContract.map((row) => (
                  <div key={row.contractNumber} className="grid grid-cols-6 text-xs py-2 border-b border-slate-50 last:border-0 items-center">
                    <span className="font-mono text-slate-600 text-xs">{row.contractNumber}</span>
                    <span className="col-span-2 text-slate-700 truncate" title={row.contractName}>{row.contractName || row.contractorName || "—"}</span>
                    <span className="text-center text-slate-600">{row.total}</span>
                    <span className="text-center text-emerald-600 font-medium">{row.passed}</span>
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="flex-1 max-w-16 bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            row.passRate >= 80 ? "bg-emerald-500" : row.passRate >= 60 ? "bg-amber-400" : "bg-red-400"
                          }`}
                          style={{ width: `${row.passRate}%` }}
                        />
                      </div>
                      <span className={`font-semibold ${
                        row.passRate >= 80 ? "text-emerald-600" : row.passRate >= 60 ? "text-amber-600" : "text-red-600"
                      }`}>{row.passRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>


    </div>
    </DashboardLayout>
  );
}
