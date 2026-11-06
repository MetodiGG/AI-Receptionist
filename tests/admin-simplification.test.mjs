import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { adminSections, adminSectionDestination } from '../lib/admin-navigation.mjs'
import { externalLinkDraftSchema } from '../lib/external-booking-links.mjs'

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('compact admin sections retain all destinations and add the separate catalogue', () => {
  const keys = ['businesses', 'catalogue', 'leads', 'statistics', 'external-links', 'audit', 'reviews']
  for (const locale of ['bg', 'en']) {
    const sections = adminSections(locale)
    assert.deepEqual(sections.map(section => section.id), keys)
    assert.equal(new Set(sections.map(section => section.label)).size, 7)
    assert.ok(sections.every(section => section.label.length > 3))
  }
  assert.equal(adminSections()[4].label, 'Външни линкове')
  assert.equal(adminSections('en')[4].label, 'External links')
  assert.equal(adminSections()[1].label, 'Каталог')
  assert.deepEqual(adminSections('unexpected'), adminSections('bg'))
})

test('the only route-based admin section uses a fixed first-party URL, never input as a destination', () => {
  assert.equal(adminSectionDestination('reviews'), '/admin/reviews?lang=bg')
  assert.equal(adminSectionDestination('reviews', 'en'), '/admin/reviews?lang=en')
  assert.equal(adminSectionDestination('reviews', 'en&next=https://other.test'), '/admin/reviews?lang=bg')
  for (const id of ['businesses', 'external-links', 'javascript:alert(1)', 'https://other.test']) assert.equal(adminSectionDestination(id), null)
})

test('external link editor is opt-in and edits prefill the saved row instead of asking for registration again', () => {
  const source = read('components/admin-external-booking-links.js')
  assert.match(source, /\[composerOpen, setComposerOpen\] = useState\(false\)/)
  assert.match(source, /\{composerOpen && <form/)
  assert.match(source, /row \? Object\.fromEntries\(Object\.keys\(blank\)\.map\(key => \[key, row\[key\]/)
  assert.match(source, /Регистрираните партньори и данните им са в „Бизнеси“/)
  assert.match(source, /<details className="external-links-help"/)
  assert.match(source, /if \(lock\.current \|\| !discard\(\)\) return/)
  assert.match(source, /opener\.current\.isConnected/)
  assert.doesNotMatch(source, /fetch\(|maps\.googleapis|places\.googleapis/)
})

test('compact navigation shares destinations, guards dirty drafts and cannot switch while saving', () => {
  const source = read('components/platform-admin.js'), css = read('app/dashboard-responsive.css')
  assert.match(source, /<select id=\{sectionId\} value=\{tab\} disabled=\{linkBusy\|\|catalogueBusy\}/)
  assert.match(source, /if\(linkBusy\|\|catalogueBusy\|\|!sections\.some/)
  assert.match(source, /tab==='external-links'&&linkDirty&&!window\.confirm/)
  assert.match(source, /onManagePartners=\{\(\)=>chooseSection\('businesses'\)\}/)
  assert.match(source, /refreshKey=\{linkRefreshKey\}/)
  assert.match(read('components/admin-external-booking-links.js'), /\[load, refreshKey\]/)
  assert.match(css, /\.admin-console \.admin-console-toolbar \.admin-section-tabs \{ display:none;/)
  assert.match(css, /\.admin-section-selector select \{[^}]*font-size:16px;/)
})

test('simplifying the editor retains the exact-identity, real source and verification requirements', () => {
  const draft = { place_id: 'ChIJ_LOCAL_VALIDATION_ONLY', label: 'Local Example', booking_url: 'https://example.com/appointments', official_url: 'https://example.com/contact', evidence: 'Human verification of the exact business and direct booking flow.' }
  assert.equal(externalLinkDraftSchema.safeParse(draft).success, true)
  for (const key of Object.keys(draft)) assert.equal(externalLinkDraftSchema.safeParse({ ...draft, [key]: '' }).success, false, key)
  assert.equal(externalLinkDraftSchema.safeParse({ ...draft, booking_url: 'https://localhost/appointments' }).success, false)
  const source = read('components/admin-external-booking-links.js')
  assert.match(source, /verifiedBusinessAndBookingFlow: true/)
  assert.match(source, /action: 'save', id: edit\?\.id \|\| null, revision: edit\?\.revision/)
  assert.match(source, /Approval expires after 90 days/)
})
