// Research intake only. Parent owns shared imports, identities and photos.
const checkedOn = '2026-11-14'
const validUntil = '2027-02-12'
const rosie = 'https://imageandstyle.eu/'
const rosieContact = `${rosie}contacts/`
const rosieServices = `${rosie}имидж-консултации-и-цветови-анализ/`
const tristana = 'https://tristana.bg/'
const tristanaBook = 'https://docs.google.com/forms/d/e/1FAIpQLSfhm5PQK3T1yFXZ4Q-hm9gfuOOWdl2N7E6zCCUhfTOsrgHryg/viewform?usp=send_form'
const records = [
  {
    id: 'sofia-image-style-rosie-fil-madrid39', name: 'Studio Image & Style · Rosie Fil.', cityCode: '68134', neighborhood: 'Оборище',
    address: 'София, кв. Оборище, бул. Мадрид 39', locationKind: 'premises', coordinates: null, category: 'consulting', website: rosie, phone: '+359877873515',
    booking: { kind: 'form', url: rosie },
    services: [
      { name: 'Армохромия — персонален цветови анализ и анализ на лице', category: 'consulting', appointmentModel: 'appointment', price: { amount: 140, currency: 'EUR', kind: 'fixed', sourceUrl: rosieServices, checkedOn, validUntil }, durationMin: 90, durationSourceUrl: rosieServices, durationCheckedOn: checkedOn, description: 'Индивидуална консултация в студиото с цветни мостри, анализ на форма на лицето и препоръки за цветове, прическа и аксесоари. Не е нанасяне на грим. Заявеният ден и час се потвърждават допълнително от студиото.' },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: rosie, excerpt: 'Запази час: собствен формуляр с име, телефон, дата, час, Армохромия и консултант. Студиото се свързва за потвърждение; заявката не гарантира часа.' }, contact: rosieContact },
  },
  {
    id: 'sofia-tristana-ashtanga-iskar54', name: 'Тристана Ащанга йога София', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Искър 54, ет. 2, вход през безистена за офиси', locationKind: 'premises', coordinates: null, category: 'fitness', website: tristana, phone: '+359899424747',
    booking: { kind: 'form', url: tristanaBook },
    services: [
      { name: 'Ащанга йога в Майсор клас — единично посещение', category: 'fitness', appointmentModel: 'group_reservation', price: { amount: 12, currency: 'EUR', kind: 'fixed', unit: 'едно посещение', sourceUrl: `${tristana}prices/`, checkedOn, validUntil }, description: 'Място в групов Майсор клас с индивидуално темпо; не частен урок. Записване за сутрешен клас до 20:00 предната вечер, за следобеден до 15:30 същия ден. При невъзможност за посещение уведомете поне 2 часа по-рано, а за сутрешен клас — предната вечер; иначе се дължи заниманието.' },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: `${tristana}schedule/`, excerpt: 'Всички практики са с предварително записване. Собствената връзка към формата дава текущи Майсор класове, име, телефон и избор на практика за заявка.' }, contact: `${tristana}contacts/` },
  },
]
const reviews = [
  {
    id: 'sofia-image-style-rosie-fil-madrid39', website: rosie, checkedOn, bookingEntry: rosie, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [rosie, `${rosie}robots.txt`, rosieContact, `${rosie}services/`, rosieServices, `${rosie}privacy-policy/`],
    notes: 'Actual own Book href is an Elementor popup on same root, not booking.page or another provider. Fresh public native root HTML contains actual BookingFrom form controls: name/phone/date/time, four named service options including Армохромия, consultant selector and submit; accompanying owner text says request needs later confirmation. This is a non-instant owned request form reviewed through native HTML, not a claimed interactive popup, calendar/availability or successful submission. No fields selected/entered, no consent/POST/API/bundle use. Current own service page explicitly140EUR/273.84BGN for90min colour+face analysis; select literalEUR without conversion. Other actual services/fees reviewed but not imported to avoid photo/scope ambiguity. OwnerContact exactSofia/Oborishte/Madrid39/877873515; published hours only prior appointment, so no numeric openingHours. Root/robots/cookie-policy complete reviewed, no general-use Terms link found in checked native navigation/footer; no legal clearance inferred. Fullruntime+ALL2000intake domain/phone preflight0, one studio/operator not three consultant clones. No testimonials, credentials claims, media, coords or inventoryIdentity imported.',
  },
  {
    id: 'sofia-tristana-ashtanga-iskar54', website: tristana, checkedOn, bookingEntry: tristanaBook, bookingReview: 'provider_booking_reviewed',
    reviewedUrls: [tristana, `${tristana}robots.txt`, `${tristana}schedule/`, `${tristana}etiquette/`, `${tristana}ащанга-йога/how_to_start/`, `${tristana}contacts/`, `${tristana}prices/`, 'https://forms.gle/robots.txt', 'https://forms.gle/pNDKJ1ipUGbabs717', 'https://docs.google.com/robots.txt', tristanaBook],
    notes: 'Actual owner Schedule says all classes need advance reservation. Main owner link accidentally targets a form editor; NOTopened. Alternate actual owner shortlink forms.gle/pNDKJ1ipUGbabs717 ordinaryHEAD302 resolves exact public viewform URL. forms.gle robots400invalid-link (notchallenge); docs robotsAllow/forms checked BEFORE publicform. Actual publicviewform nativeHTML200 fully read after technicalreaderfailure: current14–22Nov classes, name/phone, practice choices and submit; no date/service/customer fields entered, choices selected, response/editor/private data opened or submission. JavaScript-disabled banner is present; receipt covers actual native form/menu, not interactivecalendar/availability/login or booking confirmation. Literalownsinglevisit12EUR, not70/85/105EURcards, free trial, deposit or private35EURconsultation. No guessed60min from first-visit guidance or3h Mysore arrivalwindow; venue hours not inferred from class schedule. Publicdescription preserves bookingdeadlines/cancellationcharge. ExactownIskar54officepassageentrance/899424747. Fullruntime+ALLintakes domain/name/phone0beforeauthoring. Root/etiquette rules and service page complete, no separate generaluseTerms linked in reviewed native navigation/footer; no legalclearanceclaim. No medical/therapeutic claims, sourceimages/reviews/ratings, coordinates or identity.',
  },
]
export default { records, reviews }
