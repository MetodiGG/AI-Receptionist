import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { NEIGHBOURHOODS, normalizeLocationQuery } from '../lib/business-location.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { DISCOVERY_CATEGORIES } from '../lib/discovery/categories.mjs'

const order = (a, b) => a.localeCompare(b, 'bg')
const quarterKey = value => normalizeLocationQuery(value)
  .replace(/^(?:zh k|zhk|kvartal|kv)\s+/u, '').replace(/\s+/gu, '')

// Reporting aliases already used by catalogue-expansion-report. No record,
// search filter or coordinates are modified. Numbered quarters stay separate.
export function coverageNeighborhood(value, registry = NEIGHBOURHOODS['68134']) {
  if (!value || /^неуточнен(?: квартал)?$/iu.test(value.trim())) return null
  let name = value.replace(/\s+/gu, ' ').trim()
  if (/^манастирски ливади(?:\s*(?:[-–—]\s*)?(?:изток|запад))?$/iu.test(name)) name = 'Манастирски ливади'
  if (/^(?:бели|белите) брези$/iu.test(name)) name = 'Белите брези'
  if (/^(?:св\.|света) троица$/iu.test(name)) name = 'Света Троица'
  if (/^(?:суха|сухата) река$/iu.test(name)) name = 'Сухата река'
  return registry.find(item => quarterKey(item) === quarterKey(name)) || name
}

function categoryIds(row) {
  // This is the same explicit service-category evidence required for a
  // category browse. A primary business label alone does not fill a cell.
  return [...new Set(row.services.map(service => service.category))]
}

