import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");

const readJson = async (relativePath) => {
  const content = await readFile(path.join(projectRoot, relativePath), "utf8");
  return JSON.parse(content);
};

const centralBenefits = await readJson("data/benefits.central.json");
const localBenefits = await readJson("data/benefits.local.json");
const localChongyangBenefits = await readJson("data/benefits.local.chongyang.json");
const localHealthCheckBenefits = await readJson("data/benefits.local.health-check.json");
const dentalBenefits = await readJson("data/benefits.dental.json");
const assistiveBenefits = await readJson("data/benefits.assistive.json");
const localHealthAidBenefits = await readJson("data/benefits.local.health-aids.json");
const localSupportBenefits = await readJson("data/benefits.local.support.json");
const localTransportBenefits = await readJson("data/benefits.local.transport.json");
const localRehabBusBenefits = await readJson("data/benefits.local.rehab-bus.json");
const benefits = [...centralBenefits, ...localBenefits, ...localChongyangBenefits, ...localHealthCheckBenefits, ...dentalBenefits, ...assistiveBenefits, ...localHealthAidBenefits, ...localSupportBenefits, ...localTransportBenefits, ...localRehabBusBenefits];
const coverage = await readJson("data/jurisdiction-coverage.json");
const chongyangCoverage = await readJson("data/chongyang-coverage.json");
const dentureCoverage = await readJson("data/denture-coverage.json");
const inpatientCaregiverCoverage = await readJson("data/inpatient-caregiver-coverage.json");
const mealDeliveryCoverage = await readJson("data/meal-delivery-coverage.json");
const emergencySystemCoverage = await readJson("data/emergency-system-coverage.json");
const transportCoverage = await readJson("data/transport-coverage.json");
const rehabBusCoverage = await readJson("data/rehab-bus-coverage.json");

const allowedStatuses = new Set([
  "verified",
  "pending_confirmation",
  "conflicting_sources",
  "planned",
  "expired",
  "needs_review"
]);

const allowedGovernmentLevels = new Set(["central", "county_city", "township_district"]);
const allowedCategories = new Set([
  "cash_assistance",
  "pension_retirement",
  "health_insurance",
  "healthcare",
  "vaccination",
  "long_term_care",
  "housing",
  "transportation",
  "culture_recreation",
  "community_support",
  "protection",
  "tax"
]);
const allowedAvailabilityStatuses = new Set([
  "continuous", "quota_limited", "funds_limited", "waitlist", "closed", "unknown"
]);
const allowedSourceTypes = new Set([
  "law", "program_page", "application_page", "announcement", "faq", "official_summary",
  "official_plan", "official_handbook", "official_dataset", "official_roster", "official_report"
]);
const allowedOfficialHosts = new Set(["www.thsrc.com.tw"]);
const expectedJurisdictions = new Set([
  "基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣",
  "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市",
  "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣", "金門縣", "連江縣"
]);

const errors = [];
const validationDate = new Date();
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

const isIsoDate = (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value);
const isOfficialUrl = (value) => {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "gov.tw" || host.endsWith(".gov.tw") || host.endsWith(".gov.taipei") || allowedOfficialHosts.has(host);
  } catch {
    return false;
  }
};

