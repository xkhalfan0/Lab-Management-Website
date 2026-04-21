/**
 * Seeds 5 contractors, 5 sectors (if missing), and 5 projects (contracts) per contractor.
 * Each contractor's projects are spread across the 5 sectors (one project per sector).
 *
 * Idempotent: skips if contracts with numbers CON-SEED-2026-* already exist.
 *
 * Run: pnpm exec tsx server/scripts/seed-contractors-projects.ts
 * Requires DATABASE_URL in .env
 */
import "dotenv/config";
import { eq, like } from "drizzle-orm";
import { contractors, contracts } from "../../drizzle/schema";
import { createContract, createContractor, createSector, getDb, getSectorByKey } from "../db";

const SEED_TAG = "CON-SEED-2026";

const SECTOR_DEFS = [
  { sectorKey: "sector_north", nameEn: "North Region", nameAr: "القطاع الشمالي" },
  { sectorKey: "sector_south", nameEn: "South Region", nameAr: "القطاع الجنوبي" },
  { sectorKey: "sector_central", nameEn: "Central Region", nameAr: "القطاع المركزي" },
  { sectorKey: "sector_east", nameEn: "East Region", nameAr: "القطاع الشرقي" },
  { sectorKey: "sector_west", nameEn: "West Region", nameAr: "القطاع الغربي" },
] as const;

const CONTRACTOR_DEFS = [
  {
    nameEn: "Gulf Construction Co.",
    nameAr: "شركة الخليج للإنشاءات",
    code: "CON-SEED-GULF",
    contact: "Ahmed Al-Mansoori",
    phone: "+971501111001",
    email: "projects@gulf-construction.example.com",
  },
  {
    nameEn: "Emirates Building Materials LLC",
    nameAr: "شركة الإمارات لمواد البناء",
    code: "CON-SEED-EBM",
    contact: "Fatima Al-Zaabi",
    phone: "+971502222002",
    email: "ops@ebm-materials.example.com",
  },
  {
    nameEn: "Al Watan Infrastructure",
    nameAr: "الوطن للبنية التحتية",
    code: "CON-SEED-WATAN",
    contact: "Omar Hassan",
    phone: "+971503333003",
    email: "contracts@alwatan-infra.example.com",
  },
  {
    nameEn: "Red Sea Contracting",
    nameAr: "مقاولات البحر الأحمر",
    code: "CON-SEED-REDSEA",
    contact: "Layla Ibrahim",
    phone: "+971504444004",
    email: "tenders@redsea-contracting.example.com",
  },
  {
    nameEn: "Capital City Developers",
    nameAr: "مطوري العاصمة",
    code: "CON-SEED-CAPITAL",
    contact: "Khalid Nasser",
    phone: "+971505555005",
    email: "pmo@capital-dev.example.com",
  },
] as const;

async function ensureSectors() {
  for (const s of SECTOR_DEFS) {
    const existing = await getSectorByKey(s.sectorKey);
    if (!existing) {
      await createSector({
        sectorKey: s.sectorKey,
        nameEn: s.nameEn,
        nameAr: s.nameAr,
        description: "Demo sector (seed data)",
      });
      console.log(`Created sector ${s.sectorKey}`);
    } else {
      console.log(`Sector ${s.sectorKey} already exists, skipping create`);
    }
  }
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL is not set or database connection failed.");
    process.exit(1);
  }

  const already = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(like(contracts.contractNumber, `${SEED_TAG}%`))
    .limit(1);

  if (already.length > 0) {
    console.log(
      `Seed data already present (found contract ${SEED_TAG}*). Delete those rows to re-seed, or ignore this message.`
    );
    process.exit(0);
  }

  await ensureSectors();

  const year = new Date().getFullYear();
  const startBase = new Date(year, 0, 1);
  const endBase = new Date(year, 11, 31);

  for (let c = 0; c < CONTRACTOR_DEFS.length; c++) {
    const def = CONTRACTOR_DEFS[c];
    const existingCo = await db
      .select({ id: contractors.id })
      .from(contractors)
      .where(eq(contractors.contractorCode, def.code))
      .limit(1);

    let contractorId: number;
    if (existingCo.length > 0) {
      contractorId = existingCo[0].id;
      console.log(`Contractor ${def.code} already exists (id=${contractorId})`);
    } else {
      await createContractor({
        nameEn: def.nameEn,
        nameAr: def.nameAr,
        contractorCode: def.code,
        contactPerson: def.contact,
        phone: def.phone,
        email: def.email,
        address: "Demo address — seed data",
        isActive: true,
      });
      const row = await db
        .select({ id: contractors.id })
        .from(contractors)
        .where(eq(contractors.contractorCode, def.code))
        .limit(1);
      contractorId = row[0]!.id;
      console.log(`Created contractor ${def.code} (id=${contractorId})`);
    }

    for (let p = 0; p < SECTOR_DEFS.length; p++) {
      const sector = SECTOR_DEFS[p];
      const contractNumber = `${SEED_TAG}-C${String(c + 1).padStart(2, "0")}-P${String(p + 1).padStart(2, "0")}`;
      const contractName = `${def.nameEn} — ${sector.nameEn} Project ${p + 1}`;

      await createContract({
        contractNumber,
        contractName,
        contractorId,
        sectorKey: sector.sectorKey,
        sectorNameEn: sector.nameEn,
        sectorNameAr: sector.nameAr,
        startDate: startBase,
        endDate: endBase,
        notes: `Demo project for ${sector.nameEn} (seed)`,
        isActive: true,
      });
      console.log(`  Contract ${contractNumber}`);
    }
  }

  console.log("Done. 5 contractors (or reused), 5 sectors ensured, 25 projects (contracts) created across sectors.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
