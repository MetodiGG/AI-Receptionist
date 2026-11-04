import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DURATION_OPTIONS, validDuration } from '../lib/business-schedule.mjs'
import { businessApplicationSchema, applicationRecord } from '../lib/business-application.mjs'
import { buildAvailableSlots } from '../lib/availability.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const signup = minutes => ({
  business: { name: 'Offline QA', slug: 'offline-qa', phone: '+359888123456', contact_email: 'qa@example.com', address: 'Test Street 1', timezone: 'Europe/Sofia', industry: 'other', city_ekatte: '68134', neighborhood: '', default_duration_min: minutes, booking_slot_minutes: 15 },
  services: [{ name: 'Local service', price: '10', duration_min: minutes }], staff: [{ name: 'QA Person' }],
  schedule: Array.from({ length: 7 }, (_, index) => ({ weekday: index + 1, enabled: index < 5, open: '09:00', close: '18:00', breakEnabled: false, breakStart: '12:00', breakEnd: '13:00' })),
  account: { email: 'qa@example.com', password: 'Offline-test-only-password' }, locale: 'bg', consent: true, company: '',
})

test('short duration suggestions include ten minutes without limiting exact custom values', () => {
  assert.ok(DURATION_OPTIONS.includes(10))
  assert.deepEqual([...new Set(DURATION_OPTIONS)].sort((a, b) => a - b), DURATION_OPTIONS)
  assert.ok(DURATION_OPTIONS.every(validDuration))
  for (const minutes of [5, 10, 17, 23, 1440]) assert.equal(validDuration(String(minutes)), true)
  for (const minutes of ['', '4', '10.5', '1441', 'invalid']) assert.equal(validDuration(minutes), false)
})

test('onboarding has editable integer minutes for both the default and each service, with optional suggestions', async () => {
  const input = await read('components/duration-input.js'), setup = await read('components/business-setup.js')
  assert.match(input, /type="number" inputMode="numeric" min="5" max="1440" step="1"/)
  assert.match(input, /const listId = useId\(\)/)
  assert.match(input, /list=\{listId\} value=\{value\} onChange=\{event => onChange\(event\.target\.value\)\}/)
  assert.match(input, /<datalist id=\{listId\}>/)
  assert.doesNotMatch(input, /<select|Math\.round|parseInt|fetch\(/)
  assert.match(setup, /<DurationInput id="usual-duration"[^>]*value=\{business\.default_duration_min\}/)
  assert.match(setup, /<DurationInput id=\{`duration-\$\{index\}`\}[^>]*value=\{service\.duration_min\}/)
  assert.match(setup, /service\.name\.trim\(\) \? service : \{ \.\.\.service, duration_min: value \}/)
  // Internal mode retains the selected exact minutes; external mode must not
  // invent a duration or price for an unconfigured service.
  assert.match(setup, /duration_min: external\?'':business\.default_duration_min/)
  assert.match(setup, /price: external\?'':'25'/)
})

test('server signup validation preserves ten and seventeen minutes exactly and rejects invalid durations', () => {
  for (const minutes of ['10', '17', '1440']) {
    const parsed = businessApplicationSchema.parse(signup(minutes)), record = applicationRecord(parsed)
    assert.equal(record.business.default_duration_min, Number(minutes))
    assert.equal(record.services[0].duration_min, Number(minutes))
    assert.equal(record.business.booking_slot_minutes, 15)
  }
  for (const minutes of ['', '4', '10.5', '1441', 'bad']) assert.equal(businessApplicationSchema.safeParse(signup(minutes)).success, false)
})

test('exact short and custom services reserve their full minutes and exclude partial overlaps', () => {
  for (const durationMinutes of [10, 17]) {
    const end = `2026-10-19T06:${durationMinutes}:00.000Z`
    const slots = buildAvailableSlots({ date: '2026-10-19', zone: 'Europe/Sofia', durationMinutes, slotMinutes: 5, minimumNoticeMinutes: 0, now: '2026-10-18T08:00:00Z', staff: [{ id: 'local', name: 'QA' }], workingHours: [{ staff_id: 'local', weekday: 1, open_time: '09:00', close_time: '10:00' }], appointments: [{ staff_id: 'local', starts_at: end, ends_at: '2026-10-19T06:30:00.000Z' }], timeOff: [] })
    assert.equal(slots.find(slot => slot.localTime === '09:00').endsAt, end)
    assert.equal(slots.some(slot => slot.localTime === '09:05'), false)
    assert.ok(slots.some(slot => slot.localTime === '09:30'))
  }
})

test('business city fields no longer show the tiny source explanation but retain real city and custom-area choices', async () => {
  const fields = await read('components/business-location-fields.js')
  assert.doesNotMatch(fields, /location-source|Градове:|City list:|Кварталите са предложения/)
  assert.match(fields, /searchCities\('', locale\)/)
  assert.match(fields, /'Other — enter a neighbourhood' : 'Друг — въведи квартал'/)
  assert.match(fields, /onChange\(\{ city_ekatte: value, neighborhood: '' \}\)/)
})

test('one flags-only language button keeps the localized accessible label and existing locale callback', async () => {
  const ui = await read('components/language-switch.js')
  assert.equal((ui.match(/<button\b/g) || []).length, 1)
  assert.match(ui, /<CountryFlag locale=\{locale\}/)
  assert.doesNotMatch(ui, /\{en \? 'EN' : 'BG'\}|🇬🇧|🇧🇬/)
  assert.match(ui, /onChange\(en \? 'bg' : 'en'\)/)
  assert.match(ui, /'Switch language to Bulgarian' : 'Смени езика на английски'/)
  assert.doesNotMatch(ui, /router\.|location\.|fetch\(|localStorage|aria-pressed/)
})

test('client sign-in is reachable in the footer and collapsed menu, never as a competing header account icon', async () => {
  const nav = await read('components/marketing-navigation.js'), footer = await read('components/site-footer.js')
  for (const source of [nav, footer]) {
    assert.match(source, /href=\{`\/account\?lang=\$\{locale\}`\}/)
    assert.match(source, /'Client (?:login|account)' : 'Вход за клиенти'/)
  }
  assert.doesNotMatch(nav, /nav-client-account|<Icon name="user"/)
  assert.match(nav, /id="launch-menu" hidden=\{!open\}/)
  assert.match(nav, /aria-expanded=\{open\} aria-controls="launch-menu"/)
  assert.match(await read('components/customer-account.js'), /Регистрация/)
})

test('the menu remains keyboard-accessible and closed until requested on desktop as well as mobile', async () => {
  const nav = await read('components/marketing-navigation.js'), css = await read('app/solar.css')
  assert.match(nav, /event\.key === 'Escape' && open/)
  assert.match(nav, /document\.addEventListener\('pointerdown', close\)/)
  assert.match(nav, /document\.removeEventListener\('pointerdown', close\)/)
  assert.match(css, /\.marketing-page \.launch-menu-toggle \{ display: inline-grid;/)
  assert.match(css, /\.marketing-page \.launch-navigation \.launch-menu\[hidden\] \{ display: none;/)
  assert.match(css, /\.marketing-page \.launch-navigation \.launch-menu\.is-open \{ display: grid;/)
})

test('Sofia focus outlines the whole location control instead of an offset inner select', async () => {
  const css = await read('app/solar.css')
  assert.match(css, /\.discovery-controls \.discovery-city:focus-within \{ outline: 3px solid #b94315; outline-offset: 3px;/)
  assert.match(css, /\.discovery-controls \.discovery-city select:focus \{ outline: none; box-shadow: none;/)
})