check(Array.isArray(centralBenefits), "benefits.central.json 必須是陣列");
check(Array.isArray(localBenefits), "benefits.local.json 必須是陣列");
check(Array.isArray(localChongyangBenefits), "benefits.local.chongyang.json 必須是陣列");
check(Array.isArray(localHealthCheckBenefits), "benefits.local.health-check.json 必須是陣列");
check(Array.isArray(dentalBenefits), "benefits.dental.json 必須是陣列");
check(Array.isArray(assistiveBenefits), "benefits.assistive.json 必須是陣列");
check(Array.isArray(localHealthAidBenefits), "benefits.local.health-aids.json 必須是陣列");
check(Array.isArray(localSupportBenefits), "benefits.local.support.json 必須是陣列");
check(centralBenefits.length === 28, `中央種子資料應為 28 筆，目前為 ${centralBenefits.length} 筆`);
check(localBenefits.length === 40, `地方福利資料應為 40 筆（敬老卡22、健保補助18），目前為 ${localBenefits.length} 筆`);
check(localChongyangBenefits.length === 13, `已核驗地方重陽禮金應為13筆，目前為${localChongyangBenefits.length}筆`);
check(localHealthCheckBenefits.length === 7, `已核驗地方長者加值健檢應為7筆，目前為${localHealthCheckBenefits.length}筆`);
check(dentalBenefits.length === 23, `已核驗假牙補助應為23筆，目前為${dentalBenefits.length}筆`);
check(assistiveBenefits.length === 1, `已核驗身障輔具補助應為1筆，目前為${assistiveBenefits.length}筆`);
check(localHealthAidBenefits.length === 5, `已核驗地方眼鏡與助聽器補助應為5筆，目前為${localHealthAidBenefits.length}筆`);
check(localSupportBenefits.length === 54, `地方生活支持、住院看護、送餐與緊急救援應為54筆，目前為${localSupportBenefits.length}筆`);
check(localTransportBenefits.length === 20, `已核驗地方長照交通接送應為20筆，目前為${localTransportBenefits.length}筆`);
check(localRehabBusBenefits.length === 20, `已核驗地方復康巴士應為20筆，目前為${localRehabBusBenefits.length}筆`);

const programIds = new Set();
for (const [index, item] of benefits.entries()) {
  const label = `benefits[${index}]`;
  check(typeof item.program_id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.program_id), `${label}.program_id 格式錯誤`);
  check(!programIds.has(item.program_id), `${label}.program_id 重複：${item.program_id}`);
  programIds.add(item.program_id);
  check(typeof item.name === "string" && item.name.length > 0, `${label}.name 不可空白`);
  check(typeof item.plain_name === "string" && item.plain_name.length > 0, `${label}.plain_name 不可空白`);
  check(allowedGovernmentLevels.has(item.government_level), `${label}.government_level 無效`);
  check(allowedCategories.has(item.category), `${label}.category 無效`);
  check(typeof item.authority === "string" && item.authority.length > 0, `${label}.authority 不可空白`);
  check(item.eligibility && typeof item.eligibility.summary === "string", `${label}.eligibility.summary 缺漏`);
  check(item.benefit && typeof item.benefit.summary === "string", `${label}.benefit.summary 缺漏`);
  check(item.application && typeof item.application.summary === "string", `${label}.application.summary 缺漏`);
  check(allowedStatuses.has(item.verification?.status), `${label}.verification.status 無效`);
  check(isIsoDate(item.verification?.last_verified_at), `${label}.verification.last_verified_at 日期格式錯誤`);
  check(item.verification?.status !== "verified" || item.verification.last_verified_at !== null, `${label} 已核驗資料必須有查核日`);
  check(isIsoDate(item.validity?.effective_from), `${label}.validity.effective_from 日期格式錯誤`);
  check(isIsoDate(item.validity?.effective_to), `${label}.validity.effective_to 日期格式錯誤`);
  check(item.availability !== undefined, `${label}.availability 缺漏`);
  if (item.availability !== undefined) {
    check(allowedAvailabilityStatuses.has(item.availability?.status), `${label}.availability.status 無效`);
    check(isIsoDate(item.availability?.as_of), `${label}.availability.as_of 日期格式錯誤`);
    check(typeof item.availability?.check_required === "boolean", `${label}.availability.check_required 必須是布林值`);
    check(item.availability?.notes === null || typeof item.availability?.notes === "string", `${label}.availability.notes 必須是文字或null`);
    check(item.availability?.status === "continuous" || item.availability?.check_required === true, `${label} 非持續受理狀態必須標示需再次確認`);
  }
  if (item.validity?.effective_to) {
    const endOfValidity = new Date(`${item.validity.effective_to}T23:59:59+08:00`);
    check(endOfValidity >= validationDate || item.verification?.status === "expired" || item.availability?.status === "closed", `${label} 效期已過但未標示 expired 或 closed`);
  }
  check(Array.isArray(item.official_sources) && item.official_sources.length > 0, `${label} 至少需要一個官方來源`);
  for (const [sourceIndex, source] of (item.official_sources ?? []).entries()) {
    check(isOfficialUrl(source.url), `${label}.official_sources[${sourceIndex}] 不是允許的官方網址：${source.url}`);
    check(typeof source.title === "string" && source.title.length > 0, `${label}.official_sources[${sourceIndex}].title 缺漏`);
    check(typeof source.publisher === "string" && source.publisher.length > 0, `${label}.official_sources[${sourceIndex}].publisher 缺漏`);
    check(allowedSourceTypes.has(source.source_type), `${label}.official_sources[${sourceIndex}].source_type 無效：${source.source_type}`);
  }
}

