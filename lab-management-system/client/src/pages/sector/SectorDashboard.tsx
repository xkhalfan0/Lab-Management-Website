import { trpc } from "@/lib/trpc";
import { SectorLayout, useSectorAuth, useSectorLang } from "./SectorLayout";
import { Link } from "wouter";
import {
  TestTube2, FlaskConical, FileCheck2, Clock, CheckCircle2,
  AlertCircle, TrendingUp, ArrowLeft, ArrowRight,
} from "lucide-react";
import { Loader2 } from "lucide-react";

const t = {
  ar: {
    welcome: "مرحباً بك في بوابة القطاعات",
    overview: "نظرة عامة",
    totalSamples: "إجمالي العينات",
    pendingSamples: "قيد الفحص",
    completedSamples: "مكتملة",
    approvedResults: "نتائج معتمدة",
    unreadResults: "نتائج جديدة",
    unreadClearances: "براءات جديدة",
    viewResults: "عرض النتائج",
    viewSamples: "عرض العينات",
    viewClearances: "عرض براءات الذمة",
    quickLinks: "روابط سريعة",
    samples: "العينات المستلمة",
    results: "نتائج الاختبارات",
    clearances: "شهادة براءة الذمة",
    newBadge: "جديد",
    loading: "جاري التحميل...",
    noData: "لا توجد بيانات بعد",
    sectorPortal: "بوابة القطاعات",
    viewAll: "عرض الكل",
    arrow: "←",
  },
  en: {
    welcome: "Welcome to Sector Portal",
    overview: "Overview",
    totalSamples: "Total Samples",
    pendingSamples: "Under Testing",
    completedSamples: "Completed",
    approvedResults: "Approved Results",
    unreadResults: "New Results",
    unreadClearances: "New Clearances",
    viewResults: "View Results",
    viewSamples: "View Samples",
    viewClearances: "View Clearances",
    quickLinks: "Quick Links",
    samples: "Received Samples",
    results: "Test Results",
    clearances: "Clearances",
    newBadge: "New",
    loading: "Loading...",
    noData: "No data yet",
    sectorPortal: "Sector Portal",
    viewAll: "View All",
    arrow: "→",
  },
};

export default function SectorDashboard() {
  const { lang } = useSectorLang();
  const T = t[lang];
  const isRtl = lang === "ar";
  const { sector } = useSectorAuth();
  const sectorLabel = isRtl
    ? (sector?.nameAr ?? "")
    : (sector?.nameEn ?? "");
  const sectorTitle = isRtl
    ? `قسم المختبر - ${sectorLabel}`
    : `Lab Section - ${sectorLabel}`;

  const { data: stats, isLoading } = trpc.sector.getDashboardStats.useQuery();

  const statCards = [
    {
      label: T.totalSamples,
      value: stats?.totalSamples ?? 0,
      icon: TestTube2,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
    },
    {
      label: T.pendingSamples,
      value: stats?.pendingSamples ?? 0,
      icon: Clock,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    },
    {
      label: T.completedSamples,
      value: stats?.completedSamples ?? 0,
      icon: CheckCircle2,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
    },
    {
      label: T.approvedResults,
      value: stats?.approvedResults ?? 0,
      icon: FlaskConical,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
    },
  ];

  const quickLinks = [
    {
      href: "/sector/samples",
      label: T.samples,
      icon: TestTube2,
      color: "#3b82f6",
      badge: null,
    },
    {
      href: "/sector/results",
      label: T.results,
      icon: FlaskConical,
      color: "#8b5cf6",
      badge: stats?.unreadResults,
    },
    {
      href: "/sector/clearances",
      label: T.clearances,
      icon: FileCheck2,
      color: "#10b981",
      badge: stats?.unreadClearances,
    },
  ];

  return (
    <SectorLayout>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#3b82f6" }}>{sectorTitle}</p>
        <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>{T.welcome}</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>{T.overview}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#3b82f6" }} />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl p-5 bg-white"
                style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <TrendingUp className="w-4 h-4" style={{ color: "#94a3b8" }} />
                </div>
                <div className="text-3xl font-bold" style={{ color: "#1e293b" }}>{value}</div>
                <div className="text-sm mt-1" style={{ color: "#64748b" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Unread alerts */}
          {((stats?.unreadResults ?? 0) > 0 || (stats?.unreadClearances ?? 0) > 0) && (
            <div className="mb-6 rounded-2xl p-4 flex items-start gap-3"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "#dc2626" }}>
                  {isRtl ? "لديك تحديثات جديدة" : "You have new updates"}
                </p>
                <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                  {(stats?.unreadResults ?? 0) > 0 && (
                    <span>
                      {isRtl
                        ? `${stats!.unreadResults} نتيجة اختبار جديدة`
                        : `${stats!.unreadResults} new test result(s)`}
                      {(stats?.unreadClearances ?? 0) > 0 && " • "}
                    </span>
                  )}
                  {(stats?.unreadClearances ?? 0) > 0 && (
                    <span>
                      {isRtl
                        ? `${stats!.unreadClearances} براءة ذمة جديدة`
                        : `${stats!.unreadClearances} new clearance(s)`}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div>
            <h2 className="text-base font-semibold mb-3" style={{ color: "#374151" }}>{T.quickLinks}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {quickLinks.map(({ href, label, icon: Icon, color, badge }) => (
                <Link key={href} href={href}
                  className="group flex items-center justify-between p-5 rounded-2xl bg-white transition-all hover:shadow-md"
                  style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}18` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "#1e293b" }}>{label}</div>
                      {badge && badge > 0 ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-xs font-medium" style={{ color: "#ef4444" }}>
                            {badge} {T.newBadge}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{T.viewAll}</div>
                      )}
                    </div>
                  </div>
                  {isRtl
                    ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" style={{ color: "#94a3b8" }} />
                    : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: "#94a3b8" }} />
                  }
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </SectorLayout>
  );
}