/** Local reporting only: never geocodes, calls providers or alters listings. */
export function catalogueCoverageReport(records = SOFIA_CATALOGUE, {
  now = Date.now(), target = 50, neighborhoods = NEIGHBOURHOODS['68134'],
} = {}) {
  if (!Number.isFinite(now) || !Number.isInteger(target) || target < 1 || target > 100000) throw Error('Use a valid time and positive integer target')
  if (new Set(neighborhoods.map(quarterKey)).size !== neighborhoods.length) throw Error('Duplicate coverage neighborhood')
  const ids = new Set()
  for (const row of records) {
    if (ids.has(row.id)) throw Error(`Duplicate catalogue ID in coverage input: ${row.id}`)
    ids.add(row.id)
  }
  const approved = records.map(row => approvedCatalogueRecord(row, now)).filter(Boolean)
  const eligible = approved.filter(row => row.cityCode === '68134')
  const premises = eligible.filter(row => row.locationKind === 'premises')
  const mobile = eligible.filter(row => row.locationKind === 'service_area')
  const byName = new Map(neighborhoods.map(name => [name, []]))
  const missing = [], broad = new Map(), extras = new Map()
  const registryKeys = new Set(neighborhoods.map(quarterKey))
  // A broad name derived from numbered registry parts does not establish
  // which part a venue occupies. It is not copied into every child cell.
  const broadKeys = new Set(neighborhoods.map(name => name.replace(/\s+\d+[\p{L}]?$/u, ''))
    .filter(name => !registryKeys.has(quarterKey(name))).map(quarterKey))
  for (const row of premises) {
    const name = coverageNeighborhood(row.neighborhood, neighborhoods)
    if (!name) { missing.push(row); continue }
    if (byName.has(name)) { byName.get(name).push(row); continue }
    const groups = broadKeys.has(quarterKey(name)) ? broad : extras
    const existing = [...groups.keys()].find(item => quarterKey(item) === quarterKey(name)) || name
    if (!groups.has(existing)) groups.set(existing, [])
    groups.get(existing).push(row)
  }
  const categoryTotals = DISCOVERY_CATEGORIES.map(category => {
    const matches = eligible.filter(row => categoryIds(row).includes(category.id))
    return { id: category.id, name: category.bg, businesses: matches.length,
      premises: matches.filter(row => row.locationKind === 'premises').length,
      serviceAreaProviders: matches.filter(row => row.locationKind === 'service_area').length }
  })
  const makeArea = (name, rows, scope) => ({
    name, scope, distinctPremises: rows.length,
    cells: DISCOVERY_CATEGORIES.map(category => {
      const businessIds = rows.filter(row => categoryIds(row).includes(category.id)).map(row => row.id).sort()
      return { categoryId: category.id, category: category.bg, count: businessIds.length,
        gap: Math.max(0, target - businessIds.length), targetMet: businessIds.length >= target, businessIds }
    }),
  })
  const areas = [...byName].sort(([a], [b]) => order(a, b)).map(([name, rows]) => makeArea(name, rows, 'existing_picker_neighborhood'))
  const extensionAreas = [...extras].sort(([a], [b]) => order(a, b)).map(([name, rows]) => makeArea(name, rows, 'observed_additional_named_area'))
  const targetAreas = [...areas, ...extensionAreas]
  const cells = targetAreas.flatMap(area => area.cells.map(cell => ({ neighborhood: area.name, scope: area.scope, neighborhoodPremises: area.distinctPremises, ...cell })))
  const priority = cells.filter(cell => !cell.targetMet).sort((a, b) =>
    a.count - b.count || a.neighborhoodPremises - b.neighborhoodPremises ||
    categoryTotals.find(item => item.id === a.categoryId).premises - categoryTotals.find(item => item.id === b.categoryId).premises ||
    order(a.neighborhood, b.neighborhood) || order(a.category, b.category))
    .map(({ businessIds, ...cell }, index) => ({ rank: index + 1, ...cell }))
  const describe = row => ({ id: row.id, name: row.name, neighborhood: row.neighborhood, address: row.address, categoryIds: categoryIds(row), website: row.website })
  return {
    version: 1, checkedAt: new Date(now).toISOString(), targetPerCategoryPerNeighborhood: target,
    scope: 'Approved local Sofia catalogue premises; native partner records are not added without a separately deduplicated snapshot.',
    taxonomy: {
      source: 'lib/business-location.mjs:NEIGHBOURHOODS[68134]',
      pickerNeighborhoods: neighborhoods.length, observedAdditionalNamedAreas: extensionAreas.length,
      exhaustiveOfficialNeighborhoodRegister: false,
      note: 'The existing picker contains suggestions, not an exhaustive cadastral register. Additional sourced labels are shown separately, not silently dropped. No neighborhood is inferred from a centroid, coordinates or service area; boundaries have not been independently polygon-verified.',
      aliases: ['Манастирски ливади east/west → existing parent', 'Бели брези → Белите брези', 'Св. Троица → Света Троица', 'Суха река → Сухата река', 'case/spacing/punctuation variants only'],
    },
    counts: {
      sourceRecords: records.length, approvedBusinesses: eligible.length, excludedOrNotCurrentlyEligible: records.length - eligible.length,
      premises: premises.length, mappedPickerPremises: [...byName.values()].reduce((sum, rows) => sum + rows.length, 0),
      observedAdditionalAreaPremises: [...extras.values()].reduce((sum, rows) => sum + rows.length, 0),
      broadAreaUnresolvedPremises: [...broad.values()].reduce((sum, rows) => sum + rows.length, 0),
      missingNeighborhoodPremises: missing.length, serviceAreaProviders: mobile.length,
      pickerTargetCells: areas.length * DISCOVERY_CATEGORIES.length,
      additionalTargetCells: extensionAreas.length * DISCOVERY_CATEGORIES.length,
      totalTargetCells: cells.length, cellsAtTarget: cells.filter(cell => cell.targetMet).length,
      zeroCells: cells.filter(cell => cell.count === 0).length,
      businessCategoryIncidences: cells.reduce((sum, cell) => sum + cell.count, 0),
      outstandingBusinessCategoryIncidences: cells.reduce((sum, cell) => sum + cell.gap, 0),
    },
    categories: categoryTotals, neighborhoods: areas, additionalNamedAreas: extensionAreas,
    unresolvedBroadAreas: [...broad].sort(([a], [b]) => order(a, b)).map(([name, rows]) => ({ name, businesses: rows.map(describe) })),
    missingNeighborhood: missing.map(describe), serviceAreaProviders: mobile.map(describe),
    priorityQueue: priority,
    policy: [
      'Coverage gaps, not raw catalogue growth, determine research order: lowest cell count, then lowest neighborhood count, then scarcest citywide category; stable Bulgarian alphabetical ties.',
      'One approved business ID counts once per actual service category in one sourced neighborhood. Multiple services or staff do not create extra businesses.',
      'A real multiservice premises can legitimately occupy several categories; business-category incidence totals are not unique-business totals.',
      'An exact parent label never fills its numbered children; additional named areas and ambiguous broad labels remain distinct.',
      'Mobile/service-area providers are reported separately, never multiplied across neighborhoods. Expired, future, draft, rejected and owner-excluded records cannot fill cells.',
      'A target is not proof that 50 eligible premises exist in every cell. Genuine shortages remain open; never invent businesses, tariffs, coordinates or duplicate branches.',
      'This maintenance report changes no filtering, ranking, category mappings, registration, booking, database or production configuration.',
    ],
  }
}

