/**
 * Import real sectors, contractors, and contracts from a JSON file (no dummy data).
 *
 * Order: sectors → contractors → contracts (matches FK / Reception flow).
 * Idempotent: skips rows that already exist (sectorKey, contractorCode, contractNumber).
 *
 * 1. Prefer server/data/catalog.import.json (your real data). If missing, the script uses
 *    catalog.import.example.json automatically.
 * 2. Run: pnpm run db:import:catalog
 *
 * Or: IMPORT_CATALOG_JSON=C:\\path\\to\\file.json pnpm run db:import:catalog
 *
 * Admin UI alternative: Test Types / contracts section — same tables.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { contractors } from "../../drizzle/schema";
import { createContract, createSector, getContractByNumber, getDb, getSectorByKey } from "../db";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type SectorRow = { sectorKey: string; nameAr: string; nameEn: string; description?: string };
type ContractorRow = {
  nameEn: string;
  nameAr?: string;
  contractorCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
};
type ContractRow = {
  contractNumber: string;
  contractName: string;
  contractorCode: string;
  sectorKey?: string;
  notes?: string;
};

type CatalogFile = {
  sectors?: SectorRow[];
  contractors?: ContractorRow[];
  contracts?: ContractRow[];
};

function resolveCatalogJsonPath(): string {
  const envPath = process.env.IMPORT_CATALOG_JSON?.trim();
  if (envPath && fs.existsSync(envPath)) return envPath;

  const dataDir = path.join(__dirname, "..", "data");
  const preferred = path.join(dataDir, "catalog.import.json");
  const example = path.join(dataDir, "catalog.import.example.json");

  if (fs.existsSync(preferred)) return preferred;
  if (fs.existsSync(example)) {
    console.warn(
      "Using server/data/catalog.import.example.json — copy it to catalog.import.json to load your own data (and silence this message)."
    );
    return example;
  }

  console.error(
    `No catalog JSON found.\n  Create: ${preferred}\n  (copy from catalog.import.example.json)\n  Or set IMPORT_CATALOG_JSON to a full path.`
  );
  process.exit(1);
}

async function main() {
  const jsonPath = resolveCatalogJsonPath();

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as CatalogFile;
  const db = await getDb();
  if (!db) {
    console.error("Database not available. Set DATABASE_URL in .env");
    process.exit(1);
  }

  let sectorsN = 0;
  for (const s of raw.sectors ?? []) {
    const existing = await getSectorByKey(s.sectorKey);
    if (existing) continue;
    await createSector({
      sectorKey: s.sectorKey,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      description: s.description,
    });
    sectorsN++;
  }

  const contractorIdByCode = new Map<string, number>();

  for (const c of raw.contractors ?? []) {
    const code = c.contractorCode?.trim();
    if (code) {
      const found = await db
        .select({ id: contractors.id })
        .from(contractors)
        .where(eq(contractors.contractorCode, code))
        .limit(1);
      if (found[0]) {
        contractorIdByCode.set(code, found[0].id);
        continue;
      }
    }
    await db.insert(contractors).values({
      nameEn: c.nameEn,
      nameAr: c.nameAr ?? null,
      contractorCode: code ?? null,
      contactPerson: c.contactPerson ?? null,
      phone: c.phone ?? null,
      email: c.email ?? null,
      isActive: true,
    });
    if (code) {
      const row = await db
        .select({ id: contractors.id })
        .from(contractors)
        .where(eq(contractors.contractorCode, code))
        .limit(1);
      if (row[0]) contractorIdByCode.set(code, row[0].id);
    }
  }

  let contractsN = 0;
  for (const ct of raw.contracts ?? []) {
    if (await getContractByNumber(ct.contractNumber)) continue;

    let contractorId = contractorIdByCode.get(ct.contractorCode);
    if (contractorId === undefined) {
      const found = await db
        .select({ id: contractors.id })
        .from(contractors)
        .where(eq(contractors.contractorCode, ct.contractorCode))
        .limit(1);
      contractorId = found[0]?.id;
    }
    if (contractorId === undefined) {
      console.error(`Skip contract ${ct.contractNumber}: unknown contractorCode "${ct.contractorCode}"`);
      continue;
    }

    let sectorNameAr: string | undefined;
    let sectorNameEn: string | undefined;
    if (ct.sectorKey) {
      const sec = await getSectorByKey(ct.sectorKey);
      if (sec) {
        sectorNameAr = sec.nameAr;
        sectorNameEn = sec.nameEn;
      }
    }

    await createContract({
      contractNumber: ct.contractNumber,
      contractName: ct.contractName,
      contractorId,
      sectorKey: ct.sectorKey ?? null,
      sectorNameAr: sectorNameAr ?? null,
      sectorNameEn: sectorNameEn ?? null,
      notes: ct.notes ?? null,
      isActive: true,
    });
    contractsN++;
  }

  console.log(
    `Catalog import done from ${jsonPath}: sectors inserted ${sectorsN}, contractors processed ${raw.contractors?.length ?? 0}, contracts inserted ${contractsN}.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
