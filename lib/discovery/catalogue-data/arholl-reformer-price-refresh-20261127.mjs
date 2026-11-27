const id = 'sofia-arholl-arena-obelya1-124-reformer'
const name = 'Reformer Pilates · еднократно посещение с инструктор'
const website = 'https://arholl-arena.bg/'
const contact = website + 'contacts'
const book = website + 'service/reformer-pilates'
const sourceUrl = website + 'prices'
const purchase = 'https://shop.arholl-arena.bg/membership/PurchaseV2?&Namespace=ARHOLL&gymId=75'
const phone = '+359889758011'
const checkedOn = '2026-11-27'

// Refresh the previously reviewed phone-booked single visit, not a subscription
// or a different provider's session. Leave the Nov 16 source cohort immutable.
export function applyArhollReformerPriceRefreshNov27(rows) {
  return rows.map(row => {
    if (row.id !== id || row.website !== website || row.cityCode !== '68134' ||
        row.neighborhood !== 'Обеля 1' || row.address !== 'София, ж.к. Обеля 1, бл. 124, комплекс Архолл Парк' ||
        row.locationKind !== 'premises' || row.category !== 'fitness' || row.phone !== phone ||
        row.booking?.kind !== 'phone' || row.booking.phone !== phone ||
        row.verification?.status !== 'approved' || row.verification.booking?.url !== book ||
        row.verification.contact !== contact || row.services?.length !== 1) return row
    const [service] = row.services
    const price = service.price
    if (service.name !== name || service.category !== 'fitness' || service.appointmentModel !== 'individual_training' ||
        price?.amount !== 20 || price.currency !== 'EUR' || price.kind !== 'fixed' || price.maximum !== undefined ||
        price.unit !== 'еднократно посещение за един човек' || price.sourceUrl !== sourceUrl ||
        price.checkedOn !== '2026-11-16' || price.validUntil !== '2027-02-14') return row
    return { ...row, services: [{ ...service, price: { ...price, amount: 35, checkedOn } }] }
  })
}

export const ARHOLL_REFORMER_PRICE_REFRESH_20261127_REVIEW = {
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, book, sourceUrl, contact, purchase,
    website + 'page/obshchi-usloviya', website + 'page/politika-za-poveritelnost',
    website + 'page/usloviya-za-vzstanovyavane-na-sredstva'],
  notes: 'The venue explicitly lists 0889 758 011 for instructor reservations on its named Reformer service page. Its own current Prices page and homepage both list EUR 35 for one visit with an instructor; the EUR 50 visit for two and 4/8/10-visit packages are separate. The linked public membership selector in an isolated browser offered only 8-visit Reformer packages for one or two, with no single-visit product. A similarly named 45-minute third-party offer under a physiotherapy listing is not the owner-priced phone appointment; do not import its rate or duration. No selector choice, account, terms acceptance, appointment, payment, or customer data was used. Booking channel, premises, coordinates and existing expiration are unchanged; the frozen November 16 price and receipt are retained in their original cohort.',
  inventoryIdentity: '48d462adf468aa47ac7c227dc2af7bd4fff55e07bf4325ba9ea862cb3caeb0d0',
}
