import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X, Download, Loader2 } from "lucide-react";
import { generatePdfFromElement } from "@/lib/pdf";

// --- Helpers ---
function fmt(val: string | null | undefined, decimals = 2): string {
  if (!val) return "";
  const n = parseFloat(val);
  return isNaN(n) ? "" : n.toFixed(decimals);
}
// Round to nearest 0.5 N/mm² (BS 1881 Part 116)
function fmtStrength(val: string | null | undefined): string {
  if (!val) return "";
  const n = parseFloat(val);
  if (isNaN(n)) return "";
  return (Math.round(n * 2) / 2).toFixed(1);
}
// Round to nearest 10 kg/m³ (BS 1881 Part 114)
function fmtDensity(val: string | null | undefined): string {
  if (!val) return "";
  const n = parseFloat(val);
  if (isNaN(n)) return "";
  return (Math.round(n / 10) * 10).toString();
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
}

// ─── Concrete compliance helpers (age-based) ────────────────────────────────────────────
// Concrete strength percentage guidelines (approximate):
// 1d=16%, 3d=40%, 7d=65%, 14d=90%, 28d=99%, 56d+=105%
function getRequiredStrengthReport(targetMpa: number, actualAge: number): number {
  if (actualAge <= 1)  return targetMpa * 0.16;
  if (actualAge <= 3)  return targetMpa * 0.40;
  if (actualAge <= 7)  return targetMpa * 0.65;
  if (actualAge <= 14) return targetMpa * 0.90;
  if (actualAge <= 28) return targetMpa * 0.99;
  return targetMpa * 1.05; // 56+ days
}

function getEffectiveAgeReport(actualAge: number, groupAge: number): number {
  if (actualAge <= groupAge) return groupAge;
  const milestones = [1, 3, 7, 14, 28, 56];
  for (const m of milestones) { if (actualAge <= m) return m; }
  return actualAge;
}

