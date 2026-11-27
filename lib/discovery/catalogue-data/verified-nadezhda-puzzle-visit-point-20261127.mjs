import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-puzzle-kids-nadezhda'
const name = 'ПЪЗЕЛ · Надежда'
const cityCode = '68134', previousNeighborhood = 'Надежда', neighborhood = 'Надежда 1'
const address = 'София, ул. „Жорж Дантон“ 35'
const website = 'https://puzzlekids.biz/blagoevgrad/'
const phone = '+359886556671'
const bookingUrl = 'https://bg.fresha.com/book-now/puzzle-children-s-hair-care-studio-gmlukots/all-offer?id=334610&pId=115852'
const checkedOn = '2026-11-13'

// This is the exact existing civic point, not a new geocode. Run after the
// historical address bindings so we can verify both the original label and
// bound point. Do not overwrite a newer review or touch booking or pricing.
export function applyVerifiedNadezhdaPuzzleVisitPoint20261127(rows) {
  return rows.map(row => {
    const point = row.coordinates
    if (row.id !== id || row.name !== name || row.cityCode !== cityCode ||
        row.category !== 'hair' || row.locationKind !== 'premises' || row.neighborhood !== previousNeighborhood ||
        row.address !== address || row.website !== website || row.phone !== phone ||
        row.booking?.kind !== 'form' || row.booking.url !== bookingUrl ||
        row.verification?.status !== 'approved' || row.verification.checkedOn !== checkedOn ||
        row.verification.validUntil !== '2027-02-11' || row.verification.contact !== website ||
        row.verification.booking?.url !== website ||
        point?.method !== 'verified_official_address' || point.source !== OFFICIAL_SOFIA_SOURCE_URL ||
        point.addressId !== '56926' || point.sourceAddress !== address ||
        point.sourceCityCode !== cityCode || point.sourceNeighborhood !== previousNeighborhood ||
        point.sourceWebsite !== website || point.checkedOn !== checkedOn ||
        point.latitude !== 42.72814392455476 || point.longitude !== 23.295603060361113 ||
        point.licence !== 'CC-BY-4.0' || point.attribution !== OFFICIAL_SOFIA_ATTRIBUTION) return row

    return { ...row, neighborhood, coordinates: { ...point, sourceNeighborhood: neighborhood } }
  })
}
