import { OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const sarafoviSite = 'https://sarafoviauto.bg/'
const petkovId = 'sofia-serviz-petkov'
const petkovSite = 'https://serviz-petkov.com/'
const petkovPhone = '+359886816546'
const petkovPrice = petkovSite + 'prices/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export function applyVerifiedSofiaAutoFollowups20261127(rows) {
  return rows.map(row => {
    if (row.cityCode !== '68134' || row.neighborhood !== null || row.locationKind !== 'premises' ||
        row.category !== 'auto_repair' || row.verification?.status !== 'approved') return row
    if (row.id === 'sofia-sarafovi-auto' && row.address === 'София, бул. Никола Петков 73' &&
        row.website === sarafoviSite && row.booking?.kind === 'form' && row.booking.url === sarafoviSite + 'bg/book') {
      const point = row.coordinates
      if (point?.method === 'verified_official_address' && point.addressId === '10878' &&
          point.source === OFFICIAL_SOFIA_SOURCE_URL && point.sourceAddress === row.address &&
          point.sourceCityCode === row.cityCode && point.sourceNeighborhood === null &&
          point.latitude === 42.66648337501564 && point.longitude === 23.257545172396945) {
        return { ...row, neighborhood: 'Карпузица', coordinates: { ...point, sourceNeighborhood: 'Карпузица' } }
      }
    }
    if (row.id === petkovId && row.address === 'София, бул. Проф. Цветан Лазаров 162А' &&
        row.website === petkovSite && row.phone === petkovPhone && row.booking?.kind === 'phone' &&
        row.booking.phone === petkovPhone && row.coordinates === null) {
      const matching = service => service.name === 'Автомобилна диагностика' && service.category === 'auto_repair' &&
        service.appointmentModel === 'appointment' && service.price == null && service.description == null
      if (row.services.filter(matching).length !== 1) return row
      return {
        ...row,
        coordinates: { latitude: 42.6463068, longitude: 23.4141029, source: petkovSite,
          method: 'first_party_coordinates', sourceAddress: row.address },
        services: row.services.map(service => matching(service) ? {
          ...service,
          name: 'Компютърна диагностика и четене на грешки',
          description: 'Цената е само за посочения диагностичен труд и включва ДДС. Допълнителна проверка, части и ремонт се уговарят отделно след оглед.',
          price: { amount: 32, currency: 'EUR', kind: 'fixed', unit: 'труд с ДДС', sourceUrl: petkovPrice, checkedOn, validUntil },
        } : service),
      }
    }
    return row
  })
}

export const VERIFIED_SOFIA_AUTO_FOLLOWUPS_20261127_REVIEWS = [{
  id: petkovId, website: petkovSite, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [petkovSite, petkovSite + 'zapazi-chas/', petkovSite + 'terms/', petkovPrice,
    petkovSite + 'uslugi/diagnostika/kompyutarna-diagnostika/'],
  inventoryIdentity: '87143d027679f356c292bcec462d98454ad39d56ce85b312718d849550d6b97a',
  notes: 'Kept the published telephone option; no form was submitted. Only the exact EUR 32 VAT-inclusive diagnostic labour offer was reworded and priced; the other two services remain unpriced. The owner links the same full 162A branch and point from Google Maps and Waze. The civic point for plain 162 is not a substitute. No neighborhood assigned without separate evidence.',
}]
