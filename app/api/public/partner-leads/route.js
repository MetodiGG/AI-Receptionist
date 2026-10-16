import { createHash } from 'node:crypto'
import { normalizeLeadText } from '../../../../lib/partner-leads.mjs'
import { leadDatabaseRecord } from '../../../../lib/partner-submission.mjs'
import { consumeRateLimit } from '../../../../lib/rate-limit'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { createPartnerSubmissionHandler } from '../../../../lib/partner-submission-handler.mjs'

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
    input.contactName ? `Contact: ${input.contactName}` : '',
    `Phone: ${input.phone}`,
    `Email: ${input.email}`,
    `Category: ${input.category}`,
    input.city ? `City: ${input.city}` : '',
    input.websiteUrl ? `Website / Instagram: ${input.websiteUrl}` : '',
  ].filter(Boolean)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: recipients, subject: `New GoRez partner lead: ${normalizeLeadText(input.businessName)}`, text: lines.join('\n') }),
  })
  if (!response.ok) throw new Error(`Lead notification failed with status ${response.status}.`)
}

export const POST=createPartnerSubmissionHandler({
  allowAttempt:request=>consumeRateLimit(request,{scope:'partner-lead',limit:5,windowSeconds:3600}),
  save:async input=>{
    const {error}=await getSupabaseAdmin().from('partner_leads').insert(leadDatabaseRecord(input,leadFingerprint(input)))
    if(error?.code==='23505')return {duplicate:true}
    if(error)throw error
    return {duplicate:false}
  },
  notify:async input=>{try{await notifyAdmins(input)}catch{console.error('Partner lead notification was not accepted.')}},
})
