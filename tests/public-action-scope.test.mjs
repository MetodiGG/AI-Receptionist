import { locationRecoveryAllowsFileChange, locationRecoveryAllowsNewFile, locationRecoveryPriorSource } from './location-recovery-20261122-scope.mjs'
import { priority30ReportAllowsFileChange, priority30ReportAllowsNewFile, priority30ReportPriorSource } from './priority30-catalogue-report-scope.mjs'
import { azisCatalogueAllowsFileChange, azisCatalogueAllowsNewFile, azisCataloguePriorSource } from './azis-style-catalogue-20261122-scope.mjs'
import { regionalCatalogueAllowsFileChange, regionalCatalogueAllowsNewFile, regionalCataloguePriorSource } from './regional-catalogue-20261122-scope.mjs'
import { catalogueRevalidationAllowsFileChange } from './catalogue-revalidation-20261122-scope.mjs'
import { sportsMobilePhotoFitAllowsFileChange } from './sports-mobile-photo-fit-scope.mjs'
import { servicePriceCardsAllowsFileChange, servicePriceCardsAllowsNewFile } from './services-price-cards-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PUBLIC_ACTION_BASE, PUBLIC_ACTION_HASHES, PUBLIC_ACTION_NEW_HASHES, publicActionAllowsFileChange, publicActionAllowsNewFile } from './public-action-scope.mjs'
import { publicEnglishAllowsFileChange, publicEnglishAllowsNewFile } from './public-english-scope.mjs'

const root = fileURLToPath(new URL('../',import.meta.url))
const git = (...args) => execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024})
const read = path => readFile(new URL('../'+path,import.meta.url),'utf8').then(source => regionalCataloguePriorSource(path, azisCataloguePriorSource(path, priority30ReportPriorSource(path, locationRecoveryPriorSource(path, source)))))
const before = path => git('show',PUBLIC_ACTION_BASE+':'+path)
const productionPath = path => path !== 'node_modules' && !/^(?:tests|docs)\//.test(path) && !/\.(?:md|txt)$/i.test(path)
const tree = git('ls-tree','-r','-z',PUBLIC_ACTION_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata,path] = record.split('\t'),[mode,type,oid] = metadata.split(' ')
  return {mode,type,oid,path}
}).filter(record => record.type === 'blob' && productionPath(record.path))

test('compact previews and shared actions have exactly twelve reviewed existing paths and two new local component files',async () => {
  assert.equal(Object.keys(PUBLIC_ACTION_HASHES).length,12)
  assert.deepEqual(Object.keys(PUBLIC_ACTION_NEW_HASHES),['components/public-action.js','components/public-action.module.css'])
  for (const [path,hash] of Object.entries({...PUBLIC_ACTION_HASHES,...PUBLIC_ACTION_NEW_HASHES})) {
    if (azisCatalogueAllowsFileChange(path) || publicEnglishAllowsFileChange(path) || publicEnglishAllowsNewFile(path) || servicePriceCardsAllowsFileChange(path) || catalogueRevalidationAllowsFileChange(path)) continue
    assert.equal(createHash('sha256').update(await read(path)).digest('hex'),hash,path+': changed bytes need their own explicit focused review, not a new baseline')
  }
  for (const path of ['lib/discovery/rail.mjs','lib/discovery/sofia-catalogue.mjs','lib/discovery/subcategories.mjs','lib/booking-mode.mjs','components/discovery-search.js','app/inline-discovery.css','package.json','pnpm-lock.yaml','next.config.mjs']) {
    assert.equal(publicActionAllowsFileChange(path),false,path)
    assert.equal(publicActionAllowsNewFile(path),false,path)
  }
  for (const path of ['tests/discovery-refinement-20261122-scope.mjs','tests/next-security-upgrade-scope.mjs','tests/stationary-discovery-scope.mjs']) assert.equal(await read(path),before(path),'never expand historical allowlists')
})

