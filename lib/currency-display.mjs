// Derived presentation only. Never write these converted values back over the
// literal source prices/currencies or use them as a new published-price fact.
// Official fixed rate and full-rate division/cent rounding:
// https://www.evroto.bg/bg/news/459-periodat-na-zadalzhitelno-dvoyno-oboznachavane-na-tsenite-priklyuchva-na-8-avgus
// https://economy-finance.ec.europa.eu/euro/eu-countries-and-euro/bulgaria-and-euro_en
export const BGN_PER_EUR = 1.95583
export const BGN_EUR_RATE_SOURCE = 'https://economy-finance.ec.europa.eu/euro/eu-countries-and-euro/bulgaria-and-euro_en'

export function bgnToEuroDisplayAmount(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') || typeof value === 'string' && !value.trim()) return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) return null
  // Integer rational arithmetic avoids binary floating-point errors at a cent
  // boundary. 1.95583 is used in full, never rounded to 1.96 or to a reciprocal.
  const match = String(number).match(/^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i)
  if (!match) return null
  const fraction = match[2] || '', exponent = Number(match[3] || 0)
  let numerator = BigInt(match[1] + fraction) * 10000000n
  let denominator = 195583n
  const scale = fraction.length - exponent
  if (scale >= 0) denominator *= 10n ** BigInt(scale)
  else numerator *= 10n ** BigInt(-scale)
  const cents = numerator / denominator + (numerator % denominator * 2n >= denominator ? 1n : 0n)
  const digits = cents.toString().padStart(3, '0')
  const result = Number(`${digits.slice(0, -2)}.${digits.slice(-2)}`)
  return Number.isFinite(result) ? result : null
}

// Input is the validated flat service-price shape used by public labels.
// A fresh object and metadata object are returned; the source stays untouched.
// The returned EUR currency prevents conversion a second time.
export function servicePriceForDisplay(service) {
  if (service?.currency !== 'BGN') return { ...service }
  const price = bgnToEuroDisplayAmount(service.price)
  const maximum = service.priceMaximum == null ? null : bgnToEuroDisplayAmount(service.priceMaximum)
  return { ...service, currency: 'EUR', price, priceMaximum: maximum, displayConvertedFrom: 'BGN',
    ...(service.price_details && typeof service.price_details === 'object' && !Array.isArray(service.price_details)
      ? { price_details: { ...service.price_details, ...(Object.hasOwn(service.price_details, 'maximum') ? { maximum } : {}) } } : {}),
  }
}
