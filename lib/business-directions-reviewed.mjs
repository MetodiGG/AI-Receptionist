// Manually rechecked owner destinations for landmark-only Sofia addresses.
// Source/binding notes: docs/catalogue-pricing/location-navigation-20261111.md.
// Exact address binding retires an override automatically when a venue moves.
// Never accept a destination URL or coordinate override supplied by the caller.
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
].map(Object.freeze))

export function reviewedBusinessDestination(business) {
  if (business?.source && business.source !== 'catalogue') return null
  return REVIEWED_BUSINESS_DESTINATIONS.find(row => row.id === business?.id && row.address === business.address) || null
}