const localTransportationBenefits = localBenefits.filter((item) => item.category === "transportation");
const localNhiBenefits = localBenefits.filter((item) => item.category === "health_insurance");
const localCardJurisdictions = new Set();
for (const [index, item] of localTransportationBenefits.entries()) {
  const label = `localBenefits[${index}]`;
  check(item.government_level === "county_city", `${label}.government_level 應為 county_city`);
  check(expectedJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 非預期縣市：${item.jurisdiction}`);
  check(!localCardJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 重複：${item.jurisdiction}`);
  localCardJurisdictions.add(item.jurisdiction);
}

check(localTransportationBenefits.length === 22, `地方敬老卡應為22筆，目前為${localTransportationBenefits.length}筆`);
check(localNhiBenefits.length === 18, `地方老人健保補助應為18筆，目前為${localNhiBenefits.length}筆`);

for (const jurisdiction of expectedJurisdictions) {
  check(localCardJurisdictions.has(jurisdiction), `地方敬老卡資料缺少：${jurisdiction}`);
}

check(Array.isArray(coverage), "jurisdiction-coverage.json 必須是陣列");
check(coverage.length === 22, `地方覆蓋資料應為 22 筆，目前為 ${coverage.length} 筆`);

const observedJurisdictions = new Set();
for (const [index, item] of coverage.entries()) {
  const label = `coverage[${index}]`;
  check(expectedJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 非預期縣市：${item.jurisdiction}`);
  check(!observedJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 重複：${item.jurisdiction}`);
  observedJurisdictions.add(item.jurisdiction);
  check(allowedStatuses.has(item.verification_status), `${label}.verification_status 無效`);
  check(isIsoDate(item.last_verified_at), `${label}.last_verified_at 日期格式錯誤`);
  check(Array.isArray(item.official_sources) && item.official_sources.length > 0, `${label} 至少需要一個官方來源`);
  for (const [sourceIndex, source] of (item.official_sources ?? []).entries()) {
    check(isOfficialUrl(source.url), `${label}.official_sources[${sourceIndex}] 不是允許的官方網址：${source.url}`);
  }
}

for (const jurisdiction of expectedJurisdictions) {
  check(observedJurisdictions.has(jurisdiction), `地方覆蓋資料缺少：${jurisdiction}`);
}

check(Array.isArray(chongyangCoverage), "chongyang-coverage.json 必須是陣列");
check(chongyangCoverage.length === 22, `重陽禮金覆蓋資料應為22筆，目前為${chongyangCoverage.length}筆`);
const observedChongyangJurisdictions = new Set();
for (const [index, item] of chongyangCoverage.entries()) {
  const label = `chongyangCoverage[${index}]`;
  check(expectedJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 非預期縣市：${item.jurisdiction}`);
  check(!observedChongyangJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 重複：${item.jurisdiction}`);
  observedChongyangJurisdictions.add(item.jurisdiction);
  check(allowedStatuses.has(item.status), `${label}.status 無效`);
  check(typeof item["2026_summary"] === "string" && item["2026_summary"].length > 0, `${label}.2026_summary 缺漏`);
  check(isOfficialUrl(item.official_url), `${label}.official_url 不是允許的官方網址：${item.official_url}`);
}
for (const jurisdiction of expectedJurisdictions) {
  check(observedChongyangJurisdictions.has(jurisdiction), `重陽禮金覆蓋資料缺少：${jurisdiction}`);
}

