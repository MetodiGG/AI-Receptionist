import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'
import { withServicePricing } from '../lib/service-pricing.mjs'

// An offline authoring inventory, never a runtime translation service. Inputs
// are existing public catalogue data and the checked-in public partner snapshot.
// It does not read environment variables, contact details or a production API.
const repoRoot = fileURLToPath(new URL('../', import.meta.url))
const CYRILLIC = /[а-яѝ]/iu
const text = value => typeof value === 'string' && value.trim() ? value : ''
const seedKey = value => value.normalize('NFKC').toLocaleLowerCase('bg-BG').replace(/\s+/gu, ' ').trim()
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0
const sha256 = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')

function checkedDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Use an ISO checked-on date')
  const milliseconds = Date.parse(value + 'T00:00:00Z')
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString().slice(0, 10) !== value) throw Error('Use a valid checked-on date')
  return milliseconds
}

function seedPairs(suggestions) {
  const pairs = new Map()
  for (const [industry, groups] of Object.entries(suggestions || {})) {
    for (const group of groups || []) for (const service of group.services || []) {
      const bg = text(service.bg), en = text(service.en)
      if (!bg || !en) continue
      const key = JSON.stringify([bg, en])
      if (!pairs.has(key)) pairs.set(key, { bg, en, contexts: [] })
      pairs.get(key).contexts.push({ industry, group: group.key || '', id: service.id || '' })
    }
  }
  return [...pairs.values()].sort((a, b) => compare(a.bg, b.bg) || compare(a.en, b.en))
}

function inventoryField() {
  const entries = new Map()
  return {
    add(value, context) {
      if (!text(value)) return
      if (!entries.has(value)) entries.set(value, { text: value, occurrences: 0, businessIds: new Set(), categories: new Set(), sources: new Set(), examples: [] })
      const item = entries.get(value)
      item.occurrences++
      if (context.businessId) item.businessIds.add(context.businessId)
      if (context.category) item.categories.add(context.category)
      item.sources.add(context.source)
      if (item.examples.length < 6) item.examples.push({ ...context })
    },
    values() {
      return [...entries.values()].map(({ businessIds, categories, sources, ...item }) => ({
        ...item, characters: item.text.length, requiresEnglish: CYRILLIC.test(item.text),
        businessCount: businessIds.size, categories: [...categories].sort(compare), sources: [...sources].sort(compare),
      })).sort((a, b) => compare(a.text, b.text))
    },
  }
}

function countStrings(items) {
  return { unique: items.length, requiringEnglish: items.filter(item => item.requiresEnglish).length,
    characters: items.reduce((total, item) => total + item.characters, 0) }
}

