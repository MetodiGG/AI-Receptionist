// One independently reviewed dental venue; other potential branches/leads remain held.
const checkedOn = '2026-11-14';
const validUntil = '2027-02-12';
const website = 'https://nurident.com/bg/';
const contact = `${website}contact/`;
const prices = `${website}ceni/`;

export default {
  records: [{
    id: 'sofia-nurident-zlatovrah52', name: 'Нуридент 1 · Златовръх 52',
    cityCode: '68134', neighborhood: 'Лозенец',
    address: 'София, ж.к. Лозенец, ул. Златовръх 52',
    locationKind: 'premises', coordinates: null, category: 'other',
    website, phone: '+359887770703',
    booking: { kind: 'form', url: contact },
    services: [{
      name: 'Безплатна присъствена дентална консултация',
      category: 'other', appointmentModel: 'appointment',
      description: 'Консултация на място след предварителна заявка към клиниката, не изпращане на снимка за дистанционно запитване. Безплатна е консултацията, не рентгеновите изследвания, имплантите, протезирането или целият курс на лечение.',
      price: { amount: 0, currency: 'EUR', kind: 'fixed', unit: 'само консултация на място', sourceUrl: prices, checkedOn, validUntil }
    }],
    openingHours: {
      sourceUrl: contact, checkedOn,
      days: [1, 2].map(weekday => ({ weekday, periods: [{ open: '08:30', close: '17:30' }] }))
        .concat([3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })))
    },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: website, excerpt: 'Собственият Запазете час за безплатна консултация води към контактната форма. Ценоразписът изрично различава посещението на място от изпращането на снимка по имейл.' },
      contact
    }
  }],
  reviews: [{
    id: 'sofia-nurident-zlatovrah52', website, checkedOn,
    bookingEntry: contact, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [
      'https://nurident.com/robots.txt', 'https://nurident.com/', 'https://nurident.com/contact/',
      website, contact, prices, `${website}za-nas/`, `${website}obshta-dentalna-medicina/`
    ],
    notes: 'Actual owner Book FIRST: Bulgarian root explicitly invites appointment for free consultation and links its own /bg/contact/ native name/email/phone/message/optionalfile request form; complete public form read, no data/consent/upload/submit/call/email. Full current native /bg/ceni/ tariff read to EOF corroborates free consultation IN PERSON in the clinic, separately from emailing a panoramic image for an individual treatment-plan enquiry. ZERO only reflects literal Free consultation, not a computed discount, NHS copay, free imaging/surgery/implant/prosthetic or entire course; pricedXray10/30/80 and treatments/packsnotimported. No duration guessed, no instant calendar/availability/confirmation claim. Main ContactCall887770703 and its primaryContact hours bind NURIDENT1 Zlatovrah52, SofiaLozenets; footer separately names NURIDENT2 Zlatovrah71 with otherphones, but no exact selected-visit/Book branch option inspected for71, so ONLY52 authored, no department/staff/branch cloning. Full own About identifies dental implant centre and dental specialists with cardiologist/anaesthesiologist support for dental interventions; root explicitly clarified eligibility of PRIMARYDENTALoperator ONLYactualordinarydentalconsultation, no generalmedical consultations/physio/diagnostics/clinical-result claims imported. Full actual root/Book/contact/price/About/service navigation+footers and form inspected: no linked Terms/Privacy policy observed; not assertion no policy exists or a reuse licence/legal clearance. Public robotsallow no privateadmin/API requested. Only minimal independently worded service/fee/contact facts, no clinical protocols/prose/tables/photographs/patientcases/reviews/ratings copied. MonTue08:30–17:30 andWedFri09–18 expressly Contactprimaryphonecontext; weekend absentnotassumedclosed. Allownedroot/fullBG tariffservicecontext coherent, no foreignbooking/GoogleMap directions/geocoder/Nominatim/GPS/payment/customerdataset/providerexport/productionwrite. Full executable runtime+ALLintakes normalizedownhost/name/3branch1phones/branch2phone preflightzero, final gate and freeze documentedledger. Staticidentities/photoassociation left to root.'
  }]
};
