// Source-complete 14 November intake; not imported until separate root gates.
const checkedOn = '2026-11-14', validUntil = '2027-02-12'
const website = 'https://vmdent.com/', bookingUrl = `${website}kontakti/`
const records = [{
  id: 'sofia-vm-dent-pimen-zografski14', name: 'VM Dent · дентална клиника',
  cityCode: '68134', neighborhood: null, address: 'София, ул. Свети Пимен Зографски 14',
  locationKind: 'premises', coordinates: null, category: 'other', website, phone: '+359876510055',
  booking: { kind: 'phone', phone: '+359876510055' },
  services: [{ name: 'Безплатна дентална консултация', category: 'other', appointmentModel: 'appointment',
    description: 'Консултация за обсъждане на възможностите за дентално лечение след предварителна уговорка с клиниката. Последващото лечение се оферира индивидуално и не е включено в безплатната консултация.',
    price: { amount: 0, currency: 'EUR', kind: 'fixed', unit: 'консултация · без последващи лечебни процедури', sourceUrl: bookingUrl, checkedOn, validUntil },
  }],
  verification: { status: 'approved', checkedOn, validUntil,
    booking: { url: bookingUrl, excerpt: 'Действителният бутон „Запазете час“ отваря собствените контакти с безплатна консултация, конкретен телефон и адрес на клиниката.' }, contact: bookingUrl },
}]
const reviews = [{
  id: records[0].id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, bookingUrl, `${website}uslugi/`],
  notes: 'Root personally read full current ordinary native HTTP200 homepage, actual Bookhref→ownedContact, then complete Services. Own Book/Contact visibly announces FREE dentalconsultation, exactSofiaSvPimenZografski14 andcurrent876510055; selected independentphone toarrangevisit, not claimingthe genericmessage/document-uploadform is an instantcalendar. Freeconsultation is literal0, not a missingtariff/placeholder/promotional treatment price or fabricatedfree30minintro; no duration stated. Individualsubsequenttreatmentoffer excludes the treatmentitself from0fee. Only this actualconsultation admitted, not allimplant/orthodontic/prostheticprocedures/non-dentalfillers or oneclinicrecordperstaff. Services title mentionsprices but body onlydescribesspecialties/no amounts: no full-treatmenttariffcoverage or not_publicly_listed claimed. No weeklyhours published in reviewedroot/Book/Services, omitted. Exactvenueaddress noquarter/point inferred, runtime+ALLintakehost/876510055/Pimen14 preflight required atintegration. Fullactualroot/Book/Servicesnavigation/footer exposes no separateTerms/Privacyroute; robots200allowsordinarypublicpages, not universalreusepermission. Ownerexpresslyprohibitsreuseofpresentedclinicalcases: respected, no cases/gallery/patientphotos/video/testimonials/materials copiedorvisited. Only independentlyphrasedmerchant/appointment facts; no authoredprose, creativeassets, credentials, outcomes, ratings or clinicaladvice. Formfieldlabels inspectedonly; no patientdata/medicaldocument/file/consent/captchaentry, no form action or externalautomationendpoint followed/submitted. Renderedhidden success/error messages are UItemplates, NOT a successfulrequest. No calls, Maps/geocoder, privateAPI, accounts, notifications, productiondata or settings writes.',
}]
export default { records, reviews }
