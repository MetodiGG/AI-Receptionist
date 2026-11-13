import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import * as profiles from '../lib/business-profile.mjs'
import * as management from '../lib/profile-management.mjs'
import { privateReviewJson, reviewFailure } from '../lib/reviews.mjs'
import { createOwnerBusinessSettingsHandler, saveOwnerBusinessSettings } from '../lib/owner-business-settings.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const compile = async file => (await transform(await readFile(new URL(file, import.meta.url), 'utf8'), {
  filename: file, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
})).code
const routeCode = await compile('../app/api/owner/public-profile/route.js')
const editorCode = await compile('../components/business-public-profile-editor.js')
const id = '10000000-0000-4000-8000-000000000001', owner = '20000000-0000-4000-8000-000000000001'
const user = { id: owner, email_confirmed_at: '2026-01-01' }
const point = { latitude: 42.6650291, longitude: 23.2825296 }
const publicProfile = { description: { bg: 'Old description', en: '' }, payments: ['card'], brands: [], ...point }
const settings = { name: 'Offline studio', phone: '+359888000000', contact_email: 'owner@example.com', address: 'ул. Пирин 42', city_ekatte: '68134', neighborhood: 'Манастирски ливади', industry: 'beauty', timezone: 'Europe/Sofia', website_url: '', privacy_contact_email: '', booking_terms: '', default_duration_min: 45, booking_slot_minutes: 15, booking_window_days: 60, minimum_notice_minutes: 60, cancellation_notice_hours: 12, email_notifications_enabled: true, notification_locale: 'bg', welcome_message: '', bot_instructions: '' }
const business = () => ({ ...settings, id, owner_id: owner, slug: 'offline-studio', platform_status: 'enabled', public_profile: structuredClone(publicProfile), review_requests_enabled: true, content_revision: 4 })
const request = body => new Request('https://local.example/api/owner/public-profile', { method: 'PATCH', headers: { origin: 'https://local.example', 'content-type': 'application/json' }, body: JSON.stringify(body) })
const profileBody = (revision, profile = publicProfile) => ({ businessId: id, revision, profile, reviewRequestsEnabled: true })

function fixture() {
  const state = business(), calls = []
  const db = { from(table) {
    assert.equal(table, 'businesses')
    let patch = null
    const filters = new Map()
    const chain = { select() { return chain }, update(value) { patch = value; return chain }, eq(key, value) { filters.set(key, value); return chain },
      async maybeSingle() {
        calls.push({ patch, filters: [...filters] })
        if (filters.get('id') !== state.id || filters.get('owner_id') !== state.owner_id) return { data: null, error: null }
        if (!patch) return { data: { id: state.id }, error: null }
        if (filters.get('content_revision') !== state.content_revision) return { data: null, error: null }
        Object.assign(state, structuredClone(patch), { content_revision: state.content_revision + 1 })
        return { data: { id: state.id, content_revision: state.content_revision }, error: null }
      } }
    return chain
  } }
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', routeCode)(name => {
    if (name.endsWith('/server-auth')) return { requireUser: async () => user }
    if (name.endsWith('/supabase-admin')) return { getSupabaseAdmin: () => db }
    if (name.endsWith('/rate-limit')) return { consumeRateLimit: async () => true }
    if (name.endsWith('/profile-management.mjs')) return management
    if (name.endsWith('/reviews.mjs')) return { privateReviewJson, reviewFailure }
    return require(name)
  }, mod, mod.exports)
  const settingsHandler = createOwnerBusinessSettingsHandler({ authenticate: async () => user, allowAttempt: async () => true,
    readBusiness: async () => structuredClone(state), hasUpcomingBookings: async () => false,
    save: input => saveOwnerBusinessSettings(db, input) })
  return { state, calls, patch: mod.exports.PATCH, move: address => settingsHandler(request({ businessId: id, revision: state.content_revision, profile: { ...settings, address } })) }
}

