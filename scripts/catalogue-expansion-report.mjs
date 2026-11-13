import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord, EXCLUDED_GENERAL_CLINIC_IDS } from '../lib/discovery/catalogue-policy.mjs'
import { currentPublishedFact } from '../lib/discovery/business-details.mjs'
import { categoryById } from '../lib/discovery/categories.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'

const bgOrder = (a, b) => a.localeCompare(b, 'bg')
// Exact owner-source scope checks, 2026-11-13. These neutral public names do
// not themselves contain a specialty. Reporting is not a qualification claim
// (Spasova's site describes further studies as still in progress).
const reviewedPsychologySources = new Map([
  ['sofia-zhenya-spasova-kableshkov', 'https://regresiatherapy.com/'],
  ['sofia-desislava-markovska-yavorov', 'https://desislavamarkovska.com/'],
  ['sofia-room-with-heart-izgrev', 'https://roomwithheart.com/'],
])
const counts = rows => {
  const categories = new Map()
  for (const row of rows) categories.set(row.category, (categories.get(row.category) || 0) + 1)
  return Object.fromEntries([...categories].sort(([a], [b]) => bgOrder(a, b)))
}
// Reporting only: use actual published business/service wording, never the
// search query or a guessed qualification. Underlying search categories stay
// unchanged (e.g. dentistry and psychology both currently use `other`).
export function reportBusinessType(row) {
  if (row.category !== 'other') return categoryById(row.category)?.bg || row.category
  // Exact dated owner-source review: https://orlinbaev.com/contact/.
  // Its short service name "Прием" alone does not express the specialty.
  if (row.id === 'sofia-orlin-baev-estestvena-akademia' && row.website === 'https://orlinbaev.com/') return 'Психология и психотерапия'
  if (reviewedPsychologySources.has(row.id) && reviewedPsychologySources.get(row.id) === row.website) return 'Психология и психотерапия'
  // Classify the selected appointment, not another specialty mentioned in a
  // mixed practice's name. No other doctors are imported with these visits.
  const serviceText = row.services.map(service => service.name).join(' ')
  if (/психиат(?:ър|р)|psychiatr/iu.test(serviceText)) return 'Психиатрия'
  if (/психолог|психотерап|психоанал|psycholog|psychotherap/iu.test(serviceText)) return 'Психология и психотерапия'
  const text = [row.name, ...row.services.map(service => service.name)].join(' ')
  if (/ветерин|veterinar/iu.test(text)) return 'Ветеринарни услуги'
  if (/психиат(?:ър|р)|psychiatr/iu.test(text)) return 'Психиатрия'
  if (/зъб|стоматол|дентал|дент |дент$|dental|dent\b|ортодонт|алайнери/iu.test(text)) return 'Стоматология'
  if (/психолог|психотерап|психоанал|psycholog|psychotherap/iu.test(text)) return 'Психология и психотерапия'
  if (/лаборатор|изследвания|laborator/iu.test(text)) return 'Лаборатории за изследвания'
  if (/татуир|пиърсинг|piercing|tattoo/iu.test(text)) return 'Татуировки и пиърсинг'
  if (/обучение на куче/iu.test(text)) return 'Обучение на кучета'
  if (/фотограф|фотостудио|фотосес|photograph|photo\s*studio|headshot/iu.test(text)) return 'Фотография'
  return categoryById(row.category)?.bg || row.category
}
const businessTypes = rows => {
  const groups = new Map()
  for (const row of rows) {
    const type = reportBusinessType(row)
    groups.set(type, (groups.get(type) || 0) + 1)
  }
  return Object.fromEntries([...groups].sort(([a], [b]) => bgOrder(a, b)))
}
const neighborhood = value => {
  if (!value || /^неуточнен$/iu.test(value)) return 'Неуточнен квартал'
  // Reporting aliases only; never infer a neighborhood from coordinates or
  // mutate the official address/category/source record.
  if (/^манастирски ливади(?:\s*(?:[-–—]\s*)?(?:изток|запад))?$/iu.test(value)) return 'Манастирски ливади'
  if (/^(?:бели|белите) брези$/iu.test(value)) return 'Бели брези'
  if (/^(?:св\.|света) троица$/iu.test(value)) return 'Света Троица'
  if (/^(?:суха|сухата) река$/iu.test(value)) return 'Суха река'
  return value.replace(/\s+/gu, ' ').trim()
}
function areas(rows) {
  const groups = new Map()
  for (const row of rows) {
    const key = neighborhood(row.neighborhood)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  return [...groups].sort(([a], [b]) => bgOrder(a, b)).map(([name, group]) => ({
    neighborhood: name, businesses: group.length, categories: counts(group),
    businessTypes: businessTypes(group),
  }))
}
function baselineRows(baseline) {
  if (!baseline) return []
  if (baseline.version !== 1 || !Array.isArray(baseline.records) || baseline.sourceCount !== baseline.records.length ||
      baseline.records.some(row => !row || typeof row.id !== 'string') ||
      new Set(baseline.records.map(row => row.id)).size !== baseline.records.length) {
    throw new Error('Invalid operational catalogue baseline; do not substitute the pricing-review baseline')
  }
  return baseline.records
}

export function reportLocationCoverage(rows) {
  const located = rows.filter(row => catalogueBoundCoordinates(row))
  return {
    located: located.length,
    unlocatedPremises: rows.filter(row => row.locationKind === 'premises' && !catalogueBoundCoordinates(row)).length,
    serviceAreaProviders: rows.filter(row => row.locationKind === 'service_area').length,
    heldCoordinates: rows.filter(row => row.coordinates && !catalogueBoundCoordinates(row)).length,
    firstPartyPoints: located.filter(row => row.coordinates.method === 'first_party_coordinates').length,
    reviewedOsmAddressPoints: located.filter(row => row.coordinates.method === 'verified_address_geocode').length,
    officialSofiaAddressPoints: located.filter(row => row.coordinates.method === 'verified_official_address').length,
  }
}

export function catalogueExpansionReport(records = SOFIA_CATALOGUE, { now = Date.now(), baseline = null } = {}) {
  const oldRows = baselineRows(baseline), oldIds = new Set(oldRows.map(row => row.id))
  const published = records.map(row => approvedCatalogueRecord(row, now)).filter(Boolean)
  const currentIds = new Set(published.map(row => row.id))
  const added = baseline ? published.filter(row => !oldIds.has(row.id)) : []
  const excludedIds = new Set(EXCLUDED_GENERAL_CLINIC_IDS)
  return {
    checkedAt: new Date(now).toISOString(),
    sourceRecords: records.length,
    currentlyEligible: published.length,
    withCurrentPublishedPrices: published.filter(row => row.services.some(service => currentPublishedFact(service.price, now))).length,
    excludedGeneralClinics: records.filter(row => excludedIds.has(row.id)).map(({ id, name }) => ({ id, name })),
    missingNeighborhood: published.filter(row => neighborhood(row.neighborhood) === 'Неуточнен квартал').length,
    categories: counts(published),
    businessTypes: businessTypes(published),
    neighborhoods: areas(published),
    locations: reportLocationCoverage(published),
    comparison: baseline ? {
      capturedOn: baseline.capturedOn, baselineSourceRecords: oldRows.length,
      addedBusinesses: added.length,
      addedByCategory: counts(added),
      addedByBusinessType: businessTypes(added),
      addedServiceFacts: added.reduce((sum, row) => sum + row.services.length, 0),
      addedCurrentPriceFacts: added.reduce((sum, row) => sum + row.services.filter(service => currentPublishedFact(service.price, now)).length, 0),
      addedPremises: added.filter(row => row.locationKind === 'premises').length,
      addedMobileProviders: added.filter(row => row.locationKind === 'service_area').length,
      addedLocations: reportLocationCoverage(added),
      addedByNeighborhood: areas(added),
      // Keep the original all-record grouping for previous consumers, but
      // never report one mobile operator as a venue in every served quarter.
      addedPremisesByNeighborhood: areas(added.filter(row => row.locationKind === 'premises')),
      addedCitywideMobileProviders: added.filter(row => row.locationKind === 'service_area')
        .map(row => ({ id: row.id, name: row.name, businessType: reportBusinessType(row) })),
      additions: added.map(row => ({ id: row.id, name: row.name, category: row.category, businessType: reportBusinessType(row), neighborhood: row.neighborhood,
        locationKind: row.locationKind, website: row.website, booking: row.booking,
        serviceFacts: row.services.length, currentPriceFacts: row.services.filter(service => currentPublishedFact(service.price, now)).length,
        priceSources: [...new Set(row.services.map(service => service.price?.sourceUrl).filter(Boolean))],
      })),
      removedOrNowIneligible: oldRows.filter(row => !currentIds.has(row.id)).map(row => ({
        id: row.id, reason: excludedIds.has(row.id) ? 'owner_excluded_general_human_clinic' : 'absent_or_no_longer_publicly_eligible',
      })),
    } : null,
    notice: 'Counts are unique catalogue businesses, not services or specialists. A missing neighborhood is not guessed. Located means an address-bound source point, not a verified business entrance. Additions compare against a separate operational baseline, never the historical pricing-review baseline.',
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { values } = parseArgs({ options: { baseline: { type: 'string' }, output: { type: 'string' }, 'as-of': { type: 'string' } } })
  const now = values['as-of'] ? Date.parse(`${values['as-of']}T00:00:00Z`) : Date.now()
  if (!Number.isFinite(now) || (values['as-of'] && new Date(now).toISOString().slice(0, 10) !== values['as-of'])) {
    throw new Error('--as-of must be a valid UTC day (YYYY-MM-DD)')
  }
  const baseline = values.baseline ? JSON.parse(await readFile(values.baseline, 'utf8')) : null
  const report = catalogueExpansionReport(SOFIA_CATALOGUE, { now, baseline })
  const json = JSON.stringify(report, null, 2) + '\n'
  if (values.output) await writeFile(values.output, json, { flag: 'wx' })
  else console.log(json)
}
