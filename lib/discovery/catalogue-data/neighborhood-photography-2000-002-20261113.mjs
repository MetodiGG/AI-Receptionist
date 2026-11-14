// One independently reviewed operator, not separate studio/mobile clones.
const checkedOn = '2026-11-13', validUntil = '2027-02-11'
const website = 'https://club.photocafe.bg/'
const menu = website + 'services/'
const terms = website + 'obshti-uslovia-gdpr/'
const service = (name, amount, description) => ({ name, category: 'other', appointmentModel: 'appointment', description,
  price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl: menu, checkedOn, validUntil } })
const records = [{
  id: 'sofia-photo-cafe-dertliev42', name: 'Фото Кафе · услуги за фототехника',
  cityCode: '68134', neighborhood: 'Люлин 7', address: 'София, Люлин 7, бул. Петър Дертлиев 42, Грийн център',
  locationKind: 'premises', coordinates: null, category: 'other', website, phone: '+359888701698',
  booking: { kind: 'phone', phone: '+359888701698' },
  services: [
    service('Хардуерно калибриране на монитор · в студиото', 30, 'Една услуга на място в студиото след уговорен час. Мониторът се калибрира към устройството, с което работи; лаптопът трябва да е със захранване. Посещение при клиента е отделна тарифа.'),
    service('Мокро почистване на сензор на фотоапарат · EXTRA', 40, 'Едно посещение след предварително записване. Включва сухо и мокро почистване на матрица на безогледална или DSLR камера. Необходима е напълно заредена батерия; не е ремонт на съществуващи механични дефекти.'),
  ],
  verification: { status: 'approved', checkedOn, validUntil, booking: { url: terms, excerpt: 'Услугите се извършват с предварително записване на час през контактната форма или по телефон. 088 870 1698.' }, contact: menu },
}]
const reviews = [{
  id: records[0].id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, menu, terms, 'https://photocafe.bg/monitor-calibration/', 'https://photocafe.bg/sensor-cleaning/'],
  notes: 'ActualownServices appointment-entry and complete publicrequestform inspected FIRST beforeprices; ownfullTerms independently explicitly offer PHONE appointments for both exact services. CurrentordinarypublicHTTPS confirms30EURin-studioStandardmonitorcalibration and40EURExtra dry+wet sensorcleaning;35EURhomevisit and30EURdryonly notmixed. No card/memberdiscount, retailbookfee orarticleequipment/consumablepurchaseprice imported. Ownterms/services/footer same888701698 andactualLyulin7PetarDertliev42GreenCentre; historic2015comment old878number/floor2office65NOTadopted. Rootandclub areonelegalPhotoCafeoperator, nottwo businesses or an equipmentshop/staffclone. Bothdomainsrobotschecked before linkedarticles; no prohibitedadmin/search/API requested. Owner-linked olderarticles describe procedure and directtoactualcurrentServicesfees, notconflictingoldservicetariffs. Copyrightimages/materials notcopied orlicensed; onlyminimalindependentlyphrasedfactualbusiness/service/fees/contact facts andsources. Rootpricespagehasduplicatedcalibratormodelnames, so NOspecificbrand/model asserted. No weeklyhours/durationpublishedinreviewedservice/terms/footer, omitted. No sourcephotos/tutorialprose/testimonials/Mapslink/clientsdata/calls/formfields/consents/bookings/privateAPI/geocode. FullnativeTerms/currentServicesreadthroughordinaryHTTPS afterreadercachemiss, no accesschallenge.',
}]
export default { records, reviews }
