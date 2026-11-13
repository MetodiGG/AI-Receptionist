import { validateCatalogue } from './catalogue-policy.mjs'
import beautyExpansion from './catalogue-data/beauty-expansion.json' with { type: 'json' }
import autoSportHomeExpansion from './catalogue-data/auto-sport-home-expansion.json' with { type: 'json' }
import servicesExpansion from './catalogue-data/services-expansion.json' with { type: 'json' }
import beautyExpansionV2 from './catalogue-data/beauty-expansion-v2.json' with { type: 'json' }
import autoSportHomeExpansionV2 from './catalogue-data/auto-sport-home-expansion-v2.json' with { type: 'json' }
import servicesExpansionV2 from './catalogue-data/services-expansion-v2.json' with { type: 'json' }
import geocodesV2 from './catalogue-data/geocodes-v2.json' with { type: 'json' }
import geocodesV3 from './catalogue-data/geocodes-v3.json' with { type: 'json' }
import geocodesV4 from './catalogue-data/geocodes-v4.json' with { type: 'json' }
import supplementalExpansionV2 from './catalogue-data/supplemental-expansion-v2.mjs'
import coverageExpansionV3 from './catalogue-data/coverage-expansion-v3.mjs'
import coverageExpansionV4 from './catalogue-data/coverage-expansion-v4.mjs'
import coverageExpansionV5 from './catalogue-data/coverage-expansion-v5.mjs'
import coverageExpansionV6 from './catalogue-data/coverage-expansion-v6.mjs'
import coverageExpansionV7 from './catalogue-data/coverage-expansion-v7.mjs'
import coverageExpansionV8 from './catalogue-data/coverage-expansion-v8.mjs'
import coverageExpansionV9 from './catalogue-data/coverage-expansion-v9.mjs'
import coverageExpansionV10 from './catalogue-data/coverage-expansion-v10.mjs'
import { PRICING_EXPANSION_RECORDS } from './catalogue-data/pricing-expansion-20261110.mjs'
import { NEIGHBORHOOD_20261111_RECORDS } from './catalogue-data/neighborhood-expansion-20261111.mjs'
import { enrichCatalogueDetails } from './catalogue-data/details-enrichment-v2.mjs'
import { enrichCatalogueDetailsV3 } from './catalogue-data/details-enrichment-v3.mjs'
import pricing20261110 from './catalogue-data/pricing-20261110.json' with { type: 'json' }
import { BOOKING_REVIEWED_PRICING } from './catalogue-data/pricing-booking-review-v1.mjs'
import { enrichCataloguePricing } from './catalogue-pricing-enrichment.mjs'
import { applyCatalogueCoordinateBindings } from './catalogue-coordinate-binding.mjs'
import { applyOfficialCatalogueLocations } from './catalogue-official-locations.mjs'

// First-party public facts manually checked on 2026-11-05. This is a reviewed
// catalogue, not all Sofia businesses and not a Google/Studio24 data export.
// Only short appointment evidence is retained; no photographs or reviews.
const checkedOn = '2026-11-05', validUntil = '2027-02-03'
const service = (name, category, appointmentModel = 'appointment') => ({ name, category, appointmentModel })
const point = (latitude, longitude, source) => ({ latitude, longitude, source, method: 'first_party_coordinates' })
const reviewed = (url, excerpt, contact = url) => ({ status: 'approved', checkedOn, validUntil, booking: { url, excerpt }, contact })

