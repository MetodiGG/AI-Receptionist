import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const dashboard = await read('app/dashboard-responsive.css')
const onboarding = await read('app/onboarding.css')
const media = await read('app/business-management.css')
const owner = await read('app/dashboard/appointments/page.js')
function rule(source, selector) {
  const matches = [...source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(match => match[1].split(',').some(value => value.trim() === selector))
  assert.ok(matches.length, selector)
  return Object.fromEntries(matches.flatMap(match => match[2].split(';').filter(value => value.trim()).map(value => {
    const colon = value.indexOf(':')
    return [value.slice(0, colon).trim(), value.slice(colon + 1).trim()]
  })))
}

test('photo requirements are centered with breathing room above the picker border, not hidden', () => {
  assert.equal(rule(media, '.photo-picker .photo-picker-requirement')['text-align'], 'center')
  const compact = rule(onboarding, '.compact-business-setup .photo-picker-requirement')
  assert.equal(compact['text-align'], 'center')
  assert.equal(compact.padding, '0 12px 10px')
  assert.notEqual(compact.display, 'none')
})

test('bulk service selection keeps its label readable, touch target comfortable and native checkbox focus visible', () => {
  const bulk = rule(onboarding, '.catalogue-import-select-all')
  assert.equal(bulk.display, 'flex')
  assert.equal(bulk['min-width'], '0')
  assert.equal(bulk['min-height'], '44px')
  assert.equal(rule(onboarding, '.catalogue-import-select-all > strong')['overflow-wrap'], 'break-word')
  assert.match(rule(onboarding, '.catalogue-import-select-all > input:focus-visible').outline, /3px solid/)
})

test('owner forms explicitly retain grid layout instead of the legacy admin-modal direct-child flex rule', () => {
  assert.equal(rule(dashboard, '.admin-modal > .settings-form-grid').display, 'grid')
  assert.equal(rule(dashboard, '.admin-modal > .settings-panel-head').display, 'block')
  const grid = rule(dashboard, '.owner-appointment-dialog .settings-form-grid')
  assert.equal(grid.display, 'grid')
  assert.equal(grid['grid-template-columns'], 'minmax(0,1fr)', 'last rule is the narrow-screen override')
  assert.match(dashboard, /\.owner-appointment-dialog \.settings-form-grid \{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
})

test('the owner dialog scrolls within the viewport without clipping the submit actions or adding heavy backdrop blur', () => {
  const dialog = rule(dashboard, '.owner-appointment-dialog')
  assert.equal(dialog['max-height'], 'calc(100dvh - 24px)')
  assert.equal(dialog.overflow, 'auto')
  assert.equal(dialog['overscroll-behavior'], 'contain')
  const footer = rule(dashboard, '.owner-appointment-dialog .settings-actions')
  assert.equal(footer.position, 'sticky')
  assert.equal(footer.bottom, '0', 'actions stay inside the dialog scrollport, not below its edge')
  assert.equal(footer.display, 'flex')
  assert.notEqual(rule(dashboard, '.owner-appointment-dialog .settings-actions > button').width, '100%')
  assert.equal(rule(dashboard, '.owner-appointment-dialog::backdrop')['backdrop-filter'], undefined)
})

test('the dashboard delegates manual input state to an isolated component while retaining real owner context and calendar actions', () => {
  assert.match(owner, /OwnerManualBookingDialog key=\{business\.id\} business=\{business\}/)
  assert.match(owner, /initialDate=\{manualContext\.date\} initialStaffId=\{manualContext\.staffId\}/)
  assert.match(owner, /onCreated=\{async \(\) => \{ setManualContext\(null\); await load\(\) \}\}/)
  assert.match(owner, /status !== 'ready'/)
  assert.match(owner, /business\.booking_mode==='external'/)
  assert.match(owner, /onCreateBooking=\{openManualBooking\}/)
  assert.doesNotMatch(owner, /manual\.(?:serviceId|name|phone|email)|setManualIntake|createManualAppointment|manual-booking-modal/)
  assert.match(owner, /appointment-availability/, 'rescheduling keeps its existing authoritative endpoint')
})