check(Array.isArray(dentureCoverage), "denture-coverage.json 必須是陣列");
check(dentureCoverage.length === 22, `假牙覆蓋資料應為22筆，目前為${dentureCoverage.length}筆`);
const observedDentureJurisdictions = new Set();
for (const [index, item] of dentureCoverage.entries()) {
  const label = `dentureCoverage[${index}]`;
  check(expectedJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 非預期縣市：${item.jurisdiction}`);
  check(!observedDentureJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 重複：${item.jurisdiction}`);
  observedDentureJurisdictions.add(item.jurisdiction);
  check(allowedStatuses.has(item.status), `${label}.status 無效`);
  check(typeof item["2026_summary"] === "string" && item["2026_summary"].length > 0, `${label}.2026_summary 缺漏`);
  check(Array.isArray(item.formal_program_ids), `${label}.formal_program_ids 必須是陣列`);
  check(isOfficialUrl(item.official_url), `${label}.official_url 不是允許的官方網址：${item.official_url}`);
  check(isIsoDate(item.last_verified_at), `${label}.last_verified_at 日期格式錯誤`);
  for (const programId of (item.formal_program_ids ?? [])) {
    const program = dentalBenefits.find((benefit) => benefit.program_id === programId);
    check(Boolean(program), `${label}.formal_program_ids 找不到假牙方案：${programId}`);
    check(!program || program.jurisdiction === item.jurisdiction, `${label}.${programId} 縣市不一致`);
  }
  check(item.status !== "verified" || item.formal_program_ids.length > 0, `${label} 已核驗縣市至少需有一筆正式方案`);
  check(item.status === "verified" || item.formal_program_ids.length === 0, `${label} 非已核驗縣市不可連結正式方案`);
}
for (const jurisdiction of expectedJurisdictions) {
  check(observedDentureJurisdictions.has(jurisdiction), `假牙覆蓋資料缺少：${jurisdiction}`);
}

check(Array.isArray(inpatientCaregiverCoverage), "inpatient-caregiver-coverage.json 必須是陣列");
check(inpatientCaregiverCoverage.length === 22, `住院看護覆蓋資料應為22筆，目前為${inpatientCaregiverCoverage.length}筆`);
const observedInpatientJurisdictions = new Set();
for (const [index, item] of inpatientCaregiverCoverage.entries()) {
  const label = `inpatientCaregiverCoverage[${index}]`;
  check(expectedJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 非預期縣市：${item.jurisdiction}`);
  check(!observedInpatientJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 重複：${item.jurisdiction}`);
  observedInpatientJurisdictions.add(item.jurisdiction);
  check(allowedStatuses.has(item.status), `${label}.status 無效`);
  check(typeof item["2026_summary"] === "string" && item["2026_summary"].length > 0, `${label}.2026_summary 缺漏`);
  check(Array.isArray(item.formal_program_ids), `${label}.formal_program_ids 必須是陣列`);
  check(isOfficialUrl(item.official_url), `${label}.official_url 不是允許的官方網址：${item.official_url}`);
  check(isIsoDate(item.last_verified_at), `${label}.last_verified_at 日期格式錯誤`);
  for (const programId of (item.formal_program_ids ?? [])) {
    const program = localSupportBenefits.find((benefit) => benefit.program_id === programId);
    check(Boolean(program), `${label}.formal_program_ids 找不到地方支持方案：${programId}`);
    check(!program || program.jurisdiction === item.jurisdiction, `${label}.${programId} 縣市不一致`);
  }
  check(!["verified", "conflicting_sources"].includes(item.status) || item.formal_program_ids.length > 0, `${label} 已確認或衝突狀態至少需一筆正式方案`);
  check(item.status !== "pending_confirmation" || item.formal_program_ids.length === 0, `${label} 待確認縣市不可連結正式方案`);
}
for (const jurisdiction of expectedJurisdictions) {
  check(observedInpatientJurisdictions.has(jurisdiction), `住院看護覆蓋資料缺少：${jurisdiction}`);
}

