const id = 'sofia-yavorov1920-geo-milev24', name = 'НЧ „П. К. Яворов – 1920“'
const cityCode = '68134', neighborhood = 'Гео Милев', category = 'education'
const address = 'София, кв. Гео Милев, ул. Гео Милев 24'
const phone = '+359889358991', website = 'https://artfabrika.org/'
const contact = website + 'contact/'
const vocal = website + '2026/08/нова-дейност-детска-вокална-група/autors/'
const synth = website + '2026/08/нова-дейност-синтезатор/autors/'
const academicYear = website + '2026/08/нова-учебна-година-и-дейности/autors/'
const checkedOn = '2026-11-27', validUntil = '2027-02-25'
const lesson = (serviceName, description) => ({ name: serviceName, category, description, appointmentModel: 'appointment' })

export const YAVOROV_GEO_MILEV_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, phone, website, locationKind: 'premises',
  // The owner marks the side entrance by name, independently of the map centre.
  coordinates: {
    latitude: 42.684178402776, longitude: 23.358875631151,
    method: 'first_party_coordinates', source: contact, sourceAddress: address,
  },
  services: [
    lesson('Детска вокална група', 'Групови занимания по пеене за деца. Записването е по телефона; графикът и таксата се уточняват с читалището.'),
    lesson('Уроци по музикален инструмент · синтезатор', 'Записването за школата по синтезатор е по телефона. Попитай читалището за свободни места, график и такса.'),
  ],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: vocal, excerpt: 'За вокалната група и за школата по синтезатор читалището посочва един и същ пряк телефон за записване.' },
  },
}]

export const YAVOROV_GEO_MILEV_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, vocal, synth, academicYear, contact],
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: vocal, serviceUrls: [vocal, synth, academicYear],
    notes: 'The directly reached choir and synthesizer enrolment posts and the current school-year programme were checked in full. They invite direct telephone enrolment but give no tuition, price list, duration or availability for these two schools. Library membership fees are unrelated.',
  },
  inventoryIdentity: '97bc5b8bb4f3a130f64507c880c5feb5d5526dea31b655d3b8c6589d126af46b',
  notes: 'The branch’s live enrolment pages and published phone were followed first, then the school-year programme and branch contact. These are two different lessons by one operator, not two businesses. The phone line is for enrolment; no place, schedule or price is guaranteed. The contact page’s named side-entrance marker, November school-year context and district-confirmed address distinguish this branch from similar library and cadastral addresses. Chess was not imported because its announced group might not have formed. No call or booking was made.',
}]
