import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { filterBenefits, frontendFieldPaths, isNationalProgram } from '../src/benefitSearch.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDirectory = path.join(root, 'data')
const files = fs.readdirSync(dataDirectory).filter(name => /^benefits.*\.json$/.test(name)).sort()
const programs = files.flatMap(name => JSON.parse(fs.readFileSync(path.join(dataDirectory, name), 'utf8')))
const counties = [...new Set(programs.filter(program => !isNationalProgram(program)).map(program => program.jurisdiction))]
const categories = [...new Set(programs.map(program => program.category))]
const profile = { county: counties[0], age: 120, indigenous: 'yes', income: 'low', disability: 'yes', longTermCare: 'yes' }

const missingPrograms = []
for (const program of programs) {
  const county = isNationalProgram(program) ? counties[0] : program.jurisdiction
  const matches = filterBenefits(programs, {
    profile: { ...profile, county }, category: program.category, query: program.program_id,
    browseAll: true, includeExpired: true,
  })
  if (!matches.some(match => match.program_id === program.program_id)) missingPrograms.push(program.program_id)
}

function pathsFor(value, prefix = '') {
  if (Array.isArray(value)) return [prefix]
  if (!value || typeof value !== 'object') return [prefix]
  return Object.entries(value).flatMap(([key, child]) => {
    const next = prefix ? `${prefix}.${key}` : key
    return child && typeof child === 'object' && !Array.isArray(child) ? pathsFor(child, next) : [next]
  })
}

const backendFields = [...new Set(programs.flatMap(program => pathsFor(program)))].sort()
const unsupportedFields = backendFields.filter(field => !frontendFieldPaths.includes(field))
const result = {
  program_count: programs.length,
  discoverable_programs: programs.length - missingPrograms.length,
  category_count: categories.length,
  county_city_count: counties.length,
  backend_field_count: backendFields.length,
  frontend_field_count: frontendFieldPaths.length,
  missing_programs: missingPrograms,
  unsupported_fields: unsupportedFields,
}

console.log(JSON.stringify(result, null, 2))
if (missingPrograms.length || unsupportedFields.length) process.exitCode = 1
