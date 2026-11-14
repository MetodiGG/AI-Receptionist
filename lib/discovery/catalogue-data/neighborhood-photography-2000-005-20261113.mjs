// One independent owner-operated photo studio; .com and .bg are the same operator.
const checkedOn = '2026-11-14', validUntil = '2027-02-12'
const website = 'https://www.emotion-studio.bg/'
const url = path => new URL(encodeURI(path), website).href
const terms = url('общи-условия.html'), prices = url('цени.html'), contact = url('контакти.html')
const conditions = 'Препоръчва се записване 10+ дни по-рано. Кадри до 30 работни дни; експресно +50%. Лично ползване; реклама се договаря. Публикуване в портфолио; при отказ студиото може да откаже ангажимента.'
const childConsent = 'За деца: писмено съгласие на родител/настойник.'
const service = (name, amount, unit, description, facts = {}) => ({
  name, category: 'other', appointmentModel: 'appointment',
  price: { kind: 'fixed', amount, currency: 'EUR', unit, sourceUrl: prices, checkedOn, validUntil },
  description: description + ' ' + conditions, ...facts,
})
const records = [{
  id: 'sofia-emotion-studio-gotse-delchev48', name: 'Emotion Studio · Емануела Станоева',
  cityCode: '68134', neighborhood: null, address: 'София, бул. Гоце Делчев 48',
  locationKind: 'premises', coordinates: null, category: 'other', website, phone: '+359889000873',
  booking: { kind: 'phone', phone: '+359889000873' },
  services: [
    service('Мини фотосесия за самостоятелно седящи бебета и деца — 10 кадъра', 92, '10 кадъра · самостоятелно седящи, 6–7 м.+ · около 40–60 мин.',
      childConsent),
    service('Стандартна фотосесия за самостоятелно седящи бебета и деца — 20 кадъра', 163, '20 кадъра · самостоятелно седящи, 6–7 м.+ · около 40–60 мин.',
      childConsent),
    service('Голяма фотосесия за самостоятелно седящи бебета и деца — 30 кадъра', 230, '30 кадъра · самостоятелно седящи, 6–7 м.+ · около 60–90 мин.',
      childConsent),
    service('Фотосесия за новородено или бебе, което още не седи — 15 кадъра', 143, '15 кадъра · новородено/неседящо бебе · до 3 часа', childConsent),
    service('Фотосесия за бременни — 15 кадъра', 143, '15 кадъра · самостоятелна фотосесия · до 3 часа', 'Без комбинирана отстъпка.'),
    service('Фотографско заснемане на кръщене и кратка семейна фотосесия', 178, 'церемония и кратка семейна фотосесия пред църквата · общо до 1 час', childConsent),
  ],
  verification: { status: 'approved', checkedOn, validUntil,
    booking: { url: terms, excerpt: 'За да си запишете час за фотосесия или събитие, може да го направите на тел.: 0889000873' },
    contact },
}]
const reviews = [{
  id: records[0].id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, terms, prices, contact, url('услуги.html'), website + 'robots.txt',
    'https://www.emotion-studio.com/', 'https://www.emotion-studio.com/robots.txt',
    'https://www.emotion-studio.com/%D0%BE%D0%B1%D1%89%D0%B8-%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F.html',
    'https://www.emotion-studio.com/%D1%86%D0%B5%D0%BD%D0%B8.html',
    'https://www.emotion-studio.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8.html'],
  notes: 'RootownactualBookFIRSTTerms explicitphone0889000873; readfullTerms thenwholecurrentprices/services/contact. Owner.comTerms links.bg; readercachemissNOThostblock, ordinarynative200broot/Terms/Prices/Services/Contact confirmSAMEoperatorEmanuelaStanoeva/phone/GotseDelchev48andidenticalEURtariff. Bothrobotsallowthesepublicpaths, disallowedJoomlaadmin/componentpathsNOTrequested. WholeTermsrestrictACTUALPHOTOGRAPHScommercialreuse/rawfiles/phonephotographyanddefaultportfoliooptoutmaydecline; notbroadsitefacts/automateddatarestriction, nolegalclearance. Noactualportfoliogallery/casephotos/social/logos/reviews/prosecopied. SixliteralEURfacts92/163/230child10/20/30frames;143newborn15;143maternity15;178baptismceremonyplusbriefoutsidefamilyphotosup-to1h. Thesearewholebookingproductsnotperframefees/dividedpackageor20percentbundlecredit; printedBGN/EURroundingnotrecomputedtoouramount. Childmustselfsit6–7monthsorolder; newbornNOTselfsit. Durations40–60/60–90/upto3h/upto1hNOTfixedscalarorcalendaravailability. Recommended10dayleadnotrequiredhorizon. Publicconditionskeepdelivery30workingdays/express+50percent/personaluse/portfoliooptoutmaydecline/writtenparentconsent. No weeklyhours/quarter/sourcepoint published, nullnotguessed. Actualcontactformhasnobookingdate/onlygenericenquiry, NOTchosen; no formfieldsentered/submitted. Runtime+ALL2000frozen/WIP hosts.com/.bg,phone889000873andoperatornamezeroatpreflight, ONEphysicalstudio notsixservicealiases orsecondexternal-eventbusiness. NoGoogle/Maps/geocoder/clientcoordinates/calls/emails/consent/payment/booking/notifications/productionwrite.',
}]
export default { records, reviews }
