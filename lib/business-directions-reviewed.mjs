// Manually rechecked owner destinations for landmark-only Sofia addresses.
// Source/binding notes: docs/catalogue-pricing/location-navigation-20261111.md.
// Exact address binding retires an override automatically when a venue moves.
// Never accept a destination URL or coordinate override supplied by the caller.
import { OFFICIAL_SOFIA_SOURCE_URL } from './discovery/official-sofia-address-source.mjs'

export const REVIEWED_BUSINESS_DESTINATIONS = Object.freeze([
  { id: 'sofia-niko-09', address: 'София, кв. Дружба, бул. Проф. Цветан Лазаров и бул. Христофор Колумб', placeId: 'ChIJGwPLXNWHqkARYOWWbYnFqMs', sourceUrl: 'https://niko09.bg/' },
  { id: 'sofia-tennis-lyulin-6', address: 'София, местност Друмо 1', latitude: 42.707625017444485, longitude: 23.256896419547754, sourceUrl: 'https://tennislulin.com/contact/' },
  { id: 'sofia-game-castle-simeonovo', address: 'София, Симеоново, бул. Симеоновско шосе при ул. Буйновско ждрело, спирка Шумако', latitude: 42.601408, longitude: 23.350354, sourceUrl: 'https://gamecastlebg.com/bg/contact' },
  { id: 'sofia-autotest-gtp-4-kilometar', address: 'София, бул. Цариградско шосе, 4-ти километър, Винарово колело под моста', latitude: 42.668101430658695, longitude: 23.36885723387535, sourceUrl: 'https://gtp.bg/punktove/' },
  { id: 'sofia-goplus-lyulin', address: 'София, ж.к. Люлин 6, бул. Д-р Петър Дертлиев, срещу бл. 639', latitude: 42.70871998415663, longitude: 23.247137299859354, sourceUrl: 'https://goplus.bg/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/' },
  { id: 'sofia-gpoint-sveta-troitsa', address: 'София, Света Троица, пл. Преображение', mapsUrl: 'https://maps.app.goo.gl/8xCUuZiAiHwZmttk7', sourceUrl: 'https://gpoint.bg/' },
  { id: 'sofia-gpoint-ovcha-kupel-mizia', address: 'София, Овча купел 1, ул. 761-ва, срещу паркинга на метростанция Мизия', mapsUrl: 'https://g.page/r/CQRnNUYohaUIEBM', sourceUrl: 'https://gpoint.bg/' },
  { id: 'sofia-sugarnails-ovcha-kupel', address: 'София, кв. Овча купел, ул. Архитект Франк Лойд Райт', mapsUrl: 'https://maps.app.goo.gl/FXwHkAvPxFFVEj7d6', sourceUrl: 'https://sugarnails.beauty/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/' },
  { id: 'sofia-vet-vyara-nadezhda-lyubov', address: 'София, Люлин 5, ул. 502 срещу бл. 521', mapsUrl: 'https://maps.app.goo.gl/Vx7eMd9EB6i932yx5', sourceUrl: 'https://vnl-vet.com/' },
  { id: 'sofia-katerene-europe-private', address: 'София, Дружба 1, бул. Искърско шосе 7, Търговски център Европа, сграда 1', latitude: 42.6716059, longitude: 23.3958986, sourceUrl: 'https://www.katerene.bg/courses/private/individualni-zanimaniia-po-katerene-v-zala' },
  { id: 'sofia-in-beauty', address: 'София, ул. Генерал Иван Колев 2', latitude: 42.65564914279809, longitude: 23.31449726584672, sourceUrl: OFFICIAL_SOFIA_SOURCE_URL },
  { id: 'sofia-san-krasi-barber', address: 'София, бул. Панчо Владигеров 28', latitude: 42.713467459219046, longitude: 23.248270417064983, sourceUrl: OFFICIAL_SOFIA_SOURCE_URL },
  { id: 'sofia-carbox-studio', address: 'София, бул. Симеоновско шосе 104', latitude: 42.64307038723681, longitude: 23.334093899551668, sourceUrl: OFFICIAL_SOFIA_SOURCE_URL },
  { id: 'sofia-xzona-sport', address: 'София, Овча купел, бул. Никола Петков 52, Trade House West, ет. 1', latitude: 42.66604118728293, longitude: 23.25923267662913, sourceUrl: OFFICIAL_SOFIA_SOURCE_URL },
  { id: 'sofia-rhythm-academy', address: 'София, кв. Драгалевци, ул. Цветарска 12', latitude: 42.635236333085444, longitude: 23.309155099779936, sourceUrl: OFFICIAL_SOFIA_SOURCE_URL },
  { id: 'sofia-classy-barbershop', address: 'София, ул. Тинтява 84', latitude: 42.66735233180537, longitude: 23.351948971144786, sourceUrl: OFFICIAL_SOFIA_SOURCE_URL },
  { id: 'sofia-inergy-borovo-reserved-kickboxing', address: 'София, Борово, ул. Солун 59б', latitude: 42.66867582328267, longitude: 23.288161657625782, sourceUrl: OFFICIAL_SOFIA_SOURCE_URL },
  { id: 'sofia-autoxpert', address: 'София, Витоша, ул. Могилата 2', latitude: 42.656535, longitude: 23.327307, sourceUrl: 'https://autoxpert.bg/' },
  { id: 'sofia-shining-polishing-auto', address: 'София, НПЗ Искър, ул. Мюнхен 14', latitude: 42.6591861, longitude: 23.4141981, sourceUrl: 'https://polishingauto.bg/kontakti/' },
].map(Object.freeze))

