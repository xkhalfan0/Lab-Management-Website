/**
 * One-time helper: build meta/0030_snapshot.json from 0029 + samples.nominalCubeSize
 * Run from repo root: node drizzle/patch-0030-snapshot.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, "meta", "0029_snapshot.json");
const dst = path.join(__dirname, "meta", "0030_snapshot.json");
const j = JSON.parse(fs.readFileSync(src, "utf8"));
j.id = "c8f3a1b2-4d5e-6f70-a1b2-c3d4e5f60789";
j.prevId = "4607b423-1428-4870-885a-4ff38564e901";
const cols = j.tables.samples.columns;
const next = {};
for (const key of Object.keys(cols)) {
  next[key] = cols[key];
  if (key === "location") {
    next.nominalCubeSize = {
      name: "nominalCubeSize",
      type: "varchar(32)",
      primaryKey: false,
      notNull: false,
      autoincrement: false,
    };
  }
}
j.tables.samples.columns = next;
fs.writeFileSync(dst, JSON.stringify(j, null, 2));
console.log("Wrote", dst);
