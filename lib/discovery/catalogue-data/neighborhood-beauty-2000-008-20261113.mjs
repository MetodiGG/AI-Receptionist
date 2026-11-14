// Research intake only. Parent owns shared imports, identities and photos.
const checkedOn = '2026-11-14'
const validUntil = '2027-02-12'
const mavelle = 'https://solarium-lulin.com/'
const mavelleContact = `${mavelle}contacts/`
const mavellePrices = `${mavelle}ceni/`
const vean = 'https://vean-tattoo.bg/'
const veanSofia = `${vean}salony/sofiya`
const veanFaq = `${vean}vpros-otgovor`
const veanPrices = `${vean}ceni`
const records = [
  {
    id: 'sofia-mavelle-godech3', name: 'Mavelle · соларно студио', cityCode: '68134', neighborhood: 'Люлин 8',
    address: 'София, ж.к. Люлин 8, ул. Годеч 3', locationKind: 'premises', coordinates: null, category: 'beauty', website: mavelle, phone: '+359889656814',
    booking: { kind: 'phone', phone: '+359889656814' },
    services: [
      { name: 'Солариум — посещение с таксуване на минута', category: 'beauty', appointmentModel: 'appointment', price: { amount: 0.70, currency: 'EUR', kind: 'fixed', unit: 'минута', sourceUrl: mavellePrices, checkedOn, validUntil }, description: 'Публикувана тарифа за свободно посещение: 0,70 € на минута, не обща цена за сесия. Продължителността и общата сума се уточняват със студиото; предплатените карти са отделни.' },
    ],
    openingHours: { sourceUrl: mavelleContact, checkedOn, days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '21:00' }] })) },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: mavelleContact, excerpt: 'За записване на час и повече информация моля обадете ни се: +359889656814. Годеч3, Люлин8, София. Собствената Запиши си час връзка води към тези контакти.' }, contact: mavelleContact },
  },
  {
    id: 'sofia-vean-tattoo-stambolov6', name: 'VEAN TATTOO · София', cityCode: '68134', neighborhood: null,
    address: 'София, бул. Стефан Стамболов 6', locationKind: 'premises', coordinates: null, category: 'other', website: veanSofia, phone: '+359877065747',
    booking: { kind: 'phone', phone: '+359877065747' },
    services: [
      { name: 'Татуировка по индивидуален проект — за пълнолетни', category: 'other', appointmentModel: 'appointment', price: { amount: 100, currency: 'BGN', kind: 'from', sourceUrl: veanPrices, checkedOn, validUntil }, description: 'Ориентировъчна начална цена от собствената тарифа, не фиксирана цена за всяка татуировка. Размерът, сложността, мястото, цветовете и избраният татуист определят окончателната сума след обсъждане на проекта. Каталожната услуга е за пълнолетен клиент.' },
      { name: 'Покриване на стара татуировка — за пълнолетни', category: 'other', appointmentModel: 'appointment', price: { amount: 100, currency: 'BGN', kind: 'from', sourceUrl: veanPrices, checkedOn, validUntil }, description: 'Покриване с нова татуировка, не лазерно премахване. Ориентировъчна цена от 100 лв.; проектът, размерът, сложността и татуистът определят окончателната сума. Каталожната услуга е за пълнолетен клиент.' },
    ],
    openingHours: { sourceUrl: veanSofia, checkedOn, days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '11:00', close: '20:00' }] })) },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: veanFaq, excerpt: 'ЧЗВ, Как да се запиша за татуировка: възможно е записване по телефона. Софийският обект публикува Обадете се на нас, +359877065747 и бул. Стефан Стамболов6.' }, contact: veanSofia },
  },
]
const reviews = [
  {
    id: 'sofia-mavelle-godech3', website: mavelle, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [mavelle, `${mavelle}robots.txt`, mavelleContact, mavellePrices, `${mavelle}solarium/`, `${mavelle}za-nas/`],
    notes: 'Actual owner Запиши си час first followed to own Contacts, whose explicit voice-booking invitation and exact phone889656814/premiseGodech3/Lyulin8/Sofia are fully read. Whole native tariff, selectedsolariumservice andAbout read; onlyone ordinarysolarium row at literal0.70EUR/MINUTE, not sessiontotal or guessed10min duration. No prepaid40/60/100/170minute card totals, saltroom/halotherapy medicalclaims, laserprocedures, colariumhealth/antiaging/safetyclaims, sourcephotos/reviews/ratings or Mapsrequests imported. Completeweek09–21 ownerContact/rootconsistent. Robots permits publicpages; no linked general-use Terms found in reviewednative navigation/footer, genericcopyright notcalledpermission. Own tariff independently corroborated ordinaryHTML200, not provider/bundle. Source visits began UTC13, final inventory review completedUTC14; checkedOn14/validUntilFeb12, no frozenearlierbatchredating. Allruntime+all2000intakedomain/phone/premisededupe beforeauthoring; no overlap. No calls, clientfields, consent, submissions, coordinates, images or inventoryIdentity.',
  },
  {
    id: 'sofia-vean-tattoo-stambolov6', website: veanSofia, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [vean, `${vean}robots.txt`, veanSofia, veanFaq, veanPrices, `${vean}garanciya-za-rezervaciya`, 'https://customer.vean-tattoo.bg/robots.txt'],
    notes: 'Actual owner Book target customer.vean-tattoo.bg checked for robots BEFORE calendar access: Disallow all, no calendar/menu/API/customer content requested or used. Independent native FAQ question8 explicitly permits tattoo appointments by PHONE; Sofia own branch publishes Call us, exact branch877065747/Stambolov6 and daily11–20. This is phone booking, NOT a cleared online calendar. Sofia branch FAQ links own actual native /ceni as its indicative tariff; complete selected table and pricing explanation read. Only two literal from100BGN adult body-art variants, no conversion, fixedfee, invented duration, deposit, promotion/cashback, junior/minor/piercing, laser/medical procedure or safety/result claims. Table values below its general minimum are not selected and not reconciled by guessing. Footer/navigation public rules inspected: linked promotion/coin rules are not selected commercial services; /documents robots-disallowed and not requested. No blanket legal clearance or unpublished-price claim. Full current runtime1571+all2000intakes1922 domain/branch/globalphone preflight0. Same street6 KinesiJoy has different domain/phone/industry and is not this operator. One Sofia venue only; no artist aliases. No images/reviews/ratings copied, coordinatesnull, no inventoryIdentity.',
  },
]
export default { records, reviews }
