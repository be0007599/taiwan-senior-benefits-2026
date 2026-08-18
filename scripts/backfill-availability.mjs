import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "benefits.central.json",
  "benefits.local.json",
  "benefits.local.chongyang.json",
  "benefits.local.health-check.json",
  "benefits.dental.json",
  "benefits.assistive.json",
  "benefits.local.health-aids.json",
  "benefits.local.support.json",
  "benefits.local.transport.json",
  "benefits.local.rehab-bus.json"
];

let changed = 0;
for (const file of files) {
  const target = path.join(root, "data", file);
  const rows = JSON.parse(await readFile(target, "utf8"));
  let fileChanged = false;
  for (const row of rows) {
    if (!row.availability) {
      row.availability = {
        status: row.verification?.status === "expired" ? "closed" : "unknown",
        as_of: row.verification?.last_verified_at ?? "2026-08-18",
        check_required: true,
        notes: "已核驗方案內容，但尚未建立即時名額或經費狀態；申請前仍須向主管機關確認。"
      };
      changed += 1;
      fileChanged = true;
    }
  }
  if (fileChanged) await writeFile(target, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
}

console.log(`已補上 ${changed} 筆 availability 狀態`);
