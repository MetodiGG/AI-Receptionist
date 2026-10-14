import { createHash } from 'node:crypto'
import { z } from 'zod'
import { apiError, getSafeError } from '../../../../lib/api-response'
import { PARTNER_CATEGORY_KEYS, normalizeLeadText } from '../../../../lib/partner-leads.mjs'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'

const leadSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(32),
  email: z.string().trim().email().max(180),
  category: z.enum(PARTNER_CATEGORY_KEYS),
  city: z.string().trim().min(2).max(100),
  websiteUrl: z.string().trim().url().max(300).optional().or(z.literal('')),
  locale: z.enum(['bg', 'en']).optional().default('bg'),
  company: z.string().max(0).optional().default(''),
})

function leadFingerprint(input) {
  const source = [input.businessName, input.email, input.phone]
    .map((value) => normalizeLeadText(value).toLocaleLowerCase('bg-BG'))
    .join('|')
  return createHash('sha256').update(source).digest('hex')
}

async function notifyAdmins(input) {
  const recipients = String(process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map((email) => email.trim()).filter(Boolean)
  if (!recipients.length || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return

  const lines = [
    `Business: ${input.businessName}`,
    `Contact: ${input.contactName}`,
    `Phone: ${input.phone}`,
    `Email: ${input.email}`,
    `Category: ${input.category}`,
    `City: ${input.city}`,
    input.websiteUrl ? `Website / Instagram: ${input.websiteUrl}` : '',
  ].filter(Boolean)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: recipients, subject: `New GoRez partner lead: ${input.businessName}`, text: lines.join('\n') }),
  })
  if (!response.ok) throw new Error(`Lead notification failed with status ${response.status}.`)
}

export async function POST(request) {
  try {
    if (!await consumeRateLimit(request, { scope: 'partner-lead', limit: 5, windowSeconds: 3600 })) {
      return apiError('Твърде много заявки. Опитай отново по-късно.', 429, 'RATE_LIMITED')
    }

    const input = leadSchema.parse(await request.json())
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('partner_leads').insert({
      business_name: normalizeLeadText(input.businessName),
      contact_name: normalizeLeadText(input.contactName),
      phone: normalizeLeadText(input.phone),
      email: input.email.trim().toLowerCase(),
      category: input.category,
      city: normalizeLeadText(input.city),
      website_url: input.websiteUrl || null,
      locale: input.locale,
      fingerprint: leadFingerprint(input),
    })

    if (error?.code === '23505') return Response.json({ ok: true, duplicate: true })
    if (error) throw error
    notifyAdmins(input).catch((notificationError) => console.error('Partner lead email notification failed.', notificationError))
    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
