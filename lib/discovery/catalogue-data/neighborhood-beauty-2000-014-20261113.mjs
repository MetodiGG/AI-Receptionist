// Owner-native/phone intake only; parent owns shared imports, identities and service photos.
const checkedOn = '2026-11-14'
const validUntil = '2027-02-12'
const website = 'https://mariart.ucoz.com/'
const contact = 'https://mariart.ucoz.com/index/0-3'
const menu = 'https://mariart.ucoz.com/index/uslugi-i-ceni/0-2'
const tariff = 'https://mariart.ucoz.com/ceni_2025.jpg'
const service = (name, amount, durationMin, description) => ({ name, category: 'hair', appointmentModel: 'appointment', description, durationMin, durationSourceUrl: tariff, durationCheckedOn: checkedOn, price: { amount, currency: 'BGN', kind: 'fixed', sourceUrl: tariff, checkedOn, validUntil } })
const records = [{
  id: 'sofia-maria-art-salon-moskva-han-presian15', name: 'Мария Арт Студио · салон Москва', cityCode: '68134', neighborhood: 'Хиподрума',
  address: 'София, ж.к. Хиподрума, ул. Хан Пресиан 15, салон Москва', locationKind: 'premises', coordinates: null, category: 'hair', website, phone: '+359898877051',
  booking: { kind: 'phone', phone: '+359898877051' },
  services: [
    service('Дамско подстригване — без екстеншъни', 25, 30, 'За къса, до раменете или по-дълга коса. При необходимост е включено полиране. Публикуваната добавка за екстеншъни е 20 лв.; този вариант е без екстеншъни. Не е заявено включено измиване.'),
    service('Сешоар и стилизанти — къса коса, без екстеншъни', 30, 20, 'Къса коса без екстеншъни. Публикуваната добавка при екстеншъни е 20 лв. Измиването е отделна услуга в тарифата, не е включено по предположение.'),
    service('Сешоар и стилизанти — коса до раменете, без екстеншъни', 40, 40, 'Коса до раменете без екстеншъни. Публикуваната добавка при екстеншъни е 20 лв. Измиването е отделна услуга в тарифата, не е включено по предположение.'),
  ],
  verification: { status: 'approved', checkedOn, validUntil, booking: { url: website, excerpt: 'Собственият сайт изрично посочва ЗАПИШЕТЕ ЧАС НА ТЕЛЕФОН0898877051. Контактите дават София, Хиподрума, Хан Пресиан15, салон Москва.' }, contact },
}]
const reviews = [{
  id: records[0].id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [`${website}robots.txt`, website, contact, menu, tariff],
  notes: 'Actual owner root Book invitation is explicit phone0898877051, reviewed before Services/Prices, independently repeated on Contact as phone andViber; chosen supported voicepath, not chat-only. Current native Services/Prices200 links complete ceni_2025.jpg; whole image visually read including BGNheader, exact lengthcolumns and extension+20BGN condition. Version2025filename not an inferred expiry; no numericEURconversion or search-onlyfees. Imported ordinary adultwomen haircut25BGN30min (all lengths, polishingifneeded) and blow+styling short30BGN20min/shoulderlength40BGN40min only. No wash inferred: it is separately listed in currenttariff. Extensions excluded explicitly; mandatorysurcharge recorded in descriptions. Ambiguous1.20/1.40 notation for other services not flattened or imported. Ordinary hair salon, no scalpdiagnosis/coldlaser/medical/clinical/safety/outcomeclaims, packages or nailinventory inferred. Exact Contact names SofiaHipodrumaHanPresian15SalonMoskva, samephone/root; one business not Nad ezhda staffclone. Contact11–19 versus rootsidebar12–19 andfloatingrestday conflict, all structuredhours omitted. Actual root/contact/menu navigation/footer has no own Terms/Privacy link, generic MyCorp copyright not a licence or universalautomationban. Robots public paths allowed; account/panel/admin/query paths not requested. Previous beauty-more hold was sourcepricepage cachemiss only, now cleared by owner nativeHTML+fullimage, not access bypass; no provider source. Currentruntime+ALL2000 intake domain/phone/name/address no acceptedduplicate; allHanPresian venue matches checked. No sourcephoto/review/ratings copy, Maps/geocoding, clientinput, phonecall, date/slot/staff/service selection, booking confirmation/submission, inventoryIdentity or coordinates.',
}]
export default { records, reviews }
