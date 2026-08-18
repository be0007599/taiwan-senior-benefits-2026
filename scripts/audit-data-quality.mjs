import { readFile } from "node:fs/promises";
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

const datasets = await Promise.all(files.map(async (file) => ({
  file,
  rows: JSON.parse(await readFile(path.join(root, "data", file), "utf8"))
})));
const rows = datasets.flatMap(({ file, rows }) => rows.map((row) => ({ ...row, __file: file })));
const now = new Date("2026-08-18T00:00:00+08:00");
const day = 86_400_000;
const issue = (severity, rule, row, detail) => ({ severity, rule, program_id: row?.program_id ?? null, file: row?.__file ?? null, detail });
const issues = [];

const requiredPaths = [
  "program_id", "name", "plain_name", "government_level", "jurisdiction", "authority", "category",
  "eligibility.summary", "benefit.type", "benefit.summary", "application.summary",
  "availability.status", "availability.as_of",
  "verification.status", "verification.last_verified_at", "official_sources"
];
const get = (object, key) => key.split(".").reduce((value, part) => value?.[part], object);
const empty = (value) => value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
const normalized = (value) => value.normalize("NFKC").toLowerCase().replace(/[\s－—–_　()（）\-]/g, "");

for (const row of rows) {
  for (const key of requiredPaths) {
    if (empty(get(row, key))) issues.push(issue("critical", "required_field", row, `${key} 缺漏`));
  }

  const verified = new Date(`${row.verification?.last_verified_at}T00:00:00+08:00`);
  const ageDays = Math.floor((now - verified) / day);
  if (Number.isFinite(ageDays) && ageDays > 180) issues.push(issue("high", "verification_stale", row, `距最後核驗 ${ageDays} 天`));
  if (Number.isFinite(ageDays) && ageDays < 0) issues.push(issue("high", "verification_future", row, `最後核驗日期在未來：${row.verification.last_verified_at}`));

  const asOf = new Date(`${row.availability?.as_of}T00:00:00+08:00`);
  const asOfAge = Math.floor((now - asOf) / day);
  if (Number.isFinite(asOfAge) && asOfAge > 180) issues.push(issue("high", "availability_stale", row, `可用狀態距今 ${asOfAge} 天`));
  if (Number.isFinite(asOfAge) && asOfAge < 0) issues.push(issue("high", "availability_future", row, `可用狀態日期在未來：${row.availability.as_of}`));

  if (row.validity?.effective_to) {
    const end = new Date(`${row.validity.effective_to}T23:59:59+08:00`);
    if (end < now && !["expired", "closed"].includes(row.verification?.status) && row.availability?.status !== "closed") {
      issues.push(issue("critical", "expired_but_active", row, `效期已於 ${row.validity.effective_to} 結束，但仍標示可用`));
    }
  }

  if (!Array.isArray(row.official_sources) || row.official_sources.length === 0) continue;
  const seenUrls = new Set();
  for (const source of row.official_sources) {
    let url;
    try { url = new URL(source.url); } catch {
      issues.push(issue("critical", "invalid_source_url", row, source.url));
      continue;
    }
    const host = url.hostname.toLowerCase();
    const official = host === "gov.tw" || host.endsWith(".gov.tw") || host.endsWith(".gov.taipei") || host === "www.thsrc.com.tw";
    if (!official) issues.push(issue("critical", "non_official_source", row, source.url));
    if (url.protocol !== "https:") issues.push(issue("medium", "insecure_source_url", row, source.url));
    if (seenUrls.has(source.url)) issues.push(issue("medium", "duplicate_source_in_record", row, source.url));
    seenUrls.add(source.url);
    if (empty(source.title) || empty(source.publisher) || empty(source.source_type)) {
      issues.push(issue("high", "source_metadata_incomplete", row, source.url));
    }
  }
}

const byProgramId = new Map();
const byName = new Map();
for (const row of rows) {
  const idList = byProgramId.get(row.program_id) ?? [];
  idList.push(row);
  byProgramId.set(row.program_id, idList);
  const nameKey = normalized(row.name);
  const nameList = byName.get(nameKey) ?? [];
  nameList.push(row);
  byName.set(nameKey, nameList);
}
for (const [key, matches] of byProgramId) {
  if (matches.length > 1) issues.push(issue("critical", "duplicate_program_id", matches[0], `${key} 出現 ${matches.length} 次`));
}
for (const matches of byName.values()) {
  const ids = new Set(matches.map((row) => row.program_id));
  if (ids.size > 1) issues.push(issue("medium", "normalized_name_collision", matches[0], [...ids].join(", ")));
}

const sources = rows.flatMap((row) => row.official_sources.map((source) => ({ ...source, program_id: row.program_id })));
const uniqueUrls = [...new Set(sources.map((source) => source.url))];
const hostCounts = {};
for (const url of uniqueUrls) {
  const host = new URL(url).hostname.toLowerCase();
  hostCounts[host] = (hostCounts[host] ?? 0) + 1;
}

const fieldCompleteness = Object.fromEntries(requiredPaths.map((key) => {
  const present = rows.filter((row) => !empty(get(row, key))).length;
  return [key, { present, total: rows.length, rate: Number((present / rows.length).toFixed(4)) }];
}));

const categoryCounts = {};
const jurisdictionCounts = {};
const verificationCounts = {};
for (const row of rows) {
  categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + 1;
  jurisdictionCounts[row.jurisdiction] = (jurisdictionCounts[row.jurisdiction] ?? 0) + 1;
  verificationCounts[row.verification.status] = (verificationCounts[row.verification.status] ?? 0) + 1;
}

let linkChecks = [];
if (process.argv.includes("--links")) {
  const concurrency = 12;
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < uniqueUrls.length) {
      const index = cursor++;
      const url = uniqueUrls[index];
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      const started = Date.now();
      try {
        let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
        if ([403, 405, 500, 501].includes(response.status)) {
          response = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers: { Range: "bytes=0-4095" } });
        }
        linkChecks[index] = { url, status: response.status, ok: response.ok, final_url: response.url, elapsed_ms: Date.now() - started };
      } catch (error) {
        linkChecks[index] = { url, status: null, ok: false, error: error.name, elapsed_ms: Date.now() - started };
      } finally {
        clearTimeout(timer);
      }
    }
  });
  await Promise.all(workers);
}

const summary = {
  generated_at: "2026-08-18",
  grain: "每列為一項由政府主管機關核驗的福利或服務方案",
  row_count: rows.length,
  file_count: datasets.length,
  file_counts: Object.fromEntries(datasets.map(({ file, rows }) => [file, rows.length])),
  unique_program_ids: byProgramId.size,
  source_count: sources.length,
  unique_source_urls: uniqueUrls.length,
  field_completeness: fieldCompleteness,
  category_counts: categoryCounts,
  jurisdiction_counts: jurisdictionCounts,
  verification_counts: verificationCounts,
  issue_counts: issues.reduce((counts, item) => ({ ...counts, [item.severity]: (counts[item.severity] ?? 0) + 1 }), {}),
  issues,
  top_source_hosts: Object.entries(hostCounts).sort((a, b) => b[1] - a[1]).slice(0, 20),
  link_check_summary: process.argv.includes("--links") ? {
    checked: linkChecks.length,
    ok: linkChecks.filter((item) => item.ok).length,
    failed: linkChecks.filter((item) => !item.ok).length,
    failures: linkChecks.filter((item) => !item.ok)
  } : null
};

console.log(JSON.stringify(summary, null, 2));
