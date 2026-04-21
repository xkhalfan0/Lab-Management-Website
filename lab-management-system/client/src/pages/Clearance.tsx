import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { SAMPLE_TYPE_LABELS } from "@/lib/labTypes";
import { Award, CheckCircle, FileText, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Clearance() {
  const { lang, t } = useLanguage();
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [form, setForm] = useState({
    contractorLetter: false,
    sectorLetter: false,
    paymentOrder: false,
    paymentReceipt: false,
    testReport: false,
    remarks: "",
  });

  const [taskFilter, setTaskFilter] = useState<"all" | "new" | "incomplete" | "done">("all");

  const { data: samples, refetch } = trpc.samples.list.useQuery();
  const { data: issuedCerts = [], refetch: refetchCerts } = trpc.certificates.list.useQuery();
  const issueCert = trpc.certificates.create.useMutation({
    onSuccess: (cert: any) => {
      toast.success(lang === "ar" ? `تم إصدار شهادة براءة الذمة ${cert?.certificateCode} بنجاح` : `Clearance certificate ${cert?.certificateCode} issued successfully`);
      setSelectedSample(null);
      refetch();
      refetchCerts();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // For Clearance page:
  // new = qc_passed (ready for clearance, not yet processed)
  // incomplete = (no intermediate state here, but keep for consistency)
  // done = clearance_issued
  const allPendingSamples = samples?.filter((s) => s.status === "qc_passed") ?? [];
  const pendingSamples = taskFilter === "done" ? [] : allPendingSamples;
  const filteredCerts = taskFilter === "new" ? [] : issuedCerts;

  const newCount = allPendingSamples.length;
  const doneCount = issuedCerts.length;
  const totalCount = newCount + doneCount;

  const allDocsChecked =
    form.contractorLetter &&
    form.sectorLetter &&
    form.paymentOrder &&
    form.paymentReceipt &&
    form.testReport;

  const handleIssue = () => {
    if (!allDocsChecked) {
      toast.error(lang === "ar" ? "يرجى تأكيد استلام جميع المستندات المطلوبة" : "Please confirm all required documents are received");
      return;
    }
    issueCert.mutate({
      sampleId: selectedSample.id,
      notes: form.remarks || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">{t("clearance.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("clearance.subtitle")}</p>
        </div>

        {/* Task Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTaskFilter("all")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: taskFilter === "all" ? "#3b82f6" : "#fff",
              border: `1.5px solid ${taskFilter === "all" ? "#3b82f6" : "#e2e8f0"}`,
              color: taskFilter === "all" ? "#fff" : "#475569",
              boxShadow: taskFilter === "all" ? "0 2px 8px rgba(59,130,246,0.18)" : "none",
            }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
            {lang === "ar" ? "الكل" : "All"}
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: taskFilter === "all" ? "rgba(255,255,255,0.25)" : "#f1f5f9", color: taskFilter === "all" ? "#fff" : "#64748b" }}>
              {totalCount}
            </span>
          </button>
          <button
            onClick={() => setTaskFilter("new")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: taskFilter === "new" ? "#ef4444" : "#fff",
              border: `1.5px solid ${taskFilter === "new" ? "#ef4444" : "#fecaca"}`,
              color: taskFilter === "new" ? "#fff" : "#dc2626",
              boxShadow: taskFilter === "new" ? "0 2px 8px rgba(239,68,68,0.18)" : "none",
            }}>
            <span className="w-2 h-2 rounded-full" style={{ background: taskFilter === "new" ? "#fff" : "#ef4444", display: "inline-block" }} />
            {lang === "ar" ? "جديدة" : "New"}
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: taskFilter === "new" ? "rgba(255,255,255,0.25)" : "rgba(239,68,68,0.1)", color: taskFilter === "new" ? "#fff" : "#dc2626" }}>
              {newCount}
            </span>
          </button>
          <button
            onClick={() => setTaskFilter("done")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: taskFilter === "done" ? "#10b981" : "#fff",
              border: `1.5px solid ${taskFilter === "done" ? "#10b981" : "#a7f3d0"}`,
              color: taskFilter === "done" ? "#fff" : "#059669",
              boxShadow: taskFilter === "done" ? "0 2px 8px rgba(16,185,129,0.18)" : "none",
            }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {lang === "ar" ? "مُنجزة" : "Done"}
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: taskFilter === "done" ? "rgba(255,255,255,0.25)" : "rgba(16,185,129,0.1)", color: taskFilter === "done" ? "#fff" : "#059669" }}>
              {doneCount}
            </span>
          </button>
        </div>

        {/* Pending Clearance */}
        {pendingSamples.length > 0 && (
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                {lang === "ar" ? `جاهزة للتخليص (${pendingSamples.length})` : `${t("clearance.readyForClearance")} (${pendingSamples.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("clearance.sampleCode")}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("clearance.contractor")}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "النوع" : "Type"}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("clearance.contract")}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "إجراء" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSamples.map((sample) => (
                      <tr key={sample.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{sample.sampleCode}</td>
                        <td className="px-4 py-2.5 text-xs">{sample.contractorName}</td>
                        <td className="px-4 py-2.5 text-xs">{SAMPLE_TYPE_LABELS[sample.sampleType]}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{sample.contractNumber ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <Button
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => {
                              setSelectedSample(sample);
                              setForm({
                                contractorLetter: false,
                                sectorLetter: false,
                                paymentOrder: false,
                                paymentReceipt: false,
                                testReport: false,
                                remarks: "",
                              });
                            }}
                          >
                            <Award className="w-3.5 h-3.5" />
                            {lang === "ar" ? "إصدار شهادة" : t("clearance.issueCertificate")}
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

        {/* Issued Certificates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
                {lang === "ar" ? `الشهادات المصدرة (${issuedCerts.length})` : `${t("clearance.issuedCertificates")} (${issuedCerts.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {issuedCerts.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "لم يتم إصدار أي شهادة بعد" : t("clearance.noCertificates")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "رقم الشهادة" : "Certificate ID"}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("clearance.sampleCode")}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("clearance.contractor")}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "تاريخ الإصدار" : "Issued Date"}</th>
                      <th className="text-start px-4 py-2.5 text-xs font-medium text-muted-foreground">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCerts.map((cert) => (
                      <tr key={cert.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-green-700">{cert.certificateCode}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-primary">{cert.sampleCode}</td>
                        <td className="px-4 py-2.5 text-xs">{cert.contractorName}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() => window.open(`/print-certificate/${cert.id}`, "_blank")}
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
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
      </div>

      {/* Issue Certificate Dialog */}
      <Dialog open={!!selectedSample} onOpenChange={(o) => !o && setSelectedSample(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              {lang === "ar" ? "إصدار براءة ذمة" : t("clearance.confirmIssue")}
            </DialogTitle>
          </DialogHeader>

          {selectedSample && (
            <div className="space-y-4 mt-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs space-y-1">
                <div><span className="text-muted-foreground">{t("clearance.sampleCode")}:</span> <span className="font-mono font-bold">{selectedSample.sampleCode}</span></div>
                <div><span className="text-muted-foreground">{t("clearance.contractor")}:</span> <span className="font-medium">{selectedSample.contractorName}</span></div>
                <div><span className="text-muted-foreground">{t("clearance.contract")}:</span> <span className="font-medium">{selectedSample.contractNumber ?? "—"}</span></div>
                <div className="flex items-center gap-1 text-green-700 font-medium mt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {lang === "ar" ? "معتمد من الجودة — جاهز للتخليص" : "QC Approved — Ready for clearance"}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">{t("clearance.requiredDocs")}</Label>
                {[
                  { key: "contractorLetter", label: t("clearance.contractorLetter") },
                  { key: "sectorLetter", label: t("clearance.sectorLetter") },
                  { key: "paymentOrder", label: t("clearance.paymentOrder") },
                  { key: "paymentReceipt", label: t("clearance.paymentReceipt") },
                  { key: "testReport", label: t("clearance.testReport") },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded"
                      checked={form[key as keyof typeof form] as boolean}
                      onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    />
                    <span className="text-sm">{label}</span>
                    {form[key as keyof typeof form] && (
                      <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                    )}
                  </label>
                ))}
              </div>

              {!allDocsChecked && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">
                  {t("clearance.allDocsRequired")}
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="remarks">{t("clearance.remarks")} ({lang === "ar" ? "اختياري" : "optional"})</Label>
                <Textarea
                  id="remarks"
                  rows={2}
                  placeholder={lang === "ar" ? "ملاحظات إضافية..." : "Additional remarks..."}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-1.5"
                  disabled={!allDocsChecked || issueCert.isPending}
                  onClick={handleIssue}
                >
                  <Award className="w-4 h-4" />
                  {issueCert.isPending ? (lang === "ar" ? "جاري الإصدار..." : "Issuing...") : t("clearance.confirmIssue")}
                </Button>
                <Button variant="outline" onClick={() => setSelectedSample(null)}>{t("common.cancel")}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