export function coverageMarkdown(report) {
  const counts = report.counts
  const lines = [
    '# Покритие на каталога по квартали и категории', '',
    `Проверка: ${report.checkedAt.slice(0, 10)}. Работна цел: **${report.targetPerCategoryPerNeighborhood} различни реални обекта на категория и квартал**.`, '',
    `Каталог: ${counts.approvedBusinesses} одобрени бизнеса; ${counts.premises} с обект; ${counts.serviceAreaProviders} мобилни доставчици, които не се размножават по квартали.`, '',
    `Използвани са ${report.taxonomy.pickerNeighborhoods} квартални предложения от съществуващия интерфейс и ${report.taxonomy.observedAdditionalNamedAreas} допълнителни именувани области от реалните записи. Това **не е изчерпателен официален регистър**. ${counts.broadAreaUnresolvedPremises} обекта са с общ район без установена номерирана част; ${counts.missingNeighborhoodPremises} нямат квартал.`, '',
    `Целта е достигната в ${counts.cellsAtTarget} от ${counts.totalTargetCells} клетки; ${counts.zeroCells} са празни. Недостигът е ${counts.outstandingBusinessCategoryIncidences} бизнес–категория участия, **не** толкова непременно различни нови фирми. Нито един брой не доказва, че 50 подходящи обекта действително съществуват във всяка комбинация.`, '',
    '## Правила', '',
    '- Приоритет: най-малък брой в клетката → най-слабо покрит квартал → най-оскъдна категория в София.',
    '- Броят се одобрени обекти по реалните категории на услугите, не по предположение от името на фирмата.',
    '- Един ID се брои веднъж в категория; отделни услуги и служители не са отделни бизнеси.',
    '- Не пренасяме „Люлин“ във всички части на Люлин. Не преместваме адреси и не изобретяваме координати.',
    '- Източниците за услуги, резервации, цени и работно време продължават да изискват отделен ръчен преглед.',
    '- JSON справката съдържа точните ID във всяка клетка, цялата опашка и отделен списък за неуточнените квартали.', '',
    '## Категории за целия град', '', '| Категория | Бизнеси | С обект | Мобилни |', '|---|---:|---:|---:|',
    ...report.categories.map(row => `| ${row.name} | ${row.businesses} | ${row.premises} | ${row.serviceAreaProviders} |`), '',
    '## Покритие по квартали', '',
    'Всяка стойност е различни обекти в съответната категория; целта е 50. Допълнителните области не променят таксономията на сайта.', '',
    `| Квартал | Обекти | ${report.categories.map(row => row.name).join(' | ')} |`,
    `|---|---:|${report.categories.map(() => '---:').join('|')}|`,
    ...[...report.neighborhoods, ...report.additionalNamedAreas].map(area => `| ${area.name}${area.scope === 'observed_additional_named_area' ? ' †' : ''} | ${area.distinctPremises} | ${area.cells.map(cell => cell.count).join(' | ')} |`), '',
    '† Допълнително име, срещнато в одобрените източници; не е част от текущите 97 предложения в интерфейса и няма независимо потвърдена полигонална граница.', '',
    '## Първи 30 комбинации за проучване', '', '| Ред | Квартал | Категория | Налични | Недостиг |', '|---:|---|---|---:|---:|',
    ...report.priorityQueue.slice(0, 30).map(row => `| ${row.rank} | ${row.neighborhood} | ${row.category} | ${row.count} | ${row.gap} |`), '',
    'Това е опашка за проверка, а не доказателство за намерени кандидати. Непотвърдените фирми не се броят като добавени.', '',
  ]
  return lines.join('\n')
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { values } = parseArgs({ options: { 'as-of': { type: 'string' }, target: { type: 'string' }, output: { type: 'string' }, markdown: { type: 'string' } } })
  const date = values['as-of'], now = date ? Date.parse(`${date}T00:00:00Z`) : Date.now()
  if (!Number.isFinite(now) || date && new Date(now).toISOString().slice(0, 10) !== date) throw Error('--as-of must be a valid UTC day (YYYY-MM-DD)')
  const report = catalogueCoverageReport(SOFIA_CATALOGUE, { now, target: values.target == null ? 50 : Number(values.target) })
  const json = JSON.stringify(report, null, 2) + '\n'
  if (values.output) await writeFile(values.output, json, { flag: 'wx' })
  else console.log(json)
  if (values.markdown) await writeFile(values.markdown, coverageMarkdown(report), { flag: 'wx' })
}
