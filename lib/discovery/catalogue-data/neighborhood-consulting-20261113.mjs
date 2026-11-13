// Public owner tariff/contact facts; no legal advice or appointment submitted.
const checkedOn = '2026-11-13'
const website = 'https://vkamenarska.com/'
const contact = `${website}kontakti/`
const prices = `${website}ceni/`
const service = (name, amount, description) => ({
  name, category: 'consulting', appointmentModel: 'appointment', description,
  price: { amount, currency: 'EUR', kind: 'fixed', unit: 'до един час', sourceUrl: prices, checkedOn },
})
const records = [{
  id: 'sofia-valentina-kamenarska-tsar-boris', name: 'Адвокатска кантора Валентина Каменарска',
  cityCode: '68134', neighborhood: null, address: 'София, бул. „Цар Борис III“ 218, офис 2',
  locationKind: 'premises', coordinates: null, category: 'consulting', website, phone: '+359888889004',
  services: [
    service('Правна консултация без преглед на документи', 60, 'Цена за консултация до един час; всеки следващ час се заплаща с още 60 €. При сключване на договор и заплащане на хонорара за водене на дело в деня на консултацията самата консултация не се заплаща.'),
    service('Правна консултация с преглед на документи', 80, 'Цена за консултация до един час с преглед на документи. При сключване на договор и заплащане на хонорара за водене на дело в деня на консултацията самата консултация не се заплаща.'),
  ],
  openingHours: { sourceUrl: contact, checkedOn, days: [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '17:00' }] })) },
  booking: { kind: 'phone', phone: '+359888889004' },
  verification: { status: 'approved', checkedOn, validUntil: '2027-02-11', contact,
    booking: { url: contact, excerpt: 'За записване на час позвънете в работно време. Няма контактна форма.' } },
}]
const reviews = [{
  id: records[0].id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, prices],
  notes: 'Followed actual own Book instruction to Contacts first: explicit advance phone appointment, no contact form, same Sofia TsarBorisIII218office2 and phone. Then read complete current owner tariff and its ordinary consultation subsection:60EUR up-to-one-hour without documents,80EUR up-to-one-hour with documents, extra60EUR per further hour for the former. Up-to duration remains text/unit, not exact appointment duration. Same-day paid litigation-retainer waiver condition retained, not advertised as generally free consultation. Written advice, court representation/material-interest fees and statutory court taxes excluded because not a simple appointment. Owner contact Mon-Fri10-17 and public-holiday closure; weekdays retained, unsourced weekends not marked closed, no live slot availability asserted. No credentials, outcomes, legal advice, images, Google ratings or coordinates copied. No calls or submissions.',
}]
export default { records, reviews }
