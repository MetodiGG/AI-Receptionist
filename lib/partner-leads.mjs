export const PARTNER_CATEGORY_KEYS = ['beauty', 'auto', 'health', 'fitness', 'education', 'consulting', 'home_services', 'pets', 'other']

export const PARTNER_STATUS_KEYS = ['new', 'contacted', 'demo_scheduled', 'interested', 'onboarding', 'active', 'declined']

export const PARTNER_STATUS_LABELS = {
  new: { bg: 'Нова заявка', en: 'New lead' },
  contacted: { bg: 'Свързахме се', en: 'Contacted' },
  demo_scheduled: { bg: 'Уговорено демо', en: 'Demo scheduled' },
  interested: { bg: 'Има интерес', en: 'Interested' },
  onboarding: { bg: 'Настройване', en: 'Onboarding' },
  active: { bg: 'Приключена заявка', en: 'Completed lead' },
  declined: { bg: 'Отказан', en: 'Declined' },
}

export function normalizeLeadText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}
