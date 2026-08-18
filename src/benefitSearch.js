const incomePattern = /低收入|中低收入|所得|財產/
const disabilityPattern = /身心障礙|失能|輔具/
const carePattern = /長照|照顧管理|失能程度|照顧需要/

export const frontendFieldPaths = [
  'program_id', 'name', 'plain_name', 'government_level', 'jurisdiction', 'authority', 'category',
  'eligibility.summary', 'eligibility.minimum_age', 'eligibility.indigenous_minimum_age',
  'eligibility.residency', 'eligibility.income', 'eligibility.assets', 'eligibility.identity',
  'eligibility.assessment', 'eligibility.exclusions',
  'benefit.type', 'benefit.summary', 'benefit.amount_twd', 'benefit.amount_twd_min',
  'benefit.amount_twd_max', 'benefit.frequency',
  'application.summary', 'application.automatic', 'application.phone',
  'validity.effective_from', 'validity.effective_to',
  'availability.status', 'availability.as_of', 'availability.check_required', 'availability.notes',
  'verification.status', 'verification.last_verified_at', 'verification.notes',
  'stacking_notes', 'official_sources',
]

export function isNationalProgram(program) {
  return program.government_level === 'central' || program.jurisdiction?.startsWith('全國')
}

export function likelyStatus(program, profile) {
  if (program.verification?.status === 'expired' || program.availability?.status === 'closed') return 'inactive'
  if (['pending_confirmation', 'conflicting_sources', 'planned', 'needs_review'].includes(program.verification?.status)) return 'confirm'

  const eligibility = program.eligibility || {}
  const minimumAge = profile.indigenous === 'yes' && eligibility.indigenous_minimum_age
    ? eligibility.indigenous_minimum_age : eligibility.minimum_age
  if (minimumAge && Number(profile.age) < minimumAge) return 'unlikely'

  const eligibilityText = [eligibility.summary, eligibility.income, eligibility.identity, eligibility.assessment]
    .filter(Boolean).join(' ')
  if (incomePattern.test(eligibilityText) && profile.income === 'general') return 'confirm'
  if (disabilityPattern.test(eligibilityText) && profile.disability === 'no') return 'confirm'
  if (carePattern.test(eligibilityText) && profile.longTermCare === 'no') return 'confirm'
  return 'likely'
}

function normalize(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/\s+/g, '')
}

function searchableText(program) {
  return normalize([
    program.program_id, program.name, program.plain_name, program.authority, program.jurisdiction,
    program.category, ...Object.values(program.eligibility || {}), ...Object.values(program.benefit || {}),
    ...Object.values(program.application || {}), program.stacking_notes,
    ...(program.official_sources || []).flatMap(source => [source.title, source.publisher, source.source_type]),
  ].filter(value => value !== null && value !== undefined).join(' '))
}

export function filterBenefits(programs, { profile, category = 'all', query = '', browseAll = false, includeExpired = false }) {
  const normalizedQuery = normalize(query)
  const statusOrder = { likely: 0, confirm: 1, unlikely: 2, inactive: 3 }

  return programs.filter(program => isNationalProgram(program) || program.jurisdiction === profile.county)
    .filter(program => category === 'all' || program.category === category)
    .filter(program => !normalizedQuery || searchableText(program).includes(normalizedQuery))
    .filter(program => includeExpired || likelyStatus(program, profile) !== 'inactive')
    .filter(program => browseAll || !['unlikely', 'inactive'].includes(likelyStatus(program, profile)))
    .toSorted((a, b) => statusOrder[likelyStatus(a, profile)] - statusOrder[likelyStatus(b, profile)]
      || (a.government_level === 'county_city' ? -1 : 1)
      || a.name.localeCompare(b.name, 'zh-Hant'))
}
