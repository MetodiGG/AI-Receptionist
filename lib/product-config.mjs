export const SUPPORT_EMAIL = 'info@gorez.co'
export const TRIAL_DAYS = 30
// Retain the existing commercial reference; public copy no longer quotes an
// amount. This display change does not activate or change any billing logic.
export const MONTHLY_PRICE_EUR = 19.99
export const PRICE_LABEL = Object.fromEntries(['bg', 'en'].map(locale => [locale,
  new Intl.NumberFormat(locale === 'bg' ? 'bg-BG' : 'en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(MONTHLY_PRICE_EUR).replace(/\u00a0/g, ' '),
]))
export const PRICING_COPY = {
  bg: { summary: `${TRIAL_DAYS} дни безплатно. Абонаментните условия уточняваме лично. Без данни за плащане и без автоматично таксуване.`, trial: `${TRIAL_DAYS} дни безплатно`, contact: 'Нека поговорим', afterTrial: 'След безплатния период уточняваме абонаментните условия с теб. Платено продължаване — само след твоето изрично съгласие, без автоматично таксуване.' },
  en: { summary: `${TRIAL_DAYS} days free. We discuss subscription terms with you directly. No payment details required. No automatic charges.`, trial: `${TRIAL_DAYS} days free`, contact: 'Let’s talk', afterTrial: 'After the free period, we agree the subscription terms with you directly. Paid continuation requires your explicit consent. There are no automatic charges.' },
}

export function safeWebsite(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null } catch { return null }
}
export function companyIdentity(env = {}) {
  const name = env.COMPANY_NAME?.trim(), eik = env.COMPANY_EIK?.trim(), address = env.COMPANY_ADDRESS?.trim()
  return { company: name && eik && address ? { name, eik, address } : null, dpaUrl: safeWebsite(env.DPA_URL) }
}
