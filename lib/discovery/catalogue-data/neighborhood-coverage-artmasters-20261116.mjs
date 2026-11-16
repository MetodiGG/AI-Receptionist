// One independently reviewed teaching studio, not one record per teacher or
// the other Sofia/Pernik locations mentioned by the school.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const site = 'https://amb2016.wixsite.com/music-school'
const contact = `${site}/blank-citr`, premises = `${site}/blank-br2ta`
const tariff = `${site}/blank-2`, teachers = `${site}/blank-c1yws`
const appointment = 'https://artmastersband12.wixsite.com/amb12/----c15bq'
const appointmentContact = 'https://artmastersband12.wixsite.com/amb12/contact'
const phone = '+359888357317'

export default {
  records: [{
    id: 'sofia-art-masters-band-nadezhda1-172', name: 'Музикална школа Арт Мастърс Бенд · Надежда 1',
    cityCode: '68134', neighborhood: 'Надежда 1',
    address: 'София, ж.к. Надежда 1, бл. 172, вх. Г',
    locationKind: 'premises', coordinates: null, category: 'education', website: site, phone,
    services: [
      { name: 'Индивидуален урок по пиано · 60 мин', category: 'education', appointmentModel: 'appointment',
        durationMin: 60, durationSourceUrl: tariff, durationCheckedOn: checkedOn,
        price: { amount: 30, currency: 'EUR', kind: 'fixed', unit: 'единично занятие', sourceUrl: tariff, checkedOn, validUntil },
        description: 'Единично занятие; 60 минути включват пристигане и тръгване. Плащане в края на часа.' },
      { name: 'Индивидуален урок по пиано · 30 мин', category: 'education', appointmentModel: 'appointment',
        durationMin: 30, durationSourceUrl: tariff, durationCheckedOn: checkedOn,
        price: { amount: 16, currency: 'EUR', kind: 'fixed', unit: 'единично занятие', sourceUrl: tariff, checkedOn, validUntil },
        description: 'Препоръчва се за по-малки деца; 30 минути включват пристигане и тръгване. Предплащане; отмяна до предходния ден, иначе урокът се отчита.' },
    ],
    openingHours: {
      days: [
        ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '08:30', close: '20:00' }] })),
        ...[6, 7].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '18:00' }] })),
      ],
      sourceUrl: premises, checkedOn,
    },
    booking: { kind: 'phone', phone },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: appointment, excerpt: 'За свободните часове и графика на школата, моля свържете се с телефоните за контакт. Собственият контакт посочва 0888 357 317.' },
      contact,
    },
  }],
  reviews: [{
    id: 'sofia-art-masters-band-nadezhda1-172', checkedOn, website: site,
    bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [site, contact, premises, tariff, teachers, `${site}/blank-c66t`, appointment, appointmentContact,
      'https://amb2016.wixsite.com/robots.txt', 'https://artmastersband12.wixsite.com/robots.txt'],
    manualIntakeResolution: {
      flag: 'first_party_appointment_evidence_required',
      decision: 'manually_verified_same_owner_websites', checkedOn,
      recordIdentity: 'cd7717c1ecdef710c0823391f3fd239fb6151d81ff42cf19aa71063b7a4a0724',
      ownerWebsite: site, currentContact: contact, currentPremises: premises,
      appointmentEvidence: appointment, appointmentContact,
      matchingPhones: [phone], premises: 'Надежда 1, бл. 172, вх. Г',
      reviewedBy: ['/root', '/root/catalogue_workflow_audit'],
      note: 'Root and independent reviewer read both owned Wix sites. School name, founder/teacher Todorov, the same amb12 professional email, phone888357317 and Nadezhda block172 entranceG bind the actual lesson-scheduling instruction to the current website and premises. The current About form is a generic inquiry, not a calendar. The older owner school page explicitly directs lesson-time and schedule inquiries to its own contact phones, and its linked Contact repeats the current phone. Different-host intake flag is retained and manually resolved; no helper change or owner-website replacement bypasses it.',
    },
    notes: 'Coverage-first single real Nadezhda1 teaching studio at block172 entranceG. Root independently re-read the actual owner lesson scheduling instruction and its linked Todorov phone FIRST, then the current school root, exact location, piano teachers and complete literal EUR tariff. Current own teacher page proves piano; no teacher clone or inferred per-specialist rate. The selected published single-session variants are60min30EUR and30min16EUR. Both durations explicitly include arrival/departure, not uninterrupted tuition. Thirty-minute option is recommended for younger children, prepaid, cancellable by the preceding day; absent prior notice the lesson is counted. Sixty-minute option is paid at lesson end. Monthly four/eight-session packages100/184EUR are not divided into artificial visit prices; instrument rental22EUR, conditional free lesson, ensemble/group/internship quotes and fifth-week adjustments are excluded. Current location/footer gives MonFri08:30–20 and SatSun10–18 as opening hours, not free slots or a teacher timetable. No Mladost/Pernik branch, other instrument inventory, coordinates or native availability inferred. Exact host aliases, brand, phone and premises checked against current catalogue/all intake before admission. Both Wix wildcard robots allow public pages; no lightbox/partials/gallery endpoint, API or blocked bot path requested. Merchant navigation/footer on the reviewed pages has generic copyright/Wix attribution and no separate reuse policy link; not a licence or legal-clearance assertion. Only compact independently phrased business/service facts retained, no teaching content, biography, source images, ratings or reviews reused. Existing precise illustrative piano-lesson artwork independently viewed; no neutral keyboard/consultation image substituted. No customer data, account, form fields, consent acceptance, submission, call, message, booking, map/geocoder, paid request or production write. Manual cross-owner-host proof stays in this review; the offline intake helper and its flag remain unchanged.',
  }],
}
