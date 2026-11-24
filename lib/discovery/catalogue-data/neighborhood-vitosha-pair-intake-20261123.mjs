import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const cityCode = '68134'
const point = (latitude, longitude, addressId, sourceAddress, sourceNeighborhood, sourceWebsite) => ({
  latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
  sourceAddress, sourceCityCode: cityCode, sourceNeighborhood, sourceWebsite, checkedOn,
  addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
})

const kis = {
  id: 'sofia-kis-auto-simeonovo-bosilek3', neighborhood: 'Симеоново',
  address: 'София, кв. Симеоново, ул. Босилек 3',
  website: 'https://www.avtoservizkis.com/', phone: '+359878969425',
}
const kisContact = `${kis.website}contact.php`
const kisServices = `${kis.website}services.php`
const kisPrices = `${kis.website}price.php`
const autoPrice = amount => ({ amount, currency: 'EUR', kind: 'from', sourceUrl: kisPrices, checkedOn, validUntil })

const nextLevel = {
  id: 'sofia-next-level-knyazhevo-tsar-boris272', neighborhood: 'Княжево',
  address: 'София, кв. Княжево, бул. Цар Борис III 272, Retail Park Княжево, последен етаж',
  website: 'https://www.nextlevelclub.bg/klubove/knyazhevo/', phone: '+359877128005',
}
const classCalendar = 'https://knyazhevo.nextlevelclub.bg/calendar'
const clubCheckout = 'https://knyazhevo.nextlevelclub.bg/buy-membership'
const clubRules = 'https://www.nextlevelclub.bg/dostup-do-moya-profil/'
const clubTerms = 'https://www.nextlevelclub.bg/dokumenti/bg-agreements/'

export const VITOSHA_PAIR_20261123_RECORDS = [
  {
    ...kis, name: 'Автобояджийски сервиз КИС', cityCode, locationKind: 'premises', category: 'auto_repair',
    coordinates: point(42.624473, 23.332706, '8417', kis.address, kis.neighborhood, kis.website),
    services: [
      {
        name: 'Боядисване на броня', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Включва демонтаж и монтаж на бронята. За час и крайна цена се свържете със сервиза.',
        price: autoPrice(127.82),
      },
      {
        name: 'Боядисване на врата или калник', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Включва демонтаж и монтаж на съответните части като тапицерия, огледало, дръжки и лайсни.',
        price: autoPrice(112.48),
      },
      {
        name: 'Изчукване и подмяна на каросерийни детайли', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Цената зависи от степента на повредата. Уточнете необходимия ремонт и оглед със сервиза.',
        price: autoPrice(35.79),
      },
    ],
    booking: { kind: 'phone', phone: kis.phone },
    verification: { status: 'approved', checkedOn, validUntil, contact: kisContact,
      booking: { url: kisContact, excerpt: 'Собственият сайт публикува директен телефон за връзка със сервиза. Огледът се уговаря по телефон; GoRez не потвърждава час.' } },
  },
  {
    ...nextLevel, name: 'Next Level · Княжево', cityCode, locationKind: 'premises', category: 'fitness',
    coordinates: point(42.660277, 23.245037, '119913', nextLevel.address, nextLevel.neighborhood, nextLevel.website),
    services: [{
      name: 'Фитнес и групови тренировки · 7-дневна карта', category: 'fitness',
      appointmentModel: 'group_reservation',
      description: 'Пакет за 7 дни, с неограничен достъп до фитнес и до едно групово занимание дневно според клуба. Отделно резервирайте място от графика на Княжево; покупката на картата не резервира тренировка.',
      price: { amount: 29, currency: 'EUR', kind: 'fixed', unit: 'карта за 7 дни', sourceUrl: clubCheckout, checkedOn, validUntil },
    }],
    openingHours: { days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '06:30', close: '23:00' }] })),
      sourceUrl: nextLevel.website, checkedOn },
    booking: { kind: 'form', url: classCalendar },
    verification: { status: 'approved', checkedOn, validUntil, contact: nextLevel.website,
      booking: { url: classCalendar, excerpt: 'Графикът за Княжево указва отделна онлайн резервация за място в групово занимание. Закупуването на карта не запазва място.' } },
  },
]

export const VITOSHA_PAIR_20261123_REVIEWS = [
  {
    id: kis.id, checkedOn, website: kis.website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [kis.website, kisContact, kisServices, kisPrices, OFFICIAL_SOFIA_SOURCE_URL],
    notes: 'The owner contact page is linked from the workshop service and rate pages and names the exact Simeonovo premises. The site supplies an on-site inspection requirement for severely damaged paintwork and a direct phone; no live appointment calendar is claimed. These three services and EUR starting prices are distinct entries in the workshop tariff. Removal and refitting conditions and damage-dependent pricing are retained. Published weekday heading conflicts with the claim of no day off, so no opening hours are imported. No insurance relationship is implied by this listing.',
    inventoryIdentity: 'ff32b6e980f66182061128c55096b4853cde399f90df138cddba0e4b51d12c08',
  },
  {
    id: nextLevel.id, checkedOn, website: nextLevel.website, bookingEntry: classCalendar, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [nextLevel.website, classCalendar, clubRules, clubCheckout, clubTerms, OFFICIAL_SOFIA_SOURCE_URL],
    notes: 'The branch’s Programme link leads to its actual class reservation calendar. The separate Knyazhevo checkout publishes the ordinary EUR 29 seven-day Fitness+Group Activities package; it is a package total, not a class price or a free-trial offer. No available spot or duration of a group session is imported. The official postal point identifies the retail park; the owner supplies the floor, not a separately geocoded entrance.',
    inventoryIdentity: '1c2d8b4b4bb933d35ec86d72fa714466aa6393e326904307c859656718bbed7e',
  },
]
