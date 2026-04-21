/**
 * PrintCertificate — صفحة طباعة شهادة التخليص (شهادة براءة الذمة)
 * URL: /print-certificate/:id
 * تُفتح في تاب جديد وتطبع تلقائياً عند تحميل البيانات
 */
import { useParams } from "wouter";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Printer, X, XCircle, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_TYPE_LABELS } from "@/lib/labTypes";

const SECTOR_LABELS: Record<string, { ar: string; en: string }> = {
  sector_1: { ar: "قطاع/1", en: "Sector 1" },
  sector_2: { ar: "قطاع/2", en: "Sector 2" },
  sector_3: { ar: "قطاع/3", en: "Sector 3" },
  sector_4: { ar: "قطاع/4", en: "Sector 4" },
  sector_5: { ar: "قطاع/5", en: "Sector 5" },
};

function fmtDate(d?: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PrintCertificate() {
  const { id } = useParams<{ id: string }>();
  const certId = parseInt(id ?? "0");

  const { data: cert, isLoading } = trpc.certificates.get.useQuery(
    { id: certId },
    { enabled: certId > 0 }
  );

  const handleClose = () => {
    if (window.opener) window.close();
    else window.history.back();
  };

  const printRef = useRef<HTMLDivElement>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);

  const handlePrint = async () => {
    if (!printRef.current) return window.print();
    setIsPdfLoading(true);
    const { generatePdfFromElement } = await import("@/lib/pdf");
    const ok = await generatePdfFromElement(printRef.current, {
      filename: `clearance-certificate-${cert?.certificateCode ?? certId}`,
      mode: "print",
    });
    if (!ok) window.print();
    setIsPdfLoading(false);
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsDownloadLoading(true);
    const { generatePdfFromElement } = await import("@/lib/pdf");
    const ok = await generatePdfFromElement(printRef.current, {
      filename: `clearance-certificate-${cert?.certificateCode ?? certId}`,
      mode: "download",
    });
    if (!ok) window.print();
    setIsDownloadLoading(false);
  };

  // Auto-print when opened in a new tab
  useEffect(() => {
    if (cert && window.opener) {
      const timer = setTimeout(() => handlePrint(), 600);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cert]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <XCircle className="text-red-400" size={40} />
        <p className="text-slate-600 font-medium">لم يتم العثور على الشهادة.</p>
        <Button variant="outline" onClick={handleClose}>إغلاق</Button>
      </div>
    );
  }

  const sectorLabel = SECTOR_LABELS[(cert as any).sector ?? ""] ?? null;
  const sampleTypeLabel = SAMPLE_TYPE_LABELS[(cert as any).sampleType] ?? (cert as any).sampleType;
  const testsCompleted: any[] = (cert.testsCompleted as any[]) ?? [];

  return (
    <>
      {/* Print Controls — hidden when printing */}
      <div className="print:hidden bg-slate-800 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <Button variant="ghost" className="text-white hover:text-white hover:bg-slate-700 gap-2" onClick={handleClose}>
          <X className="w-4 h-4" /> إغلاق
        </Button>
        <span className="text-sm font-medium">شهادة براءة الذمة — {cert.certificateCode}</span>
        <div className="flex gap-2">
          <Button onClick={handleDownload} disabled={isDownloadLoading} variant="ghost" className="text-white hover:text-white hover:bg-slate-700 gap-2">
            {isDownloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            تحميل PDF
          </Button>
          <Button onClick={handlePrint} disabled={isPdfLoading} className="bg-blue-600 hover:bg-blue-700 gap-2">
            {isPdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            طباعة / حفظ PDF
          </Button>
        </div>
      </div>

      {/* Certificate Page */}
      <div className="bg-gray-200 print:bg-white min-h-screen py-6 print:py-0">
        <div
          ref={printRef}
          className="mx-auto bg-white shadow-lg print:shadow-none"
          style={{ width: "210mm", minHeight: "297mm", padding: "15mm 15mm 20mm 15mm", fontFamily: "Arial, sans-serif", fontSize: "11px", direction: "rtl" }}
        >
          {/* ═══ رأس المختبر ═══════════════════════════════════════════════ */}
          <div style={{ borderTop: "5px solid #1e3a5f", paddingTop: "14px", marginBottom: "0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <div style={{ textAlign: "right", flex: 1 }}>
                <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#1e3a5f", lineHeight: 1.3 }}>مختبر الإنشاءات والمواد الهندسية</h1>
                <p style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>Construction Materials &amp; Engineering Laboratory</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px", borderLeft: "1px solid #ccc", borderRight: "1px solid #ccc" }}>
                <div style={{ width: "55px", height: "55px", borderRadius: "50%", border: "3px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 900, color: "#1e3a5f" }}>م</div>
                <span style={{ fontSize: "9px", color: "#999", marginTop: "2px", letterSpacing: "3px" }}>LAB</span>
              </div>
              <div style={{ textAlign: "left", flex: 1, fontSize: "11px", color: "#555" }}>
                <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a5f" }}>{cert.certificateCode}</span>
                  <span style={{ color: "#888" }}>:رقم الشهادة</span>
                </div>
                <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end", marginTop: "2px" }}>
                  <span>{fmtDate(cert.issuedAt)}</span>
                  <span style={{ color: "#888" }}>:تاريخ الإصدار</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ شريط عنوان الوثيقة ════════════════════════════════════════ */}
          <div style={{ background: "#1e3a5f", color: "white", textAlign: "center", padding: "14px 0", margin: "16px 0" }}>
            <p style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "2px" }}>شهادة براءة الذمة</p>
            <p style={{ fontSize: "11px", color: "#aac4e8", marginTop: "4px", letterSpacing: "2px", textTransform: "uppercase" }}>Clearance Certificate</p>
          </div>

          {/* ═══ بيانات المشروع ══════════════════════════════════════════════ */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "16px", border: "1px solid #ccc" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ background: "#f0f4f8", fontWeight: 600, color: "#1e3a5f", padding: "9px 14px", width: "25%", textAlign: "right" }}>المقاول</td>
                <td style={{ padding: "9px 14px", fontWeight: 600 }}>{cert.contractorName ?? "—"}</td>
                <td style={{ background: "#f0f4f8", fontWeight: 600, color: "#1e3a5f", padding: "9px 14px", width: "25%", textAlign: "right" }}>رقم العقد</td>
                <td style={{ padding: "9px 14px", fontFamily: "monospace" }}>{cert.contractNumber ?? cert.projectNumber ?? "—"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ background: "#f0f4f8", fontWeight: 600, color: "#1e3a5f", padding: "9px 14px", textAlign: "right" }}>اسم المشروع</td>
                <td colSpan={3} style={{ padding: "9px 14px" }}>{cert.contractName ?? cert.projectName ?? "—"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ background: "#f0f4f8", fontWeight: 600, color: "#1e3a5f", padding: "9px 14px", textAlign: "right" }}>رقم العينة</td>
                <td style={{ padding: "9px 14px", fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>{cert.sampleCode ?? "—"}</td>
                <td style={{ background: "#f0f4f8", fontWeight: 600, color: "#1e3a5f", padding: "9px 14px", textAlign: "right" }}>نوع العينة</td>
                <td style={{ padding: "9px 14px" }}>{sampleTypeLabel}</td>
              </tr>
              {sectorLabel && (
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ background: "#f0f4f8", fontWeight: 600, color: "#1e3a5f", padding: "9px 14px", textAlign: "right" }}>القطاع</td>
                  <td colSpan={3} style={{ padding: "9px 14px" }}>{sectorLabel.ar} / {sectorLabel.en}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ═══ نص شهادة براءة الذمة ══════════════════════════════════════════════ */}
          <div style={{ fontSize: "13px", lineHeight: 2, textAlign: "justify", padding: "20px", background: "#f9fafb", border: "1px solid #e0e0e0", borderRadius: "4px", marginBottom: "20px" }}>
            يشهد مختبر الإنشاءات والمواد الهندسية بأن المقاول <strong>{cert.contractorName}</strong> قد أتمّ جميع إجراءات الفحص والاختبار المتعلقة بالعقد رقم <strong>{cert.contractNumber ?? cert.projectNumber ?? "—"}</strong>، وأن جميع نتائج الاختبارات قد استوفت المتطلبات الفنية المعتمدة. وبذلك تُصدر هذه الشهادة تأكيداً لبراءة ذمته من أي التزامات تجاه المختبر فيما يخص هذا العقد.
          </div>

          {/* ═══ ملخص الاختبارات ══════════════════════════════════════════════ */}
          {testsCompleted.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a5f", borderBottom: "2px solid #1e3a5f", paddingBottom: "6px", marginBottom: "10px" }}>
                ملخص الاختبارات المنجزة
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr style={{ background: "#1e3a5f", color: "white" }}>
                    {["#", "الاختبار", "النتيجة", "الوحدة", "المطابقة"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "center", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {testsCompleted.map((t: any, i: number) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "7px 10px", textAlign: "center" }}>{i + 1}</td>
                      <td style={{ padding: "7px 10px" }}>{t.testName ?? "—"}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: 700 }}>{t.result ?? "—"}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center" }}>{t.unit ?? "—"}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center" }}>
                        <span style={{ color: t.compliance === "pass" ? "#16a34a" : t.compliance === "fail" ? "#dc2626" : "#666", fontWeight: 700 }}>
                          {t.compliance === "pass" ? "✓ مطابق" : t.compliance === "fail" ? "✗ غير مطابق" : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ═══ ختم الاعتماد ══════════════════════════════════════════════ */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: "#f0fdf4", border: "2px solid #16a34a", borderRadius: "8px", color: "#15803d", fontWeight: 700, fontSize: "13px" }}>
              <span style={{ fontSize: "18px" }}>✓</span>
              معتمد — جميع الاختبارات مطابقة للمواصفات
            </div>
          </div>

          {/* ═══ التوقيعات ══════════════════════════════════════════════════ */}
          <div style={{ marginTop: "50px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
            {[
              { ar: "مدير المختبر", en: "Laboratory Manager" },
              { ar: "مسؤول الجودة", en: "QC Inspector" },
              { ar: "المقاول", en: "Contractor" },
            ].map((sig) => (
              <div key={sig.ar} style={{ textAlign: "center" }}>
                <div style={{ borderTop: "1px solid #555", paddingTop: "8px", marginTop: "40px" }}>
                  <p style={{ fontWeight: 700, fontSize: "11px", color: "#333" }}>{sig.ar}</p>
                  <p style={{ fontSize: "9px", color: "#888", marginTop: "2px" }}>{sig.en}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ═══ تذييل ══════════════════════════════════════════════════════ */}
          <div style={{ marginTop: "24px", paddingTop: "10px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#aaa" }}>
            <span>مختبر الإنشاءات والمواد الهندسية — Construction Materials &amp; Engineering Laboratory</span>
            <span>تاريخ الطباعة: {new Date().toLocaleString("ar-AE")}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
