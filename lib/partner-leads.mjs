export const PARTNER_CATEGORY_KEYS = ['beauty', 'auto', 'health', 'fitness', 'education', 'consulting', 'home_services', 'pets', 'other']

export const PARTNER_STATUS_KEYS = ['new', 'contacted', 'demo_scheduled', 'interested', 'onboarding', 'active', 'declined']

export const PARTNER_STATUS_LABELS = {
  new: { bg: 'Нова заявка', en: 'New lead' },
  contacted: { bg: 'Свързахме се', en: 'Contacted' },
  demo_scheduled: { bg: 'Уговорено демо', en: 'Demo scheduled' },
  interested: { bg: 'Има интерес', en: 'Interested' },
  onboarding: { bg: 'Одобрена · за настройване', en: 'Approved · setup needed' },
  active: { bg: 'Приключена заявка', en: 'Completed lead' },
  declined: { bg: 'Отказана', en: 'Rejected' },
}

// Approval is a review decision, not publication or account creation.
export const PARTNER_DECISION_STATUS = { approve: 'onboarding', reject: 'declined' }

export function partnerReviewGroup(status) {
  if (status === 'onboarding') return 'approved'
  if (status === 'active') return 'completed'
  if (status === 'declined') return 'rejected'
  return 'pending'
}

export function filterPartnerLeads(leads, group = 'all') {
  return leads.filter(row => group === 'all' || partnerReviewGroup(row.status) === group)
    .sort((a, b) => Number(partnerReviewGroup(b.status) === 'pending') - Number(partnerReviewGroup(a.status) === 'pending') || new Date(b.created_at) - new Date(a.created_at))
}

export function normalizeLeadText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}
