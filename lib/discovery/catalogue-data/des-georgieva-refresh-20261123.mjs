import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-des-georgieva-makeup'
const website = 'https://www.desgeorgievamua.com/'
const booking = website + 'book-online'
const contact = website + encodeURIComponent('контакти')
const neighborhood = 'Люлин 2'
const priorAddress = 'София, ж.к. Люлин 2, бл. 280'
const address = priorAddress + ', вх. В'
const pricingDescription = 'Потвърждението е допълнително от студиото. Преди 09:00 и след 19:00 се добавят 50% към цената.'

const entries = [
  { name: 'Експресен грим', slug: 'експресен-грим', amount: 40, duration: 40, kind: 'fixed', extra: ' Не включва очна линия.' },
  { name: 'Ежедневен грим', slug: 'ежедневен-грим', amount: 50, duration: 80, kind: 'fixed' },
  { name: 'Вечерен грим', slug: 'вечерен-грим', amount: 50, duration: 90, kind: 'fixed' },
  { name: 'Абитуриентски грим', slug: 'абитуриентски-грим', amount: 70, duration: 100, kind: 'fixed' },
  { name: 'Пробен грим', slug: 'пробен-грим', amount: 70, duration: 120, kind: 'from' },
  { name: 'Сватбен грим · в студиото', slug: 'сватбен-грим', amount: 80, duration: 120, kind: 'fixed' },
]
const source = slug => website + 'service-page/' + encodeURIComponent(slug)
const services = entries.map(({ name, slug, amount, duration, kind, extra }) => ({
  name, category: 'beauty', description: pricingDescription + (extra || ''),
  price: { amount, currency: 'EUR', kind, sourceUrl: source(slug), checkedOn, validUntil },
  appointmentModel: 'appointment', durationMin: duration, durationSourceUrl: booking, durationCheckedOn: checkedOn,
}))

// Scope this revalidation to the same existing appointment inventory and public
// address. The initial 2026-11-10 source/price cohort remains frozen for audit.
export function applyDesGeorgievaRefresh20261123(records) {
  const names = services.map(item => item.name)
  return records.map(row => row.id === id && row.website === website && row.neighborhood === neighborhood &&
    row.address === priorAddress && row.coordinates === null && row.category === 'beauty' && row.cityCode === '68134' &&
    row.locationKind === 'premises' && row.phone === '+359894277311' && row.booking?.kind === 'form' &&
    row.booking.url === booking && row.verification?.booking?.url === booking &&
    row.verification.status === 'approved' && row.verification.checkedOn === '2026-11-10' &&
    row.services.length === names.length && row.services.every((item, index) => item.name === names[index] && item.category === 'beauty') ? {
      ...row, address, services, coordinates: {
        latitude: 42.722343, longitude: 23.252351, source: OFFICIAL_SOFIA_SOURCE_URL,
        method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
        sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '101062',
        licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
      },
      verification: { ...row.verification, checkedOn },
    } : row)
}

export const DES_GEORGIEVA_REFRESH_20261123_REVIEW = {
  id, website, checkedOn, bookingEntry: booking, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, booking, contact, ...entries.map(item => source(item.slug))],
  notes: 'Reopened the actual owner booking menu and checked all six live service detail pages, all linking the studio at Lyulin 2, block 280, entrance В. Current literal EUR amounts and calendar durations agree across the selectable menu and six owner detail headers. Express makeup reserves 40 minutes; its explanatory text gives 30–40 minutes in practice and excludes eyeliner. The trial is from EUR 70; the EUR 80 bridal rate is the in-studio service only, not the separate EUR 160 home-visit offer or a wedding package. The owner confirms requests afterwards and adds 50% before 09:00 or after 19:00. The exact public business entrance matches the unique block/entrance pair in municipal district Lyulin; there is no inferred floor, apartment, guaranteed availability, customer data, booking, or new service. The old audit cohort is retained separately.',
  inventoryIdentity: 'f79576363c2ca586aa8935ac89431f17b8bca9009c0beda91e2fb6161e16a3d1',
}
