import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClipboardList, Eye, UserCheck, Building2, FlaskConical, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sectorLabel(val: string, lang: string) {
  const map: Record<string, { ar: string; en: string }> = {
    sector_1: { ar: "قطاع/1", en: "Sector 1" },
    sector_2: { ar: "قطاع/2", en: "Sector 2" },
    sector_3: { ar: "قطاع/3", en: "Sector 3" },
    sector_4: { ar: "قطاع/4", en: "Sector 4" },
    sector_5: { ar: "قطاع/5", en: "Sector 5" },
  };
  return map[val]?.[lang as "ar" | "en"] ?? val;
}

function typeLabel(type: string, lang: string) {
  const map: Record<string, Record<string, string>> = {
    concrete: { en: "Concrete", ar: "خرسانة" },
    soil: { en: "Soil", ar: "تربة" },
    steel: { en: "Steel", ar: "حديد" },
    asphalt: { en: "Asphalt", ar: "أسفلت" },
    metal: { en: "Metal", ar: "معادن" },
    water: { en: "Water", ar: "مياه" },
    aggregates: { en: "Aggregates", ar: "ركام" },
  };
  return map[type]?.[lang] ?? type;
}

function TypeCell({ order, lang }: { order: any; lang: string }) {
  const base = typeLabel(order.sampleType ?? "", lang);
  const sub = order.sampleSubType;
  return (
    <div className="flex flex-col gap-0.5">
      <span>{base}</span>
      {sub && (
        <span className="text-[10px] text-muted-foreground font-medium bg-slate-100 px-1.5 py-0.5 rounded w-fit">
          {sub}
        </span>
      )}
    </div>
  );
}

function orderStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: "#f59e0b",
    distributed: "#3b82f6",
    in_progress: "#8b5cf6",
    completed: "#10b981",
    reviewed: "#0ea5e9",
    qc_passed: "#22c55e",
    rejected: "#ef4444",
  };
  return map[status] ?? "#94a3b8";
}

