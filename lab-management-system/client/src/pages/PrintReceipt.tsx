/**
 * PrintReceipt — صفحة طباعة وصل استلام العينة
 * URL: /print-receipt/:id
 * تُفتح في تاب جديد وتطبع تلقائياً عند تحميل البيانات
 */
import { useParams } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Printer, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_TYPE_LABELS } from "@/lib/labTypes";

const SECTOR_LABELS: Record<string, { ar: string; en: string }> = {
  sector_1: { ar: "قطاع/1", en: "Sector 1" },
  sector_2: { ar: "قطاع/2", en: "Sector 2" },
  sector_3: { ar: "قطاع/3", en: "Sector 3" },
  sector_4: { ar: "قطاع/4", en: "Sector 4" },
  sector_5: { ar: "قطاع/5", en: "Sector 5" },
};

const CONDITION_LABELS: Record<string, string> = {
  good: "جيدة",
  damaged: "تالفة",
  partial: "جزئية",
};

function fmtDate(d?: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PrintReceipt() {
  const { id } = useParams<{ id: string }>();
  const sampleId = parseInt(id ?? "0");

  const { data: sample, isLoading } = trpc.samples.get.useQuery(
    { id: sampleId },
    { enabled: sampleId > 0 }
  );
  // Fetch order to get total quantity as backup
  const { data: orders } = trpc.orders.bySample.useQuery(
    { sampleId },
    { enabled: sampleId > 0 }
  );

  // Debug quantity source (temporary)
  useEffect(() => {
    if (sample) {
      console.log("📦 Sample Data:", {
        sampleCode: sample.sampleCode,
        quantity: sample.quantity,
        sampleType: (sample as any).sampleType,
        rawSample: sample,
      });
    }
  }, [sample]);

  const handleClose = () => {
    if (window.opener) window.close();
    else window.history.back();
  };

  const handlePrint = () => window.print();

  // Auto-print when opened in a new tab
  useEffect(() => {
    if (sample && window.opener) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [sample]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <XCircle className="text-red-400" size={40} />
        <p className="text-slate-600 font-medium">لم يتم العثور على العينة.</p>
        <Button variant="outline" onClick={handleClose}>إغلاق</Button>
      </div>
    );
  }

  const sectorLabel = SECTOR_LABELS[(sample as any).sector ?? ""] ?? null;
  const sampleTypeLabel = SAMPLE_TYPE_LABELS[(sample as any).sampleType] ?? (sample as any).sampleType;
  const conditionLabel = CONDITION_LABELS[(sample as any).condition ?? "good"] ?? "جيدة";
  // Calculate total quantity with multiple fallbacks
  let totalQuantity = 1;
  if (sample.quantity !== undefined && sample.quantity !== null && sample.quantity > 0) {
    totalQuantity = sample.quantity;
  } else if (orders && orders.length > 0) {
    const latestOrder = orders[0] as any;
    if (latestOrder.items && Array.isArray(latestOrder.items)) {
      const itemsTotal = latestOrder.items.reduce((sum: number, item: any) => {
        return sum + (Number(item.quantity) || 0);
      }, 0);
      if (itemsTotal > 0) {
        totalQuantity = itemsTotal;
        console.warn("⚠️ Using order items total because sample.quantity was invalid:", sample.quantity);
      }
    }
  }
  console.log("📊 Final totalQuantity:", totalQuantity);

  return (
    <>
      {/* Print Controls — hidden when printing */}
      <div className="print:hidden bg-slate-800 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <Button variant="ghost" className="text-white hover:text-white hover:bg-slate-700 gap-2" onClick={handleClose}>
          <X className="w-4 h-4" /> إغلاق
        </Button>
        <span className="text-sm font-medium">وصل استلام عينة — {sample.sampleCode}</span>
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Printer className="w-4 h-4" /> طباعة / حفظ PDF
        </Button>
      </div>

      {/* Receipt Page */}
      <div className="bg-gray-200 print:bg-white min-h-screen py-6 print:py-0">
        <div
          className="mx-auto bg-white shadow-lg print:shadow-none"
          style={{ width: "210mm", minHeight: "148mm", padding: "8mm 10mm 10mm 10mm", fontFamily: "Arial, sans-serif", fontSize: "10.5px", direction: "rtl" }}
        >
          {/* ═══ رأس المختبر ═══════════════════════════════════════════════ */}
          <div className="border-t-4 border-gray-900 pt-2 pb-1 mb-0">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <div style={{ textAlign: "right", flex: 1 }}>
                <h1 style={{ fontSize: "17px", fontWeight: 900, color: "#111", lineHeight: 1.3 }}>مختبر الإنشاءات والمواد الهندسية</h1>
                <p style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>Construction Materials &amp; Engineering Laboratory</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px", borderLeft: "1px solid #ccc", borderRight: "1px solid #ccc" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900 }}>م</div>
                <span style={{ fontSize: "9px", color: "#999", marginTop: "2px", letterSpacing: "3px" }}>LAB</span>
              </div>
              <div style={{ textAlign: "left", flex: 1, fontSize: "11px", color: "#555" }}>
                <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#111" }}>{sample.sampleCode}</span>
                  <span style={{ color: "#888" }}>:رقم الوثيقة</span>
                </div>
                <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end", marginTop: "2px" }}>
                  <span>{fmtDate(sample.receivedAt)}</span>
                  <span style={{ color: "#888" }}>:التاريخ</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ شريط عنوان الوثيقة ════════════════════════════════════════ */}
          <div style={{ background: "#1a1a2e", color: "white", textAlign: "center", padding: "6px 0", marginBottom: "10px" }}>
            <p style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "1px" }}>وصل استلام عينة</p>
            <p style={{ fontSize: "10px", color: "#aaa", marginTop: "2px", letterSpacing: "2px", textTransform: "uppercase" }}>Sample Receipt</p>
          </div>

          {/* ═══ بيانات العينة ══════════════════════════════════════════════ */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px", marginBottom: "10px" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ background: "#f3f4f6", fontWeight: 600, color: "#374151", padding: "8px 12px", width: "25%", textAlign: "right" }}>رقم العينة</td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>{sample.sampleCode}</td>
                <td style={{ background: "#f3f4f6", fontWeight: 600, color: "#374151", padding: "8px 12px", width: "25%", textAlign: "right" }}>نوع العينة</td>
                <td style={{ padding: "8px 12px" }}>{sampleTypeLabel}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ background: "#f3f4f6", fontWeight: 600, color: "#374151", padding: "8px 12px", textAlign: "right" }}>المقاول</td>
                <td style={{ padding: "8px 12px" }}>{sample.contractorName ?? "—"}</td>
                <td style={{ background: "#f3f4f6", fontWeight: 600, color: "#374151", padding: "8px 12px", textAlign: "right" }}>رقم العقد</td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{sample.contractNumber ?? "—"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ background: "#f3f4f6", fontWeight: 600, color: "#374151", padding: "8px 12px", textAlign: "right" }}>اسم المشروع</td>
                <td colSpan={3} style={{ padding: "8px 12px" }}>{sample.contractName ?? "—"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ background: "#f3f4f6", fontWeight: 600, color: "#374151", padding: "8px 12px", textAlign: "right" }}>القطاع</td>
                <td style={{ padding: "8px 12px" }}>
                  {sectorLabel ? `${sectorLabel.ar} / ${sectorLabel.en}` : "—"}
                </td>
                <td style={{ background: "#f3f4f6", fontWeight: 600, color: "#374151", padding: "8px 12px", textAlign: "right" }}>الكمية</td>
                <td style={{ padding: "8px 12px" }}>{totalQuantity}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ background: "#f3f4f6", fontWeight: 600, color: "#374151", padding: "8px 12px", textAlign: "right" }}>حالة العينة</td>
                <td style={{ padding: "8px 12px" }}>{conditionLabel}</td>
                <td style={{ background: "#f3f4f6", fontWeight: 600, color: "#374151", padding: "8px 12px", textAlign: "right" }}>تاريخ الاستلام</td>
                <td style={{ padding: "8px 12px" }}>{fmtDate(sample.receivedAt)}</td>
              </tr>
              {(sample as any).notes && (
                <tr>
                  <td style={{ background: "#f3f4f6", fontWeight: 600, color: "#374151", padding: "8px 12px", textAlign: "right" }}>ملاحظات</td>
                  <td colSpan={3} style={{ padding: "8px 12px", color: "#555" }}>{(sample as any).notes}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ═══ التوقيعات ══════════════════════════════════════════════════ */}
          <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            {[
              { ar: "موظف الاستقبال", en: "Reception Staff" },
              { ar: "مسؤول المختبر", en: "Lab Manager" },
              { ar: "المقاول / المندوب", en: "Contractor / Agent" },
            ].map((sig) => (
              <div key={sig.ar} style={{ textAlign: "center" }}>
                <div style={{ borderTop: "1px solid #555", paddingTop: "6px", marginTop: "24px" }}>
                  <p style={{ fontWeight: 700, fontSize: "11px", color: "#333" }}>{sig.ar}</p>
                  <p style={{ fontSize: "9px", color: "#888", marginTop: "2px" }}>{sig.en}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ═══ تذييل ══════════════════════════════════════════════════════ */}
          <div style={{ marginTop: "24px", paddingTop: "10px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#aaa" }}>
            <span>مختبر الإنشاءات والمواد الهندسية — Construction Materials &amp; Engineering Laboratory</span>
            <span>طُبع في: {new Date().toLocaleString("ar-AE")}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A5 landscape; margin: 0; }
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