test('every original image and other production byte/path stays identical to the committed stationary-discovery stage, including data/prices, search, filtering, booking and analytics',async () => {
  const frozen = tree.filter(record => !publicActionAllowsFileChange(record.path) && !publicEnglishAllowsFileChange(record.path) && !servicePriceCardsAllowsFileChange(record.path) && !catalogueRevalidationAllowsFileChange(record.path) && !regionalCatalogueAllowsFileChange(record.path) && !azisCatalogueAllowsFileChange(record.path) && !priority30ReportAllowsFileChange(record.path) && !locationRecoveryAllowsFileChange(record.path) && !sportsMobilePhotoFitAllowsFileChange(record.path))
  for(let offset=0;offset<frozen.length;offset+=32) await Promise.all(frozen.slice(offset,offset+32).map(async record => {
    const path = new URL('../'+record.path,import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),record.oid,record.path+' stays unchanged from '+PUBLIC_ACTION_BASE)
  }))
  const actual = git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(path => path && !locationRecoveryAllowsNewFile(path) && !priority30ReportAllowsNewFile(path) && !regionalCatalogueAllowsNewFile(path) && !azisCatalogueAllowsNewFile(path) && !(path === 'lib/discovery/public-catalogue.mjs' && azisCatalogueAllowsFileChange(path)) && productionPath(path) && !publicEnglishAllowsNewFile(path) && !(path === 'scripts/check-public-english.mjs' && (regionalCatalogueAllowsFileChange(path) || azisCatalogueAllowsFileChange(path))) && !(path === 'lib/locale/service-english.json' && (catalogueRevalidationAllowsFileChange(path) || (regionalCatalogueAllowsFileChange(path) || azisCatalogueAllowsFileChange(path)))) && !servicePriceCardsAllowsNewFile(path))
  assert.deepEqual([...new Set(actual)].sort(),[...tree.map(record=>record.path),...Object.keys(PUBLIC_ACTION_NEW_HASHES)].sort(),'no data/media/API/config path is added')
})

