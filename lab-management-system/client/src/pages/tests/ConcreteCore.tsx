import { useState, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { PassFailBadge, ResultBanner } from "@/components/PassFailBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Send, FlaskConical, Info, Printer, UserCheck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── L/D Correction Factors (BS EN 12504-1) ─────────────────────────────
// Correction applies only when L/D < 1.0; at L/D ≥ 1.0, CF = 1.0 (no correction).
function getLDCorrectionFactor(ld: number): number {
  if (ld >= 1.0) return 1.0;
  if (ld >= 0.95) return 0.98;
  if (ld >= 0.90) return 0.96;
  if (ld >= 0.85) return 0.94;
  if (ld >= 0.80) return 0.92;
  if (ld >= 0.75) return 0.89;
  return 0.8;
}

interface CoreRow {
  id: string;
  coreNo: string;
  location: string;
  diameter: string;
  length: string;          // Total length (mm)
  lengthAfterCap: string;  // Length after capping (mm)
  mass: string;            // Mass (g)
  maxLoad: string;
  area?: number;
  ld?: number;
  correctionFactor?: number;
  density?: number;        // kg/m³ rounded to nearest 10
  coreStrength?: number;
  equivalentCubeStrength?: number;
  isCylinderStrength?: boolean; // true when L/D ≥ 2.0 (result is cylinder strength, not eq. cube)
  result?: "pass" | "fail" | "pending";
}

function newRow(index: number): CoreRow {
  return {
    id: `row_${Date.now()}_${index}`,
    coreNo: `C${index + 1}`,
    location: "",
    diameter: "100",
    length: "",
    lengthAfterCap: "",
    mass: "",
    maxLoad: "",
  };
}

function computeRow(row: CoreRow, specifiedCubeStrength: number): CoreRow {
  const d = parseFloat(row.diameter);
  const l = parseFloat(row.lengthAfterCap || row.length);
  const load = parseFloat(row.maxLoad);
  if (!d || !l || !load) {
    // Can still compute density even without load
    const dOnly = parseFloat(row.diameter);
    const lOnly = parseFloat(row.length || row.lengthAfterCap);
    const massG = parseFloat(row.mass);
    if (dOnly && lOnly && massG) {
      const areaOnly = Math.PI * (dOnly / 2) ** 2; // mm²
      const volMm3 = areaOnly * lOnly;              // mm³
      const volM3 = volMm3 * 1e-9;                  // m³
      const massKg = massG / 1000;
      const densityRaw = massKg / volM3;
      const density = Math.round(densityRaw / 10) * 10; // round to nearest 10
      return { ...row, area: Math.round(areaOnly), density };
    }
    return row;
  }
  const area = Math.PI * (d / 2) ** 2;
  const ld = l / d;
  const cf = getLDCorrectionFactor(ld);
  const coreStr = (load * 1000) / area;
  const eqCubeStr = coreStr * cf;
  // When L/D >= 2.0: result is cylinder strength (not equivalent cube strength)
  // BS EN 12504-1: at L/D=2, CF=1.0 and result is treated as cylinder strength
  const isCylinderStrength = ld >= 2.0;
  // Acceptance: equivalent cube strength ≥ 100% of specified cube strength
  const required = specifiedCubeStrength * 1.0;
  const coreStrRounded = Math.round(coreStr * 10) / 10;
  const eqCubeStrRounded = Math.round(eqCubeStr * 10) / 10;

  // Density calculation
  const massG = parseFloat(row.mass);
  let density: number | undefined;
  const lForDensity = parseFloat(row.length || row.lengthAfterCap);
  if (massG && lForDensity && d) {
    const volMm3 = area * lForDensity;
    const volM3 = volMm3 * 1e-9;
    const massKg = massG / 1000;
    const densityRaw = massKg / volM3;
    density = Math.round(densityRaw / 10) * 10;
  }

  return {
    ...row,
    area: Math.round(area),
    ld: parseFloat(ld.toFixed(2)),
    correctionFactor: ld >= 1.0 ? 1.0 : parseFloat(cf.toFixed(3)),
    density,
    coreStrength: coreStrRounded,
    equivalentCubeStrength: eqCubeStrRounded,
    isCylinderStrength,
    result: eqCubeStrRounded >= required ? "pass" : "fail",
  };
}

export default function ConcreteCore() {
  const { distributionId } = useParams<{ distributionId: string }>();
  const [, setLocation] = useLocation();
  const distId = parseInt(distributionId ?? "0");

  const { data: dist } = trpc.distributions.get.useQuery({ id: distId }, { enabled: !!distId });
  const { data: existing } = trpc.specializedTests.getByDistribution.useQuery(
    { distributionId: distId },
    { enabled: !!distId }
  );

  const [specifiedStrength, setSpecifiedStrength] = useState("30");
  const [coreType, setCoreType] = useState("Drilled Core");
  const [endCondition, setEndCondition] = useState("as-drilled"); // as-drilled | grinded | capped
  const [structureType, setStructureType] = useState("");
  const [castDate, setCastDate] = useState("");
  const [testDate, setTestDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<CoreRow[]>([newRow(0), newRow(1), newRow(2)]);
  const [saving, setSaving] = useState(false);

  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const saveResult = trpc.specializedTests.save.useMutation({
    onSuccess: (_, vars) => {
      if (vars.status === "submitted") {
        toast.success(ar ? "تم إرسال النتائج بنجاح" : "Test results submitted successfully");
        setSubmitted(true);
      } else {
        toast.success(ar ? "تم حفظ المسودة" : "Draft saved");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!dist?.castingDate) return;
    const iso = new Date(dist.castingDate).toISOString().split("T")[0];
    setCastDate(prev => prev || iso);
  }, [dist?.castingDate]);

  // Load existing data
  useEffect(() => {
    if (!existing?.formData) return;
    const fd = existing.formData as any;
    if (fd.specifiedCubeStrength) setSpecifiedStrength(String(fd.specifiedCubeStrength));
    if (fd.coreType) setCoreType(fd.coreType);
    if (fd.endCondition) setEndCondition(fd.endCondition);
    if (fd.structureType) setStructureType(fd.structureType);
    if (fd.castDate) setCastDate(String(fd.castDate).split("T")[0]);
    if (fd.testDate) setTestDate(String(fd.testDate).split("T")[0]);
    if (fd.notes) setNotes(fd.notes);
    if (fd.cores && Array.isArray(fd.cores)) {
      setRows(fd.cores.map((c: any) => ({
        id: c.id || `row_${Date.now()}_${Math.random()}`,
        coreNo: c.coreNo || "",
        location: c.location || "",
        diameter: String(c.diameter || "100"),
        length: String(c.length || ""),
        lengthAfterCap: String(c.lengthAfterCap || ""),
        mass: String(c.mass || ""),
        maxLoad: String(c.maxLoad || ""),
      })));
    }
       if (existing.status === "submitted") setSubmitted(true);
  }, [existing]);

  const ageDays =
    castDate && testDate
      ? Math.round((new Date(testDate).getTime() - new Date(castDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

  const specStr = parseFloat(specifiedStrength) || 30;
  const computedRows = rows.map(r => computeRow(r, specStr));
  const validRows = computedRows.filter(r => r.equivalentCubeStrength && r.equivalentCubeStrength > 0);
  const avgEqStrength = validRows.length > 0
    ? validRows.reduce((s, r) => s + (r.equivalentCubeStrength ?? 0), 0) / validRows.length
    : 0;
  const overallResult: "pass" | "fail" | "pending" =
    validRows.length === 0 ? "pending"
    : validRows.every(r => r.result === "pass") ? "pass" : "fail";

  const updateRow = useCallback((id: string, field: keyof CoreRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const addRow = () => setRows(prev => [...prev, newRow(prev.length)]);
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const handleSave = async (status: "draft" | "submitted") => {
    if (status === "submitted" && validRows.length === 0) {
      toast.error(ar ? "الرجاء إدخال نتيجة لب واحدة على الأقل" : "Please enter at least one core result");
      return;
    }
    setSaving(true);
    try {
      await saveResult.mutateAsync({
        distributionId: distId,
        sampleId: dist?.sampleId ?? 0,
        testTypeCode: "CONC_CORE",
        formTemplate: "concrete_cores",
        formData: {
          specifiedCubeStrength: specStr,
          coreType,
          endCondition,
          structureType,
          castDate: castDate || undefined,
          testDate: testDate || undefined,
          ageDays: ageDays ?? undefined,
          cores: computedRows.map(r => ({
            ...r,
            testDateMs: testDate ? new Date(testDate).getTime() : undefined,
          })),
          avgEquivalentCubeStrength: Math.round(avgEqStrength * 10) / 10,
        },
        overallResult,
        summaryValues: {
          avgEqStrength: avgEqStrength.toFixed(2),
          required: (specStr * 1.0).toFixed(1),
          coreCount: validRows.length,
        },
        notes,
        status,
      });
    } finally {
      setSaving(false);
    }
  };

  const LD_TABLE = [
    { ld: "0.95", cf: "0.980" }, { ld: "0.90", cf: "0.960" },
    { ld: "0.85", cf: "0.940" }, { ld: "0.80", cf: "0.920" },
    { ld: "0.75", cf: "0.890" }, { ld: "≥1.00", cf: "1.000 (no correction)" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <FlaskConical size={16} />
              <span>{ar ? "اختبارات الخرسانة" : "Concrete Tests"}</span>
              <span>/</span>
              <span className="font-medium text-slate-700">
                {ar ? "قوة الضغط لعينات الخرسانة اللبية" : "Compressive Strength of Concrete Cores"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {ar ? "قوة الضغط لعينات الخرسانة اللبية" : "Compressive Strength of Concrete Cores"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {ar ? "BS EN 12504-1 | أمر التوزيع:" : "BS EN 12504-1 | Distribution:"}{" "}
              {dist?.distributionCode ?? `DIST-${distId}`}
            </p>
          </div>
          <div className="flex gap-2">
            {submitted ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setLocation("/technician")}>
                  {ar ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 gap-1.5"
                  onClick={() => window.open(`/test-report/${distId}`, "_blank")}
                >
                  <Printer size={14} />
                  {ar ? "طباعة التقرير / PDF" : "Print Report / PDF"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={saving}>
                  {ar ? "حفظ مسودة" : "Save Draft"}
                </Button>
                <Button size="sm" onClick={() => handleSave("submitted")} disabled={saving}>
                  <Send size={14} className="mr-1.5" />
                  {saving ? (ar ? "جاري الإرسال..." : "Submitting...") : (ar ? "إرسال النتائج" : "Submit Results")}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* General Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{ar ? "معلومات الاختبار" : "Test Information"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">
                  {ar ? "مقاومة المكعب المحددة (نيوتن/مم²)" : "Specified Cube Strength (N/mm²)"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={specifiedStrength}
                  onChange={e => setSpecifiedStrength(e.target.value)}
                  placeholder={ar ? "مثال: 30" : "e.g. 30"}
                  className="font-mono"
                  disabled={submitted}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">{ar ? "نوع اللب" : "Core Type"}</Label>
                <Select value={coreType} onValueChange={setCoreType} disabled={submitted}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Drilled Core">{ar ? "لب محفور" : "Drilled Core"}</SelectItem>
                    <SelectItem value="Cut Core">{ar ? "لب مقطوع" : "Cut Core"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">{ar ? "حالة سطح النهاية" : "End Condition"}</Label>
                <Select value={endCondition} onValueChange={setEndCondition} disabled={submitted}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="as-drilled">{ar ? "كما حفر (As-Drilled)" : "As-Drilled"}</SelectItem>
                    <SelectItem value="grinded">{ar ? "مطحون (Grinded)" : "Grinded"}</SelectItem>
                    <SelectItem value="capped">{ar ? "مغطى (Capped)" : "Capped"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">{ar ? "نوع الهيكل" : "Structure Type"}</Label>
                <Input
                  value={structureType}
                  onChange={e => setStructureType(e.target.value)}
                  placeholder={ar ? "مثال: عمود، بلاطة، جدار" : "e.g. Column, Slab, Wall"}
                  disabled={submitted}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">{ar ? "تاريخ الصب" : "Date Cast"}</Label>
                <Input type="date" value={castDate} onChange={e => setCastDate(e.target.value)} disabled={submitted} />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">{ar ? "تاريخ الفحص" : "Test Date"}</Label>
                <Input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} disabled={submitted} />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">{ar ? "العمر (يوم)" : "Age (days)"}</Label>
                <div className="h-10 flex items-center px-3 rounded-md border bg-slate-50 text-sm font-mono font-semibold">
                  {ageDays !== null && ageDays >= 0 ? ageDays : "—"}
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">{ar ? "الفاحص" : "Tested By"}</Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <UserCheck size={14} className="text-green-600 shrink-0" />
                  <span className="text-sm font-semibold text-green-800">{user?.name ?? "—"}</span>
                </div>
              </div>
              <div className="flex items-end col-span-2 md:col-span-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 w-full space-y-1">
                  <div>
                    <Info size={12} className="inline mr-1" />
                    {ar
                      ? `ناجح: قوة المكعب المكافئة ≥ 100% من المحدد (${specStr.toFixed(1)} N/mm²) — BS EN 12504-1`
                      : `Pass: Eq. cube strength ≥ 100% of specified (${specStr.toFixed(1)} N/mm²) — BS EN 12504-1`}
                  </div>
                  <div className="text-amber-700">
                    <Info size={12} className="inline mr-1" />
                    {ar
                      ? "تنبيه: عند L/D = 2 تُعتبر النتيجة قوة أسطوانة (Cylinder Strength) وليس قوة مكعب مكافئة"
                      : "Note: When L/D = 2, the result is Cylinder Strength — not equivalent cube strength"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cores Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{ar ? "نتائج اختبار اللب" : "Core Test Results"}</CardTitle>
              {!submitted && (
                <Button variant="outline" size="sm" onClick={addRow}>
                  <Plus size={14} className="mr-1" /> {ar ? "إضافة عينة" : "Add Core"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {[
                    { en: "Core No.", ar: "رقم اللب" },
                    { en: "Location", ar: "الموقع" },
                    { en: "Dia. (mm)", ar: "القطر (مم)" },
                    { en: "Length (mm)", ar: "الطول (مم)" },
                    { en: "L after cap (mm)", ar: "الطول بعد التغطية (مم)" },
                    { en: "Mass (g)", ar: "الكتلة (غ)" },
                    { en: "Density (kg/m³)", ar: "الكثافة (كغ/م³)" },
                    { en: "Max Load (kN)", ar: "الحمل الأقصى (كن)" },
                    { en: "Area (mm²)", ar: "المساحة (مم²)" },
                    { en: "L/D", ar: "L/D" },
                    { en: "CF", ar: "عامل التصحيح" },
                    { en: "Core Str. (N/mm²)", ar: "قوة اللب (نيوتن/مم²)" },
                    { en: "Eq. Cube Str. (N/mm²)", ar: "قوة المكعب المكافئة (نيوتن/مم²)" },
                    { en: "Result", ar: "النتيجة" },
                    { en: "", ar: "" },
                  ].map(h => (
                    <th
                      key={h.en}
                      className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-600 whitespace-nowrap"
                    >
                      {ar ? h.ar : h.en}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {computedRows.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="border border-slate-200 px-1 py-1">
                      <Input
                        value={row.coreNo}
                        onChange={e => updateRow(row.id, "coreNo", e.target.value)}
                        className="h-7 text-xs w-14"
                        disabled={submitted}
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1">
                      <Input
                        value={row.location}
                        onChange={e => updateRow(row.id, "location", e.target.value)}
                        className="h-7 text-xs w-28"
                        placeholder={ar ? "مرجع الشبكة" : "Grid ref."}
                        disabled={submitted}
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1">
                      <Input
                        value={row.diameter}
                        onChange={e => updateRow(row.id, "diameter", e.target.value)}
                        className="h-7 text-xs w-16 text-center font-mono"
                        disabled={submitted}
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1">
                      <Input
                        value={row.length}
                        onChange={e => updateRow(row.id, "length", e.target.value)}
                        className="h-7 text-xs w-20 text-center font-mono"
                        placeholder="—"
                        disabled={submitted}
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1">
                      <Input
                        value={row.lengthAfterCap}
                        onChange={e => updateRow(row.id, "lengthAfterCap", e.target.value)}
                        className="h-7 text-xs w-20 text-center font-mono"
                        placeholder="—"
                        disabled={submitted}
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1">
                      <Input
                        value={row.mass}
                        onChange={e => updateRow(row.id, "mass", e.target.value)}
                        className="h-7 text-xs w-20 text-center font-mono"
                        placeholder="—"
                        disabled={submitted}
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center font-mono text-xs text-slate-600">
                      {row.density != null ? row.density : "—"}
                    </td>
                    <td className="border border-slate-200 px-1 py-1">
                      <Input
                        value={row.maxLoad}
                        onChange={e => updateRow(row.id, "maxLoad", e.target.value)}
                        className="h-7 text-xs w-20 text-center font-mono"
                        placeholder="—"
                        disabled={submitted}
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center font-mono text-xs text-slate-600">
                      {row.area ?? "—"}
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center font-mono text-xs text-slate-600">
                      {row.ld ?? "—"}
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center font-mono text-xs text-slate-600">
                      {row.correctionFactor ?? "—"}
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center font-mono text-xs font-semibold">
                      {row.coreStrength ?? "—"}
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center font-mono text-xs font-bold text-slate-800">
                      {row.equivalentCubeStrength != null ? (
                        <span title={row.isCylinderStrength ? (ar ? "قوة أسطوانة (L/D=2)" : "Cylinder strength (L/D=2)") : undefined}>
                          {row.equivalentCubeStrength}
                          {row.isCylinderStrength && <sup className="text-amber-600 text-[9px] ml-0.5">cyl</sup>}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center">
                      {row.result && row.result !== "pending" ? (
                        <PassFailBadge result={row.result} size="sm" />
                      ) : "—"}
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center">
                      {!submitted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 1}
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* L/D Reference */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              {ar
                ? "عوامل تصحيح L/D (BS EN 12504-1) — عند L/D = 1.0: لا يلزم تصحيح (CF = 1.000)"
                : "L/D Correction Factors (BS EN 12504-1) — No correction when L/D ≥ 1.0 (CF = 1.000)"}
            </p>
            <div className="flex gap-6 flex-wrap">
              {LD_TABLE.map(({ ld, cf }) => (
                <div key={ld} className="text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-700">L/D = {ld}</span>: CF = {cf}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {validRows.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{ar ? "ملخص" : "Summary"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center border">
                  <p className="text-xs text-slate-500 mb-1">{ar ? "عدد اللبابات المختبرة" : "No. of Cores Tested"}</p>
                  <p className="text-3xl font-bold text-slate-800">{validRows.length}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center border">
                  <p className="text-xs text-slate-500 mb-1">{ar ? "متوسط قوة المكعب المكافئة" : "Avg. Eq. Cube Strength"}</p>
                  <p className="text-3xl font-bold text-slate-800">{avgEqStrength.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">N/mm²</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center border">
                  <p className="text-xs text-slate-500 mb-1">
                    {ar ? `المطلوب (100% من ${specStr})` : `Required (100% of ${specStr})`}
                  </p>
                  <p className="text-3xl font-bold text-slate-800">{specStr.toFixed(1)}</p>
                  <p className="text-xs text-slate-400">N/mm²</p>
                </div>
              </div>
              <ResultBanner
                result={overallResult}
                testName={ar ? "قوة الضغط لعينات الخرسانة اللبية" : "Compressive Strength of Concrete Cores"}
                standard="BS EN 12504-1"
              />
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardContent className="pt-4">
            <Label className="text-xs text-slate-500 mb-1 block">
              {ar ? "ملاحظات الاختبار / الملاحظات" : "Test Notes / Observations"}
            </Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={ar ? "أدخل أي ملاحظات أو حالات شاذة أو معلومات إضافية..." : "Enter any observations, anomalies, or additional information..."}
              rows={3}
              disabled={submitted}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
