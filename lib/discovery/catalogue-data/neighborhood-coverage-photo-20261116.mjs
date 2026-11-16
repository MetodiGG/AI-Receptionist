// Independently reviewed first-party appointment routes and literal tariffs.
// Only these unambiguous offers are admitted; conflicting offers stay held.
const checkedOn = '2026-11-16'
const margo = 'https://margaritaangelova.com/'
const margoBook = `${margo}професионален-сватбен-фотограф/`
const margoFamily = `${margo}детски-и-семейни-фотосесии/`
const maria = 'https://marianemska.com/'
const mariaBook = `${maria}студио-софия-цени-и-условия/`
const mariaContact = `${maria}contact/`
const mariaDescription = 'Студийна фотосесия с минимум 10 снимки; допълнителен кадър 10 €. Само с предварителна уговорка на обявените дати за София; фотографът потвърждава часа.'

export default {
  records: [{
    id: 'sofia-photo-studio-margo-svoboda', name: 'Photo Studio Margo · Маргарита Ангелова',
    cityCode: '68134', neighborhood: 'Свобода',
    address: 'София, ж.к. Свобода, бул. Н. Жеков, бл. 4А (до CBA)',
    locationKind: 'premises',
    coordinates: {
      latitude: 42.73572582730182, longitude: 23.30583665727182,
      method: 'first_party_coordinates', source: margoBook,
      sourceAddress: 'София, ж.к. Свобода, бул. Н. Жеков, бл. 4А (до CBA)',
    },
    category: 'other', website: margo, phone: '+359899866672',
    services: [{
      name: 'Детска и семейна фотосесия', category: 'other', appointmentModel: 'appointment',
      price: { amount: 200, maximum: 250, currency: 'EUR', kind: 'range', unit: 'фотосесия; според желанията и локацията', sourceUrl: margoFamily, checkedOn, validUntil: '2027-02-14' },
      description: 'На предварително уговорена външна локация, не задължително в студиото. Продължителност 60–90 минути; предаване до 10 работни дни. Цената, мястото и датата се потвърждават при запитване.',
    }],
    booking: { kind: 'form', url: margoBook },
    verification: {
      status: 'approved', checkedOn, validUntil: '2027-02-14',
      booking: { url: margoBook, excerpt: 'Формулярът за запитване приема желана дата, място на събитието и съобщение. Фотографът потвърждава уговорката.' },
      contact: margoBook,
    },
  }, {
    id: 'sofia-maria-nemska-photo-suhodol', name: 'Мария Немска · Студио София',
    cityCode: '68134', neighborhood: 'Суходол',
    address: 'София, Суходол, ул. Траян Танев 21', locationKind: 'premises', coordinates: null,
    category: 'other', website: maria, phone: '+359878464445',
    services: [
      { name: 'Портретна фотосесия в студио', amount: 100 },
      { name: 'Фотосесия за бебета в студио', amount: 100 },
      { name: 'Фотосесия за новородени', amount: 190 },
    ].map(({ name, amount }) => ({
      name, category: 'other', appointmentModel: 'appointment', description: mariaDescription,
      price: { amount, currency: 'EUR', kind: 'fixed', unit: 'фотосесия с минимум 10 снимки', sourceUrl: mariaBook, checkedOn, validUntil: '2026-12-16' },
    })),
    booking: { kind: 'form', url: mariaBook },
    verification: {
      status: 'approved', checkedOn, validUntil: '2026-12-16',
      booking: { url: mariaBook, excerpt: 'Страницата за София съдържа формуляр за запитване и указания за записване. Работи се само на обявени дати, след потвърждение.' },
      contact: mariaContact,
    },
  }],
  reviews: [{
    id: 'sofia-photo-studio-margo-svoboda', checkedOn, website: margo,
    bookingEntry: margoBook, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [margo, margoBook, `${margo}календар/`, margoFamily, `${margo}индивидуални-фотосесии/`, `${margo}фотостудио-фотография/`, `${margo}ваучер-за-фотосесия/`, `${margo}общи-условия/`, `${margo}лични-данни-бисквитки/`],
    notes: 'One real Svoboda studio, not branches in every served quarter. Root independently read the actual date/place inquiry form and rendered Calendar in a browser: Calendar is only a static occupied-events table, not slots or a tariff menu. Family service page explicitly publishes200–250EUR per session depending on client wishes and agreed outdoor location,60–90min and delivery within10workingdays. The variable duration stays descriptive, never a fixed booking duration. This service is not promised at the studio address. Root independently read the owner Contact address and literal numeric map-link destination; only that address-bound first-party point is retained, without a Maps/geocoder request. Portrait pages have conflicting EUR/BGN offers, deliberately excluded rather than described as unpublished; vouchers excluded as products. No complete weekly schedule published: evening meeting guidance is not recurring opening hours. Public robots permits these routes; Terms/Privacy/Calendar read through ordinary HTTPS200 after reader timeouts, not a challenge bypass. Terms protect photographs and original prose; only concise independently paraphrased service/business facts and our AI illustrative artwork used, no portfolio/media/reviews copied and no blanket legal clearance claimed. No form input, booking, consent acceptance, call, email, customer data, provider API or paid service. Exact service inventory checked against existing catalogue and intake by name/domain/phone/address; no duplicate.',
  }, {
    id: 'sofia-maria-nemska-photo-suhodol', checkedOn, website: maria,
    bookingEntry: mariaBook, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [maria, mariaBook, mariaContact],
    notes: 'One Sofia studio in Suhodol at TrayanTanev21; Plovdiv is not a second Sofia listing. Actual Sofia appointment page independently rendered by root, including its complete ContactForm7 inquiry form and expanded HowToBook FAQ; no fields or reCAPTCHA interacted with. Root compared the selected Sofia tariffs against Contact: studio portrait100EUR, studio baby100EUR and newborn190EUR agree. Each amount is one photosession package with minimum10delivered images, not ten visits;10EUR additional image is visible only as a qualification, not a service row. Cake130vs140EUR and ambiguous child/maternity indoor/outdoor offers explicitly held. Owner announces only17/18Nov and15/16Dec2026 Sofia attendance, not available slots or weekly opening hours; public descriptions retain announced-date confirmation and shorter record/price review ends16Dec. No fixed duration, weekly schedule, coordinates or native availability invented. Actual owner public root, Contact and Sofia conditions read; robots disallows/wp-json and rest_route, neither requested. Footer has copyright but no separate Terms/Privacy link; no source prose/photos/ratings reused or licence assumed. Only independently summarized minimal facts and approved AI illustrative service photos. Current catalogue/intake domain/name/phone/address deduplication found no existing Sofia studio. No form submission, booking, call, message, account, personal data, Maps, geocoder, paid API or production write.',
  }],
}
