/**
 * Seeds lab test catalog rows into `test_types` (codes + form templates for Reception & TestRouter).
 * Idempotent: ON DUPLICATE KEY UPDATE refreshes labels/templates by `code`.
 *
 * Run: pnpm run db:seed:test-types   (loads `test_types` so Reception can filter by category = sampleType)
 * Requires DATABASE_URL in .env
 */
import "dotenv/config";
import { testTypes } from "../../drizzle/schema";
import { getDb } from "../db";

type Cat = "concrete" | "soil" | "steel" | "asphalt" | "aggregates";

const ROWS: Array<{
  category: Cat;
  nameEn: string;
  nameAr: string;
  code: string;
  unitPrice: string;
  unit: string;
  standardRef: string | null;
  formTemplate: string;
  sortOrder: number;
}> = [
  // Default AED prices: edit here or in DB / TestTypesManagement. Documented examples: CONC_CUBE 15, CONC_CORE 20, CONC_BLOCK 30, beams 80/100, STEEL_REBAR 300, SOIL_PROCTOR 300.
  // ─── Concrete ─────────────────────────────────────────────
  { category: "concrete", nameEn: "Concrete Cube Compression", nameAr: "ضغط مكعبات الخرسانة", code: "CONC_CUBE", unitPrice: "15", unit: "N/mm²", standardRef: "BS EN 12390-3", formTemplate: "concrete_cubes", sortOrder: 10 },
  { category: "concrete", nameEn: "Concrete Core Compression", nameAr: "ضغط نواة خرسانية", code: "CONC_CORE", unitPrice: "20", unit: "N/mm²", standardRef: "BS EN 12504-1", formTemplate: "concrete_cores", sortOrder: 20 },
  { category: "concrete", nameEn: "Concrete Blocks", nameAr: "بلوك خرساني", code: "CONC_BLOCK", unitPrice: "30", unit: "N/mm²", standardRef: "BS EN 771-3", formTemplate: "concrete_blocks", sortOrder: 30 },
  { category: "concrete", nameEn: "Interlocking Pavers", nameAr: "بلاط انترلوك", code: "CONC_INTERLOCK", unitPrice: "25", unit: "N/mm²", standardRef: "BS EN 1338", formTemplate: "interlock", sortOrder: 40 },
  { category: "concrete", nameEn: "Foam Concrete / Lightweight", nameAr: "خرسانة رغوية", code: "CONC_FOAM", unitPrice: "45", unit: "kg/m³", standardRef: "—", formTemplate: "concrete_foam", sortOrder: 50 },
  { category: "concrete", nameEn: "Foam Concrete Density", nameAr: "كثافة خرسانة رغوية", code: "CONC_FOAM_DENSITY", unitPrice: "40", unit: "kg/m³", standardRef: "—", formTemplate: "concrete_foam", sortOrder: 51 },
  { category: "concrete", nameEn: "Foam Concrete Cube", nameAr: "مكعب خرسانة رغوية", code: "CONC_FOAM_CUBE", unitPrice: "15", unit: "N/mm²", standardRef: "—", formTemplate: "concrete_foam", sortOrder: 52 },
  { category: "concrete", nameEn: "Cement Setting Time", nameAr: "زمن تصلب الأسمنت", code: "CEM_SETTING_TIME", unitPrice: "50", unit: "min", standardRef: "ASTM C191 / BS EN 196-3", formTemplate: "cement_setting_time", sortOrder: 60 },
  { category: "concrete", nameEn: "Mortar Sand (Sieve)", nameAr: "رمل ملاط (مناخل)", code: "CONC_MORTAR_SAND", unitPrice: "55", unit: "%", standardRef: "BS EN 13139", formTemplate: "sieve_analysis", sortOrder: 70 },
  { category: "concrete", nameEn: "Concrete Beam (Small)", nameAr: "عتة خرسانية صغيرة", code: "CONC_BEAM_SMALL", unitPrice: "80", unit: "kN", standardRef: "BS EN 12390-5", formTemplate: "concrete_beam", sortOrder: 80 },
  { category: "concrete", nameEn: "Concrete Beam (Large)", nameAr: "عتة خرسانية كبيرة", code: "CONC_BEAM_LARGE", unitPrice: "100", unit: "kN", standardRef: "BS EN 12390-5", formTemplate: "concrete_beam", sortOrder: 81 },
  { category: "concrete", nameEn: "Mix Aggregate Gradation", nameAr: "تدرج ركام الخلطة", code: "CONC_MIX_GRAD", unitPrice: "65", unit: "%", standardRef: "ASTM C33 / BS EN 12620", formTemplate: "concrete_mix_grad", sortOrder: 90 },
  // ─── Soil (labels/prices aligned with lab catalog — e.g. Sieve 100 / Atterberg 150 / Proctor 300 AED)
  { category: "soil", nameEn: "Sieve Analysis of Soil", nameAr: "تحليل المناخل للتربة", code: "SOIL_SIEVE", unitPrice: "100", unit: "%", standardRef: "BS 1377", formTemplate: "sieve_analysis", sortOrder: 100 },
  { category: "soil", nameEn: "Atterberg Limits of Soil (Plasticity Index)", nameAr: "حدود أتربرج للتربة (مؤشر اللدونة)", code: "SOIL_ATTERBERG", unitPrice: "150", unit: "%", standardRef: "BS 1377-2", formTemplate: "soil_atterberg", sortOrder: 110 },
  { category: "soil", nameEn: "MDD/OMC (Proctor) test", nameAr: "اختبار بروكتور / MDD و OMC", code: "SOIL_PROCTOR", unitPrice: "300", unit: "kN/m³", standardRef: "BS 1377-4", formTemplate: "soil_proctor", sortOrder: 120 },
  { category: "soil", nameEn: "CBR", nameAr: "نسبة تحمل كاليفورنيا", code: "SOIL_CBR", unitPrice: "350", unit: "%", standardRef: "BS 1377-9", formTemplate: "soil_cbr", sortOrder: 130 },
  { category: "soil", nameEn: "Field Density", nameAr: "كثافة حقلية", code: "SOIL_FIELD_DENSITY", unitPrice: "200", unit: "Mg/m³", standardRef: "BS 1377-9", formTemplate: "soil_field_density", sortOrder: 140 },
  // ─── Steel ──────────────────────────────────────────────────
  { category: "steel", nameEn: "Steel Rebar Tensile", nameAr: "شد حديد التسليح", code: "STEEL_REBAR", unitPrice: "300", unit: "N/mm²", standardRef: "BS 4449", formTemplate: "steel_rebar", sortOrder: 200 },
  { category: "steel", nameEn: "Bend Test", nameAr: "اختبار الانحناء", code: "STEEL_BEND", unitPrice: "150", unit: "—", standardRef: "BS 4449", formTemplate: "steel_bend_rebend", sortOrder: 210 },
  { category: "steel", nameEn: "Rebend Test", nameAr: "إعادة الانحناء", code: "STEEL_REBEND", unitPrice: "150", unit: "—", standardRef: "BS 4449", formTemplate: "steel_bend_rebend", sortOrder: 211 },
  { category: "steel", nameEn: "Anchor Bolt", nameAr: "برغي تثبيت", code: "STEEL_ANCHOR", unitPrice: "200", unit: "kN", standardRef: "—", formTemplate: "steel_anchor_bolt", sortOrder: 220 },
  { category: "steel", nameEn: "Structural Steel", nameAr: "حديد إنشائي", code: "STEEL_STRUCTURAL", unitPrice: "280", unit: "N/mm²", standardRef: "BS EN 10025", formTemplate: "steel_structural", sortOrder: 230 },
  // ─── Asphalt ───────────────────────────────────────────────
  { category: "asphalt", nameEn: "Hot Bin Gradation", nameAr: "تدرج الخلاط الساخن", code: "ASPH_HOTBIN", unitPrice: "250", unit: "%", standardRef: "—", formTemplate: "asphalt_hotbin", sortOrder: 300 },
  { category: "asphalt", nameEn: "Bitumen Extraction", nameAr: "استخلاص البيتومين", code: "ASPH_BITUMEN_EXTRACT", unitPrice: "320", unit: "%", standardRef: "ASTM D2172", formTemplate: "asphalt_bitumen_extraction", sortOrder: 310 },
  { category: "asphalt", nameEn: "Extracted Aggregate Sieve", nameAr: "مناخل الركام المستخلص", code: "ASPH_EXTRACTED_SIEVE", unitPrice: "200", unit: "%", standardRef: "—", formTemplate: "asphalt_extracted_sieve", sortOrder: 320 },
  { category: "asphalt", nameEn: "Marshall Stability", nameAr: "مارشال", code: "ASPH_MARSHALL", unitPrice: "280", unit: "kN", standardRef: "ASTM D6927", formTemplate: "asphalt_marshall", sortOrder: 330 },
  { category: "asphalt", nameEn: "Marshall Density", nameAr: "كثافة مارشال", code: "ASPH_MARSHALL_DENSITY", unitPrice: "200", unit: "Mg/m³", standardRef: "ASTM D6927", formTemplate: "asphalt_marshall", sortOrder: 331 },
  { category: "asphalt", nameEn: "Marshall — ACWC (Wearing Course)", nameAr: "مارشال — طبقة رابطة", code: "ASPH_ACWC", unitPrice: "280", unit: "kN", standardRef: "ASTM D6927", formTemplate: "asphalt_marshall", sortOrder: 332 },
  { category: "asphalt", nameEn: "Marshall — ACBC (Binder Course)", nameAr: "مارشال — طبقة أساس", code: "ASPH_ACBC", unitPrice: "280", unit: "kN", standardRef: "ASTM D6927", formTemplate: "asphalt_marshall", sortOrder: 333 },
  { category: "asphalt", nameEn: "Marshall — DBM", nameAr: "مارشال — DBM", code: "ASPH_DBM", unitPrice: "280", unit: "kN", standardRef: "ASTM D6927", formTemplate: "asphalt_marshall", sortOrder: 334 },
  { category: "asphalt", nameEn: "Asphalt Core", nameAr: "نواة أسفلت", code: "ASPH_CORE", unitPrice: "220", unit: "Mg/m³", standardRef: "—", formTemplate: "asphalt_core", sortOrder: 340 },
  { category: "asphalt", nameEn: "Spray Rate (Bituminous)", nameAr: "معدل الرش", code: "ASPH_SPRAY", unitPrice: "180", unit: "L/m²", standardRef: "JKR / BS 594-1", formTemplate: "asphalt_spray_rate", sortOrder: 350 },
  { category: "asphalt", nameEn: "Spray Rate — SS-1", nameAr: "معدل رش SS-1", code: "ASPH_SPRAY_SS1", unitPrice: "180", unit: "L/m²", standardRef: "JKR", formTemplate: "asphalt_spray_rate", sortOrder: 351 },
  { category: "asphalt", nameEn: "Spray Rate — SS-1h", nameAr: "معدل رش SS-1h", code: "ASPH_SPRAY_SS1H", unitPrice: "180", unit: "L/m²", standardRef: "JKR", formTemplate: "asphalt_spray_rate", sortOrder: 352 },
  { category: "asphalt", nameEn: "Spray Rate — CRS-1", nameAr: "معدل رش CRS-1", code: "ASPH_SPRAY_CRS1", unitPrice: "180", unit: "L/m²", standardRef: "JKR", formTemplate: "asphalt_spray_rate", sortOrder: 353 },
  { category: "asphalt", nameEn: "Spray Rate — MC-30", nameAr: "معدل رش MC-30", code: "ASPH_SPRAY_MC30", unitPrice: "180", unit: "L/m²", standardRef: "JKR", formTemplate: "asphalt_spray_rate", sortOrder: 354 },
  { category: "asphalt", nameEn: "Spray Rate — MC-70", nameAr: "معدل رش MC-70", code: "ASPH_SPRAY_MC70", unitPrice: "180", unit: "L/m²", standardRef: "JKR", formTemplate: "asphalt_spray_rate", sortOrder: 355 },
  { category: "asphalt", nameEn: "Spray Rate — MC-250", nameAr: "معدل رش MC-250", code: "ASPH_SPRAY_MC250", unitPrice: "180", unit: "L/m²", standardRef: "JKR", formTemplate: "asphalt_spray_rate", sortOrder: 356 },
  { category: "asphalt", nameEn: "Spray Rate — Custom", nameAr: "معدل رش مخصص", code: "ASPH_SPRAY_CUSTOM", unitPrice: "180", unit: "L/m²", standardRef: "Project spec", formTemplate: "asphalt_spray_rate", sortOrder: 357 },
  // ─── Aggregates ───────────────────────────────────────────
  { category: "aggregates", nameEn: "Aggregate Sieve Analysis", nameAr: "مناخل الركام", code: "AGG_SIEVE", unitPrice: "120", unit: "%", standardRef: "BS EN 933-1", formTemplate: "sieve_analysis", sortOrder: 400 },
  { category: "aggregates", nameEn: "Specific Gravity & Absorption", nameAr: "الوزن النوعي والامتصاص", code: "AGG_SG", unitPrice: "100", unit: "—", standardRef: "BS EN 1097-6", formTemplate: "agg_specific_gravity", sortOrder: 410 },
  { category: "aggregates", nameEn: "Flakiness & Elongation Index", nameAr: "معامل التقشر والاستطالة", code: "AGG_FLAKINESS_ELONGATION", unitPrice: "100", unit: "%", standardRef: "BS EN 933-3 / -4", formTemplate: "agg_shape_index", sortOrder: 420 },
  { category: "aggregates", nameEn: "Aggregate Crushing Value (ACV)", nameAr: "قيمة التكسير ACV", code: "AGG_CRUSHING", unitPrice: "150", unit: "%", standardRef: "BS 812-110", formTemplate: "agg_crushing", sortOrder: 430 },
  { category: "aggregates", nameEn: "Aggregate Impact Value (AIV)", nameAr: "قيمة الصدم AIV", code: "AGG_IMPACT", unitPrice: "150", unit: "%", standardRef: "BS 812-112", formTemplate: "agg_impact", sortOrder: 440 },
  { category: "aggregates", nameEn: "Los Angeles Abrasion (LAA)", nameAr: "تآكل لوس أنجلوس", code: "AGG_LA", unitPrice: "150", unit: "%", standardRef: "BS EN 1097-2", formTemplate: "agg_la_abrasion", sortOrder: 450 },
  { category: "aggregates", nameEn: "Los Angeles Abrasion (alias)", nameAr: "تآكل لوس أنجلوس", code: "AGG_LA_ABRASION", unitPrice: "150", unit: "%", standardRef: "BS EN 1097-2", formTemplate: "agg_la_abrasion", sortOrder: 451 },
];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available. Set DATABASE_URL in .env");
    process.exit(1);
  }

  let n = 0;
  for (const row of ROWS) {
    await db
      .insert(testTypes)
      .values({
        category: row.category,
        nameEn: row.nameEn,
        nameAr: row.nameAr,
        code: row.code,
        unitPrice: row.unitPrice,
        unit: row.unit,
        standardRef: row.standardRef,
        formTemplate: row.formTemplate,
        isActive: true,
        sortOrder: row.sortOrder,
      })
      .onDuplicateKeyUpdate({
        set: {
          category: row.category,
          nameEn: row.nameEn,
          nameAr: row.nameAr,
          unitPrice: row.unitPrice,
          unit: row.unit,
          standardRef: row.standardRef,
          formTemplate: row.formTemplate,
          isActive: true,
          sortOrder: row.sortOrder,
          updatedAt: new Date(),
        },
      });
    n++;
  }

  console.log(`Seed test types: upserted ${n} rows (by code).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
