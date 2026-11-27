import { OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-tino-hair-hladilnika-paradisecenter100'
const website = 'https://www.tinohair.com/', bookingEntry = 'https://app.tinohair.com/'
const phone = '+359883383809', cityCode = '68134', neighborhood = 'Хладилника'
const address = 'София, кв. Хладилника, бул. Черни връх 100, Paradise Center, ет. 1'
const municipalVenue = 'https://www.sofia.bg/en/w/7047838'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

function nailOffer(name, amount, wednesdayAmount, durationMin) {
  return {
    name, category: 'nails', appointmentModel: 'appointment',
    description: `Стандартна цена ${amount} €. В сряда цената в ценоразписа е ${wednesdayAmount} €. Записването е през сайта на салона и е достъпно и като гост.`,
    durationMin, durationSourceUrl: website, durationCheckedOn: checkedOn,
    price: { amount, currency: 'EUR', kind: 'fixed', unit: `${wednesdayAmount} € в сряда`, sourceUrl: website, checkedOn, validUntil },
  }
}

export function applyVerifiedTinoNails20261127(rows) {
  return rows.map(row => {
    if (row.id !== id || row.cityCode !== cityCode || row.neighborhood !== neighborhood ||
        row.locationKind !== 'premises' || row.category !== 'hair' || row.address !== address ||
        row.website !== website || row.phone !== phone || row.booking?.kind !== 'form' ||
        row.booking.url !== bookingEntry || row.verification?.status !== 'approved' ||
        row.verification.booking?.url !== bookingEntry || row.services?.length !== 1) return row
    const point = row.coordinates
    if (point?.method !== 'verified_official_address' || point.addressId !== '106136' ||
        point.source !== OFFICIAL_SOFIA_SOURCE_URL || point.sourceAddress !== address ||
        point.sourceCityCode !== cityCode || point.sourceNeighborhood !== neighborhood ||
        point.sourceWebsite !== website || point.latitude !== 42.657861 || point.longitude !== 23.315751) return row
    const [haircut] = row.services
    if (haircut.name !== 'Мъжко подстригване' || haircut.category !== 'hair' ||
        haircut.appointmentModel !== 'appointment' || haircut.durationMin !== 30 ||
        haircut.durationSourceUrl !== website || haircut.durationCheckedOn !== checkedOn ||
        haircut.description !== 'Стандартна цена 40 €. В сряда цената в ценоразписа е 30 €. Записването е през сайта на салона и е достъпно и като гост.' ||
        haircut.price?.amount !== 40 || haircut.price.currency !== 'EUR' || haircut.price.kind !== 'fixed' ||
        haircut.price.unit !== '30 € в сряда' || haircut.price.sourceUrl !== website ||
        haircut.price.checkedOn !== checkedOn || haircut.price.validUntil !== validUntil) return row
    return {
      ...row,
      services: [haircut, nailOffer('Маникюр с гел лак', 40, 30, 50), nailOffer('Педикюр с гел лак', 50, 40, 60)],
    }
  })
}

export const VERIFIED_TINO_NAILS_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, bookingEntry, municipalVenue, OFFICIAL_SOFIA_SOURCE_URL],
  inventoryIdentity: 'aae83699e31d831338b2cae85fdef2f6c9ec4d0c9de4a7a7123009c5964ce0bc',
  notes: 'Combined inventory receipt for the existing Hladilnika TINO profile and unchanged first-party guest booking target. The previously verified men’s haircut remains identical. The current owner price tabs and the owner guest booking menu agree on standalone gel polish manicure (50 minutes, EUR 40, Wednesday EUR 30) and standalone gel polish pedicure (60 minutes, EUR 50, Wednesday EUR 40). No cash-only price qualifier or separate individual booking contact is shown for either selected menu entry. Keep literal Wednesday conditions in public descriptions and price units, without catalogue package, loyalty pricing or retail offers. The same booking app and owner profile provide the two groups; do not clone the business or add staff records. Only public service groups were opened; no service, appointment time, staff, account, personal data, calendar or booking action was selected or submitted.',
}]