export function buildPublicEnglishInventory({ catalogue = [], partners = [], suggestions = {}, checkedOn, scope = 'public' }) {
  const now = checkedDate(checkedOn)
  if (!['public', 'all'].includes(scope)) throw Error('Scope must be public or all')
  const approved = catalogue.map(row => approvedCatalogueRecord(row, now)).filter(Boolean)
  const selectedCatalogue = scope === 'all' ? catalogue : approved
  const publicPartners = partners.filter(row => row && row.active !== false && (!row.platform_status || row.platform_status === 'enabled'))
  const fields = { names: inventoryField(), descriptions: inventoryField(), units: inventoryField() }
  let catalogueServices = 0, partnerServices = 0
  function collect(business, source) {
    for (const [index, service] of (business.services || []).entries()) {
      if (!service || service.active === false || !text(service.name)) continue
      if (source === 'catalogue') catalogueServices++
      else partnerServices++
      const context = { source, businessId: business.id || '', category: service.category || business.category || business.industry || '', serviceIndex: index,
        ...(typeof service.id === 'string' ? { serviceId: service.id } : {}) }
      fields.names.add(service.name, context)
      // Preserve original pricing-condition recognition first. Only remaining
      // visible prose is an untranslated leaf; never overwrite the source row.
      fields.descriptions.add(servicePresentation(service, 'en').description, context)
      const unit = source === 'catalogue' ? service.price?.unit : withServicePricing(service).priceUnit
      fields.units.add(unit, context)
    }
  }
  for (const row of selectedCatalogue) collect(row, 'catalogue')
  for (const row of publicPartners) collect(row, 'public_partner_snapshot')
  const seeds = seedPairs(suggestions), seedsByKey = new Map()
  for (const pair of seeds) {
    const key = seedKey(pair.bg)
    if (!seedsByKey.has(key)) seedsByKey.set(key, [])
    seedsByKey.get(key).push(pair)
  }
  const entries = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.values()]))
  for (const item of entries.names) {
    const candidates = seedsByKey.get(seedKey(item.text))
    if (candidates?.length) item.seedCandidates = candidates.map(({ bg, en, contexts }) => ({ bg, en, contexts }))
  }
  return {
    schemaVersion: 1, checkedOn, scope,
    purpose: 'Offline English presentation inventory; source names, prices, qualifications, IDs and records stay unchanged.',
    descriptionStage: 'Remaining prose after servicePresentation(service, en); known translated conditions are not duplicated.',
    sourceFingerprints: { catalogue: sha256(catalogue), publicPartnerSnapshot: sha256(partners), suggestionPairs: sha256(seeds) },
    sourceCounts: { catalogueBusinesses: catalogue.length, eligibleCatalogueBusinesses: approved.length,
      selectedCatalogueBusinesses: selectedCatalogue.length, catalogueServices, partnerBusinesses: publicPartners.length, partnerServices },
    totals: { ...Object.fromEntries(Object.entries(entries).map(([key, values]) => [key, countStrings(values)])),
      seedPairs: seeds.length, seedNames: new Set(seeds.map(pair => pair.bg)).size,
      exactSeededNames: entries.names.filter(item => item.seedCandidates?.length).length },
    entries, seedPairs: seeds,
    limitations: [
      'Partner input is the checked-in public snapshot, not a live production read.',
      'Existing seed pairs are candidates, not automatic translations of qualified or ambiguous source names.',
      'New unmatched partner text requires a separately reviewed translation; transliteration is not English translation.',
    ],
  }
}

export async function writePublicEnglishInventory(output, inventory, { overwrite = false } = {}) {
  if (typeof output !== 'string' || !isAbsolute(output) || !output.endsWith('.json')) throw Error('Output must be an absolute JSON path outside the project')
  const destination = resolve(output), withinProject = relative(repoRoot, destination)
  if (withinProject === '' || !withinProject.startsWith('..' + '/') && !isAbsolute(withinProject)) throw Error('Do not write the inventory into project/source data')
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, JSON.stringify(inventory, null, 2) + '\n', { flag: overwrite ? 'w' : 'wx' })
}

async function main(args) {
  const options = {}
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--overwrite') options.overwrite = true
    else if (['--output', '--checked-on', '--scope'].includes(arg)) {
      const value = args[++index]
      if (!value || value.startsWith('--')) throw Error('Missing value for ' + arg)
      options[arg.slice(2)] = value
    } else throw Error('Unknown option: ' + arg)
  }
  if (!options.output) throw Error('Use --output /absolute/path/outside/project/inventory.json [--checked-on YYYY-MM-DD] [--scope public|all] [--overwrite]')
  const [{ SOFIA_CATALOGUE }, { SERVICE_SUGGESTION_DATA }, snapshot] = await Promise.all([
    import('../lib/discovery/sofia-catalogue.mjs'), import('../lib/service-suggestion-data.mjs'),
    readFile(new URL('../tests/fixtures/guided-public-partners-20261121.json', import.meta.url), 'utf8').then(JSON.parse),
  ])
  const inventory = buildPublicEnglishInventory({ catalogue: SOFIA_CATALOGUE, partners: snapshot.businesses,
    suggestions: SERVICE_SUGGESTION_DATA, checkedOn: options['checked-on'] || new Date().toISOString().slice(0, 10), scope: options.scope || 'public' })
  await writePublicEnglishInventory(options.output, inventory, options)
  process.stdout.write(JSON.stringify({ output: resolve(options.output), checkedOn: inventory.checkedOn, scope: inventory.scope, sourceCounts: inventory.sourceCounts, totals: inventory.totals }, null, 2) + '\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1 })
}