function between(source,start,end) {
  const first = source.indexOf(start),last = source.indexOf(end,first)
  assert.ok(first>=0&&last>first,start)
  return source.slice(first,last)
}
// Remove only the exact reviewed display-only wrappers. IDs, handlers, links,
// prices, request/state code and all other bytes remain comparison inputs.
function withoutEnglishDisplay(source) {
  return source.replace(/^import \{ serviceDisplayName, (?:businessDisplayAddress|publicProse, businessDisplayAddress) \} from '\.\.\/lib\/locale\/public-content\.mjs'\n/m, '')
    .replace(/serviceDisplayName\((service|confirmation\.service), locale\)/g, '$1.name')
    .replace(/businessDisplayAddress\((row|business), locale\)/g, '$1.address')
    .replaceAll('publicProse(profile.description, locale, business.presentationEn?.description)', "profile.description[locale] || profile.description[en ? 'bg' : 'en']")
    .replaceAll('publicProse(person.bio, locale, person.bioEn)', 'person.bio')
    .replaceAll('publicProse(business.booking_terms, locale, business.presentationEn?.bookingTerms)', 'business.booking_terms')
}
test('outbound action paths, one-use event IDs, synchronous POST lock and pageshow cleanup remain byte-identical',async () => {
  const path='components/outbound-booking-button.js',current=await read(path),original=before(path)
  assert.equal(between(current,' const [busy,setBusy]',' const content='),between(original,' const [busy,setBusy]',' const content='))
  const submit = source => source.match(/onSubmit=\{event=>\{[^\n]+?\}\}/)?.[0]
  assert.ok(submit(original));assert.equal(submit(current),submit(original))
  assert.match(current,/<input type="hidden" name="eventId" value=\{eventId\}/)
  assert.match(current,/action=\{path\} method="post"/)
  assert.match(current,/disabled=\{busy\|\|disabled\}/)
  assert.match(current,/disabled\|\|!path\?<PublicAction as="span"/)
  assert.doesNotMatch(current,/trackProductEvent|trackSearchEvent|\bfetch\s*\(|location\./)
})

test('all directory photos, service names/prices, filters and analytics stay exact outside the single reviewed action/import line',async () => {
  const canonical = source => source.split('\n').filter(line=>!/^import \{ (?:BookingButtonContent|PublicAction) \}/.test(line)&&!line.includes('{bookingDisabled ?')).join('\n')
  assert.equal(canonical(withoutEnglishDisplay(await read('components/business-directory.js'))),canonical(before('components/business-directory.js')))
  const profile=withoutEnglishDisplay(await read('components/business-profile.js')),original=before('components/business-profile.js')
  const unchanged = source => source.split('\n').filter(line=>!/^import \{ (?:BookingCalendarIcon|PublicAction) \}/.test(line)&&!line.includes('<div className="profile-service-actions">')).join('\n')
  assert.equal(unchanged(profile.slice(profile.indexOf('export function BusinessProfileHeader'))),unchanged(original.slice(original.indexOf('export function BusinessProfileHeader'))))
  assert.equal(between(profile,'export function BusinessDirectionsLink','export function BusinessProfileHeader').match(/const href[^\n]+/)?.[0],between(original,'export function BusinessDirectionsLink','export function BusinessProfileHeader').match(/const href[^\n]+/)?.[0])
})

test('Google authorization/widget/attribution and contact modal behavior remain unchanged; only GoRez-owned controls adopt shared presentation',async () => {
  const path='components/google-business-card.js',current=await read(path),original=before(path)
  assert.equal(between(current,'function useAuthorizedGoogleWidget','export function GoogleBusinessCardFrame'),between(original,'function useAuthorizedGoogleWidget','export function GoogleBusinessCardFrame'))
  assert.equal(between(current,'export function GoogleContactDialogFrame','function GoogleBusinessContactDialog'),between(original,'export function GoogleContactDialogFrame','function GoogleBusinessContactDialog'))
  const contact = source => source.slice(source.indexOf('function GoogleBusinessContactDialog')).split('\n').filter(line=>!line.includes('href={railDirections(')).join('\n')
  assert.equal(contact(current),contact(original))
})

test('public booking/calendar state machine and forms remain byte-identical outside action-only JSX/import substitutions',async () => {
  let expected=before('components/public-booking-page.js')
  expected=expected.replace("import { BookingCalendarIcon, BookingButtonContent } from './booking-button-content'","import { BookingCalendarIcon } from './booking-button-content'\nimport { PublicAction, PublicActionPair } from './public-action'")
    .replaceAll('<OutboundBookingButton business={business} locale={locale} className="profile-external-reserve" disabled={preview}><BookingButtonContent>{en?\'Book\':\'Резервирай\'}</BookingButtonContent></OutboundBookingButton>','<OutboundBookingButton business={business} locale={locale} disabled={preview}>{en?\'Book\':\'Резервирай\'}</OutboundBookingButton>')
    .replace('<div className="business-booking-method"><div className="profile-mode-controls" role="group" aria-label={en ? \'Booking method\' : \'Начин за записване\'}>','<div className="business-booking-method"><PublicActionPair className="profile-action-modes" role="group" aria-label={en ? \'Booking method\' : \'Начин за записване\'}>')
    .replace('<button type="button" disabled={busy} aria-pressed={mode === \'booking\'} aria-controls="profile-native-panel" onClick={() => setMode(\'booking\')}><BookingButtonContent>{en ? \'Book\' : \'Резервирай\'}</BookingButtonContent></button>','<PublicAction type="button" disabled={busy} aria-pressed={mode === \'booking\'} aria-controls="profile-native-panel" onClick={() => setMode(\'booking\')}>{en ? \'Book\' : \'Резервирай\'}</PublicAction>')
    .replace('    </div></div>\n    <BusinessServiceList','    </PublicActionPair></div>\n    <BusinessServiceList')
  assert.notEqual(expected,before('components/public-booking-page.js'))
  assert.equal(withoutEnglishDisplay(await read('components/public-booking-page.js')),expected)
})