function calcCubeAgeReport(castingDateStr: string | null | undefined, testDateStr: string | null | undefined): number | null {
  if (!castingDateStr || !testDateStr) return null;
  const casting = new Date(castingDateStr);
  const tested = new Date(testDateStr);
  if (isNaN(casting.getTime()) || isNaN(tested.getTime())) return null;
  const diffMs = tested.getTime() - casting.getTime();
  if (diffMs < 0) return null;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getAgePctReport(age: number): number {
  if (age <= 1)  return 16;
  if (age <= 3)  return 40;
  if (age <= 7)  return 65;
  if (age <= 14) return 90;
  if (age <= 28) return 99;
  return 105;
}
// Extract target strength from classOfConcrete string e.g. "C40/20 35%OPC" → 40
function extractTargetFromClass(classStr: string | null | undefined): number | null {
  if (!classStr) return null;
  const m = classStr.match(/C(\d+)/i);
  return m ? parseFloat(m[1]) : null;
}
// ─── Single Report Page (one age group = one page) ────────────────────────────
function ReportPage({ group, refNo, castingDate: distCastingDate }: { group: any; refNo: string; castingDate?: Date | string | null }) {
  const cubes: any[] = group.cubes ?? [];
  const avg = group.avgCompressiveStrength ? parseFloat(group.avgCompressiveStrength) : null;
  // Use minAcceptable from DB; fallback to extracting from classOfConcrete
  const targetMpa = group.minAcceptable
    ? parseFloat(group.minAcceptable)
    : extractTargetFromClass(group.classOfConcrete);
  const testAge = group.testAge ?? 28;
  // Casting date: prefer distribution-level castingDate (from sample), fallback to group batchDateTime
  const castingDate = distCastingDate
    ? (distCastingDate instanceof Date ? distCastingDate.toISOString() : String(distCastingDate))
    : (group.batchDateTime ? group.batchDateTime.split(' ')[0] : null);
  // Group-level:28d+ uses f_ck on average; earlier ages use % of f_ck
  const requiredMpa =
    targetMpa != null && testAge >= 28 ? targetMpa : targetMpa != null ? getRequiredStrengthReport(targetMpa, testAge) : null;
  const agePct = getAgePctReport(testAge);
  // Per-cube compliance
  const cubesWithAge = cubes.map(c => {
    const actualAge = calcCubeAgeReport(castingDate, c.dateTested);
    const effectiveAge = actualAge !== null ? getEffectiveAgeReport(actualAge, testAge) : testAge;
    const cubeRequiredEarly = targetMpa && testAge < 28 ? getRequiredStrengthReport(targetMpa, effectiveAge) : null;
    const s = parseFloat(c.compressiveStrengthMpa ?? "0");
    let autoFail = false;
    if (s > 0 && c.withinSpec !== true) {
      if (testAge >= 28 && targetMpa != null) autoFail = s < targetMpa - 4;
      else if (cubeRequiredEarly != null) autoFail = s < cubeRequiredEarly;
    }
    const isFail = c.withinSpec === true ? false : autoFail;
    const isPass = c.withinSpec === true
      ? true
      : s > 0 && (
          (testAge >= 28 && targetMpa != null && s >= targetMpa - 4)
          || (testAge < 28 && cubeRequiredEarly != null && s >= cubeRequiredEarly)
        );
    return { ...c, actualAge, effectiveAge, cubeRequired: cubeRequiredEarly, isFail, isPass };
  });

  const withinSpec = cubesWithAge.filter(c => c.isPass && parseFloat(c.compressiveStrengthMpa ?? "0") > 0);
  const outsideSpec = cubesWithAge.filter(c => c.isFail && parseFloat(c.compressiveStrengthMpa ?? "0") > 0);
  const strengthsForAvg = cubes.map(c => parseFloat(c.compressiveStrengthMpa ?? "0")).filter(v => v > 0);
  const minCubeStr = strengthsForAvg.length ? Math.min(...strengthsForAvg) : null;
  const avgPass =
    avg !== null && targetMpa != null && testAge >= 28
      ? avg >= targetMpa && (minCubeStr == null || minCubeStr >= targetMpa - 4)
      : avg !== null && requiredMpa !== null
        ? avg >= requiredMpa
        : null;

  return (
    <div className="report-page bg-white p-8 print:p-6" style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", minHeight: "297mm", width: "210mm" }}>
      {/* Top Reference Box */}
      <div className="flex justify-end mb-1">
        <table className="border-collapse border border-black text-center" style={{ minWidth: "160px" }}>
          <tbody>
            <tr>
              <td className="border border-black px-3 py-1 font-bold text-xs">Reference</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-2 font-bold text-sm">{refNo}</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-1 font-bold text-xs">Date</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-1 text-xs">{new Date().toLocaleDateString("en-GB")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Title */}
      <div className="text-center font-bold text-base border border-black py-2 mb-1 bg-gray-100">
        LABORATORY TEST REPORT
      </div>

      {/* Subtitle */}
      <div className="text-center font-bold text-xs border border-black py-1 mb-3">
        COMPRESSIVE STRENGTH OF CONCRETE CUBES TO BS 1881; PART 114 &amp; 116: 1983
      </div>

      {/* Project Info Grid */}
      <table className="w-full border-collapse border border-black mb-1 text-xs">
        <tbody>
          <tr>
            <td className="border border-black px-2 py-1 w-1/4">CONTRACT NO:</td>
            <td className="border border-black px-2 py-1 w-1/4 font-semibold">{group.contractNo ?? ""}</td>
            <td className="border border-black px-2 py-1 w-1/4">REGION :</td>
            <td className="border border-black px-2 py-1 w-1/4 font-semibold">{group.region ?? ""}</td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">PROJECT:</td>
            <td className="border border-black px-2 py-1 font-semibold">{group.projectName ?? ""}</td>
            <td className="border border-black px-2 py-1">CONSULTANT:</td>
            <td className="border border-black px-2 py-1 font-semibold">{group.consultant ?? ""}</td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">CONTRACTOR:</td>
            <td className="border border-black px-2 py-1 font-semibold">{group.contractorName ?? ""}</td>
            <td className="border border-black px-2 py-1">CSC REF.</td>
            <td className="border border-black px-2 py-1 font-semibold">{group.cscRef ?? ""}</td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">LOCATION:</td>
            <td className="border border-black px-2 py-1 font-semibold">{group.location ?? ""}</td>
            <td className="border border-black px-2 py-1">Place of Sampling</td>
            <td className="border border-black px-2 py-1 font-semibold">{group.placeOfSampling ?? ""}</td>
          </tr>
        </tbody>
      </table>

      {/* Source/Batch/Slump row */}
      <table className="w-full border-collapse border border-black mb-1 text-xs">
        <tbody>
          <tr>
            <td className="border border-black px-2 py-1 w-1/4">SOURCE/SUPPLIER :</td>
            <td className="border border-black px-2 py-1 w-1/4 font-semibold">{group.sourceSupplier ?? ""}</td>
            <td className="border border-black px-2 py-1 w-1/4 text-center">Date of Casting</td>
            <td className="border border-black px-2 py-1 w-1/4 font-semibold">{fmtDate(distCastingDate ?? group.batchDateTime)}</td>
          </tr>
        </tbody>
      </table>

      {/* Class / Slump row */}
      <table className="w-full border-collapse border border-black mb-1 text-xs">
        <tbody>
          <tr>
            <td className="border border-black px-2 py-1 w-2/3">
              Class of Concrete: <strong>{group.classOfConcrete ?? ""}</strong>
            </td>
            <td className="border border-black px-2 py-1 w-1/3">
              Max Agg. Size Site <strong>{group.maxAggSize ?? ""}</strong>
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">
              Nominal Size of Cube: <strong>{group.nominalCubeSize ?? "150mm"}</strong>
            </td>
            <td className="border border-black px-2 py-1">
              Method of compaction: <strong>{group.methodOfCompaction ?? "Using Compacting Bar"}</strong>
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">
              Appearance of sample when received: <strong>{group.appearance ?? "Normal"}</strong>
            </td>
            <td className="border border-black px-2 py-1">
              Date of Casting: <strong>{fmtDate(distCastingDate ?? group.dateSampled ?? group.batchDateTime)}</strong>
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">
              Moisture condition at testing: <strong>{group.moistureCondition ?? "Saturated"}</strong>
            </td>
            <td className="border border-black px-2 py-1">
              Sampled By: <strong>{group.sampledBy ?? "Contractor"}</strong>
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">
              Removal of Fins (if present): <strong>{group.removalOfFins ?? "Using Steel File"}</strong>
            </td>
            <td className="border border-black px-2 py-1">
              Curing Method*: <strong>{group.curingMethod ?? "BS 1881 Part 111: 1983"}</strong>
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1">
              Volume Determination: <strong>{group.volumeDetermination ?? "By Calculation"}</strong>
            </td>
            <td className="border border-black px-2 py-1">
              Tested by: <strong>{group.testedBy ?? ""}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Results Table */}
      <table className="w-full border-collapse border border-black text-xs mb-1">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-1 py-1 text-center" rowSpan={2}>Mark<br />No.</th>
            <th className="border border-black px-1 py-1 text-center" rowSpan={2}>Cube ID</th>
            <th className="border border-black px-1 py-1 text-center" rowSpan={2}>Date<br />Tested</th>
            <th className="border border-black px-1 py-1 text-center" rowSpan={2}>Test<br />Age,<br />Days</th>
            <th className="border border-black px-1 py-1 text-center" colSpan={3}>Average Dimensions, mm</th>
            <th className="border border-black px-1 py-1 text-center" rowSpan={2}>Mass of<br />Specimen,<br />Saturated-kg</th>
            <th className="border border-black px-1 py-1 text-center" rowSpan={2}>Density,<br />Saturated-<br />kg/m³</th>
            <th className="border border-black px-1 py-1 text-center" rowSpan={2}>Max. Load<br />at Failure,<br />kN</th>
            <th className="border border-black px-1 py-1 text-center" rowSpan={2}>Compressive<br />Strength,<br />N/mm²</th>
            <th className="border border-black px-1 py-1 text-center" rowSpan={2}>Avg.<br />Compressive<br />Strength, N/mm²</th>
            <th className="border border-black px-1 py-1 text-center" rowSpan={2}>Type of<br />Fracture</th>
          </tr>
          <tr className="bg-gray-100">
            <th className="border border-black px-1 py-1 text-center">Length</th>
            <th className="border border-black px-1 py-1 text-center">Width</th>
            <th className="border border-black px-1 py-1 text-center">Height</th>
          </tr>
        </thead>
        <tbody>
          {cubesWithAge.map((cube, idx) => {
            const isLast = idx === cubesWithAge.length - 1;
            const strength = fmtStrength(cube.compressiveStrengthMpa);
            const density = fmtDensity(cube.densityKgM3);
            const { isFail, isPass, actualAge, effectiveAge } = cube;
            const rowBg = isFail ? "bg-red-50" : isPass ? "bg-green-50" : "";
            return (
              <tr key={cube.id ?? idx} className={rowBg}>
                <td className="border border-black px-1 py-1 text-center">{cube.markNo}</td>
                <td className="border border-black px-1 py-1 text-center">{cube.cubeId ?? ""}</td>
                <td className="border border-black px-1 py-1 text-center">{fmtDate(cube.dateTested)}</td>
                <td className="border border-black px-1 py-1 text-center">
                  {actualAge !== null ? (
                    <span title={effectiveAge !== actualAge ? `Evaluated as ${effectiveAge}-day band` : undefined}
                      style={effectiveAge !== actualAge ? { color: '#c2410c' } : {}}>
                      {actualAge}{effectiveAge !== actualAge ? `→${effectiveAge}` : ''}
                    </span>
                  ) : group.testAge}
                </td>
                <td className="border border-black px-1 py-1 text-center">{fmt(cube.length, 0)}</td>
                <td className="border border-black px-1 py-1 text-center">{fmt(cube.width, 0)}</td>
                <td className="border border-black px-1 py-1 text-center">{fmt(cube.height, 0)}</td>
                <td className="border border-black px-1 py-1 text-center">{fmt(cube.massKg, 3)}</td>
                <td className="border border-black px-1 py-1 text-center">{density}</td>
                <td className="border border-black px-1 py-1 text-center font-semibold">{fmt(cube.maxLoadKN, 1)}</td>
                <td className={`border border-black px-1 py-1 text-center font-bold ${isFail ? "text-red-700" : isPass ? "text-green-700" : ""}`}>
                  {strength}
                </td>
                <td className="border border-black px-1 py-1 text-center font-bold">
                  {isLast && avg !== null ? (Math.round(avg * 2) / 2).toFixed(1) : ""}
                </td>
                <td className="border border-black px-1 py-1 text-center">{cube.fractureType ?? ""}</td>
              </tr>
            );
          })}
          {/* Empty rows to match original format */}
          {cubes.length < 3 && Array.from({ length: 3 - cubes.length }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-black px-1 py-2 text-center">{cubes.length + i + 1}</td>
              {Array.from({ length: 12 }).map((_, j) => (
                <td key={j} className="border border-black px-1 py-2"></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Comments */}
      <div className="border border-black p-2 mb-2 min-h-12">
        <span className="underline font-semibold">Comments/Remarks</span>
        <p className="mt-1 text-xs">{group.comments ?? ""}</p>
      </div>

      {/* Signatures */}
      <div className="flex justify-between items-end mb-2">
        <div className="text-xs text-gray-400 italic">
          <p>Type of Fracture : SF - Satisfactory, USF - Unsatisfactory</p>
          <p>* Curing before delivery to lab was performed outside the control of the laboratory</p>
        </div>
        <div className="text-right text-xs">
          <p className="font-semibold">مدني مهندس</p>
          <p className="font-semibold">ركن المختبر</p>
          <p className="font-bold mt-1">عادل محمد الزيني</p>
        </div>
      </div>

      {/* Auto-note when technician manually overrides withinSpec for cubes below auto threshold */}
      {(() => {
        const manualOverrides = cubes.filter(c => {
          if (c.withinSpec !== true) return false;
          const s = parseFloat(c.compressiveStrengthMpa ?? "");
          if (!s || targetMpa === null) return false;
          const thresh = testAge >= 28 ? targetMpa - 4 : (requiredMpa ?? targetMpa);
          return s < thresh;
        });
        if (manualOverrides.length === 0) return null;
        const strengths = manualOverrides.map(c => fmtStrength(c.compressiveStrengthMpa)).join(", ");
        return (
          <div className="text-xs italic text-gray-600 border border-gray-400 bg-gray-50 p-2 mb-2">
            ** Results {strengths} N/mm² accepted within specification limits based on technician assessment.
          </div>
        );
      })()}
      {/* Spec Limits Summary */}
      <div className="text-xs border-t border-black pt-1 space-y-1">
        {requiredMpa !== null && targetMpa !== null && (
          <div className="font-semibold text-gray-700">
            {testAge >= 28 ? (
              <>
                Acceptance (BS EN 12390-3 / 206): average ≥ {targetMpa.toFixed(1)} N/mm²; each cube ≥
                {" "}{(targetMpa - 4).toFixed(1)} N/mm²
              </>
            ) : (
              <>
                Required Strength at {testAge} days ({agePct}% of {targetMpa} N/mm²):
                <span className="text-blue-700 ml-1">{requiredMpa.toFixed(1)} N/mm²</span>
              </>
            )}
            {avgPass !== null && (
              <span className={`ml-3 font-bold ${avgPass ? "text-green-700" : "text-red-600"}`}>
                {avgPass ? "✓ PASS" : "✗ FAIL"}
              </span>
            )}
          </div>
        )}
        <div className="flex justify-between">
          <div>
            <span className="font-semibold">Results Within Specification Limits: </span>
            <span className="font-bold text-green-700">
              {withinSpec.map(c => fmtStrength(c.compressiveStrengthMpa)).join(", ")}
              {withinSpec.length > 0 ? " N/mm²" : "—"}
            </span>
          </div>
          <div>
            <span className="font-semibold">Results Outside Specification Limits: </span>
            <span className="font-bold text-red-600">
              {outsideSpec.map(c => fmtStrength(c.compressiveStrengthMpa)).join(", ")}
              {outsideSpec.length > 0 ? " N/mm²" : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Report Page ─────────────────────────────────────────────────────────
export default function ConcreteReport() {
  const { distributionId } = useParams<{ distributionId: string }>();
  const distId = parseInt(distributionId ?? "0");
  const printRef = useRef<HTMLDivElement>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);

  // Close this tab (opened via window.open) instead of navigating away
  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      window.history.back();
    }
  };

  const { data: distribution } = trpc.distributions.get.useQuery(
    { id: distId },
    { enabled: distId > 0 }
  );

  const { data: groups = [], isLoading } = trpc.concrete.groupsByDistribution.useQuery(
    { distributionId: distId },
    { enabled: distId > 0 }
  );

  const handlePrint = async () => {
    if (!printRef.current) return window.print();
    setIsPdfLoading(true);
    const ok = await generatePdfFromElement(printRef.current, {
      filename: `concrete-report-${refNo}`,
      mode: "print",
    });
    if (!ok) window.print();
    setIsPdfLoading(false);
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsDownloadLoading(true);
    const ok = await generatePdfFromElement(printRef.current, {
      filename: `concrete-report-${refNo}`,
      mode: "download",
    });
    if (!ok) window.print();
    setIsDownloadLoading(false);
  };

  // Auto-print when opened in a new tab
  useEffect(() => {
    if (!isLoading && (groups as any[]).length > 0 && window.opener) {
      const timer = setTimeout(() => handlePrint(), 600);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading report...</p>
      </div>
    );
  }

  const refNo = distribution?.distributionCode ?? `DIST-${distId}`;

  return (
    <>
      {/* Print Controls — hidden when printing */}
      <div className="print:hidden bg-gray-800 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-gray-700"
            onClick={handleClose}>
            <X className="w-4 h-4 mr-1" /> Close
          </Button>
          <span className="text-sm text-gray-300">
            Concrete Compression Test Report — {refNo}
          </span>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload} disabled={isDownloadLoading} variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 gap-2">
            {isDownloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </Button>
          <Button onClick={handlePrint} disabled={isPdfLoading} className="bg-blue-600 hover:bg-blue-700 gap-2">
            {isPdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={printRef} className="bg-gray-200 print:bg-white min-h-screen py-6 print:py-0">
        {(groups as any[]).length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No test results found. Please enter results first.
          </div>
        ) : (
          (groups as any[]).map((group: any, idx: number) => (
            <div key={group.id} className={`mx-auto mb-6 shadow-lg print:shadow-none print:mb-0 ${idx > 0 ? "print:page-break-before" : ""}`}
              style={{ width: "210mm" }}>
              <ReportPage group={group} refNo={refNo} castingDate={distribution?.castingDate} />
            </div>
          ))
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: white !important; }
          .print\\:page-break-before { page-break-before: always; }
          .report-page { page-break-inside: avoid; }
        }
      `}</style>
    </>
  );
}
