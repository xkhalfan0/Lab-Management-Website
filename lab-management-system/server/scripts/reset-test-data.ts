/**
 * Resets transactional lab data while preserving contractors, contracts, users,
 * test types, sectors, and sector portal accounts.
 *
 * Run: pnpm db:reset:tests
 * Non-interactive: pnpm db:reset:tests -- --yes
 *
 * Uses the same DATABASE_URL as the app (.env). If the UI still shows data after
 * running this, the script is almost certainly pointed at a different database
 * than your deployed server (e.g. local .env vs Railway variables).
 */
import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { sql, inArray, count } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import {
  attachments,
  auditLog,
  certificates,
  clearanceRequests,
  concreteCubes,
  concreteTestGroups,
  distributions,
  labOrderItems,
  labOrders,
  notifications,
  reviews,
  sampleHistory,
  samples,
  sectorReportReads,
  specializedTestResults,
  testResults,
} from "../../drizzle/schema";
import { getDb } from "../db";

const workflowAuditEntities = ["sample", "labOrder"] as const;

function dbHostHint(): string {
  const u = process.env.DATABASE_URL;
  if (!u) return "(DATABASE_URL not set)";
  try {
    const parsed = new URL(u);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}/${parsed.pathname.replace(/^\//, "")}`;
  } catch {
    return "(could not parse DATABASE_URL)";
  }
}

async function confirm(): Promise<boolean> {
  if (process.argv.includes("--yes")) {
    return true;
  }
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(
      "This will delete all samples and test data. Are you sure? (yes/no) "
    );
    return answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

async function main() {
  const ok = await confirm();
  if (!ok) {
    console.log("Aborted — no changes were made.");
    process.exit(0);
  }

  const db = await getDb();
  if (!db) {
    console.error("[reset-test-data] DATABASE_URL is not set or database connection failed.");
    process.exit(1);
  }

  console.log(`[reset-test-data] Target database: ${dbHostHint()}`);

  const countSamples = () =>
    db.select({ n: count() }).from(samples).then((r) => Number(r[0]?.n ?? 0));
  const countOrders = () =>
    db.select({ n: count() }).from(labOrders).then((r) => Number(r[0]?.n ?? 0));

  let beforeSamples = 0;
  let beforeOrders = 0;
  try {
    beforeSamples = await countSamples();
    beforeOrders = await countOrders();
  } catch (e) {
    console.warn("[reset-test-data] Could not read pre-delete counts:", e);
  }
  console.log(
    `[reset-test-data] Before: samples=${beforeSamples}, lab_orders=${beforeOrders}`
  );

  const steps: Array<[string, MySqlTable]> = [
    ["sector_report_reads", sectorReportReads],
    ["concrete_cubes", concreteCubes],
    ["reviews", reviews],
    ["attachments", attachments],
    ["test_results", testResults],
    ["specialized_test_results", specializedTestResults],
    ["concrete_test_groups", concreteTestGroups],
    ["lab_order_items", labOrderItems],
    ["lab_orders", labOrders],
    ["distributions", distributions],
    ["certificates", certificates],
    ["sample_history", sampleHistory],
    ["notifications", notifications],
    ["clearance_requests", clearanceRequests],
    ["samples", samples],
  ];

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
      try {
        for (const [label, table] of steps) {
          console.log(`[reset-test-data] Deleting ${label}…`);
          await tx.delete(table);
        }
        console.log(
          `[reset-test-data] Deleting audit_log (entity in ${workflowAuditEntities.join(", ")})…`
        );
        await tx
          .delete(auditLog)
          .where(inArray(auditLog.entity, [...workflowAuditEntities]));
      } finally {
        await tx.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
      }
    });

    let afterSamples = 0;
    let afterOrders = 0;
    try {
      afterSamples = await countSamples();
      afterOrders = await countOrders();
    } catch (e) {
      console.warn("[reset-test-data] Could not read post-delete counts:", e);
    }
    console.log(
      `[reset-test-data] After: samples=${afterSamples}, lab_orders=${afterOrders}`
    );

    if (afterSamples > 0 || afterOrders > 0) {
      console.warn(
        "[reset-test-data] Warning: samples or lab_orders remain > 0. You may be connected to the wrong database, or another error occurred."
      );
    }

    console.log(
      "[reset-test-data] Done. Preserved: users, contractors, contracts, test_types, sectors, sector_accounts."
    );
    process.exit(0);
  } catch (err) {
    console.error(
      "[reset-test-data] Error — transaction rolled back. No changes were committed from this run."
    );
    console.error(err);
    process.exit(1);
  }
}

main();
