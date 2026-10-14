// Explicit opt-in live QA. Creates isolated, clearly labelled test tenants;
// never reads or modifies existing customer bookings. Tokens stay in memory.
import assert from 'node:assert/strict'
import { randomUUID, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

const baseArg = process.argv.find(value => value.startsWith('--base='))
if (!baseArg || !process.argv.includes('--allow-test-data')) throw new Error('Use --base=https://your-deployment --allow-test-data')
const base = new URL(baseArg.slice(7)).origin
const checks = []
const createdBusinesses = []
const owners = []
let config

function passed(name) { checks.push(name); console.log(`PASS ${name}`) }
async function json(path, { method = 'GET', body, token, raw } = {}) {
  const response = await fetch(base + path, { method, headers: { ...(body || raw ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: raw ?? (body ? JSON.stringify(body) : undefined) })
  const data = await response.json()
  return { status: response.status, data, headers: response.headers }
}

async function rest(path, owner, method = 'GET', body) {
  const response = await fetch(config.url + '/rest/v1/' + path, { method, headers: { apikey: config.key, Authorization: `Bearer ${owner.token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: body ? JSON.stringify(body) : undefined })
  const text = await response.text()
  return { status: response.status, data: text ? JSON.parse(text) : null }
}

async function write(path, owner, method, body) {
  const result = await rest(path, owner, method, body)
  assert.ok(result.status >= 200 && result.status < 300, `Test write ${path.split('?')[0]} failed (${result.status}, ${result.data?.code || ''})`)
  return result.data
}

async function signup(label) {
  const email = `gorez.qa.${randomUUID()}@example.com`
  const password = `Qa!${randomBytes(24).toString('hex')}`
  const response = await fetch(config.url + '/auth/v1/signup', { method: 'POST', headers: { apikey: config.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, data: { qa_only: true, name: `GoRez automated QA ${label}` } }) })
  const data = await response.json()
  assert.equal(response.status, 200, `Test registration failed (${response.status})`)
  assert.ok(data.access_token && data.user?.id, 'Test signup requires auto-confirm; no emails should be sent')
  const loginResponse = await fetch(config.url + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: config.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  const login = await loginResponse.json()
  assert.equal(loginResponse.status, 200, 'Test password login failed')
  assert.equal(login.user?.id, data.user.id)
  const owner = { token: login.access_token, id: data.user.id, label }
  owners.push(owner)
  return owner
}

async function createTenant(owner) {
  const slug = `gorez-qa-${randomUUID()}`
  const [business] = await write('businesses', owner, 'POST', { owner_id: owner.id, name: `QA TEST ONLY — NOT A PARTNER (${owner.label})`, slug, industry: 'auto', active: false, timezone: 'Europe/Sofia', phone: '0000000000', booking_window_days: 14, minimum_notice_minutes: 0, cancellation_notice_hours: 0, email_notifications_enabled: false })
  createdBusinesses.push({ id: business.id, owner })
  const [service] = await write('services', owner, 'POST', { business_id: business.id, name: 'QA diagnostics', price: 0, duration_min: 30 })
  const staff = await write('staff', owner, 'POST', [{ business_id: business.id, name: 'QA Alex' }, { business_id: business.id, name: 'QA Sam' }])
  for (const person of staff) {
    await write('rpc/replace_working_hours', owner, 'POST', { input_business_id: business.id, input_staff_id: person.id, input_hours: Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, open_time: '09:00', close_time: '12:00' })) })
  }
  return { business, service, staff, owner, slug }
}

try {
  const html = await (await fetch(base + '/dashboard')).text()
  const assets = [...new Set([...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(match => match[1]))]
  const scripts = await Promise.all(assets.map(async path => { const response = await fetch(new URL(path, base)); assert.equal(response.status, 200); return response.text() }))
  const code = scripts.join('\n')
  config = { url: code.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0], key: code.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0] }
  assert.ok(config.url && config.key, 'Public Supabase config not found')
  const settings = await (await fetch(config.url + '/auth/v1/settings', { headers: { apikey: config.key } })).json()
  assert.equal(settings.mailer_autoconfirm, true, 'Stop: test signup would require sending emails')
  passed('frontend assets and registration configuration')

  for (const table of ['businesses', 'customers', 'appointments', 'messages', 'conversations', 'partner_leads']) {
    const result = await rest(`${table}?select=id&limit=1`, { token: config.key })
    assert.ok(result.status === 401 || result.status === 403 || (result.status === 200 && result.data.length === 0), `Anonymous data exposed: ${table}`)
  }
  passed('anonymous database access blocked')
  assert.equal((await json('/api/admin/overview')).status, 401)
  assert.equal((await json(`/api/owner/customers/${randomUUID()}`, { method: 'DELETE' })).status, 401)
  passed('admin and deletion require authentication')

  const a = await createTenant(await signup('A'))
  const b = await createTenant(await signup('B'))
  passed('real registration, business setup, services, two specialists and working hours')
  const hidden = await json(`/api/public/${a.slug}`)
  assert.equal(hidden.status, 404)
  passed('inactive business cannot be booked')

  const [customer] = await write('customers', a.owner, 'POST', { business_id: a.business.id, name: 'QA existing client', phone: '0000000001', notes: 'QA private CRM note' })
  for (const table of ['services', 'staff', 'working_hours', 'customers', 'appointments']) {
    const result = await rest(`${table}?business_id=eq.${a.business.id}`, b.owner)
    assert.equal(result.status, 200)
    assert.deepEqual(result.data, [])
  }
  assert.deepEqual(await write(`customers?id=eq.${customer.id}`, b.owner, 'PATCH', { notes: 'cross-tenant attack' }), [])
  assert.equal((await json(`/api/owner/customers/${customer.id}`, { method: 'DELETE', token: b.owner.token })).status, 404)
  const illegal = await rest('appointments', a.owner, 'POST', { business_id: a.business.id, service_id: a.service.id, staff_id: b.staff[0].id, customer_id: customer.id, starts_at: '2026-12-20T07:00:00Z', ends_at: '2026-12-20T07:30:00Z' })
  assert.ok(illegal.status >= 400)
  passed('cross-business reads, edits, deletion and foreign-row links blocked')

  const date = DateTime.now().setZone('Europe/Sofia').plus({ days: 3 }).toISODate()
  const local = DateTime.fromISO(`${date}T09:00`, { zone: 'Europe/Sofia' })
  const [off] = await write('time_off', a.owner, 'POST', { business_id: a.business.id, staff_id: a.staff[0].id, starts_at: local.toUTC().toISO(), ends_at: local.plus({ hours: 1 }).toUTC().toISO(), reason: 'QA time off' })
  await write(`businesses?id=eq.${a.business.id}`, a.owner, 'PATCH', { active: true })
  const publicPath = `/api/public/${a.slug}`
  assert.equal((await json(publicPath)).status, 200)
  const availability = await json(`${publicPath}/availability?service_id=${a.service.id}&date=${date}`)
  assert.equal(availability.status, 200)
  assert.ok(availability.data.slots.length > 0)
  assert.equal(availability.data.slots.some(slot => slot.staffId === a.staff[0].id && slot.startsAt === local.toUTC().toISO()), false)
  assert.ok(availability.data.slots.some(slot => slot.staffId === a.staff[1].id && slot.startsAt === local.toUTC().toISO()))
  assert.deepEqual((await json(`${publicPath}/availability?service_id=${a.service.id}&date=2020-01-01`)).data.slots, [])
  passed('availability respects staff time off, working hours, timezone and past dates')
  await write(`time_off?id=eq.${off.id}`, a.owner, 'DELETE')

  const slot = availability.data.slots.find(item => item.staffId === a.staff[1].id)
  const payload = { serviceId: a.service.id, staffId: slot.staffId, startsAt: slot.startsAt, customer: { name: 'QA GoRez pilot client', phone: '0000000002', email: '' }, intake: { vehicle: 'QA test vehicle' }, notes: 'QA test private appointment note', consent: true, locale: 'en' }
  assert.equal((await json(`${publicPath}/bookings`, { method: 'POST', body: {} })).status, 422)
  assert.equal((await json(`${publicPath}/bookings`, { method: 'POST', raw: '{' })).status, 422)
  assert.equal((await json(`${publicPath}/bookings`, { method: 'POST', body: { ...payload, source: 'manual' } })).status, 401)
  assert.equal((await json(`${publicPath}/bookings`, { method: 'POST', body: { ...payload, source: 'manual' }, token: b.owner.token })).status, 403)
  assert.equal((await json(`${publicPath}/bookings`, { method: 'POST', body: { ...payload, intake: {} } })).status, 422)
  passed('server validation, industry requirements and manual-owner authorization')

  const race = await Promise.all([json(`${publicPath}/bookings`, { method: 'POST', body: payload }), json(`${publicPath}/bookings`, { method: 'POST', body: payload })])
  assert.deepEqual(race.map(item => item.status).sort(), [201, 409])
  const booking = race.find(item => item.status === 201).data.booking
  assert.equal('customer' in booking, false)
  const viewPath = `/api/public/appointments/${booking.appointment.cancellation_token}`
  const view = await json(viewPath)
  assert.equal(view.status, 200)
  assert.match(view.headers.get('cache-control'), /no-store/)
  assert.ok(view.data.appointment.notes.includes('QA test vehicle'))
  const bookedRows = await rest(`appointments?id=eq.${booking.appointment.id}`, a.owner)
  assert.equal(bookedRows.data.length, 1)
  assert.deepEqual((await rest(`notification_outbox?business_id=eq.${a.business.id}`, a.owner)).data, [])
  passed('real booking, single race winner, private confirmation and no notification queue')

  const customerId = bookedRows.data[0].customer_id
  const availableNow = (await json(`${publicPath}/availability?service_id=${a.service.id}&date=${date}`)).data.slots
  assert.equal(availableNow.some(item=>item.startsAt === slot.startsAt && item.staffId === slot.staffId), false)
  const moveSlot = availableNow.find(item => item.staffId === a.staff[0].id)
  await write(`appointments?id=eq.${booking.appointment.id}`, a.owner, 'PATCH', { starts_at: moveSlot.startsAt, ends_at: moveSlot.endsAt, staff_id: moveSlot.staffId, status: 'confirmed' })
  assert.equal((await json(viewPath)).data.appointment.starts_at, moveSlot.startsAt.replace('.000Z', '+00:00'))
  passed('owner rescheduling and status reflected on client confirmation')

  const manualSlot = availableNow.find(item => item.staffId === a.staff[1].id && item.startsAt > slot.endsAt)
  const manual = await json(`${publicPath}/bookings`, { method: 'POST', token: a.owner.token, body: { ...payload, startsAt: manualSlot.startsAt, staffId: manualSlot.staffId, customer: { name: 'QA manual client', phone: '0000000003' }, source: 'manual' } })
  assert.equal(manual.status, 201)
  passed('authenticated manual booking')

  let conversationId
  async function chat(body) {
    const result = await json(`${publicPath}/chat`, { method: 'POST', body: { ...body, locale: 'en', conversationId } })
    assert.equal(result.status, 200, `Chat ${body.action} failed (${result.status})`)
    conversationId = result.data.conversationId
    return result.data
  }
  const faq = await chat({ action: 'faq', topic: 'services' })
  assert.match(faq.message, /QA diagnostics/)
  await chat({ action: 'start_booking' })
  await chat({ action: 'select_service', serviceId: a.service.id })
  await chat({ action: 'select_staff', serviceId: a.service.id, staffId: a.staff[1].id })
  const chatSlots = await chat({ action: 'select_date', serviceId: a.service.id, staffId: a.staff[1].id, date })
  const chatSlot = chatSlots.slots.at(-1)
  await chat({ action: 'select_slot', serviceId: a.service.id, staffId: chatSlot.staffId, startsAt: chatSlot.startsAt })
  const chatBooking = await chat({ action: 'book', ...payload, startsAt: chatSlot.startsAt, staffId: chatSlot.staffId, customer: { name: 'QA chat client', phone: '0000000004' } })
  assert.ok(chatBooking.booking?.appointment?.id)
  const messages = (await rest(`messages?conversation_id=eq.${conversationId}`, a.owner)).data
  assert.equal(messages.length, 14)
  assert.ok(messages.some(item => item.role === 'bot' && item.content.includes('Done!')))
  passed('full free guided chat booking and saved owner transcript')

  const erased = await json(`/api/owner/customers/${customerId}`, { method: 'DELETE', token: a.owner.token })
  assert.equal(erased.status, 200)
  const erasedView = (await json(viewPath)).data.appointment
  assert.equal(erasedView.notes, null)
  assert.equal(erasedView.customer.phone, null)
  assert.equal(erasedView.customer.email, null)
  assert.equal(erasedView.customer.name, 'Изтрит клиент')
  passed('complete client contact and appointment-note erasure')
  for (const item of [booking, manual.data.booking, chatBooking.booking]) {
    const path = `/api/public/appointments/${item.appointment.cancellation_token}`
    assert.equal((await json(path, { method: 'POST', body: { action: 'cancel' } })).status, 200)
    assert.equal((await json(path)).data.appointment.status, 'cancelled')
    assert.equal((await json(path, { method: 'POST', body: { action: 'cancel' } })).status, 200)
  }
  const finalSlots = (await json(`${publicPath}/availability?service_id=${a.service.id}&date=${date}`)).data.slots
  assert.ok(finalSlots.some(item => item.startsAt === moveSlot.startsAt && item.staffId === moveSlot.staffId))
  passed('cancellation is repeat-safe and immediately frees the slot')
} finally {
  for (const item of createdBusinesses.reverse()) {
    const result = await rest(`businesses?id=eq.${item.id}`, item.owner, 'DELETE')
    assert.ok(result.status >= 200 && result.status < 300, 'Test business cleanup failed')
  }
  for (const owner of owners) {
    await fetch(config.url + '/auth/v1/logout', { method: 'POST', headers: { apikey: config.key, Authorization: `Bearer ${owner.token}` } })
  }
  console.log(JSON.stringify({ checks: checks.length, testBusinessesRemoved: createdBusinesses.length, testAuthIdentitiesRetained: owners.length, existingDataModified: false }))
}
