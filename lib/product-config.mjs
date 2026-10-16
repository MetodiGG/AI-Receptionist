export const SUPPORT_EMAIL = 'info@gorez.co'
export const TRIAL_DAYS = 30
export const MONTHLY_PRICE_EUR = 19.99
export const PRICE_LABEL = Object.fromEntries(['bg', 'en'].map(locale => [locale,
  new Intl.NumberFormat(locale === 'bg' ? 'bg-BG' : 'en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(MONTHLY_PRICE_EUR).replace(/\u00a0/g, ' '),
]))
export const PRICING_COPY = {
  bg: { summary: `${TRIAL_DAYS} дни безплатно, после ${PRICE_LABEL.bg} на месец. Без данни за плащане, без автоматично таксуване.`, trial: `${TRIAL_DAYS} дни безплатно`, monthly: `${PRICE_LABEL.bg} / месец`, afterTrial: 'Платено продължаване — само след твоето изрично съгласие. Ще уточним активирането с теб; няма автоматично таксуване.' },
  en: { summary: `${TRIAL_DAYS} days free, then ${PRICE_LABEL.en} per month. No payment details required. No automatic charges.`, trial: `${TRIAL_DAYS} days free`, monthly: `${PRICE_LABEL.en} / month`, afterTrial: 'Paid continuation requires your explicit consent. We will arrange activation with you; there are no automatic charges.' },
}

export function safeWebsite(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null } catch { return null }
}
export function companyIdentity(env = {}) {
  const name = env.COMPANY_NAME?.trim(), eik = env.COMPANY_EIK?.trim(), address = env.COMPANY_ADDRESS?.trim()
  return { company: name && eik && address ? { name, eik, address } : null, dpaUrl: safeWebsite(env.DPA_URL) }
}
