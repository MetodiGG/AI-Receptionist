import { emailDeliveryEnabled } from './booking-safety.mjs'
import { escapeEmailHtml, serializeEmailPayload } from './notification-email.mjs'

const SITE_ORIGIN = 'https://www.gorez.co'
const email = value => typeof value === 'string' && value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export function approvalNoticeIsCurrent(row, context, now = Date.now()) {
  const business = context?.business, owner = context?.owner
  const created = Date.parse(row?.created_at), attempted = Date.parse(row?.first_attempt_at)
  const bannedUntil = owner?.banned_until ? Date.parse(owner.banned_until) : null
  return Boolean(row && business && owner && row.business_id === business.id && row.owner_id === business.owner_id && row.owner_id === owner.id
    && business.active && business.platform_status === 'enabled' && owner.email_confirmed_at && !owner.is_anonymous
    && (!owner.banned_until || (Number.isFinite(bannedUntil) && bannedUntil <= now))
    && email(row.recipient) && row.recipient === owner.email?.trim().toLowerCase()
    && Number.isFinite(created) && created <= now && created > now - 7 * 86400000
    && Number.isFinite(attempted) && attempted <= now && attempted > now - 23 * 3600000)
}

export function buildBusinessApprovalEmail(row, context, from) {
  const en = row.locale === 'en', locale = en ? 'en' : 'bg', business = context.business
  if (!email(row.recipient) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(business.slug || '') || !from || /[\r\n]/.test(from)) throw Error('INVALID_APPROVAL_EMAIL')
  const title = en ? 'Your business is approved' : 'Бизнесът ти е одобрен'
  const intro = en ? 'Your GoRez business profile is approved and published.' : 'Бизнес профилът ти в GoRez е одобрен и публикуван.'
  const instruction = en ? 'Sign in with the email and password you chose during registration. No new account or email verification link is needed.' : 'Влез с имейла и паролата, които избра при регистрацията. Не е нужен нов профил или линк за потвърждение на имейла.'
  const action = en ? 'Sign in to GoRez' : 'Влез в GoRez'
  const profileLabel = en ? 'Public business profile' : 'Публичен профил на бизнеса'
  const footer = en ? 'One automatic notice about your business application, not a marketing subscription. If you did not submit this application, contact info@gorez.co.' : 'Еднократно автоматично известие за заявката на бизнеса, не абонамент за реклама. Ако не си подавал тази заявка, свържи се с info@gorez.co.'
  const login = `${SITE_ORIGIN}/login?lang=${locale}`, profile = `${SITE_ORIGIN}/book/${encodeURIComponent(business.slug)}?lang=${locale}`, h = escapeEmailHtml
  return {
    from, to: [row.recipient], subject: `${title} · ${business.name}`.replace(/[\r\n]/g, ' ').slice(0, 240),
    text: `${title}\n\n${intro}\n${business.name}\n\n${instruction}\n\n${action}: ${login}\n${profileLabel}: ${profile}\n\n${footer}`,
    html: `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#fff8ef;font-family:Arial,sans-serif;color:#493322"><div style="max-width:600px;margin:auto;padding:28px 18px"><div style="background:#fffdf8;border:1px solid #ead8c5;border-radius:18px;padding:28px"><strong style="color:#a64b1b;font-size:24px">GoRez</strong><h1 style="font-size:25px;line-height:1.3">${h(title)}</h1><p>${h(intro)}</p><p style="font-weight:bold">${h(business.name)}</p><p style="line-height:1.6">${h(instruction)}</p><a href="${login}" style="display:inline-block;background:#ffd09f;color:#5a2d17;padding:14px 20px;border:1px solid #dda978;border-radius:12px;text-decoration:none;font-weight:bold">${h(action)}</a><p style="margin-top:22px"><a href="${h(profile)}" style="color:#8b421c">${h(profileLabel)}</a></p><p style="font-size:12px;line-height:1.6;color:#766457;margin-top:28px">${h(footer)}</p></div></div></body></html>`,
  }
}

function validPayload(payload, recipient) {
  return payload && Object.keys(payload).every(key => ['from','to','subject','text','html'].includes(key))
    && Array.isArray(payload.to) && payload.to.length === 1 && payload.to[0] === recipient
    && ['from','subject','text','html'].every(key => typeof payload[key] === 'string' && payload[key].length > 0)
    && !/[\r\n]/.test(payload.from + payload.subject)
}

