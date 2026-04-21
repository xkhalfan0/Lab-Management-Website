/**
 * Runs a .sql file against DATABASE_URL (MySQL / TiDB-compatible).
 * Usage: pnpm run db:import:contracts-sql
 *    or: node server/scripts/run-sql-file.mjs path/to/file.sql
 *
 * Requires: server/data/contracts_catalog.sql (place your export there) or pass path as argv[2]
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");

const defaultFile = path.join(root, "server", "data", "contracts_catalog.sql");
const sqlPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultFile;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (.env)");
  process.exit(1);
}
if (!fs.existsSync(sqlPath)) {
  console.error("SQL file not found:", sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  multipleStatements: true,
});

try {
  await conn.query(sql);
  console.log("OK — executed:", sqlPath);
} finally {
  await conn.end();
}
