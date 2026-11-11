import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { DateTime } from 'luxon'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
let active
const hooks = { ...React, useState: initial => active.state(initial), useMemo: (factory, dependencies) => active.memo(factory, dependencies) }
const controls = Object.fromEntries(['CatalogueImportReview', 'PhotoPicker', 'OwnerManualBookingDialog', 'WeeklyScheduleFields', 'OpeningHoursEditor'].map(name => [name, Object.defineProperty(() => null, 'name', { value: name })]))
const source = await readFile(new URL('../app/dev/owner-forms/preview.js', import.meta.url), 'utf8')
async function load(filename, imports) {
  const body = filename.endsWith('/preview.js') ? source : await readFile(new URL(`../${filename}`, import.meta.url), 'utf8')
  const { code } = await transform(body, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(imports, name) ? imports[name] : require(name), module, module.exports)
  return module.exports
}
const preview = await load('app/dev/owner-forms/preview.js', {
  react: hooks,
  '../../../components/catalogue-import-review': controls,
  '../../../components/photo-picker': controls,
  '../../../components/owner-manual-booking-dialog': controls,
  '../../../components/weekly-schedule-fields': controls,
  '../../../components/opening-hours-editor': controls,
})
const { OwnerFormsPreview, ownerFormsFixture, createOwnerFormsPreviewLoader } = preview
function elements(node, predicate, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, result))
  else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}
const content = node => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(content).join('') : React.isValidElement(node) ? content(node.props.children) : ''
function harness(locale = 'bg') {
  const slots = []
  let index = 0
  const h = {
    tree: null,
    slot(initial) { const at = index++; return slots[at] ?? (slots[at] = { value: initial() }) },
    state(initial) { const slot = h.slot(() => typeof initial === 'function' ? initial() : initial); return [slot.value, next => { slot.value = typeof next === 'function' ? next(slot.value) : next }] },
    memo(factory, dependencies) {
      const slot = h.slot(() => ({ dependencies: undefined, result: undefined }))
      if (!slot.value.dependencies || dependencies.some((value, at) => !Object.is(value, slot.value.dependencies[at]))) { slot.value.dependencies = dependencies; slot.value.result = factory() }
      return slot.value.result
    },
    render() { index = 0; active = h; try { h.tree = OwnerFormsPreview({ locale }) } finally { active = null }; return h.tree },
    find(predicate) { return elements(h.tree, predicate) },
    control(name) { return h.find(node => node.type === controls[name])[0] },
    click(label) { const action = h.find(node => node.type === 'button' && content(node) === label)[0]; assert.ok(action, label); action.props.onClick(); h.render() },
  }
  h.render()
  return h
}

