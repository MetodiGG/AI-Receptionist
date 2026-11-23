// One stationary repair service, verified for the owner's direct phone route.
const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-vm-auto-service-obelya-2-lomsko248a'
const website = 'https://www.vmauto.bg/'
const contact = `${website}za-nas`
const service = `${website}uslugi/diagnostika`
const tariff = `${website}ceni/diagnostika`
const phone = '+359897937799'
const address = 'София, ж.к. Обеля 2, бул. Ломско шосе 248А'

export const VM_AUTO_INTAKE_20261123_RECORDS = [{
  id, name: 'VM Auto Service', cityCode: '68134', neighborhood: 'Обеля 2', address,
  locationKind: 'premises', website, phone, category: 'auto_repair',
  coordinates: {
    latitude: 42.7571582, longitude: 23.270078, source: website,
    method: 'first_party_coordinates', sourceAddress: address,
  },
  services: [{
    name: 'Компютърна диагностика на автомобил', category: 'auto_repair', appointmentModel: 'appointment',
    description: 'Четене и изтриване на грешки. Крайната цена за конкретния автомобил се уточнява предварително при записване.',
    price: { amount: 30, currency: 'EUR', kind: 'from', sourceUrl: tariff, checkedOn, validUntil },
  }],
  openingHours: {
    days: [
      ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })),
      { weekday: 6, periods: [] },
      { weekday: 7, periods: [] },
    ],
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: service, excerpt: 'На страницата за компютърна диагностика сервизът изрично приканва за обаждане или записване и посочва, че цената за конкретния автомобил се уточнява предварително.' },
  },
}]

export const VM_AUTO_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, service, tariff, `${website}ceni/masla-filtri`, `${website}privacy`],
  notes: 'The owner’s appointment button opens the actual #booking section of the reviewed homepage; its form asks for a service and time and promises owner confirmation, but the online service options were not verified. Only the owner’s separately explicit telephone appointment route is used: the named diagnostic service connects to the same phone listed on the owner contact page. The regular diagnostics tariff gives EUR30 from for reading and clearing fault codes. The service page says the amount for the specific vehicle is confirmed before the booking. No promotional offer, fixed quote, duration, optional repair, online booking, live slots, or external request is included. The official site binds its own precise service point to street number 248А in AutoRepair JSON-LD; the merchant’s same-brand, same-phone seller listing supplies the exact quarter at the identical civic address.',
  inventoryIdentity: 'ba8844484e388884a5c31f12dd8f8cc4b6efb792e607543a4c68550f8641b061',
}]