const baseCatalogue = validateCatalogue([
  {
    id: 'sofia-mokro-nosle', name: 'Мокро Носле', category: 'pets', cityCode: '68134', neighborhood: 'Манастирски ливади',
    address: 'София, Манастирски ливади, ул. Пирин 85', locationKind: 'premises',
    coordinates: point(42.6638205, 23.2846817, 'https://www.mokronosle.com/'), website: 'https://www.mokronosle.com/', phone: '+359884191090',
    services: [service('Груминг за кучета', 'pets'), service('Къпане и подстригване на кучета', 'pets')],
    booking: { kind: 'form', url: 'https://easybook.bg/gruming-studio-mokro-nosle-sofiya-manastirski-livadi' },
    verification: reviewed('https://www.mokronosle.com/', 'Запази час за груминг'),
  },
  {
    id: 'sofia-kaya-grooming', name: 'Kaya Grooming', category: 'pets', cityCode: '68134', neighborhood: 'Борово',
    address: 'София, Борово, ул. Солун 62', locationKind: 'premises',
    coordinates: point(42.670812, 23.289344, 'https://www.kaya-grooming.com/'), website: 'https://www.kaya-grooming.com/', phone: '+359895754360',
    services: [service('Груминг за кучета', 'pets'), service('Къпане и разресване на котки', 'pets')],
    booking: { kind: 'form', url: 'https://www.kaya-grooming.com/book-online' },
    verification: reviewed('https://www.kaya-grooming.com/book-online', 'ЗАПАЗИ ЧАС ПРИ НАС ПРЕЗ НАШИЯ САЙТ ИЛИ СЕ ОБАДИ НА : 0895 75 43 60', 'https://www.kaya-grooming.com/'),
  },
  {
    id: 'sofia-tobbys-grooming', name: 'Tobby’s Grooming House', category: 'pets', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Белмекен 8', locationKind: 'premises', coordinates: null, website: 'https://tobby.bg/', phone: '+359894467070',
    services: [service('Груминг и подстригване на кучета', 'pets'), service('Къпане и сушене на кучета', 'pets')],
    booking: { kind: 'phone', phone: '+359894467070' },
    verification: reviewed('https://tobby.bg/', 'Засега можеш да запазиш час по телефон, имейл или чрез формата.'),
  },
  {
    id: 'sofia-pet-stop-place', name: 'PetStopPlace · груминг', category: 'pets', cityCode: '68134', neighborhood: 'Надежда 4',
    address: 'София, Надежда 4, ул. Бели Дунав 2', locationKind: 'premises', coordinates: null, website: 'https://petstopplace.com/', phone: '+359877755265',
    services: [service('Груминг за кучета', 'pets')], booking: { kind: 'phone', phone: '+359877755265' },
    verification: reviewed('https://petstopplace.com/', 'Час се запазва с обаждане.'),
  },
  {
    id: 'sofia-iq-detailing', name: 'IQ Detailing', category: 'detailing', cityCode: '68134', neighborhood: 'Павлово',
    address: 'София, Павлово, ул. Пелистер 18', locationKind: 'premises', coordinates: null, website: 'https://iq-detailing.com/', phone: '+359889404080',
    services: [service('Автодетайлинг и полиране', 'detailing'), service('PPF защитно фолио', 'detailing')],
    booking: { kind: 'phone', phone: '+359889404080' }, verification: reviewed('https://iq-detailing.com/kontakti/', 'Запиши час за своя автомобил'),
  },
  {
    id: 'sofia-nebula-detailing', name: 'Nebula Detailing Studio', category: 'detailing', cityCode: '68134', neighborhood: 'Младост 3',
    address: 'София, Младост 3, ул. Жечо Гюмюшев 239', locationKind: 'premises',
    coordinates: point(42.6391334, 23.3865838, 'https://www.nebuladetailing.bg/'), website: 'https://www.nebuladetailing.bg/', phone: '+359893314121',
    services: [service('Автодетайлинг и полиране', 'detailing'), service('Интериорен детайлинг', 'detailing')],
    booking: { kind: 'phone', phone: '+359893314121' }, verification: reviewed('https://www.nebuladetailing.bg/contact', 'Приемаме автомобили с предварително записан час'),
  },
  {
    id: 'sofia-autosteamclean-mobile', name: 'AUTOSTEAMCLEAN · мобилна автомивка', category: 'car_wash', cityCode: '68134', neighborhood: null,
    address: null, locationKind: 'service_area', coordinates: null, website: 'https://autosteamclean.com/', phone: '+359895690303',
    services: [service('Мобилна автомивка на адрес в Южна София', 'car_wash', 'home_visit')],
    booking: { kind: 'phone', phone: '+359895690303' },
    verification: reviewed('https://autosteamclean.com/въпроси-faq/', 'За мобилната услуга също е необходимо предварително да бъде уговорен адрес и час.', 'https://autosteamclean.com/'),
  },
  {
    id: 'sofia-cut-n-chill', name: 'Cut N’Chill by R. Yankoff', category: 'barber', cityCode: '68134', neighborhood: 'Разсадника',
    address: 'София, бул. Вардар, бл. 20', locationKind: 'premises',
    coordinates: point(42.6989464, 23.2868141, 'https://www.cutnchill.com/'), website: 'https://www.cutnchill.com/', phone: '+359878958723',
    services: [service('Мъжко подстригване', 'barber'), service('Оформяне на брада', 'barber'), service('Оформяне на вежди', 'beauty')],
    booking: { kind: 'form', url: 'https://www.cutnchill.com/rezervirai' }, verification: reviewed('https://www.cutnchill.com/rezervirai', 'Мъжко подстригване · Запази час', 'https://www.cutnchill.com/'),
  },
  {
    id: 'sofia-bobi-yarchev', name: 'Боби Ярчев', category: 'hair', cityCode: '68134', neighborhood: 'Борово',
    address: 'София, Борово, бул. България 60А', locationKind: 'premises',
    coordinates: point(42.6689253, 23.290778, 'https://bobiyarchev.com/'), website: 'https://bobiyarchev.com/', phone: '+359897975527',
    services: [service('Дамско подстригване', 'hair'), service('Боядисване и балеаж', 'hair'), service('Мъжко подстригване', 'hair')],
    // The official site's booking destination is inaccessible to our checker;
    // use its published appointment phone, not an unverified form redirect.
    booking: { kind: 'phone', phone: '+359897975527' }, verification: reviewed('https://bobiyarchev.com/', 'Вижте цени и запазете час при Боби Ярчев.'),
  },
  {
    id: 'sofia-el-gato', name: 'El Gato', category: 'nails', cityCode: '68134', neighborhood: 'Илинден',
    address: 'София, Илинден, бл. 114А, вход откъм ул. Тодораки Пешев', locationKind: 'premises',
    coordinates: point(42.7034, 23.28869, 'https://www.elgatobeauty.com/'), website: 'https://www.elgatobeauty.com/', phone: '+359876900718',
    services: [service('Маникюр с гел лак', 'nails'), service('Педикюр', 'nails')],
    booking: { kind: 'phone', phone: '+359876900718' }, verification: reviewed('https://www.elgatobeauty.com/', 'Запишете си час за по-сложна процедура на: 0876 900 718'),
  },
  {
    id: 'sofia-nail-cocktail-boutique', name: 'Nail Cocktail Boutique', category: 'nails', cityCode: '68134', neighborhood: null,
    address: 'София, бул. България 73, вход от ул. Св. Иван Кирков', locationKind: 'premises', coordinates: null,
    website: 'https://nailcocktailboutique.com/', phone: '+359876666419',
    services: [service('Маникюр', 'nails'), service('Педикюр', 'nails')],
    booking: { kind: 'phone', phone: '+359876666419' }, verification: reviewed('https://nailcocktailboutique.com/zapazi-chas/', 'Запази час по телефона'),
  },
  {
    id: 'sofia-elmida-beauty', name: 'Elmida Beauty', category: 'beauty', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Софроний Врачански 2, пл. Възраждане', locationKind: 'premises', coordinates: null,
    website: 'https://elmidabeauty.com/', phone: '+359897850322',
    services: [service('Лазерна епилация', 'beauty'), service('Почистване на лице', 'beauty')],
    booking: { kind: 'phone', phone: '+359897850322' }, verification: reviewed('https://elmidabeauty.com/kontakti/', 'Нашата бърза и удобна система за онлайн резервации ви позволява да запазите подходящ за вас час.'),
  },
  {
    id: 'sofia-twisted-hladilnika', name: 'Twisted Jiu Jitsu · Хладилника', category: 'fitness', cityCode: '68134', neighborhood: 'Хладилника',
    address: 'София, бул. Черни връх 47, ет. 5 (за възрастни и юноши)', locationKind: 'premises', coordinates: null,
    website: 'https://twistedjiujitsu.com/', phone: '+359898664490',
    services: [service('Бразилско джу джицу за начинаещи', 'fitness', 'group_reservation'), service('Индивидуални тренировки по джу джицу', 'fitness', 'individual_training')],
    booking: { kind: 'form', url: 'https://twistedjiujitsu.gymdesk.com/signup/v/ArkkO' },
    verification: reviewed('https://twistedjiujitsu.com/probna-sedmica/?lang=en', 'Log into your profile and book as many classes as you wish during your trial period', 'https://twistedjiujitsu.com/contact/?lang=en'),
  },
  {
    id: 'sofia-twisted-slatina', name: 'Twisted Jiu Jitsu · Слатина', category: 'fitness', cityCode: '68134', neighborhood: 'Слатина',
    address: 'София, бул. Шипченски проход 63, ет. 3', locationKind: 'premises', coordinates: null,
    website: 'https://twistedjiujitsu.com/', phone: '+359898664490',
    services: [service('Бразилско джу джицу за начинаещи', 'fitness', 'group_reservation'), service('Индивидуални тренировки по джу джицу', 'fitness', 'individual_training')],
    booking: { kind: 'form', url: 'https://twistedjiujitsu.gymdesk.com/signup/v/ArkkO' },
    verification: reviewed('https://twistedjiujitsu.com/probna-sedmica/?lang=en', 'schedules “BJJ Hladilnika” or “BJJ Slatina”', 'https://twistedjiujitsu.com/contact/?lang=en'),
  },
  {
    id: 'sofia-sofiyski-remonti', name: 'Софийски Ремонти', category: 'home_services', cityCode: '68134', neighborhood: null,
    address: null, locationKind: 'service_area', coordinates: null, website: 'https://sofiaremonti.com/', phone: '+359886746430',
    services: [service('Оглед за ремонт на апартамент', 'home_services', 'home_visit'), service('Оглед за ВиК и електроинсталации', 'home_services', 'home_visit')],
    booking: { kind: 'phone', phone: '+359886746430' },
    verification: reviewed('https://sofiaremonti.com/services/cialostni-remonti/', 'Запази час за безплатен оглед', 'https://sofiaremonti.com/contacts/'),
  },
  {
    id: 'sofia-danyelle-hair-beauty', name: 'Danyell’e Hair & Beauty', category: 'hair', cityCode: '68134', neighborhood: 'Манастирски ливади',
    address: 'София, Манастирски ливади, ул. Родопски извор 64', locationKind: 'premises',
    coordinates: point(42.663980987, 23.280163925, 'https://danyellebeauty.studio/'), website: 'https://danyellebeauty.studio/', phone: '+359890217660',
    services: [service('Дамско подстригване', 'hair'), service('Боядисване и балеаж', 'hair')],
    booking: { kind: 'phone', phone: '+359890217660' }, verification: reviewed('https://danyellebeauty.studio/', 'Запази своя час'),
  },
  ...[
    { id: 'westmall', name: 'WestMall', address: 'бул. Царица Йоанна 15', phone: '+359988319310', coordinates: point(42.710817405762185, 23.27088031093672, 'https://belamistudio.com/') },
    { id: 'park-center', name: 'Park Center', address: 'бул. Арсеналски 2', phone: '+359877711838', coordinates: point(42.67864560866395, 23.320276183951233, 'https://belamistudio.com/') },
  ].map(branch => ({
    id: `sofia-belami-${branch.id}`, name: `Belami Studio · ${branch.name}`, category: 'nails', cityCode: '68134', neighborhood: null,
    address: `София, ${branch.address}`, locationKind: 'premises', coordinates: branch.coordinates, website: 'https://belamistudio.com/', phone: branch.phone,
    services: [service('Маникюр с гел лак', 'nails'), service('Педикюр', 'nails'), service('Дамско подстригване', 'hair'), service('Оформяне на вежди', 'beauty')],
    booking: { kind: 'phone', phone: branch.phone }, verification: reviewed('https://belamistudio.com/', 'Запази час онлайн'),
  })),
  {
    id: 'sofia-salon-fiore', name: 'Салон Фиоре', category: 'nails', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Чарлз Дарвин 8', locationKind: 'premises', coordinates: null, website: 'https://salonfiore.com/', phone: '+359876837860',
    services: [service('Маникюр с гел лак', 'nails'), service('Педикюр', 'nails'), service('Ноктопластика', 'nails')],
    booking: { kind: 'phone', phone: '+359876837860' }, verification: reviewed('https://salonfiore.com/', 'Запази час за процедура'),
  },
  {
    id: 'sofia-nn-hair-design', name: 'NN Hair Design', category: 'hair', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Пъстър свят 11', locationKind: 'premises', coordinates: null, website: 'https://nnhairdesign.eu/', phone: '+359898899873',
    // One premises, not a second listing for the separately published nail specialist.
    services: [service('Дамско подстригване и боядисване', 'hair')],
    booking: { kind: 'phone', phone: '+359898899873' }, verification: reviewed('https://nnhairdesign.eu/', 'Book an Appointment'),
  },
  {
    id: 'sofia-uli-nails', name: 'Uli Nails', category: 'nails', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Гео Милев 22', locationKind: 'premises', coordinates: null, website: 'https://uli.bg/', phone: '+359876471110',
    services: [service('Маникюр и гел лак', 'nails'), service('Педикюр', 'nails'), service('Ноктопластика', 'nails')],
    booking: { kind: 'phone', phone: '+359876471110' }, verification: reviewed('https://uli.bg/', 'Запази час'),
  },
  {
    id: 'sofia-lumiere-beauty-club', name: 'Lumière Beauty Club', category: 'nails', cityCode: '68134', neighborhood: 'Надежда 2',
    address: 'София, Надежда 2, ул. Света Никола Нови 2А', locationKind: 'premises', coordinates: null, website: 'https://www.lumierebeautyclub.bg/', phone: '+359899979791',
    services: [service('Маникюр с гел лак', 'nails'), service('Педикюр', 'nails'), service('Ноктопластика', 'nails'), service('Фризьорски услуги', 'hair')],
    booking: { kind: 'phone', phone: '+359899979791' }, verification: reviewed('https://www.lumierebeautyclub.bg/', 'ЗАПАЗИ ЧАС'),
  },
  {
    id: 'sofia-alvien-nails', name: 'AlViEN Beauty Center · маникюр', category: 'nails', cityCode: '68134', neighborhood: 'Васил Левски',
    address: 'София, ул. Бесарабия 52', locationKind: 'premises', coordinates: null, website: 'https://alvienbeauty.com/', phone: '+359898502629',
    services: [service('Маникюр', 'nails'), service('Педикюр', 'nails')],
    booking: { kind: 'phone', phone: '+359898502629' }, verification: reviewed('https://alvienbeauty.com/', 'Резервация с обаждане до специалиста по нокти'),
  },
  {
    id: 'sofia-persia-beauty', name: 'Persia Beauty Sofia', category: 'hair', cityCode: '68134', neighborhood: null,
    address: 'София, бул. Княгиня Мария Луиза 131, Ramada Sofia City Center', locationKind: 'premises', coordinates: null,
    website: 'https://persiabeauty.bg/', phone: '+359876311134',
    services: [service('Фризьорски услуги', 'hair'), service('Маникюр', 'nails')],
    booking: { kind: 'phone', phone: '+359876311134' }, verification: reviewed('https://persiabeauty.bg/contact', 'Запази час'),
  },
  {
    id: 'sofia-bloom-beauty-evelyn', name: 'Bloom Beauty by Evelyn', category: 'nails', cityCode: '68134', neighborhood: null,
    address: 'София, бул. Цариградско шосе 92А, Sofia Outlet Center, ет. 1', locationKind: 'premises', coordinates: null,
    website: 'https://bloombeautybg.com/bg', phone: '+359878889802',
    services: [service('Маникюр с гел лак', 'nails')],
    booking: { kind: 'phone', phone: '+359878889802' }, verification: reviewed('https://bloombeautybg.com/bg', 'Запази час сега'),
  },
  ...beautyExpansion,
  ...autoSportHomeExpansion,
  ...servicesExpansion,
  ...beautyExpansionV2,
  ...autoSportHomeExpansionV2,
  ...servicesExpansionV2,
  ...supplementalExpansionV2,
  ...coverageExpansionV3,
  ...coverageExpansionV4,
  ...coverageExpansionV5,
  ...coverageExpansionV6,
  ...coverageExpansionV7,
  ...coverageExpansionV8,
  ...coverageExpansionV9,
  ...coverageExpansionV10,
  ...PRICING_EXPANSION_RECORDS,
  ...NEIGHBORHOOD_20261111_RECORDS,
])