const Coordinates = () => null
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
function editor(initialBusiness) {
  const slots = [], saved = []
  let cursor = 0, props = { business: structuredClone(initialBusiness), locale: 'bg', onSaved: async () => saved.push(true) }
  const hooks = { ...React, useEffect() {}, useState(initial) { const at = cursor++; if (!(at in slots)) slots[at] = typeof initial === 'function' ? initial() : initial; return [slots[at], value => { slots[at] = typeof value === 'function' ? value(slots[at]) : value }] } }
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', editorCode)(name => {
    if (name === 'react') return hooks
    if (name.endsWith('/business-profile.mjs')) return profiles
    if (name.endsWith('/supabase')) return { supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'offline-test-only' } } }) } } }
    if (name.endsWith('/business-coordinates-fields')) return { BusinessCoordinatesFields: Coordinates }
    return require(name)
  }, mod, mod.exports)
  const render = next => { if (next) props = { ...props, business: structuredClone(next) }; cursor = 0; return mod.exports.BusinessPublicProfileEditor(props) }
  return { render, slots, saved }
}

test('actual stale editor cannot restore its old valid pin after owner address move, even when refreshed parent props carry the new revision', async () => {
  const f = fixture(), e = editor(f.state), requests = []
  e.render()
  assert.equal((await f.move('ул. Пирин 43')).status, 200)
  assert.equal(f.state.content_revision, 5)
  assert.equal(f.state.public_profile.latitude, null)
  const tree = e.render(f.state)
  elements(tree, node => node.type === 'textarea')[0].props.onChange({ target: { value: 'Description-only old-tab edit' } })
  const previous = globalThis.fetch
  globalThis.fetch = async (_url, init) => { const body = JSON.parse(init.body); requests.push(body); return f.patch(request(body)) }
  try { await elements(e.render(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} }) }
  finally { globalThis.fetch = previous }
  assert.equal(requests[0].revision, 4, 'fresh props must not rebase the original draft')
  assert.equal(requests[0].profile.latitude, point.latitude)
  assert.equal(f.state.address, 'ул. Пирин 43'); assert.equal(f.state.content_revision, 5)
  assert.equal(f.state.public_profile.latitude, null); assert.equal(f.state.public_profile.longitude, null)
  assert.deepEqual(e.saved, [])
  assert.match(e.slots[7].text, /Обнови.*адреса и пина/)
})

test('fresh editor may intentionally set a new valid pin and advances only from its own successful server revision', async () => {
  const f = fixture()
  assert.equal((await f.move('ул. Пирин 43')).status, 200)
  const e = editor(f.state), requests = []
  const tree = e.render()
  elements(tree, node => node.type === Coordinates)[0].props.onChange({ latitude: 42.676917, longitude: 23.291083 })
  const previous = globalThis.fetch
  globalThis.fetch = async (_url, init) => { const body = JSON.parse(init.body); requests.push(body); return f.patch(request(body)) }
  try {
    await elements(e.render(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} })
    assert.equal(f.state.content_revision, 6)
    await elements(e.render(f.state), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} })
  } finally { globalThis.fetch = previous }
  assert.deepEqual(requests.map(value => value.revision), [5, 6])
  assert.equal(f.state.content_revision, 7)
  assert.equal(f.state.public_profile.latitude, 42.676917)
  assert.equal(f.state.public_profile.longitude, 23.291083)
  assert.equal(e.saved.length, 2)
})

test('actual profile adapter admits only one concurrent revision and blocks stale null-coordinate overwrites too', async () => {
  const f = fixture()
  const responses = await Promise.all([f.patch(request(profileBody(4))), f.patch(request(profileBody(4)))])
  assert.deepEqual(responses.map(value => value.status).sort(), [200, 409])
  assert.equal(f.state.content_revision, 5)
  const stale = await f.patch(request(profileBody(4, { ...publicProfile, latitude: null, longitude: null })))
  assert.equal(stale.status, 409)
  assert.equal(f.state.public_profile.latitude, point.latitude)
  const update = f.calls.find(value => value.patch)
  assert.ok(update.filters.some(([key, value]) => key === 'content_revision' && value === 4))
})

test('missing or malformed profile revisions fail before ownership lookup or writes', async () => {
  for (const revision of [undefined, null, '4', -1, 4.5]) {
    const f = fixture(), response = await f.patch(request(profileBody(revision)))
    assert.equal(response.status, 422)
    assert.deepEqual(f.calls, [])
    assert.equal(f.state.content_revision, 4)
  }
})
