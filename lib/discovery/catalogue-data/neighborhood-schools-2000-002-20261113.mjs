// Three individually corroborated teaching premises, not staff or departments.
// The fourth address is held because the owner's body/footer disagree (64/62).
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const root = 'https://ihsofia.bg/'
const offer = `${root}Индивидуални-уроци/`
const contact = `${root}Контакти/`
const privacy = `${root}политика-за-поверителност/`
const faq = `${root}Често-Задавани-Въпроси/`
const venues = [
  ['sitnyakovo39a', 'Ситняково', 'бул. Ситняково 39А', '+359890291111', [42.692476, 23.3555069]],
  ['bregalnitsa43', 'Брегалница', 'ул. Брегалница 43', '+359892414994', null],
  ['parensov39', 'Ген. Паренсов', 'ул. Ген. Паренсов 39', '+359890291111', [42.6883558, 23.3306711]],
]
const records = venues.map(([key, label, street, phone, ownerPoint]) => {
  const address = `София, ${street}`
  return {
    id: `sofia-ih-sofia-${key}`, name: `International House Sofia · ${label}`,
    cityCode: '68134', neighborhood: null, address, locationKind: 'premises',
    coordinates: ownerPoint ? { latitude: ownerPoint[0], longitude: ownerPoint[1], source: contact, method: 'first_party_coordinates', sourceAddress: address } : null,
    category: 'education', website: root, phone,
    services: [
      { name: 'Индивидуален урок по английски език', category: 'education', appointmentModel: 'appointment',
        description: 'Обучение с чуждестранен преподавател след запитване за този офис. Цената е за час; продължителността и графикът се уговарят предварително.',
        price: { amount: 40, currency: 'EUR', kind: 'fixed', unit: 'час индивидуално обучение', sourceUrl: offer, checkedOn, validUntil } },
      { name: 'Индивидуална подготовка за IELTS или CAE', category: 'education', appointmentModel: 'appointment',
        description: 'Индивидуална изпитна подготовка след предварително запитване. Таксата е за час; избраният изпит, мястото и условията се потвърждават от екипа.',
        price: { amount: 55, currency: 'EUR', kind: 'fixed', unit: 'час индивидуална изпитна подготовка', sourceUrl: offer, checkedOn, validUntil } },
    ],
    booking: { kind: 'form', url: contact },
    verification: { status: 'approved', checkedOn, validUntil,
      booking: { url: offer, excerpt: 'Индивидуалните уроци са по уговорен график в един от офисите; действителният бутон „Свържете се с нас“ води към формата за запитване.' },
      contact },
  }
})
const reviews = records.map(row => ({
  id: row.id, website: root, checkedOn, bookingEntry: contact, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [root, offer, contact, privacy, faq],
  notes: 'Root read the complete rendered current individual-offer page, followed its actual Contact CTA, inspected the live name/email/phone/subject/message/consent enquiry form without entering or submitting anything, then read the owner contact, public privacy and homepage. Literal40EUR/hour general individual and55EUR/hour IELTS/CAE fees are published together; no60minute scalar, native slots, teacher credentials or outcomes are inferred. The offer explicitly permits lessons in the listed offices as well as online/home; only these three separately named real Sofia teaching venues are selected, not online/mobile duplicates. Parensov has no permanent administration, but is explicitly a teaching office; appointment enquiries go through the actual common form. Flexible08–21:30 lesson windows and weekday10–18:30 administration are NOT imported as weekly class opening hours. Solun64 body versus62 footer is held, not silently resolved. Two owner contact-page named Google Maps hyperlinks publish explicit destination marker !3d/!4d coordinates: those literal markers, NOT @viewport centres, are address-bound first-party points; no Google API, Maps navigation, route or client location was used. Bregalnitsa link supplies only a place identifier, so its coordinates remain absent. No mapped point is represented as a surveyed entrance. Only minimal facts and short independently written descriptions retained; no owner photos, logos, reviews, teaching materials or prose copied. No separate general-usage/extraction restriction link was exposed in these menus; the inspected published privacy notice is not a claimed permission agreement.',
}))
export default { records, reviews }