const validateSupportCoverage = (items, fileLabel, coverageLabel) => {
  check(Array.isArray(items), `${fileLabel} 必須是陣列`);
  check(items.length === 22, `${coverageLabel}覆蓋資料應為22筆，目前為${items.length}筆`);
  const observed = new Set();
  for (const [index, item] of items.entries()) {
    const label = `${fileLabel}[${index}]`;
    check(expectedJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 非預期縣市：${item.jurisdiction}`);
    check(!observed.has(item.jurisdiction), `${label}.jurisdiction 重複：${item.jurisdiction}`);
    observed.add(item.jurisdiction);
    check(allowedStatuses.has(item.status), `${label}.status 無效`);
    check(typeof item["2026_summary"] === "string" && item["2026_summary"].length > 0, `${label}.2026_summary 缺漏`);
    check(Array.isArray(item.formal_program_ids), `${label}.formal_program_ids 必須是陣列`);
    check(isOfficialUrl(item.official_url), `${label}.official_url 不是允許的官方網址：${item.official_url}`);
    check(isIsoDate(item.last_verified_at), `${label}.last_verified_at 日期格式錯誤`);
    for (const programId of (item.formal_program_ids ?? [])) {
      const program = localSupportBenefits.find((benefit) => benefit.program_id === programId);
      check(Boolean(program), `${label}.formal_program_ids 找不到地方支持方案：${programId}`);
      check(!program || program.jurisdiction === item.jurisdiction, `${label}.${programId} 縣市不一致`);
    }
    check(item.status !== "verified" || item.formal_program_ids.length > 0, `${label} 已核驗縣市至少需一筆正式方案`);
    check(item.status !== "pending_confirmation" || item.formal_program_ids.length === 0, `${label} 待確認縣市不可連結正式方案`);
  }
  for (const jurisdiction of expectedJurisdictions) {
    check(observed.has(jurisdiction), `${coverageLabel}覆蓋資料缺少：${jurisdiction}`);
  }
  return observed;
};

const observedMealDeliveryJurisdictions = validateSupportCoverage(mealDeliveryCoverage, "mealDeliveryCoverage", "送餐");
const observedEmergencySystemJurisdictions = validateSupportCoverage(emergencySystemCoverage, "emergencySystemCoverage", "緊急救援");

check(Array.isArray(transportCoverage), "transport-coverage.json 必須是陣列");
check(transportCoverage.length === 22, `長照交通接送覆蓋資料應為22筆，目前為${transportCoverage.length}筆`);
const observedTransportJurisdictions = new Set();
for (const [index, item] of transportCoverage.entries()) {
  const label = `transportCoverage[${index}]`;
  check(expectedJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 非預期縣市：${item.jurisdiction}`);
  check(!observedTransportJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 重複：${item.jurisdiction}`);
  observedTransportJurisdictions.add(item.jurisdiction);
  check(allowedStatuses.has(item.status), `${label}.status 無效`);
  check(typeof item["2026_summary"] === "string" && item["2026_summary"].length > 0, `${label}.2026_summary 缺漏`);
  check(Array.isArray(item.formal_program_ids), `${label}.formal_program_ids 必須是陣列`);
  check(isOfficialUrl(item.official_url), `${label}.official_url 不是允許的官方網址：${item.official_url}`);
  check(isIsoDate(item.last_verified_at), `${label}.last_verified_at 日期格式錯誤`);
  for (const programId of (item.formal_program_ids ?? [])) {
    const program = localTransportBenefits.find((benefit) => benefit.program_id === programId);
    check(Boolean(program), `${label}.formal_program_ids 找不到地方長照交通方案：${programId}`);
    check(!program || program.jurisdiction === item.jurisdiction, `${label}.${programId} 縣市不一致`);
  }
  check(item.status !== "verified" || item.formal_program_ids.length > 0, `${label} 已核驗縣市至少需有一筆正式方案`);
  check(item.status !== "pending_confirmation" || item.formal_program_ids.length === 0, `${label} 待確認縣市不可連結正式方案`);
}
for (const jurisdiction of expectedJurisdictions) {
  check(observedTransportJurisdictions.has(jurisdiction), `長照交通接送覆蓋資料缺少：${jurisdiction}`);
}

check(Array.isArray(rehabBusCoverage), "rehab-bus-coverage.json 必須是陣列");
check(rehabBusCoverage.length === 22, `復康巴士覆蓋資料應為22筆，目前為${rehabBusCoverage.length}筆`);
const observedRehabBusJurisdictions = new Set();
for (const [index, item] of rehabBusCoverage.entries()) {
  const label = `rehabBusCoverage[${index}]`;
  check(expectedJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 非預期縣市：${item.jurisdiction}`);
  check(!observedRehabBusJurisdictions.has(item.jurisdiction), `${label}.jurisdiction 重複：${item.jurisdiction}`);
  observedRehabBusJurisdictions.add(item.jurisdiction);
  check(allowedStatuses.has(item.status), `${label}.status 無效`);
  check(typeof item["2026_summary"] === "string" && item["2026_summary"].length > 0, `${label}.2026_summary 缺漏`);
  check(Array.isArray(item.formal_program_ids), `${label}.formal_program_ids 必須是陣列`);
  check(isOfficialUrl(item.official_url), `${label}.official_url 不是允許的官方網址：${item.official_url}`);
  check(isIsoDate(item.last_verified_at), `${label}.last_verified_at 日期格式錯誤`);
  for (const programId of (item.formal_program_ids ?? [])) {
    const program = localRehabBusBenefits.find((benefit) => benefit.program_id === programId);
    check(Boolean(program), `${label}.formal_program_ids 找不到地方復康巴士方案：${programId}`);
    check(!program || program.jurisdiction === item.jurisdiction, `${label}.${programId} 縣市不一致`);
  }
  check(item.status !== "verified" || item.formal_program_ids.length > 0, `${label} 已核驗縣市至少需有一筆正式方案`);
  check(item.status !== "pending_confirmation" || item.formal_program_ids.length === 0, `${label} 待確認縣市不可連結正式方案`);
}
for (const jurisdiction of expectedJurisdictions) {
  check(observedRehabBusJurisdictions.has(jurisdiction), `復康巴士覆蓋資料缺少：${jurisdiction}`);
}

if (errors.length > 0) {
  console.error(`資料驗證失敗，共 ${errors.length} 項：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  assert.equal(programIds.size, 211);
  assert.equal(localCardJurisdictions.size, 22);
  assert.equal(observedJurisdictions.size, 22);
  assert.equal(observedChongyangJurisdictions.size, 22);
  assert.equal(observedDentureJurisdictions.size, 22);
  assert.equal(observedInpatientJurisdictions.size, 22);
  assert.equal(observedMealDeliveryJurisdictions.size, 22);
  assert.equal(observedEmergencySystemJurisdictions.size, 22);
  assert.equal(observedTransportJurisdictions.size, 22);
  assert.equal(observedRehabBusJurisdictions.size, 22);
  console.log("資料驗證通過");
  console.log(`- 中央福利：${centralBenefits.length} 筆`);
  console.log(`- 地方敬老卡：${localTransportationBenefits.length} 筆，22縣市無缺漏或重複`);
  console.log(`- 地方老人健保補助：${localNhiBenefits.length} 筆`);
  console.log(`- 已核驗地方重陽／敬老禮金：${localChongyangBenefits.length} 筆`);
  console.log(`- 已核驗地方長者加值健檢：${localHealthCheckBenefits.length} 筆`);
  console.log(`- 已核驗假牙補助：${dentalBenefits.length} 筆`);
  console.log(`- 已核驗身障輔具補助：${assistiveBenefits.length} 筆`);
  console.log(`- 已核驗地方眼鏡與助聽器補助：${localHealthAidBenefits.length} 筆`);
  console.log(`- 已核驗地方生活支持：${localSupportBenefits.length} 筆`);
  console.log(`- 已核驗地方長照交通接送：${localTransportBenefits.length} 筆`);
  console.log(`- 已核驗地方復康巴士：${localRehabBusBenefits.length} 筆`);
  console.log(`- 全部福利：${benefits.length} 筆，program_id 全部唯一`);
  console.log(`- 地方覆蓋：${coverage.length} 縣市，無缺漏或重複`);
  console.log(`- 重陽禮金覆蓋：${chongyangCoverage.length} 縣市，無缺漏或重複`);
  console.log(`- 假牙覆蓋：${dentureCoverage.length} 縣市，無缺漏或重複`);
  console.log(`- 住院看護覆蓋：${inpatientCaregiverCoverage.length} 縣市，無缺漏或重複`);
  console.log(`- 送餐覆蓋：${mealDeliveryCoverage.length} 縣市，無缺漏或重複`);
  console.log(`- 緊急救援覆蓋：${emergencySystemCoverage.length} 縣市，無缺漏或重複`);
  console.log(`- 長照交通接送覆蓋：${transportCoverage.length} 縣市，無缺漏或重複`);
  console.log(`- 復康巴士覆蓋：${rehabBusCoverage.length} 縣市，無缺漏或重複`);
  console.log("- 官方來源、狀態值、必填欄位與日期格式均通過檢查");
}
