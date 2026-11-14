// Bounded owner-native appointment intake; parent owns identities, shared integration and photos.
const checkedOn = '2026-11-14'
const validUntil = '2027-02-12'
const website = 'https://www.bridalgallery.bg/'
const styling = 'https://www.bridalgallery.bg/stylingsessions'
const records = [{
  id: 'sofia-bridal-gallery-karnigradska13', name: 'Bridal Gallery · индивидуална проба', cityCode: '68134', neighborhood: null,
  address: 'София, ул. Кърниградска 13', locationKind: 'premises', coordinates: null, category: 'consulting', website, phone: '+359885308371',
  booking: { kind: 'form', url: website },
  services: [{ name: 'Индивидуална проба на булчински рокли', category: 'consulting', appointmentModel: 'appointment', description: 'Едночасова проба с неограничен брой рокли, с предварителна заявка и финално потвърждение от бутика по телефона. До трима придружители; препоръчва се лек или никакъв грим. Допълнителната styling session се заплаща отделно и не е включена. Това не е цена за покупка на рокля.', durationMin: 60, durationSourceUrl: website, durationCheckedOn: checkedOn, price: { amount: 20, currency: 'EUR', kind: 'fixed', sourceUrl: website, checkedOn, validUntil } }],
  openingHours: { days: [3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '11:00', close: '19:00' }] })).concat([6, 7].map(weekday => ({ weekday, periods: [{ open: '11:00', close: '17:00' }] }))), sourceUrl: website, checkedOn },
  verification: { status: 'approved', checkedOn, validUntil, booking: { url: website, excerpt: 'Запази час: собствена форма за предпочитани дата и час, следвана от обаждане за финално потвърждение. Пробата е с предварително записване, 20 евро за един час.' }, contact: website },
}]
const reviews = [{
  id: records[0].id, website, checkedOn, bookingEntry: website, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [`${website}robots.txt`, website, styling, `${website}blank`, `${website}styling-sessions`],
  notes: 'Actualownerroot nativeBook/form fullyread FIRST(name/surname/email/phone/preferreddate/from-to time/message/optionalpaidstylingcheckbox/submit), no input or actions. Ownerexplicitstaffcallbackforfinalconfirmation, not instantcalendar/confirmedavailability. Completecurrentownroot via ordinaryHTTP repeats independentlybookablebasefitting20EUR/onehour/unlimiteddresses, <=3companions andlight/no-makeuprecommendation, all publicconditions retained. SeparatecurrentnativeStylingSessions20/30/60EUR fullyread but optionalpaidadditionalcheckbox/basefittingfee totalnotclear, ALLstylingfeesheld notimported or calledunpublished. Actualformaddonlink /styling-sessions readerCachemiss(notcompleted), separateactualnav/stylingsessions native200 fullcurrentread; no fakeactualdialogclaim. No dress/accessory/retail/alterationpurchasefee imported, no inventedpurchasecredit/refund/cancellationcondition or includedgarment. RootalreadyidentifiesSofiabridalboutique/customdresses/Adi, coherentexactKarnigradska13/885308371. OwnAbout /blank normalHTTPempty, notclaimedoperatorlegalidentityverification. Actualroot/servicefullnav+footers expose no ownTerms/Privacy/cancellationlinks, not blanketpermission/legalclearance or assertionnoneexist. Robots publicallowed, ?lightbox excluded/notused. Root/serviceagreeWedFri11–19/SatSun11–17; MonTue absentnotassumedclosed, outsidehoursconditionalnotnormalized. Runtime1687plusALL2000modules host/phone/comefit/name/allKarnigradska13 overlaps0. Onebookingvenue notdress/model/staffclones, parentauthorizedsolepaidreservedfittingconsultation scope. Coordinates/quarter null, no sourcephotos/reviews/ratings/prosecopy, maps/GPS/geocoder/provider/checkout/customer/consent/actions/calls/submissions/productionwrites or staticidentities.',
}]
export default { records, reviews }