function providerRetryDelay(response, now) {
  const raw = response.headers.get('retry-after')
  if (!raw) return 1000
  const milliseconds = /^\d+(?:\.\d+)?$/.test(raw.trim()) ? Number(raw) * 1000 : Date.parse(raw) - now
  return Number.isFinite(milliseconds) && milliseconds > 0 ? Math.max(1000, milliseconds) : 1000
}

async function deliverApproval({ row, payload, store, env, fetcher, pause, now, deadline }) {
  const body = serializeEmailPayload(payload)
  let failure = { kind: 'failed', code: 'DELIVERY_UNCONFIRMED' }
  // An immediate short retry avoids relying solely on the Hobby daily cron.
  // Both attempts retain the same frozen bytes and provider deduplication key.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (now() >= deadline || !await store.current(row)) return { kind: 'skipped' }
    if (now() >= deadline) return { kind: 'skipped' }
    let delay = 1000
    try {
      const response = await fetcher('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(Math.max(1, Math.min(5000, deadline - now()))),
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `gorez/approval/${row.id}` }, body,
      })
      if (response.ok) {
        const result = await response.json()
        if (typeof result?.id !== 'string' || !result.id || result.id.length > 200 || /[\r\n]/.test(result.id)) throw Error('INVALID_PROVIDER_RESPONSE')
        return { kind: 'sent', id: result.id }
      }
      const retryable = response.status === 429 || response.status >= 500 || response.status === 409
      delay = providerRetryDelay(response, now())
      failure = { kind: 'failed', code: `PROVIDER_HTTP_${response.status}`, permanent: !retryable, retryAfterMs: delay }
      if (!retryable) return failure
    } catch { failure = { kind: 'failed', code: 'DELIVERY_UNCONFIRMED' } }
    // Honor longer provider Retry-After values by deferring, never by keeping a
    // serverless invocation alive. Keep a full bounded request budget left.
    if (attempt === 1 || delay > 2000 || deadline - now() < delay + 5000) return failure
    await pause(delay)
  }
  return failure
}

// Mocks inject the store and transport; tests never contact an email provider.
export function createBusinessApprovalEmailWorker({ store, env, fetcher = fetch, now = Date.now, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  return async function process({ businessId = null, limit = 10 } = {}) {
    const stats = { processed: 0, accepted: 0, failed: 0, skipped: 0 }
    if (!emailDeliveryEnabled(env)) return { ...stats, disabled: true }
    const deadline = now() + 18000
    for (let index = 0; index < Math.min(10, Math.max(1, limit)); index++) {
      if (now() >= deadline) break
      if (index > 0) { if (deadline - now() < 600) break; await pause(600) }
      if (now() >= deadline) break
      const row = await store.claim(businessId)
      if (!row) break
      stats.processed++
      try {
        const context = await store.context(row)
        if (!approvalNoticeIsCurrent(row, context, now())) {
          await store.finish(row, { status: 'skipped', last_error: 'APPROVAL_CONTEXT_CHANGED_OR_EXPIRED' }); stats.skipped++; continue
        }
        let payload = row.payload
        if (!payload) {
          payload = buildBusinessApprovalEmail(row, context, env.EMAIL_FROM)
          if (!await store.prepare(row, payload)) { stats.skipped++; continue }
        }
        if (!validPayload(payload, row.recipient)) {
          await store.finish(row, { status: 'skipped', last_error: 'INVALID_FROZEN_PAYLOAD' }); stats.skipped++; continue
        }
        // Revalidates the still-live claim, publication and matching actual Auth
        // owner before EACH HTTP attempt, including a delayed inline retry.
        const delivery = await deliverApproval({ row, payload, store, env, fetcher, pause, now, deadline })
        if (delivery.kind === 'skipped') { stats.skipped++; continue }
        if (delivery.kind === 'sent') {
          await store.finish(row, { status: 'sent', provider_message_id: delivery.id, sent_at: new Date(now()).toISOString(), last_error: null }); stats.accepted++
        } else {
          await store.finish(row, { status: 'failed', last_error: delivery.code, ...(delivery.permanent ? { attempts: 3 } : {}), scheduled_for: new Date(now() + Math.max(row.attempts * 5 * 60000, delivery.retryAfterMs || 0)).toISOString() }); stats.failed++
        }
      } catch {
        // Never persist provider bodies/private error messages or tell the
        // caller that durable publication failed because email is unavailable.
        await store.finish(row, { status: 'failed', last_error: 'DELIVERY_UNCONFIRMED', scheduled_for: new Date(now() + row.attempts * 5 * 60000).toISOString() }); stats.failed++
      }
    }
    return stats
  }
}
