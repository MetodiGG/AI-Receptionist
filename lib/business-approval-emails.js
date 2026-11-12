import 'server-only'
import { after } from 'next/server'
import { getSupabaseAdmin } from './supabase-admin'
import { createBusinessApprovalEmailWorker } from './business-approval-email.mjs'

function approvalEmailStore() {
  const db = getSupabaseAdmin()
  const checked = ({ data, error }) => { if (error) throw error; return data }
  return {
    async claim(businessId) { return checked(await db.rpc('claim_business_approval_email', { p_business_id: businessId }))?.[0] || null },
    async context(row) {
      const business = checked(await db.from('businesses').select('id,owner_id,name,slug,active,platform_status').eq('id', row.business_id).maybeSingle())
      if (!business || business.owner_id !== row.owner_id) return null
      const { data, error } = await db.auth.admin.getUserById(row.owner_id)
      if (error) throw error
      return { business, owner: data.user }
    },
    async prepare(row, payload) {
      return Boolean(checked(await db.from('business_approval_email_outbox').update({ payload }).eq('id', row.id).eq('claim_token', row.claim_token).eq('status', 'processing').select('id').maybeSingle()))
    },
    async current(row) { return Boolean(checked(await db.rpc('business_approval_email_current', { p_id: row.id, p_claim_token: row.claim_token }))) },
    async finish(row, patch) {
      checked(await db.from('business_approval_email_outbox').update({ ...patch, claim_token: null, locked_until: null }).eq('id', row.id).eq('claim_token', row.claim_token).eq('status', 'processing'))
    },
  }
}

export async function processBusinessApprovalEmails(options) {
  return createBusinessApprovalEmailWorker({ store: approvalEmailStore(), env: process.env })(options)
}

// The DB trigger has already committed the unique intent. A failed after-task
// leaves it available to the existing authenticated notifications cron.
export function scheduleBusinessApprovalEmail(businessId) {
  try {
    after(async () => {
      try { await processBusinessApprovalEmails({ businessId, limit: 1 }) }
      catch { console.error('Business approval email processing unavailable.') }
    })
  } catch { console.error('Business approval email scheduling unavailable.') }
}
