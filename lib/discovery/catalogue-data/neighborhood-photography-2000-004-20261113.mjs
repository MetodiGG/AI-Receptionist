// Working root intake004. Only actual14Novpublicsource observations; shared integration remains separate.
const checkedOn = '2026-11-14', validUntil = '2027-02-12'
const website = 'https://podcaststudio.bg/'
const bookingUrl = website + 'pages/contact'
const audioUrl = "https://podcaststudio.bg/products/%D0%B7%D0%B0%D0%BF%D0%B8%D1%81-%D0%BD%D0%B0-%D0%B0%D1%83%D0%B4%D0%B8%D0%BE-%D0%BF%D0%BE%D0%B4%D0%BA%D0%B0%D1%81%D1%82-%D0%BF%D1%80%D0%BE%D1%84%D0%B5%D1%81%D0%B8%D0%BE%D0%BD%D0%B0%D0%BB%D0%BD%D0%BE-%D1%81%D1%82%D1%83%D0%B4%D0%B8%D0%BE-%D0%B2-%D1%81%D0%BE%D1%84%D0%B8%D1%8F"
const rentalUrl = website + 'pages/podkast-studio-pod-naem'
const records = [{
  id: 'sofia-it-corner-podcast-slavyanska29', name: 'Podcast Studio Sofia · IT Corner Studio 2', cityCode: '68134', neighborhood: 'Център',
  address: 'София, ул. Славянска 29', locationKind: 'premises', coordinates: null, category: 'other', website, phone: '+359889043395',
  booking: { kind: 'form', url: bookingUrl },
  services: [{
    name: 'Аудио подкаст · запис за един час', category: 'other', appointmentModel: 'appointment',
    price: { amount: 60, currency: 'EUR', kind: 'fixed', unit: 'един започнат час; без ДДС', sourceUrl: audioUrl, checkedOn, validUntil },
    durationMin: 60, durationSourceUrl: audioUrl, durationCheckedOn: checkedOn,
    description: 'Един час аудиозапис, без ДДС, със студио, микрофони и помощ при настройка. Всеки започнат час се таксува изцяло. Елате 30 минути по-рано и носете NVMe/SSD диск поне 500 MB/s. Видео и монтаж са отделно. Датата и офертата се потвърждават след заявка.',
  }],
  verification: { status: 'approved', checkedOn, validUntil, booking: { url: bookingUrl, excerpt: 'Запази час → собствена заявка за запис: име, телефон, услуга и желана дата; екипът отговаря до работен ден. Има и изрично записване по телефона.' }, contact: bookingUrl },
}]
const reviews = [{
  id: records[0].id, website, checkedOn, bookingEntry: bookingUrl, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, website + 'robots.txt', bookingUrl, audioUrl, rentalUrl, website + 'policies/terms-of-service/', website + 'policies/privacy-policy'],
  notes: 'ActualrootBook followedFIRST beforeselectedtariff. WebreaderContact/product showed staleShopifylayout with genericoldreserve link; ordinarysameURLcurrentnativeHTTP200 fullyread actualOWNstudioform name/phone/email/service/date/host/guest/source/message/consent/submit, actualserviceoptionAudioPodcast andcallbackworkday, no inputs/choices/submission/actions. No stale zeroCarttotal/soldout flag orpromo imported. Completecurrentnativeaudiomenu literal60EURonehour/120two, wholeownrentalpage and25Oct2026Terms verifyEXVAT/eachstartedhourchargedfull, advance30minarrival/ownNVMeSSD500MBs, microphones/setupassistance, notvideo/edit/freeconsultation/scaleupsubscription. OneactualSlavyanska29visitorstudio; Pirotska52 inPrivacy iscorrespondence notcurrentsecondvenue. Studio3renovatingnotopen, Studio1footerlabelnoexactpremise notcloned. EntireownTerms and23590charPrivacy reviewedinboundedcachedsegments, ordinaryserviceoffer/customerdata terms; noexpressautomation/database/noncommercialsourcebanobserved, nolegalclearanceclaim. Robotsdisallowstudio/portal/share/prompter/slots respected, no suchpaths/customerportals/links/API/bundles/payment/cart/account requested. No ordinaryweekhours published inactualroot/contact/menu/rental, omitted. Independentminimalfactualdescription only, no sourceimages/portfolio/testimonials/reviews/marketingprose/qualifications. Runtime+ALL2000domain/phone/ITCornerpreflight0; no owner/clientcalls, bookings, emailpricesrequest, consent, map or geocode.',
}]
records.push({
  "id": "sofia-yep-podcasts-tsum",
  "name": "YEPpodcasts · ЦУМ",
  "cityCode": "68134",
  "neighborhood": "Център",
  "address": "София, бул. Мария Луиза 2, ЦУМ, ет. 7",
  "locationKind": "premises",
  "coordinates": null,
  "category": "other",
  "website": "https://youreventpartner.bg/",
  "phone": "+359878717871",
  "booking": {
    "kind": "form",
    "url": "https://youreventpartner.bg/kontakti/"
  },
  "services": [
    {
      "name": "Запис на подкаст · до 1,5 часа",
      "category": "other",
      "appointmentModel": "appointment",
      "price": {
        "amount": 590,
        "currency": "BGN",
        "kind": "from",
        "unit": "запис до 1,5 часа; без ДДС",
        "sourceUrl": "https://youreventpartner.bg/faq/",
        "checkedOn": "2026-11-14",
        "validUntil": "2027-02-12"
      },
      "description": "Начална цена за запис до 1,5 часа, без ДДС. Форматът, студиото, техниката, монтажът и крайната оферта се уточняват предварително. Индивидуален декор и публика изискват отделен бюджет. Препоръчва се поне месец подготовка; заявката не потвърждава свободен час."
    }
  ],
  "verification": {
    "status": "approved",
    "checkedOn": "2026-11-14",
    "validUntil": "2027-02-12",
    "booking": {
      "url": "https://youreventpartner.bg/kontakti/",
      "excerpt": "Собственият бутон на подкаст услугата води до реална форма с име, телефон, дата, часове и коментар за проекта; екипът уточнява заявката."
    },
    "contact": "https://youreventpartner.bg/kontakti/"
  }
})
reviews.push({
  "id": "sofia-yep-podcasts-tsum",
  "website": "https://youreventpartner.bg/",
  "checkedOn": "2026-11-14",
  "bookingEntry": "https://youreventpartner.bg/kontakti/",
  "bookingReview": "owned_booking_reviewed",
  "reviewedUrls": [
    "https://youreventpartner.bg/",
    "https://youreventpartner.bg/robots.txt",
    "https://youreventpartner.bg/kontakti/",
    "https://youreventpartner.bg/podcast-studio-sofia/",
    "https://youreventpartner.bg/faq/",
    "https://youreventpartner.bg/privacy-policy/"
  ],
  "notes": "ActualrootBookContact inspected FIRST: ordinarycurrentnativeHTTP200 actualownname/company/email/phone/date/timefromto/participants/comments/consent/submit controls, no inputs/selection/submission. DedicatedcurrentPodcasts mainpage explicitlyTSUMstudio andactualCTAtoownedform. CompletecurrentnativeFAQ literalFROM590BGNforrecordingUPTO1.5hEXVAT, notperhour/90minfixed/450BGNlivestream or60–200hallrental; no package/carddivision. Formats/equipment/montage/finalquote agreed, sourcecustomset/publicseparatebudget andrecommendedmonthpreparation preserved. ActualFAQalso20April13studio but onlycurrentdedicatedTSUMmainvenue imported; no room/staff/additionalhistoricvenue/homevisit clones, no branch-specificfeesinferredfor20April. Nativefullroot/footer/currentservicebook/entirePrivacyGDPR/Termsreadincludinglasttail, no expressautomation/database/noncommercialsourcebanobserved; nolegalclearanceclaim. Krichim3Privacyregistrationnotvisitorstudio. No numericweeklyhours in reviewedmenu/contact/service/FAQ, omitted. ExactTSUMMariaLuiza2floor7/+359878717871, noCUMcentre/campus/entrancepointinferred. Runtime+ALLintakes domain/phoneoperator0. Onlyminimalindependentlyphrasedfacts, noexpressiveprose/sourcephotos/clientnames/testimonials/ratings reused. No Mapsrequests/customerdata/calls/consent/emailnewsletter/booking/payments/portal/API/bundle/UI/geocoder."
})
export default { records, reviews }