// Public native partners reviewed on 2026-11-13. These destinations affect
// directions only: neither the displayed address nor the stored distance pin
// is rewritten here. Kerelski's legacy 81 is an explicitly reviewed exception;
// both that exact pending-correction address and the confirmed 83 route to 83.
// A subsequent physical-address edit retires the exception automatically.
export const REVIEWED_NATIVE_BUSINESS_DESTINATIONS = Object.freeze([
  {
    id: 'f309d060-d96d-4237-8fa6-00db10b7ac3d',
    addresses: Object.freeze([
      'София, ж.к Манастирски ливади, ул. Пирин 81',
      'София, ж.к Манастирски ливади, ул. Пирин 83',
      'София, Манастирски ливади, ул. Пирин 83',
    ]),
    latitude: 42.66385031216646, longitude: 23.284281405717884,
    sourceUrl: 'https://kerelski.com/', checkedOn: '2026-11-13',
  },
  {
    id: '2ddceca9-1716-4ba2-bf63-2beaf0857afb',
    addresses: Object.freeze(['София, Дианабад, Ул.Русаля']),
    latitude: 42.665669, longitude: 23.347636,
    sourceUrl: 'https://maps.app.goo.gl/cnTwp11PF97KKJ9Q9', checkedOn: '2026-11-13',
  },
  {
    id: '6b57b901-acd8-494b-a992-2cec551b4b00',
    addresses: Object.freeze(['София, Модерно предградие, София бул Европа 130 и Анри Нестле']),
    // Published on the owner's contact page and manually opened to the named
    // matching service centre. No coordinate is copied out of the provider.
    mapsUrl: 'https://maps.app.goo.gl/uB57z7Nd9Nr5xTmw7',
    sourceUrl: 'https://autocomplexrs.com/контакти/', checkedOn: '2026-11-13',
  },
].map(Object.freeze))

export function reviewedBusinessDestination(business) {
  if (business?.source === 'gorez') {
    return REVIEWED_NATIVE_BUSINESS_DESTINATIONS.find(row => row.id === business.id && row.addresses.includes(business.address)) || null
  }
  if (business?.source && business.source !== 'catalogue') return null
  return REVIEWED_BUSINESS_DESTINATIONS.find(row => row.id === business?.id && row.address === business.address) || null
}