const geocodes = new Map()
for (const update of [...geocodesV2, ...geocodesV3, ...geocodesV4]) {
  const entry=baseCatalogue.find(row=>row.id===update.id)
  if (!entry || entry.coordinates || geocodes.has(update.id) || update.coordinates?.method!=='verified_address_geocode') throw Error(`Invalid catalogue geocode update: ${update.id}`)
  geocodes.set(update.id,update.coordinates)
}
export const RAW_SOFIA_CATALOGUE = validateCatalogue(applyOfficialCatalogueLocations(enrichCataloguePricing(enrichCataloguePricing(
  enrichCatalogueDetailsV3(enrichCatalogueDetails(baseCatalogue.map(row=>geocodes.has(row.id)?{...row,coordinates:geocodes.get(row.id)}:row))),
  pricing20261110,
), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true })))

// All readers (search, details, directions and partner import) see the same
// address-bound point, rather than independently retaining a stale pin.
// Reuse already validated/frozen rows. Only a retired pin creates a new row;
// reparsing every service a third time would penalize cold-start loading.
export const SOFIA_CATALOGUE = Object.freeze(applyCatalogueCoordinateBindings(RAW_SOFIA_CATALOGUE)
  .map((row, index) => row === RAW_SOFIA_CATALOGUE[index] ? row : validateCatalogue([row])[0]))

export async function readSofiaCatalogue() { return SOFIA_CATALOGUE }
