import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

// Reconcile only reviewed existing premises with their exact official address.
// Preserve the business-provided street wording and access instructions.
const points = [
  ['sofia-gumi-slick-krasna-polyana', 'Красна поляна 2', 'auto_repair', 'София, Красна поляна 2, бул. Никола Мушанов 114, вход на OMV',
    'https://gumi-slick.eu/', '+359896605796', 'https://myve.bg/vianor-krasna-polyana-obekt14370.html?tab=schedule-tyrechange', 'https://gumi-slick.eu/',
    '40838', 42.690574, 23.277552],
  ['sofia-autotechnica-iskarsko-shose', 'Гара Искър', 'auto_repair', 'София, Гара Искър, ул. Искърско шосе 13, на гърба на сервиз Дружба',
    'https://autotechnica.bg/', '+359899855040', 'https://autotechnica.bg/service-appointment/', 'https://autotechnica.bg/service-appointment/',
    '117378', 42.670306, 23.399006],
  ['sofia-vasident-angista8', 'Сточна гара', 'other', 'София, Сточна гара, ул. Ангиста №8, ет. 1',
    'https://www.vasident.com/', '+359888257496', null, 'https://www.vasident.com/контакти',
    '49373', 42.703897, 23.334116],
  ['sofia-nikolay-nikolaev-law', 'Изгрев', 'consulting', 'София, ж.к. Изгрев, ул. Фредерик Жолио-Кюри 20',
    'https://nikolaevlaw.com/', '+359893440797', 'https://nikolaevlaw.com/', 'https://nikolaevlaw.com/',
    '22859', 42.670998, 23.350277],
  ['sofia-bluess-art-studio-hemus63', 'Христо Смирненски', 'education', 'София, кв. Христо Смирненски, ул. Хемус, бл. 63, вх. А, ет. 14, ателие 113',
    'https://stanislavastoyanova.com/', '+359885935765', null, 'https://stanislavastoyanova.com/contact-bg/',
    '90426', 42.680738, 23.367988],
  ['sofia-fotovideo-elite-dimitar-tsolov9', 'Витоша', 'other', 'София, кв. Витоша, ул. Димитър Цолов 9, бл. 9',
    'https://fotovideoelite.com/foto-studio-sofia/', '+359878790122', null, 'https://fotovideoelite.com/kontakti/',
    '104670', 42.656492, 23.340146],
  ['sofia-katerene-europe-private', 'Дружба 1', 'fitness', 'София, Дружба 1, бул. Искърско шосе 7, Търговски център Европа, сграда 1',
    'https://www.katerene.bg/', '+359878669003', null, 'https://www.katerene.bg/courses/private/individualni-zanimaniia-po-katerene-v-zala',
    '117374', 42.667138, 23.405364],
  ['sofia-dupissima-gotse-delchev', 'Гоце Делчев', 'beauty', 'София, ж.к. Гоце Делчев, ул. Рикардо Вакарини 10Б',
    'https://dupissima.com/', '+359888440446', null, 'https://dupissima.com/saloni-i-kontakti/',
    '102261', 42.666209, 23.29535],
]
const byId = new Map(points.map(([id, ...point]) => [id, point]))

export function applyPriorityAddressRecovery20261123(rows) {
  return rows.map(row => {
    const point = byId.get(row.id)
    if (!point || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.coordinates !== null ||
        row.verification?.status !== 'approved') return row
    const [neighborhood, category, address, website, phone, bookingUrl, contact, addressId, latitude, longitude] = point
    if (row.neighborhood !== neighborhood || row.category !== category || row.address !== address ||
        row.website !== website || row.phone !== phone || row.verification.contact !== contact ||
        (bookingUrl ? row.booking?.kind !== 'form' || row.booking.url !== bookingUrl :
          row.booking?.kind !== 'phone' || row.booking.phone !== phone)) return row
    return { ...row, coordinates: {
      latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: address, sourceCityCode: row.cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
      checkedOn: '2026-11-23', addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