test('owner forms page awaits locale parameters and is unavailable outside development with noindex metadata', async () => {
  const page = await load('app/dev/owner-forms/page.js', { './preview': preview, 'next/navigation': { notFound: () => { throw Error('LOCAL_PREVIEW_NOT_FOUND') } } })
  const environment = process.env.NODE_ENV
  try {
    for (const mode of ['production', 'test']) {
      process.env.NODE_ENV = mode
      await assert.rejects(() => page.default({ searchParams: Promise.resolve({ lang: 'en' }) }), /LOCAL_PREVIEW_NOT_FOUND/)
    }
    process.env.NODE_ENV = 'development'
    assert.deepEqual((await page.default({ searchParams: Promise.resolve({ lang: 'en' }) })).props, { locale: 'en' })
    assert.deepEqual((await page.default({ searchParams: Promise.resolve({ lang: 'unsupported' }) })).props, { locale: 'bg' })
    assert.deepEqual(page.metadata.robots, { index: false, follow: false })
  } finally {
    if (environment === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = environment
  }
})

for (const locale of ['bg', 'en']) {
  test(`${locale}: fixture has only fictional IDs, forty complete source services and actual-current Sofia tomorrow`, () => {
    const before = DateTime.now().setZone('Europe/Sofia').plus({ days: 1 }).toISODate()
    const fixture = ownerFormsFixture(locale)
    const after = DateTime.now().setZone('Europe/Sofia').plus({ days: 1 }).toISODate()
    assert.ok([before, after].includes(fixture.tomorrow))
    assert.equal(fixture.business.timezone, 'Europe/Sofia')
    assert.equal(fixture.business.booking_mode, 'gorez')
    assert.match(fixture.business.id, /^qa-/)
    assert.match(fixture.business.name, /FICTIONAL|ИЗМИСЛЕН/)
    assert.equal(fixture.business.coordinates, undefined)
    assert.equal(fixture.business.phone, undefined)
    assert.equal(fixture.business.owner_id, undefined)
    assert.equal(fixture.importDraft.services.length, 40)
    assert.equal(fixture.importDraft.serviceLimit, 40)
    assert.equal(new Set(fixture.importDraft.services.map(service => service.id)).size, 40)
    assert.ok(fixture.importDraft.services.every(service => service.catalogueHint.priceLabel && service.price && service.duration_min === '30'))
    assert.ok([...fixture.services, ...fixture.staff].every(row => row.id.startsWith('qa-')))
    assert.equal(fixture.services.length, 3)
    assert.equal(fixture.staff.length, 2)
    assert.deepEqual(fixture.schedule.find(day => day.weekday === 1), { weekday: 1, label: locale === 'en' ? 'Monday' : 'Понеделник', enabled: true, open: '09:30', close: '18:00', breakEnabled: true, breakStart: '12:00', breakEnd: '12:30' })
    assert.deepEqual(fixture.openingHours[0].periods, [{ open: '09:00', close: '12:00' }, { open: '13:00', close: '18:00' }])
    assert.equal(fixture.schedule[5].open, '10:00')
    assert.equal(fixture.schedule[5].close, '14:00')
    assert.equal(fixture.schedule[6].enabled, false)
    assert.deepEqual(fixture.openingHours[5].periods, [{ open: '10:00', close: '14:00' }])
    assert.deepEqual(fixture.openingHours[6].periods, [])
  })

  test(`${locale}: real controls are isolated behind explicit local actions; selecting forty source rows updates only QA count`, () => {
    const h = harness(locale), en = locale === 'en'
    assert.equal(h.control('OwnerManualBookingDialog'), undefined)
    assert.equal(h.control('CatalogueImportReview'), undefined)
    const photo = h.control('PhotoPicker')
    assert.equal(photo.props.required, true)
    assert.equal(photo.props.locale, locale)
    assert.equal(photo.props.label, en ? 'Business photos *' : 'Снимки на бизнеса *')
    assert.deepEqual(photo.props.files, [])
    assert.ok(h.find(node => node.props.className === 'setup-layout compact-business-setup').length)
    h.click(en ? 'Import services (40)' : 'Импорт на услуги (40)')
    const review = h.control('CatalogueImportReview')
    assert.equal(review.props.draft.services.length, 40)
    assert.equal(review.props.replace, true)
    review.props.onConfirm(Array.from({ length: 40 }, (_, index) => index)); h.render()
    assert.equal(h.control('CatalogueImportReview'), undefined)
    assert.equal(h.find(node => node.props['data-owner-forms-import-count'] === 40).length, 1)
    assert.match(content(h.tree), en ? /no business was changed/ : /няма променен бизнес/)
    h.click(en ? 'Import services (40)' : 'Импорт на услуги (40)')
    h.control('CatalogueImportReview').props.onCancel(); h.render()
    assert.equal(h.control('CatalogueImportReview'), undefined)
  })

  test(`${locale}: owner dialog uses a stable local loader and preview guard; no successful booking callback is permitted`, () => {
    const h = harness(locale), en = locale === 'en'
    h.click(en ? '+ New booking' : '+ Нова резервация')
    const modal = h.control('OwnerManualBookingDialog')
    assert.equal(modal.props.preview, true)
    assert.equal(modal.props.locale, locale)
    assert.equal(typeof modal.props.previewAvailabilityLoader, 'function')
    assert.ok(modal.props.services.every(service => service.id.startsWith('qa-owner-')))
    assert.equal(modal.props.initialDate, ownerFormsFixture(locale).tomorrow)
    assert.throws(modal.props.onCreated, /LOCAL_QA_MUST_NOT_CREATE_BOOKING/)
    const oldFixture = modal.props.business, oldLoader = modal.props.previewAvailabilityLoader
    h.control('PhotoPicker').props.onChange([{ name: 'local-fixture-only.png' }]); h.render()
    assert.equal(h.control('PhotoPicker').props.files.length, 1)
    assert.equal(h.control('OwnerManualBookingDialog').props.business, oldFixture)
    assert.equal(h.control('OwnerManualBookingDialog').props.previewAvailabilityLoader, oldLoader, 'local state changes must not restart availability')
    h.control('OwnerManualBookingDialog').props.onClose(); h.render()
    assert.equal(h.control('OwnerManualBookingDialog'), undefined)
  })

  test(`${locale}: actual native/external hours boundaries own independent local state with no save action`, () => {
    const h = harness(locale)
    for (const name of ['data-owner-forms-schedule', 'data-owner-forms-nativehours', 'data-owner-forms-externalhours']) assert.equal(h.find(node => Object.hasOwn(node.props, name)).length, 1)
    const native = h.control('WeeklyScheduleFields'), external = h.control('OpeningHoursEditor')
    assert.equal(native.props.locale, locale)
    assert.equal(external.props.locale, locale)
    assert.equal(native.props.days.length, 7)
    assert.equal(external.props.value.length, 7)
    const beforeExternal = external.props.value
    native.props.onChange(native.props.days.map(day => day.weekday === 2 ? { ...day, enabled: true, open: '09:30', close: '18:00' } : day)); h.render()
    assert.equal(h.control('WeeklyScheduleFields').props.days[1].enabled, true)
    assert.equal(h.control('OpeningHoursEditor').props.value, beforeExternal)
    const beforeNative = h.control('WeeklyScheduleFields').props.days
    external.props.onChange(external.props.value.map(day => day.weekday === 2 ? { ...day, periods: [{ open: '09:00', close: '12:00' }] } : day)); h.render()
    assert.deepEqual(h.control('OpeningHoursEditor').props.value[1].periods, [{ open: '09:00', close: '12:00' }])
    assert.equal(h.control('WeeklyScheduleFields').props.days, beforeNative)
    assert.equal(h.find(node => node.type === 'button' && /save|запази/i.test(content(node))).length, 0)
  })
}

test('local fixture slots have actual requested IDs, selected staff and service duration across the Sofia daylight-saving boundary', async () => {
  const fixture = ownerFormsFixture('bg', DateTime.fromISO('2026-03-28T12:00:00', { zone: 'Europe/Sofia' }))
  const loader = createOwnerFormsPreviewLoader(fixture, { delayMs: 0 })
  assert.equal(fixture.tomorrow, '2026-03-29')
  const data = await loader({ business: fixture.business, serviceId: 'qa-owner-ready', staffId: fixture.staff[1].id, date: fixture.tomorrow })
  assert.equal(data.slots.length, 2)
  assert.deepEqual(data.slots.map(slot => slot.localTime), ['10:00', '11:30'])
  assert.ok(data.slots.every(slot => slot.staffId === fixture.staff[1].id && slot.staffName === fixture.staff[1].name))
  assert.equal(DateTime.fromISO(data.slots[0].startsAt).toUTC().hour, 7)
  assert.ok(data.slots.every(slot => DateTime.fromISO(slot.endsAt).diff(DateTime.fromISO(slot.startsAt), 'minutes').minutes === 45))
  assert.deepEqual(await loader({ business: fixture.business, serviceId: 'qa-owner-empty', date: fixture.tomorrow }), { slots: [] })
  assert.deepEqual(await loader({ business: fixture.business, serviceId: 'qa-owner-ready', date: '2026-03-30' }), { slots: [] })
})

test('synthetic error is distinct from empty availability and supports a real retry of the same local context', async () => {
  const fixture = ownerFormsFixture(), loader = createOwnerFormsPreviewLoader(fixture, { delayMs: 0 })
  const context = { business: fixture.business, serviceId: 'qa-owner-retry', date: fixture.tomorrow }
  await assert.rejects(() => loader(context), /FICTIONAL_QA_TECHNICAL_FAILURE/)
  assert.equal((await loader(context)).slots.length, 2)
  assert.equal((await loader(context)).slots.length, 2)
  await assert.rejects(() => loader({ ...context, serviceId: 'not-an-actual-fixture-service' }), /INVALID_LOCAL_QA_CONTEXT/)
  await assert.rejects(() => loader({ ...context, staffId: 'not-an-actual-fixture-staff' }), /INVALID_LOCAL_QA_CONTEXT/)
})

test('local loading is asynchronous and abortable without consuming the fixture failure or publishing stale slots', async () => {
  const fixture = ownerFormsFixture(), loader = createOwnerFormsPreviewLoader(fixture)
  const controller = new AbortController(), context = { business: fixture.business, serviceId: 'qa-owner-retry', date: fixture.tomorrow }
  const pending = loader({ ...context, signal: controller.signal })
  assert.equal(typeof pending.then, 'function')
  controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  await assert.rejects(() => loader(context), /FICTIONAL_QA_TECHNICAL_FAILURE/)
  assert.equal((await loader(context)).slots.length, 2)
})

test('preview imports actual UI boundaries but no authentication, dashboard provider, network, notification or application writes', () => {
  for (const component of ['catalogue-import-review', 'photo-picker', 'owner-manual-booking-dialog', 'weekly-schedule-fields', 'opening-hours-editor']) assert.ok(source.includes(`../../../components/${component}`))
  assert.doesNotMatch(source, /\bfetch\s*\(|supabase|OwnerPage|api\/|getSession|method\s*:\s*['"]POST|<form|href=/)
  assert.match(source, /preview previewAvailabilityLoader=\{loader\}/)
  assert.match(source, /useMemo\(\(\) => createOwnerFormsPreviewLoader\(fixture\), \[fixture\]\)/)
})
