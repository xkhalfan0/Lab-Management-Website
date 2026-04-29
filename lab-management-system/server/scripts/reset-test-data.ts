/**
 * Resets transactional lab data while preserving contractors, contracts, users,
 * test types, sectors, and sector portal accounts.
 *
 * Run: pnpm db:reset:tests
 * Requires DATABASE_URL in .env
 */
import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { sql, inArray } from "drizzle-orm";
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

async function confirm(): Promise<boolean> {
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

  const workflowAuditEntities = ["sample", "labOrder"] as const;

  try {
    await db.transaction(async (tx) => {
      const steps: Array<[string, () => Promise<unknown>]> = [
        ["sector_report_reads", () => tx.delete(sectorReportReads).where(sql`1 = 1`)],
        ["concrete_cubes", () => tx.delete(concreteCubes).where(sql`1 = 1`)],
        ["reviews", () => tx.delete(reviews).where(sql`1 = 1`)],
        ["attachments", () => tx.delete(attachments).where(sql`1 = 1`)],
        ["test_results", () => tx.delete(testResults).where(sql`1 = 1`)],
        ["specialized_test_results", () => tx.delete(specializedTestResults).where(sql`1 = 1`)],
        ["concrete_test_groups", () => tx.delete(concreteTestGroups).where(sql`1 = 1`)],
        ["lab_order_items", () => tx.delete(labOrderItems).where(sql`1 = 1`)],
        ["lab_orders", () => tx.delete(labOrders).where(sql`1 = 1`)],
        ["distributions", () => tx.delete(distributions).where(sql`1 = 1`)],
        ["certificates", () => tx.delete(certificates).where(sql`1 = 1`)],
        ["sample_history", () => tx.delete(sampleHistory).where(sql`1 = 1`)],
        ["notifications", () => tx.delete(notifications).where(sql`1 = 1`)],
        ["clearance_requests", () => tx.delete(clearanceRequests).where(sql`1 = 1`)],
        [
          "audit_log (sample / lab order workflow only)",
          () =>
            tx.delete(auditLog).where(inArray(auditLog.entity, [...workflowAuditEntities])),
        ],
        ["samples", () => tx.delete(samples).where(sql`1 = 1`)],
      ];

      for (const [label, run] of steps) {
        console.log(`[reset-test-data] Deleting ${label}…`);
        await run();
      }
    });

    console.log("[reset-test-data] Done. Preserved: users, contractors, contracts, test_types, sectors, sector_accounts.");
    process.exit(0);
  } catch (err) {
    console.error("[reset-test-data] Error — transaction rolled back. No partial data should remain from this run.");
    console.error(err);
    process.exit(1);
  }
}

main();
