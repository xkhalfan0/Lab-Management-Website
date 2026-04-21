/**
 * Supervisor Dashboard — Simplified monitoring view
 * Shows essential KPIs, critical alerts, sector summary, and recent activity.
 * Access controlled by supervisor_dashboard permission (granted by admin).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  FlaskConical, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, XCircle, Activity,
  RefreshCw, ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";

type Period = "today" | "week" | "month";

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-slate-400 flex items-center gap-0.5"><Minus className="w-3 h-3" /> 0%</span>;
  if (value > 0) return <span className="text-xs text-emerald-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +{value}%</span>;
  return <span className="text-xs text-red-500 flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> {value}%</span>;
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

export default function SupervisorDashboard() {
  const [period, setPeriod] = useState<Period>("today");
  const [, navigate] = useLocation();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: kpis, isLoading: kpisLoading, refetch } = trpc.dashboard.kpis.useQuery({ period });
  const { data: alerts, isLoading: alertsLoading } = trpc.dashboard.alerts.useQuery();
  const { data: sectorData, isLoading: sectorLoading } = trpc.dashboard.sectorWorkload.useQuery({ period });
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.labActivity.useQuery({ limit: 15 });

  const criticalCount = alerts?.filter(a => a.severity === "critical").length ?? 0;

  return (
    <DashboardLayout>
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {isAr ? "لوحة المتابعة" : "Supervisor Dashboard"}
          </h1>
          <p className="text-sm text-slate-500">
            {isAr ? "متابعة العمليات اليومية" : "Daily operations monitoring"}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {!alertsLoading && criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-700">
            {criticalCount} {isAr ? "تنبيه حرج" : "critical alert(s)"}
          </span>
        </div>
      )}

      {/* KPI Cards — 4 essential ones */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            title: isAr ? "إجمالي العينات" : "Total Samples",
            value: kpis?.totalSamples.value ?? 0,
            icon: <FlaskConical className="w-4 h-4" />,
            color: "text-blue-600", bg: "bg-blue-50",
            trend: kpis?.totalSamples.trend,
          },
          {
            title: isAr ? "قيد التنفيذ" : "In Progress",
            value: kpis?.inProgress.value ?? 0,
            icon: <Activity className="w-4 h-4" />,
            color: "text-amber-600", bg: "bg-amber-50",
          },
          {
            title: isAr ? "مكتملة" : "Completed",
            value: kpis?.completed.value ?? 0,
            icon: <CheckCircle2 className="w-4 h-4" />,
            color: "text-emerald-600", bg: "bg-emerald-50",
            trend: kpis?.completed.trend,
          },
          {
            title: isAr ? "متأخرة" : "Overdue",
            value: kpis?.overdue.value ?? 0,
            icon: <AlertTriangle className="w-4 h-4" />,
            color: "text-red-600", bg: "bg-red-50",
            critical: true,
          },
        ].map((card, i) => (
          <Card key={i} className={`border-0 shadow-sm ${card.critical && Number(card.value) > 0 ? "ring-2 ring-red-300" : ""}`}>
            <CardContent className="p-4">
              {kpisLoading ? (
                <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-12" /></div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <div className={card.color}>{card.icon}</div>
                    </div>
                    {card.trend !== undefined && <TrendBadge value={card.trend} />}
                  </div>
                  <div className={`text-2xl font-bold ${card.critical && Number(card.value) > 0 ? "text-red-600" : "text-slate-800"}`}>
                    {card.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">{card.title}</div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sector Workload + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sector Bar */}
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
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name={isAr ? "إجمالي" : "Total"} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="border-0 shadow-sm">
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
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !alerts || alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <CheckCircle2 className="w-7 h-7 mb-2 text-emerald-400" />
                <p className="text-sm">{isAr ? "لا توجد تنبيهات" : "All clear!"}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {alerts.slice(0, 8).map((alert) => (
                  <div
                    key={`${alert.sampleId}-${alert.issueType}`}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:opacity-80 ${
                      alert.severity === "critical" ? "bg-red-50 border border-red-100" : "bg-amber-50 border border-amber-100"
                    }`}
                    onClick={() => navigate(`/samples/${alert.sampleId}`)}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.severity === "critical" ? "bg-red-500" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-700">{alert.sampleCode}</span>
                      <span className="text-xs text-slate-500 ml-2">{SECTOR_LABELS[alert.sector] ?? alert.sector}</span>
                      <p className="text-xs text-slate-500">{isAr ? alert.issueLabelAr : alert.issueLabel}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional KPIs row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">
                {kpisLoading ? "—" : `${kpis?.avgTAT.value ?? 0}h`}
              </div>
              <div className="text-xs text-slate-500">{isAr ? "متوسط وقت التسليم" : "Avg Turnaround Time"}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50">
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <div className={`text-xl font-bold ${Number(kpis?.failed.value ?? 0) > 0 ? "text-red-600" : "text-slate-800"}`}>
                {kpisLoading ? "—" : kpis?.failed.value ?? 0}
              </div>
              <div className="text-xs text-slate-500">{isAr ? "مرفوضة / فاشلة" : "Failed / Rejected"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            {isAr ? "النشاط الأخير" : "Recent Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {activityLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : !activity || activity.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{isAr ? "لا يوجد نشاط حديث" : "No recent activity"}</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {activity.map((item) => {
                const dotColor = item.severity === "success" ? "bg-emerald-400" : item.severity === "error" ? "bg-red-400" : item.severity === "warning" ? "bg-amber-400" : "bg-blue-400";
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-700 font-medium">{isAr ? item.typeAr : item.typeEn}</span>
                        <span className="text-xs font-mono text-blue-600">{item.sampleCode}</span>
                      </div>
                      <span className="text-xs text-slate-400 truncate block">{isAr ? item.detailsAr : item.details}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-slate-500">{item.actor}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
