export const SUPPORT_EMAIL = 'info@gorez.co'
export const TRIAL_DAYS = 30
// Inactive legacy reference values, not the current public offer or a charge.
// Public copy is free to use; changing it does not activate billing or expiry.
export const MONTHLY_PRICE_EUR = 19.99
export const PRICE_LABEL = Object.fromEntries(['bg', 'en'].map(locale => [locale,
  new Intl.NumberFormat(locale === 'bg' ? 'bg-BG' : 'en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(MONTHLY_PRICE_EUR).replace(/\u00a0/g, ' '),
]))
export const PRICING_COPY = {
  bg: { summary: 'Регистрацията и използването на GoRez са безплатни. Не се изискват данни за плащане.', headline: 'Безплатно за твоя бизнес', contact: 'Помощ при регистрация', assurance: 'Без абонаментни такси и без автоматично таксуване.' },
  en: { summary: 'Registration and use of GoRez are free. No payment details are required.', headline: 'Free for your business', contact: 'Registration help', assurance: 'No subscription fees and no automatic charges.' },
}

export function safeWebsite(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null } catch { return null }
}
export function companyIdentity(env = {}) {
  const name = env.COMPANY_NAME?.trim(), eik = env.COMPANY_EIK?.trim(), address = env.COMPANY_ADDRESS?.trim()
  return { company: name && eik && address ? { name, eik, address } : null, dpaUrl: safeWebsite(env.DPA_URL) }
}