export default function Distribution() {
  const { lang } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [form, setForm] = useState({
    technicianId: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    notes: "",
  });
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "active" | "done">("all");
  const [, setLocation] = useLocation();

  // ─── Data ──────────────────────────────────────────────────────────────────
  const { data: orders = [], refetch } = trpc.orders.list.useQuery();
  const { data: technicians = [] } = trpc.users.technicians.useQuery();

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const distributeOrder = trpc.orders.distribute.useMutation({
    onSuccess: () => {
      toast.success(lang === "ar"
        ? `تم توزيع الأوردر بنجاح`
        : `Order distributed successfully`);
      setSelectedOrder(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // ─── Filters ───────────────────────────────────────────────────────────────
  const PENDING_STATUSES = ["pending"];
  const ACTIVE_STATUSES = ["distributed", "in_progress"];
  const DONE_STATUSES = ["completed", "reviewed", "qc_passed", "rejected"];

  const filteredOrders = orders.filter((o: any) => {
    if (taskFilter === "pending") return PENDING_STATUSES.includes(o.status);
    if (taskFilter === "active") return ACTIVE_STATUSES.includes(o.status);
    if (taskFilter === "done") return DONE_STATUSES.includes(o.status);
    return true;
  });

  const pendingOrders = orders.filter((o: any) => PENDING_STATUSES.includes(o.status));
  const activeOrders = orders.filter((o: any) => ACTIVE_STATUSES.includes(o.status));
  const doneOrders = orders.filter((o: any) => DONE_STATUSES.includes(o.status));

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenDialog = (order: any) => {
    setSelectedOrder(order);
    setForm({ technicianId: "", priority: "normal", notes: "" });
  };

  const handleDistribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.technicianId) {
      toast.error(lang === "ar" ? "يرجى اختيار فني" : "Please select a technician");
      return;
    }
    distributeOrder.mutate({
      orderId: selectedOrder.id,
      technicianId: parseInt(form.technicianId),
      notes: form.notes || undefined,
    });
  };

  // ─── Filter Buttons ────────────────────────────────────────────────────────
  const filterBtns = [
    { key: "all", label: lang === "ar" ? "الكل" : "All", count: orders.length, color: "#3b82f6" },
    { key: "pending", label: lang === "ar" ? "جديدة" : "Pending", count: pendingOrders.length, color: "#ef4444" },
    { key: "active", label: lang === "ar" ? "نشطة" : "Active", count: activeOrders.length, color: "#f59e0b" },
    { key: "done", label: lang === "ar" ? "مُنجزة" : "Done", count: doneOrders.length, color: "#10b981" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">{lang === "ar" ? "توزيع الأوردرات" : "Order Distribution"}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === "ar" ? "توزيع أوامر الاختبار على الفنيين" : "Assign test orders to technicians"}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterBtns.map((btn) => {
            const active = taskFilter === btn.key;
            return (
              <button
                key={btn.key}
                onClick={() => setTaskFilter(btn.key as any)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: active ? btn.color : "#fff",
                  border: `1.5px solid ${active ? btn.color : "#e2e8f0"}`,
                  color: active ? "#fff" : btn.color,
                  boxShadow: active ? `0 2px 8px ${btn.color}30` : "none",
                }}
              >
                {btn.label}
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: active ? "rgba(255,255,255,0.25)" : `${btn.color}15`,
                    color: active ? "#fff" : btn.color,
                  }}
                >
                  {btn.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pending Orders */}
        {(taskFilter === "all" || taskFilter === "pending") && (
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                {lang === "ar" ? `أوردرات تنتظر التوزيع (${pendingOrders.length})` : `Orders Pending Distribution (${pendingOrders.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {lang === "ar" ? "لا توجد أوردرات جديدة" : "No pending orders"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "رقم الأوردر" : "Order #"}</th>
                        <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "المقاول" : "Contractor"}</th>
                        <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "النوع" : "Type"}</th>
                        <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "الاختبارات" : "Tests"}</th>
                        <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "القطاع" : "Sector"}</th>
                        <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "تاريخ الاستلام" : "Received"}</th>
                        <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "الإجراء" : "Action"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrders.map((order: any) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{order.orderCode}</td>
                          <td className="px-4 py-2.5 text-xs">{order.contractorName ?? "—"}</td>
                          <td className="px-4 py-2.5 text-xs"><TypeCell order={order} lang={lang} /></td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {(order.items ?? []).length === 0 ? (
                                <span className="text-xs text-muted-foreground italic">{lang === "ar" ? "لا توجد" : "None"}</span>
                              ) : (order.items ?? []).map((item: any) => (
                                <span key={item.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  <FlaskConical className="w-3 h-3" />
                                  {item.testName && item.testName !== "__multi__" ? item.testName : item.testTypeCode}
                                  {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs">
                            {order.location ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                <Building2 className="w-3 h-3" />
                                {order.location}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE")}
                          </td>
                          <td className="px-4 py-2.5">
                            <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => handleOpenDialog(order)}>
                              <UserCheck className="w-3.5 h-3.5" />
                              {lang === "ar" ? "توزيع" : "Distribute"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Orders */}
        {(taskFilter === "all" || taskFilter === "active" || taskFilter === "done") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {lang === "ar" ? "جميع الأوردرات" : "All Orders"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "رقم الأوردر" : "Order #"}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "المقاول" : "Contractor"}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "النوع" : "Type"}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "الاختبارات" : "Tests"}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "الفني" : "Technician"}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "الإجراء" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders
                      .filter((o: any) => !PENDING_STATUSES.includes(o.status))
                      .map((order: any) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{order.orderCode}</td>
                          <td className="px-4 py-2.5 text-xs">{order.contractorName ?? "—"}</td>
                          <td className="px-4 py-2.5 text-xs"><TypeCell order={order} lang={lang} /></td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {(order.items ?? []).length === 0 ? (
                                <span className="text-xs text-muted-foreground italic">{lang === "ar" ? "لا توجد" : "None"}</span>
                              ) : (order.items ?? []).map((item: any) => (
                                <span
                                  key={item.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                                  style={{
                                    background: item.status === "completed" ? "#f0fdf4" : "#f8fafc",
                                    borderColor: item.status === "completed" ? "#86efac" : "#e2e8f0",
                                    color: item.status === "completed" ? "#15803d" : "#475569",
                                  }}
                                >
                                  {item.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <FlaskConical className="w-3 h-3" />}
                                  {item.testName && item.testName !== "__multi__" ? item.testName : item.testTypeCode}
                                  {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {order.assignedTechnicianName ?? "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-4 py-2.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => setLocation(`/order/${order.id}`)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Distribute Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {lang === "ar"
                ? `توزيع الأوردر — ${selectedOrder?.orderCode}`
                : `Distribute Order — ${selectedOrder?.orderCode}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDistribute} className="space-y-4 mt-2">
            {/* Order Summary */}
            <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{lang === "ar" ? "المقاول:" : "Contractor:"}</span>
                <span className="font-medium">{selectedOrder?.contractorName ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{lang === "ar" ? "النوع:" : "Type:"}</span>
                <span className="font-medium">{typeLabel(selectedOrder?.sampleType ?? "", lang)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{lang === "ar" ? "الاختبارات:" : "Tests:"}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(selectedOrder?.items ?? []).map((item: any) => (
                    <span key={item.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <FlaskConical className="w-3 h-3" />
                      {item.testName && item.testName !== "__multi__" ? item.testName : item.testTypeCode}
                      {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Technician */}
            <div className="space-y-1.5">
              <Label>{lang === "ar" ? "الفني المسؤول" : "Assigned Technician"} <span className="text-red-500">*</span></Label>
              <Select value={form.technicianId} onValueChange={(v) => setForm({ ...form, technicianId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={lang === "ar" ? "اختر الفني..." : "Select technician..."} />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech: any) => (
                    <SelectItem key={tech.id} value={String(tech.id)}>
                      {tech.name} {tech.specialty ? `(${tech.specialty})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label>{lang === "ar" ? "الأولوية" : "Priority"}</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{lang === "ar" ? "منخفضة" : "Low"}</SelectItem>
                  <SelectItem value="normal">{lang === "ar" ? "عادية" : "Normal"}</SelectItem>
                  <SelectItem value="high">{lang === "ar" ? "عالية" : "High"}</SelectItem>
                  <SelectItem value="urgent">{lang === "ar" ? "عاجلة" : "Urgent"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>{lang === "ar" ? "ملاحظات" : "Notes"}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={lang === "ar" ? "ملاحظات إضافية..." : "Additional notes..."}
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedOrder(null)}>
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={distributeOrder.isPending}>
                <UserCheck className="w-4 h-4 mr-1" />
                {distributeOrder.isPending
                  ? (lang === "ar" ? "جاري التوزيع..." : "Distributing...")
                  : (lang === "ar" ? "توزيع الأوردر" : "Distribute Order")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
