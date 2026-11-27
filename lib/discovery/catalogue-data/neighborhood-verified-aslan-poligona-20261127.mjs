const id = 'sofia-aslan-poligona-block44', name = 'Образователна школа Аслан'
const cityCode = '68134', neighborhood = 'Полигона', category = 'education'
const address = 'София, кв. Полигона, бл. 44, офис 3'
const website = 'https://aslan-edu.com/', phone = '+359884902760'
const programme = website + 'probni-maturi-nvo-i-dzi-2026-2027/'
const booking = website + 'nvo-bel-mat-7-klas/'
const contact = website + 'vrazka-s-nas/'
const courses = website + 'kursove-matura-bel-sofia/'
const checkedOn = '2026-11-27'
// No public intake cutoff is supplied. Close each listing before the last
// day(s) in the actual form so an already started exam is not advertised.
const pairUntil = '2026-12-29', singleUntil = '2027-01-02'

export const ASLAN_POLIGONA_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  // The operator confirms the teaching office but not the correct civic
  // entrance. A building/camera/viewport position is not a visit pin.
  coordinates: null,
  services: [
    {
      name: 'Пробен изпит НВО за 7. клас · БЕЛ или математика',
      category, appointmentModel: 'group_reservation', durationMin: 180, durationSourceUrl: booking, durationCheckedOn: checkedOn,
      description: 'Присъствен пробен изпит по един предмет. Избери дата във формата на школата. Таксата се плаща по банков път след регистрация; GoRez не потвърждава място.',
      price: { amount: 50, currency: 'EUR', kind: 'fixed', unit: 'един изпит', sourceUrl: programme, checkedOn, validUntil: singleUntil },
    },
    {
      name: 'Пробни изпити НВО за 7. клас · пакет за два изпита',
      category, appointmentModel: 'group_reservation',
      description: 'Обща цена за два присъствени изпита, не за един. Избери две дати във формата на школата. Всеки изпит е 3 часа. Таксата се плаща по банков път след регистрация; GoRez не потвърждава място.',
      price: { amount: 90, currency: 'EUR', kind: 'fixed', unit: 'два изпита общо', sourceUrl: programme, checkedOn, validUntil: pairUntil },
    },
  ],
  booking: { kind: 'form', url: booking },
  verification: {
    status: 'approved', checkedOn, validUntil: singleUntil, contact,
    booking: { url: booking, excerpt: 'Формата на школата е за записване за един или два присъствени пробни изпита за 7. клас. Записването и плащането се обработват от школата.' },
  },
}]

export const ASLAN_POLIGONA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: booking, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, booking, programme, contact, courses],
  inventoryIdentity: 'eb0ba39f8f5074bf9421e2efe328b73ead72194d9443c9534f50707d39b87f8a',
  notes: 'Owned registration form was inspected before the operator’s 31 October 2026 offer. Its public choices match the four in-person grade 7 mock exams from 28 December to 3 January, each with a three-hour time range. The owner publishes EUR 50 for one exam and EUR 90 total for two, and requires payment by bank transfer after registration. These are independent published totals, not prorated or assumed availability. The programme specifies block 44, and the operator contact specifies teaching office 3. Two possible civic entrances are not assigned to the school; there is no map, distance, entrance claim or radius result. Expiry is conservative: both offers cannot survive beyond their respective last possible dates. Only grade 7 is accepted; the separate grade-12 form resolves to a previous year and is excluded. No personal, bank or form fields used or retained, and no source imagery copied.',
}]
