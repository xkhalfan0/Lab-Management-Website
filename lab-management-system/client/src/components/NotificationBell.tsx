import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, X, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSSENotifications } from "@/hooks/useSSENotifications";
import { useLocation } from "wouter";
import { toast } from "sonner";

// ─── Color system ─────────────────────────────────────────────────────────────
// 🔵 Blue  = new / unread  (isRead=false, no action taken)
// 🟠 Orange = opened but no action yet (isRead=true, actionTaken=false)
// ⚫ Gray  = done / action taken
//
// Since we don't have a separate "actionTaken" field, we use:
//   isRead=false → blue (new)
//   isRead=true  → orange (opened, awaiting action) — unless type="info" → gray
//   type="info"  → gray (informational, no action needed)

type Notif = {
  id: number;
  title: string;
  message: string;
  type?: string | null;
  notificationType?: string | null;
  isRead?: boolean | null;
  createdAt?: Date | string | null;
};

function getColorClass(n: Notif) {
  if (n.type === "info") return "border-l-gray-400 bg-gray-50 dark:bg-gray-800/40";
  if (!n.isRead) return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
  return "border-l-orange-400 bg-orange-50 dark:bg-orange-900/20";
}

function getDotClass(n: Notif) {
  if (n.type === "info") return "bg-gray-400";
  if (!n.isRead) return "bg-blue-500 animate-pulse";
  return "bg-orange-400";
}

function getIcon(n: Notif) {
  if (n.type === "info") return <Info size={14} className="text-gray-400" />;
  if (!n.isRead) return <Bell size={14} className="text-blue-500" />;
  if (n.type === "action_required") return <AlertTriangle size={14} className="text-orange-500" />;
  return <CheckCircle size={14} className="text-green-500" />;
}

function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} س`;
  return `منذ ${Math.floor(hrs / 24)} ي`;
}

interface Props {
  isAr?: boolean;
}

export default function NotificationBell({ isAr = true }: Props) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const { data: notifications = [], refetch } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 60000, // fallback polling every 60s
  });

  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });
  const markAll = trpc.notifications.markAllRead.useMutation({ onSuccess: () => refetch() });

  // SSE: real-time updates
  useSSENotifications({
    onNew: (n) => {
      toast(n.title, {
        description: n.message.length > 80 ? n.message.slice(0, 80) + "…" : n.message,
        duration: 5000,
      });
    },
  });

  const unread = notifications.filter((n) => !n.isRead).length;
  const recent = notifications.slice(0, 8);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const handleNotifClick = (n: Notif) => {
    if (!n.isRead) markRead.mutate({ id: n.id });
    setOpen(false);
    navigate("/notifications");
  };

  return (
    <div className="relative" ref={dropRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="التنبيهات"
      >
        <Bell size={20} className="text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="fixed w-80 max-h-[480px] overflow-y-auto rounded-xl border border-border bg-background shadow-2xl"
          style={{
            zIndex: 9999,
            top: dropRef.current ? dropRef.current.getBoundingClientRect().bottom + 8 : 60,
            ...(isAr
              ? { right: dropRef.current ? window.innerWidth - dropRef.current.getBoundingClientRect().right : 16 }
              : { left: dropRef.current ? dropRef.current.getBoundingClientRect().left : 16 }),
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
            <span className="font-semibold text-sm">{isAr ? "التنبيهات" : "Notifications"}</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  title={isAr ? "تحديد الكل كمقروء" : "Mark all as read"}
                >
                  <CheckCheck size={14} />
                  {isAr ? "الكل مقروء" : "Mark all"}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Color legend */}
          <div className="px-4 py-2 border-b border-border/50 bg-muted/30">
            <p className="text-[10px] text-muted-foreground font-medium mb-1">{isAr ? "دليل الألوان:" : "Color guide:"}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span className="flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                {isAr ? "جديد (لم يُفتح)" : "New (unread)"}
              </span>
              <span className="flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                {isAr ? "مفتوح (بانتظار إجراء)" : "Opened (pending action)"}
              </span>
              <span className="flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                {isAr ? "معلوماتي / منجز" : "Info / Done"}
              </span>
            </div>
          </div>

          {/* Notification list */}
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Bell size={28} className="opacity-30" />
              <p className="text-sm">{isAr ? "لا توجد تنبيهات" : "No notifications"}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {recent.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 cursor-pointer hover:brightness-95 transition-all border-l-4 ${getColorClass(n)}`}
                  onClick={() => handleNotifClick(n)}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${getDotClass(n)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        {getIcon(n)}
                        <p className="text-xs font-semibold truncate">{n.title}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                        <Clock size={9} />
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border sticky bottom-0 bg-background">
            <button
              onClick={() => { setOpen(false); navigate("/notifications"); }}
              className="w-full text-xs text-center text-primary hover:underline"
            >
              {isAr ? "عرض جميع التنبيهات" : "View all notifications"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
