import 'server-only'
import { getSupabaseAdmin } from './supabase-admin'
import { scheduleBusinessApprovalEmail } from './business-approval-emails'

// Only called after the existing verified platform-admin authorization checks.
// Never changes passwords, user metadata, client history proof or global Auth settings.
export async function activateApplicationOwner(db,businessId,expected=null) {
  const {data:lead,error}=await db.from('partner_leads').select('requires_owner_activation,email').eq('business_id',businessId).maybeSingle()
  if(error)throw error
  if(!lead?.requires_owner_activation)return
  const business=await db.from('businesses').select('owner_id,slug,platform_revision,platform_status').eq('id',businessId).single()
  if(business.error)throw business.error
  if(expected&&(business.data.platform_revision!==expected.revision||business.data.slug!==expected.confirmation))throw Error('BUSINESS_CHANGED')
  if(business.data.platform_status==='archived')throw Error('RESTORE_FIRST')
  const owner=await db.auth.admin.getUserById(business.data.owner_id)
  if(owner.error)throw owner.error
  if(!owner.data.user?.app_metadata?.gorez_business_application||owner.data.user.email?.toLowerCase()!==lead.email.toLowerCase())throw Error('OWNER_ACTIVATION_REQUIRED')
  if(owner.data.user.email_confirmed_at)return
  const result=await db.auth.admin.updateUserById(owner.data.user.id,{email_confirm:true})
  if(result.error)throw result.error
}

export async function reviewApplication(input,actorId) {
  const db=getSupabaseAdmin()
  const {data:lead,error}=await db.from('partner_leads').select('business_id,updated_at').eq('id',input.id).maybeSingle()
  if(error)throw error
  if(!lead)return null
  if(!lead.business_id)return undefined // Legacy contact-only request: preserve its old workflow.
  if(lead.updated_at!==input.expectedUpdatedAt)return null
  if(!['new','active','declined'].includes(input.status))throw Error('INVALID_APPLICATION_DECISION')
  if(input.status==='active')await activateApplicationOwner(db,lead.business_id)
  const result=await db.rpc('review_business_application',{p_lead:input.id,p_actor:actorId,p_status:input.status,p_expected:input.expectedUpdatedAt,p_notes:input.notes??null,p_edit_notes:input.notes!==undefined})
  if(result.error){if(result.error.message?.includes('LEAD_CHANGED'))return null;throw result.error}
  if(input.status==='active')scheduleBusinessApprovalEmail(lead.business_id)
  return result.data
}
