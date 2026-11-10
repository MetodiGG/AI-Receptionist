// OFFLINE ONLY. The allowlist below records a review of named first-party
// service menus, not permission to import arbitrary crawl/AI output. No DB,
// Google, geocoder, booking forms or network calls are used by this command.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeSearchText } from '../lib/discovery/categories.mjs'
import { enrichCataloguePricing } from '../lib/discovery/catalogue-pricing-enrichment.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const audit = path.join(root, '.audit-work/pricing-20261110')
const read = async name => JSON.parse(await fs.readFile(path.join(audit, name), 'utf8'))
const { records } = await read('inventory-with-registered.json')
const crawl = await read('web/report.json'), extracted = await read('web/price-candidates.json')
const hostReports = new Map(await Promise.all(extracted.hosts.map(async host => [host.host, await read(`web/${host.host}.json`)])))
const checkedOn = '2026-11-10'
const bg = value => /\p{Script=Cyrillic}/u.test(value.name) && !/\/en\/|[?&]lang=en/i.test(value.sourceUrl)
const sourcePath = value => decodeURIComponent(new URL(value.sourceUrl).pathname).toLowerCase()
const at = pathname => value => sourcePath(value) === pathname
const rule = (select, options = {}) => ({ select, ...options })
// Scope is one exact catalogue ID per host unless an explicit branch scope is
// supplied. Ambiguous short variants, products, expired events, old BGN-only
// menus and branch/staff-dependent duplicates remain in the review report.
const reviewed = {
  'beauty-nails-by-betyna-yovcheva.com': rule(at('/tseni'), { categories: [[/^Масаж на ходила$/u, 'beauty']] }),
  'beautystudio51.com': rule(at('/manikyur-i-pedikyur/'), { category: 'nails', exclude: /^(Омбре|Френски)$/u }),
  'bobiyarchev.com': rule(value => sourcePath(value).startsWith('/uslugi/') && bg(value)),
  'kikimorabeauty.com': rule(value => sourcePath(value).startsWith('/service/'), { categories: [['/friziorstvo', 'hair'], ['/manikyur-pedikyur', 'nails']], defaultCategory: 'beauty' }),
  'ss-beauty-sofia.com': rule(value => /^\/(hair|nails|brows|lashes)\/$/.test(sourcePath(value)), { categories: [['/hair/', 'hair'], ['/nails/', 'nails']], defaultCategory: 'beauty' }),
  'mmtherapy.bg': rule(value => sourcePath(value).startsWith('/bg/services/')),
  'physiobeactive.bg': rule(at('/pricelist/'), { exclude: /^Изправителна гимнастика$/u, note: 'Exercise price differs between the live page and a secondary cached rendering; not imported.' }),
  'physiolab.bg': rule(at('/kontakti')),
  'topalcenter.com': rule(at('/prices/')),
  'tlautoservice.com': rule(at('/tseni/'), { units: [[/Смяна (?:предни|задни) накладки|Смяна дискове/u, 'мост (2 колела)']] }),
  'zonawash.bg': rule(at('/цени/'), { aliases: {
    'комплексно измиване на лек автомобил': 'Комплексно измиване · лек автомобил',
    'комплексно измиване на джип': 'Комплексно измиване · джип',
    'полимерна защита на лек автомобил': 'Полимерна защита · лек автомобил',
    'полимерна защита на джип': 'Полимерна защита · джип',
    'пране на седалкa': 'Пране на една автомобилна седалка',
  }, units: [[/пране на килими/iu, 'кв.м.'], [/пране на седал/iu, 'седалка']] }),
  'studioblades.com': rule(at('/uslugi/')),
  'undergroundbarber.shop': rule(at('/')),
  'dragneva.com': rule(at('/prices/')),
  'irinakonstantinova.com': rule(value => bg(value) && /консултац/iu.test(value.name)),
  'arnica.bg': rule(value => at('/uslugi/')(value) && /^(Устна консултация|Почасова консултантска дейност)$/u.test(value.name)),
  'drumaction.com': rule(value => bg(value)),
  'elmidabeauty.com': rule(value => bg(value)),
  'kipra.beauty': rule(value => bg(value)),
  'www.medpedicure.com': rule(at('/uslugi/')),
  'iq-detailing.com': rule(at('/tseni/'), { units: [[/Пране на седалка/u, 'седалка']] }),
  'sofiadetailing.com': rule(value => sourcePath(value).startsWith('/цени/')),
  'www.nebuladetailing.bg': rule(value => bg(value)),
  'po-manyashkiya-detailing.com': rule(value => !/Най-търсено/iu.test(value.name) && bg(value), { exclude: /^(Керамични покрития|Стъкла и джанти)$/u }),
  'sinxronstudios.com': rule(at('/uslugi/')),
  'uslugi-vik.com': rule(at('/вик-услуги-цени')),
  'angelspilates.eu': rule(at('/ceni/'), { exclude: /^(?:4|8|12) посещения:/u, categories: [[/индивидуал|бременни/u, 'fitness']], appointment: value => /индивидуал|бременни/iu.test(value.name) ? 'individual_training' : 'group_reservation' }),
  'flowhavenpilates.com': rule(at('/pages/цени'), { aliases: { '1 посещение': 'Пилатес на реформър · 1 посещение' }, appointment: () => 'group_reservation' }),
  'www.resoul-studio.com': rule(value => bg(value), { exclude: /^Частна групова звукова практика$/u, defaultCategory: 'health', categories: [[/йога/u, 'fitness']], appointment: value => /йога/u.test(value.name) ? 'individual_training' : 'appointment' }),
  'kainezitherapy.com': rule(at('/prices/')),
  'autocomplexrs.com': rule(at('/услуги/'), { exclude: /^(?:EGR|Климатик|Двигател|Ходова част)$/u, units: [[/^Зареждане с фреон R134a$/u, '100 г']], note: 'Static catalogue only; the registered owner-managed RS account and its prices are not changed.' }),
  'igdental.bg': rule(at('/ceni.html')),
  'sfdent.eu': rule(value => sourcePath(value) === '/pricing' && bg(value)),
  'sofiadentalstudio.bg': rule(at('/index.php/services/'), { exclude: /^Преглед за установяване на орален статус$/u }),
  'www.balance-clinic.bg': rule(at('/price.php'), { exclude: /изследван/iu, note: 'Medical appointments retained; lab-like investigations need separate appointment-scope review.' }),
  'physiohealth.bg': rule(value => at('/ceni/')(value) && /^(Масаж|Радиален и Фокусиращ Шокуейв|Електростимулация|Ехограф на раменна става|Рехабилитация)$/u.test(value.name)),
  'diamondbeautybymz.com': rule(value => /^(Френски педикюр с гел лак|Лакиране с гел лак на крака|Сваляне на ноктопластика|Маникюр с гел лак \+ педикюр с вана)$/u.test(value.name)),
  'www.rotorem.bg': rule(value => sourcePath(value).startsWith('/services/sofia/'), { qualify: value => /washing-machine-repair/.test(sourcePath(value)) ? `Пералня · ${value.name}` : `Фурна · ${value.name}` }),
}
const heldHosts = {
  'abibeauty.bg': 'Services differ by branch; no bulk assignment of the common price list to all six branches.',
  'barbershopmarty.com': 'Staff/branch-specific offers need exact branch confirmation.',
  'belamistudio.com': 'Repeated short variants have different prices without complete section qualifiers.',
  'lazercentar.com': 'Common menu across multiple locations needs branch confirmation.',
  'www.yogavibe.net': 'Multiple location/service/card options require branch-specific scope confirmation.',
  'thaispa.bg': 'Multiple spa locations, duration/room variants and seasonal offers require exact scope confirmation.',
  'ramuslab.com': 'Lab packages require confirmation of availability and appointment eligibility at each branch.',
  'vita.bg': 'Multi-hospital, doctor and diagnostic price schedules need exact location/scope confirmation.',
  'carboxbg.com': 'The detected amounts are retail products, not appointment services.',
  'sandiautoshop.bg': 'The detected amounts are retail parts/chemicals, not appointment services.',
  'fetishhairatelier.com': 'Detected amounts are retail hair products, not appointments.',
  'shavi.bg': 'Detected amounts are retail beard products, not appointments.',
  'www.porschesofiaiztok.bg': 'Detected amounts are vehicle sales/finance offers, not service appointments.',
  'www.porschesofiajug.bg': 'Detected amounts are vehicle sales/finance offers, not service appointments.',
  'domashen-maistor.bg': 'BGN-only construction table needs currentness, labour/material and unit review.',
  'nirvanabyhv.bg': 'BGN-only older menu; not relabelled as a newly verified current EUR price.',
  'www.mgtheartofbeauty.com': 'BGN-only menu; currentness requires confirmation.',
  'antilopa.bg': 'Detected cleaning amount lacks a reliable service/unit pairing.',
  'carsrepair.bg': 'BGN-only truncated service names and old-price currentness need confirmation.',
  'noxicbeauty.com': 'Mixed dated event/price variants need exact current-menu review; expired event excluded.',
  'www.cityclinic.vet': 'Ambiguous numeric test-code/price pairing; not imported.',
  'luxurynails.bg': 'Short staff-level variants lack the parent service name; not imported.',
  'mymusic.center': 'Single event/card variants need package and date qualifiers.',
  'newwaygym.bg': 'Gym admission/sauna excluded; reserved class pricing needs confirmation.',
  'vayasport.bg': 'Generic visit/card rows need exact reserved class scope.',
  'vasilenahristova.com': 'Dated events are not a verified ongoing consultation tariff.',
}
const updates = [], sourceReviews = [], decisions = new Map()
const count = { servicesAdded: 0, pricesAdded: 0, pricesUpdated: 0, pricesReverified: 0, durationsAdded: 0 }
const identity = value => JSON.stringify([value.amount, value.currency, value.kind, value.maximum ?? null, value.unit ?? null])
for (const host of extracted.hosts) {
  const config = reviewed[host.host]
  if (!config) {
    for (const id of host.businessIds) if (host.candidates.length) decisions.set(id, heldHosts[host.host] || 'Literal amounts found, but section, unit, package or service scope is not sufficiently clear for import.')
    continue
  }
  // Never spread a host's prices over multiple premises implicitly.
  if (host.businessIds.length !== 1) throw Error(`Branch review required: ${host.host}`)
  const id = host.businessIds[0], original = records.find(row => row.id === id)
  if (!original || original.ownerManaged || original.source !== 'catalogue') throw Error(`Owner protection: ${id}`)
  const selected = host.candidates.filter(value => config.select(value) && value.price.currency === 'EUR'
    && !config.exclude?.test(value.name) && !/изследван|лаборатор/iu.test(value.name)
    && !/добави|количка|add to cart|checkout/iu.test(value.context))
  const grouped = new Map()
  for (const item of selected) {
    const alias = config.aliases?.[normalizeSearchText(item.name)]
    const name = alias || config.qualify?.(item) || item.name
    const key = normalizeSearchText(name)
    const prices = grouped.get(key) || new Map()
    const unit = config.units?.find(([test]) => test.test(item.name))?.[1]
    const price = { ...item.price, ...(unit ? { unit } : {}) }
    const duplicate = prices.get(identity(price))
    // Conflicting published durations are not resolved by picking the first.
    prices.set(identity(price), { ...item, name, price, ...(duplicate && duplicate.durationMin !== item.durationMin ? { durationMin: undefined } : {}) })
    grouped.set(key, prices)
  }
  const conflicts = [], services = []
  for (const [key, variants] of grouped) {
    if (variants.size !== 1) { conflicts.push(key); continue }
    const value = [...variants.values()][0]
    const category = config.categories?.find(([test]) => test instanceof RegExp ? test.test(value.name) : sourcePath(value).includes(test))?.[1] || config.category || config.defaultCategory || original.category
    const appointmentModel = config.appointment?.(value) || (category === 'home_services' ? 'home_visit' : category === 'fitness' ? 'group_reservation' : 'appointment')
    const price = { ...value.price, sourceUrl: value.sourceUrl, checkedOn }
    const service = { name: value.name, category, appointmentModel, price,
      ...(value.durationMin ? { durationMin: value.durationMin, durationSourceUrl: value.sourceUrl, durationCheckedOn: checkedOn } : {}) }
    services.push(service)
    const old = original.services.find(item => normalizeSearchText(item.name) === key)
    if (!old) count.servicesAdded++
    if (!old?.price) count.pricesAdded++
    else if (identity(old.price) !== identity(price)) count.pricesUpdated++
    else count.pricesReverified++
    if (value.durationMin && old?.durationMin !== value.durationMin) count.durationsAdded++
  }
  if (services.length) updates.push({ id, services })
  sourceReviews.push({ host: host.host, businessId: id, checkedOn, sourceUrls: [...new Set(services.map(value => value.price.sourceUrl))], importedPrices: services.length,
    rejectedOrDuplicateCandidates: host.candidates.length - services.length, unresolvedConflictingNames: conflicts, note: config.note || null })
  decisions.set(id, `Reviewed literal named first-party service rows; ${services.length} prices retained. Unqualified variants, conflicting amounts, products, duplicate translations and unreviewed pages remain excluded.`)
}
// Validation/merge is the exact same safe path used by the application. No DB
// record is changed. A typo in an ID, scope or service fails the generation.
enrichCataloguePricing(records.filter(row => row.source === 'catalogue').map(({ source, ownerManaged, ...row }) => row), updates)
const byId = new Map(updates.map(row => [row.id, row])), inventory = new Map(records.map(row => [row.id, row]))
const results = crawl.records.map(row => {
  const current = inventory.get(row.id), change = byId.get(row.id)
  const issues = []
  if (row.ownerManaged) {
    issues.push('Owner-managed record preserved; no website-driven overwrite.')
    if (current.platformStatus === 'suspended') issues.push('Suspended test record remains excluded from public discovery.')
    if (current.services.some(service => service.active && (!service.name || /Нова услуга/u.test(service.name) || Number(service.price) === 0))) issues.push('Owner review: active zero-price or placeholder service(s); not changed automatically.')
  }
  if (!row.website) issues.push('No official website or owner-configured booking URL in the record.')
  if (row.website && !row.websiteAccessed) issues.push('Official website unavailable/restricted; no bypass attempted.')
  for (const reason of new Set(row.attemptedPages.map(page => page.reviewRequired || (page.status !== 200 ? `HTTP ${page.status || 'network failure'}` : null)).filter(Boolean))) issues.push(reason)
  if (decisions.has(row.id)) issues.push(decisions.get(row.id))
  const hostReport = row.website && hostReports.get(new URL(row.website).hostname)
  const unvisitedRelevantLinks = hostReport?.unvisitedRelevantLinks || []
  if (unvisitedRelevantLinks.length) issues.push(`${unvisitedRelevantLinks.length} additional relevant links not visited in the bounded pass; further review is still needed.`)
  if (row.priceCandidatePages.length && !change && !decisions.has(row.id) && !row.ownerManaged) issues.push('Money/price labels found, but no unambiguous current service-price pair passed the literal extractor. Image/PDF/JS menus or section/table review may still be needed.')
  if (!row.priceCandidatePages.length && row.websiteAccessed) issues.push('No public service-price pair found in the checked pages; this is not a claim that the business has no prices.')
  return { id: row.id, name: row.name, source: row.source, ownerManaged: row.ownerManaged, website: row.website, websiteAccessed: row.websiteAccessed,
    existingServices: row.existingServices, existingPrices: row.existingPrices, pricesImported: change?.services.length || 0,
    status: change ? 'verified_pricing_enriched' : row.ownerManaged ? 'owner_managed_preserved' : row.status,
    issues, unvisitedRelevantLinks, checkedUrls: row.attemptedPages.map(({ url, status, reviewRequired }) => ({ url, status, ...(reviewRequired ? { reviewRequired } : {}) })) }
})
const summary = { checkedOn, businessesEvaluated: results.length, catalogueBusinesses: records.filter(row => row.source === 'catalogue').length,
  ownerManagedBusinesses: records.filter(row => row.ownerManaged).length, validWebsiteOrBookingUrls: crawl.validWebsiteRecords,
  websiteAccessedRecords: crawl.websiteAccessedRecords, recordsWithPriceSignals: crawl.priceCandidateRecords,
  businessesEnriched: updates.length, ...count, pricesImported: updates.reduce((n, row) => n + row.services.length, 0),
  inaccessibleWebsiteRecords: results.filter(row => row.website && !row.websiteAccessed).length,
  noPriceSignalInCheckedPages: crawl.records.filter(row => row.websiteAccessed && !row.priceCandidatePages.length).length,
  priceSignalWithoutApprovedImport: results.filter(row => row.status !== 'verified_pricing_enriched' && row.status !== 'owner_managed_preserved' && crawl.records.find(item => item.id === row.id).priceCandidatePages.length).length,
  liveDatabaseWrites: 0, paidRequests: 0,
  limitation: 'Full inventory evaluated, but not an exhaustive completed harvest of all public prices. PDFs, JavaScript/third-party menus, unavailable pages, unvisited relevant links, conflicting variants and branch/unit scope remain explicitly unresolved. No missing price is fabricated.' }
await fs.mkdir(path.join(root, 'docs/catalogue-pricing'), { recursive: true })
await fs.writeFile(path.join(root, 'lib/discovery/catalogue-data/pricing-20261110.json'), JSON.stringify(updates, null, 2) + '\n')
await fs.writeFile(path.join(root, 'docs/catalogue-pricing/audit-20261110.json'), JSON.stringify({ summary, sourceReviews, businesses: results }, null, 2) + '\n')
const csv = value => `"${String(value ?? '').replaceAll('"', '""')}"`
const columns = ['id', 'name', 'source', 'ownerManaged', 'website', 'websiteAccessed', 'existingServices', 'existingPrices', 'pricesImported', 'status', 'issues']
await fs.writeFile(path.join(root, 'docs/catalogue-pricing/audit-20261110.csv'), '\ufeff' + [columns, ...results.map(row => columns.map(key => key === 'issues' ? row.issues.join(' | ') : row[key]))].map(row => row.map(csv).join(',')).join('\n') + '\n')
console.log(JSON.stringify(summary, null, 2))
