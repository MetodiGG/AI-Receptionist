import waveBaseline from './neighborhood-nails-owned22-20261111.mjs'

const id = 'sofia-wave-studio-lyulin7-nails'
const website = 'https://www.wave-studio.net/'
const hairTariff = website + 'hairstyle/'
const nailsTariff = website + 'manicure/'
const contact = website + 'contact-us/'
const checkedOn = '2026-11-23'

const hair = [
  ["Дамско подстригване", 15],
  ["Мъжко подстригване с измиване", 12.5],
  ["Мъжко подстригване с машинка и измиване", 10],
  ["Детско подстригване (до 6 години)", 10],
  ["Подстригване на бретон", 2.5],
  ["Сешоар · къса коса", 15],
  ["Сешоар · средна коса", 17.5],
  ["Сешоар · дълга коса", 20],
  ["Букли с маша · къса коса", 23],
  ["Букли с маша · средна коса", 30],
  ["Букли с маша · дълга коса", 40],
  ["Кичури с шапка · 30 г блондор", 35, "Цената е за 1 доза блондор (30 г)."],
  ["Кичури с фолио · 30 г блондор", 35],
  ["Кичури с фолио · 60 г блондор", 40],
  ["Кичури с фолио · 90 г блондор", 66],
  ["Боядисване с боя на клиента", 20, "Клиентът носи собствена боя за коса."],
  ["Боядисване на корени · до 60 мл боя", 30, "Цената включва до 60 мл боя за корените."],
  ["Балеаж · средна коса", 127, null, 240],
  ["Балеаж · дълга коса", 204, null, 360],
  ["Матиране", 40, null, 60],
  ["Официална прическа", 40],
  ["Плитки на половин глава", 30],
  ["Трайно изправяне с терапия", 153, "Посочена трайност до 3 месеца."],
  ["Трайно изправяне · до 6 месеца", 204, "Посочена трайност до 6 месеца."],
].map(([name, amount, description, minutes]) => ({
  name, category: 'hair', ...(description ? { description } : {}),
  price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl: hairTariff, checkedOn },
  appointmentModel: 'appointment',
  ...(minutes ? { durationMin: minutes, durationSourceUrl: hairTariff, durationCheckedOn: checkedOn } : {}),
}))

// Add the reviewed haircut menu to the existing venue only. Nails, booking,
// location and the old source file are not rewritten.
const before = waveBaseline.records.find(row => row.id === id)
const originalServices = JSON.stringify(before.services)
export function applyWaveLyulinHair20261123(rows) {
  return rows.map(row => row.id === id && row.cityCode === '68134' && row.neighborhood === 'Люлин 7' &&
    row.locationKind === 'premises' && row.coordinates?.addressId === '52301' && row.address === before.address &&
    row.category === 'nails' && row.website === website && row.phone === before.phone &&
    row.booking?.kind === 'phone' && row.booking.phone === before.phone && row.verification?.status === 'approved' &&
    row.verification.contact === contact && JSON.stringify(row.services) === originalServices
    ? { ...row, services: [...row.services, ...hair] } : row)
}

export const WAVE_LYULIN_HAIR_20261123_REVIEW = {
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, website + 'reservations/', contact, hairTariff, nailsTariff],
  notes: 'The owner’s bookings page still names the moved NDK site in its online widget, so we did not import it. The current Lyulin 7 haircut menu explicitly lists direct telephone appointments at the same number as the contact page and original manicure listing. Both tariffs were read. The original three nail rates and distinctions are unchanged. Haircut, finish and material variants use literal branch-specific amounts, durations only for the two balayage lengths and toning, and no invented prices for ambiguous lines, add-ons or packages outside the reviewed services.',
  inventoryIdentity: '73412d7d9805a1f9edb19dd313c7332b9d6aea4b2f5d48736ecdd7f0ffde6429',
}
