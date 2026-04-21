import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell, CheckCheck, FlaskConical, ClipboardCheck,
  FileText, ShieldCheck, CreditCard, AlertTriangle, Package,
  Clock, Filter, Info
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useSSENotifications } from "@/hooks/useSSENotifications";

// ─── Type → icon mapping ──────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, React.ReactNode> = {
  new_sample:              <Package size={16} className="text-blue-500" />,
  sample_received:         <FlaskConical size={16} className="text-blue-500" />,
  result_issued:           <FileText size={16} className="text-green-500" />,
  qc_passed:               <ShieldCheck size={16} className="text-emerald-500" />,
  clearance_started:       <ClipboardCheck size={16} className="text-amber-500" />,
  clearance_qc_approved:   <ShieldCheck size={16} className="text-emerald-600" />,
  clearance_issued:        <FileText size={16} className="text-purple-500" />,
  action_required:         <AlertTriangle size={16} className="text-orange-500" />,
  revision:                <AlertTriangle size={16} className="text-red-500" />,
  payment:                 <CreditCard size={16} className="text-indigo-500" />,
  info:                    <Info size={16} className="text-gray-400" />,
};

// ─── Color system ─────────────────────────────────────────────────────────────
// 🔵 Blue  = new / unread  (isRead=false)
// 🟠 Orange = opened but no action yet (isRead=true, not info type)
// ⚫ Gray  = informational / done (type="info")
function getRowClass(n: { isRead?: boolean | null; type?: string | null }) {
  if (n.type === "info") return "border-l-4 border-l-gray-300 bg-gray-50/50 dark:bg-gray-800/20";
  if (!n.isRead)         return "border-l-4 border-l-blue-500 bg-blue-50/60 dark:bg-blue-900/20";
  return                        "border-l-4 border-l-orange-400 bg-orange-50/40 dark:bg-orange-900/10";
}

function getStatusBadge(n: { isRead?: boolean | null; type?: string | null }, lang: string) {
  if (n.type === "info")
    return <Badge variant="secondary" className="text-[10px] h-5">{lang === "ar" ? "معلوماتي" : "Info"}</Badge>;
  if (!n.isRead)
    return <Badge className="text-[10px] h-5 bg-blue-500 hover:bg-blue-500">{lang === "ar" ? "جديد" : "New"}</Badge>;
  return <Badge variant="outline" className="text-[10px] h-5 border-orange-400 text-orange-500">{lang === "ar" ? "مفتوح" : "Opened"}</Badge>;
}

function timeAgo(date: Date | string | null | undefined, lang: string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "ar" ? "الآن" : "Just now";
  if (mins < 60) return lang === "ar" ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === "ar" ? `منذ ${hrs} ساعة` : `${hrs}h ago`;
  return lang === "ar" ? `منذ ${Math.floor(hrs / 24)} يوم` : `${Math.floor(hrs / 24)}d ago`;
}

const FILTER_OPTIONS = [
  { key: "all",    labelAr: "الكل",         labelEn: "All" },
  { key: "unread", labelAr: "جديد",          labelEn: "New" },
  { key: "read",   labelAr: "مفتوح",         labelEn: "Opened" },
  { key: "info",   labelAr: "معلوماتي",      labelEn: "Info" },
];

export default function Notifications() {
  const { lang } = useLanguage();
  const [filter, setFilter] = useState("all");

  const { data: notifs = [], refetch } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const markRead    = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم تحديد الكل كمقروء" : "All marked as read");
      refetch();
    },
  });

  // Real-time SSE
  useSSENotifications({ onNew: () => refetch() });

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const filtered = notifs.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read")   return n.isRead && n.type !== "info";
    if (filter === "info")   return n.type === "info";
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="text-primary" size={22} />
            <div>
              <h1 className="text-xl font-bold">{lang === "ar" ? "التنبيهات" : "Notifications"}</h1>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? lang === "ar" ? `${unreadCount} تنبيه جديد` : `${unreadCount} new`
                  : lang === "ar" ? "جميع التنبيهات مقروءة" : "All caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck size={14} />
              {lang === "ar" ? "تحديد الكل كمقروء" : "Mark all as read"}
            </Button>
          )}
        </div>

        {/* Color legend */}
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Filter size={12} />
            {lang === "ar" ? "دليل الألوان" : "Color Guide"}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-xs">{lang === "ar" ? "جديد — لم يُفتح بعد" : "New — not yet opened"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-400 flex-shrink-0" />
              <span className="text-xs">{lang === "ar" ? "مفتوح — بانتظار اتخاذ إجراء" : "Opened — awaiting action"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
              <span className="text-xs">{lang === "ar" ? "معلوماتي — لا يتطلب إجراء" : "Info — no action needed"}</span>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filter === opt.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {lang === "ar" ? opt.labelAr : opt.labelEn}
              {opt.key === "unread" && unreadCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[9px]">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Bell size={36} className="opacity-20" />
                <p className="text-sm">{lang === "ar" ? "لا توجد تنبيهات" : "No notifications"}</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                {filtered.map((n) => {
                  const icon = TYPE_ICONS[(n as any).notificationType ?? n.type ?? "info"] ?? <Bell size={16} className="text-muted-foreground" />;
                  return (
                    <li
                      key={n.id}
                      className={`px-4 py-3 cursor-pointer hover:brightness-95 transition-all rounded-none first:rounded-t-xl last:rounded-b-xl ${getRowClass(n)}`}
                      onClick={() => { if (!n.isRead) markRead.mutate({ id: n.id }); }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">{icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                            <p className={`text-sm truncate ${!n.isRead ? "font-semibold" : "font-normal"}`}>{n.title}</p>
                            {getStatusBadge(n, lang)}
                          </div>
                          {n.message && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 mt-1.5 flex items-center gap-1">
                            <Clock size={9} />
                            {timeAgo(n.createdAt, lang)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs shrink-0 text-muted-foreground"
                            onClick={(e) => { e.stopPropagation(); markRead.mutate({ id: n.id }); }}
                          >
                            {lang === "ar" ? "تحديد كمقروء" : "Mark read"}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
