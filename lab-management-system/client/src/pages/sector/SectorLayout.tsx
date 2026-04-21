import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { FlaskConical, Inbox, TestTube2, FileCheck2, LogOut, Bell, Globe, Menu, X, FlaskRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useSSESectorNotifications } from "@/hooks/useSSESectorNotifications";

// ─── Shared Language Context ──────────────────────────────────────────────────
const SectorLangContext = createContext<{
  lang: "ar" | "en";
  setLang: (l: "ar" | "en") => void;
}>({
  lang: "ar",
  setLang: () => {},
});

export function SectorLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<"ar" | "en">(() => {
    return (localStorage.getItem("sector_lang") as "ar" | "en") ?? "ar";
  });

  const setLang = (l: "ar" | "en") => {
    localStorage.setItem("sector_lang", l);
    setLangState(l);
  };

  return (
    <SectorLangContext.Provider value={{ lang, setLang }}>
      {children}
    </SectorLangContext.Provider>
  );
}

export function useSectorLang() {
  return useContext(SectorLangContext);
}

// ─── Auth helper ──────────────────────────────────────────────────────────────
export function useSectorAuth() {
  const token = localStorage.getItem("sector_token");
  const info = localStorage.getItem("sector_info");
  return {
    token,
    sector: info ? JSON.parse(info) : null,
    isAuthenticated: !!token,
  };
}

// ─── Translations ─────────────────────────────────────────────────────────────
const t = {
  ar: {
    title: "مختبر الإنشاءات",
    subtitle: "بوابة القطاعات",
    inbox: "صندوق الوارد",
    samples: "طلبات الفحص",
    results: "نتائج الاختبارات",
    clearances: "طلبات براءة الذمة",
    logout: "خروج",
    lang: "English",
  },
  en: {
    title: "Construction Lab",
    subtitle: "Sector Portal",
    inbox: "Inbox",
    samples: "Test Requests",
    results: "Test Results",
    clearances: "Clearance Requests",
    logout: "Sign Out",
    lang: "عربي",
  },
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export function SectorLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sector } = useSectorAuth();
  const { lang, setLang } = useSectorLang();
  const T = t[lang];
  const isRtl = lang === "ar";

  const prevUnreadRef = useRef<number | null>(null);
  const { data: unreadCount } = trpc.sector.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Toast notification when new unread items arrive
  useEffect(() => {
    if (unreadCount === undefined) return;
    const total = unreadCount.total ?? 0;
    if (prevUnreadRef.current === null) {
      // First load — only show toast if there are unread items
      if (total > 0) {
        toast.info(
          isRtl ? `لديك ${total} ${total === 1 ? 'تقرير جديد' : 'تقارير جديدة'}` : `You have ${total} new ${total === 1 ? 'report' : 'reports'}`,
          {
            description: isRtl ? 'انتقل إلى صندوق الوارد للاطلاع عليها' : 'Check your Inbox to view them',
            duration: 6000,
          }
        );
      }
    } else if (total > prevUnreadRef.current) {
      // New items arrived
      const newCount = total - prevUnreadRef.current;
      toast.success(
        isRtl ? `${newCount} ${newCount === 1 ? 'تقرير جديد' : 'تقارير جديدة'}` : `${newCount} new ${newCount === 1 ? 'report' : 'reports'}`,
        {
          description: isRtl ? 'وصلت نتائج جديدة لقطاعك' : 'New results have arrived for your sector',
          duration: 5000,
        }
      );
    }
    prevUnreadRef.current = total;
  }, [unreadCount?.total]);

  const { data: notifCount, refetch: refetchNotifCount } = trpc.sector.getNotificationCount.useQuery(undefined, {
    refetchInterval: 60000, // fallback polling — SSE handles real-time
  });

  // Real-time SSE for sector notifications
  useSSESectorNotifications({
    sectorId: sector?.id ?? null,
    onNew: (n) => {
      refetchNotifCount();
      toast(n.title, {
        description: n.message?.length > 80 ? n.message.slice(0, 80) + "…" : n.message,
        duration: 6000,
      });
    },
  });

  // Compute inbox total unread (results + clearances + notifications)
  const inboxUnread = (unreadCount?.total ?? 0) + (notifCount?.unread ?? 0);

  const navItems = [
    { path: "/sector/inbox", label: T.inbox, icon: Inbox, badge: inboxUnread },
    { path: "/sector/samples", label: T.samples, icon: TestTube2 },
    { path: "/sector/results", label: T.results, icon: FlaskConical, badge: unreadCount?.results },
    { path: "/sector/clearances", label: T.clearances, icon: FileCheck2, badge: unreadCount?.clearances },
  ];

  const handleLogout = () => {
    localStorage.removeItem("sector_token");
    localStorage.removeItem("sector_info");
    setLocation("/sector/login");
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen" style={{ background: "#f0f4f8" }}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 h-14"
        style={{
          background: "linear-gradient(135deg, #0a0f1e 0%, #1a2744 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
        }}>
        <div className="h-full flex items-center justify-between px-4 lg:px-6">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-white p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #0891b2)" }}>
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-sm leading-none">{T.title}</div>
              <div className="text-xs leading-none mt-0.5" style={{ color: "#60a5fa" }}>{T.subtitle}</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon, badge }) => {
              const active = location === path;
              return (
                <Link key={path} href={path}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative"
                  style={{
                    color: active ? "#fff" : "rgba(148,163,184,0.8)",
                    background: active ? "rgba(59,130,246,0.2)" : "transparent",
                    border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                  }}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge && badge > 0 ? (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                      style={{ background: "#ef4444", color: "#fff" }}>
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Sector name badge */}
            {sector && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs font-medium text-white">
                  {isRtl
                    ? `قسم المختبر - ${sector.nameAr}`
                    : `Lab Section - ${sector.nameEn}`}
                </span>
              </div>
            )}

            {/* Unread bell */}
            {(unreadCount?.total ?? 0) > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5" style={{ color: "#fbbf24" }} />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                  style={{ background: "#ef4444", color: "#fff", fontSize: "10px" }}>
                  {unreadCount!.total > 9 ? "9+" : unreadCount!.total}
                </span>
              </div>
            )}

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all"
              style={{ color: "rgba(148,163,184,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Globe className="w-3.5 h-3.5" />
              {T.lang}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                color: "#fca5a5",
                border: "1px solid rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.08)",
              }}>
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{T.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-14"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full p-4 space-y-1"
            style={{ background: "#0d1b2a" }}
            onClick={(e) => e.stopPropagation()}>
            {navItems.map(({ path, label, icon: Icon, badge }) => {
              const active = location === path;
              return (
                <Link key={path} href={path}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative"
                  style={{
                    color: active ? "#fff" : "rgba(148,163,184,0.8)",
                    background: active ? "rgba(59,130,246,0.2)" : "transparent",
                  }}
                  onClick={() => setMobileOpen(false)}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge && badge > 0 ? (
                    <span className="ms-auto w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                      style={{ background: "#ef4444", color: "#fff" }}>
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="p-4 lg:p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
