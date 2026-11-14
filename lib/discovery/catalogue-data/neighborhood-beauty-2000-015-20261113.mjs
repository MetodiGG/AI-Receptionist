// Source-complete owner-native request-form intake. Parent owns shared imports, identities and photos.
const checkedOn = '2026-11-14'
const validUntil = '2027-02-12'
const website = 'https://preobrazena.bg/'
const booking = 'https://preobrazena.bg/contacts/'
const menu = 'https://preobrazena.bg/услуги/'
const service = (name, amount) => ({ name, category: 'nails', appointmentModel: 'appointment', description: 'Заявка за час през собствената контактна форма. При сваляне на гел лак от друг салон се доплащат 3 €. Допълнителните декорации са отделни позиции в тарифата.', price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl: menu, checkedOn, validUntil } })
const records = [{
  id: 'sofia-preobrazena-lyulin8-block820', name: 'Салон за красота Преобразена', cityCode: '68134', neighborhood: 'Люлин 8',
  address: 'София, ж.к. Люлин 8, бл. 820', locationKind: 'premises', coordinates: null, category: 'nails', website, phone: '+359898714710',
  booking: { kind: 'form', url: booking },
  services: [service('Маникюр с гел лак', 26), service('Маникюр с обикновен лак', 15), service('Оформяне на маникюр без лак', 13)],
  verification: { status: 'approved', checkedOn, validUntil, booking: { url: website, excerpt: 'Запиши час води към собствена контактна форма. София, Люлин8, бл.820; предварително записани часове спрямо възможностите на служителите;0898714710.' }, contact: booking },
}]
const reviews = [{
  id: records[0].id, website, checkedOn, bookingEntry: booking, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [`${website}robots.txt`, website, booking, menu, `${website}общи-условия/`, `${website}политика-на-поверителност`],
  notes: 'Actual owner root ЗАПИШИЧАС followed first to actualnative Contact/requestform(name/phone/email/free-text/submit), with exact SofiaLyulin8block820 and explicitpriorappointment/staffavailability instructions. Form is appointmentrequest entry under existing Dima/VM pattern, not a renderedcalendar, instantconfirmation or selectedslot. No input/action/submission/call/consent. Root/currentContact/currentServices coherentlyidentify one realhair/nails/beautysalon, sharedcurrentphone898714710, not Joana/Anna staffclones; oldservicefooterstaffdirectnumbers not selected. Three literalcurrentlypublishedEUR ordinarynail fees gel26/plainpolish15/no-polish13, no durationassumed. Other-salon gelremoval+3EUR and separatechargeddecorations publiclyqualified, not bundled free. No currencyconversion or mismatchingBGN/EUR unrelatedhair/lash/makeupfees used; no package/promotion/medicalpedicure/fungus/laser/orthotics/diagnosis/clinical/outcome claims. Full actuallinked Terms/Privacy read: ordinarypersonaldata/cookie clauses, no expressautomation/extraction/source-use restriction identified, not a permission or consentguarantee. Obvious ContessaHotel/Varna/corporateplaceholder boilerplate disclosed, NOTused as businessidentity, secondvenue, actuallegaloperator or legalclearance. Primarysalonroot/contact/services independentcurrentcoherence retained. Hours06–22 onlyconditionalonstaffavailability with no weekdays, so no structuredhours. Robots publicpagesallowed, admin/woocommerce/account/cart/actionpaths notused. Currentruntime1671 plus ALL2000 intake normalizeddomain/phone/name and allblock820premises no acceptedoverlap. No providerrequests/UI, inventoryIdentity, coordinates, sourcephotos/reviews/ratings/prosecopy, Maps/geocoding/privateGPS or productionchanges.',
}]
export default { records, reviews }
