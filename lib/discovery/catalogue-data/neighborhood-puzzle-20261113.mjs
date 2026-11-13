// Eleven distinct owner-listed premises, each booking menu read separately in
// the browser on 2026-11-13. Mladost3 is held for its two different addresses.
// No promotion, chain-wide fee inference, customer data or reservation.
const checkedOn = '2026-11-13'
const root = 'https://puzzlekids.biz/'
// slug, quarter, owner page, actual address, phone, owner-linked booking ID,
// standard boy/girl starting fees, actual third service, third fee/kind.
const facts = [
  ['manastirski-livadi', 'Манастирски ливади', 'manastirski', 'ул. „Лъвски рид“ 7', '+359886556615', '527987', 11, 11, 'Мъжко подстригване', 11, 'from'],
  ['borovo', 'Борово', 'borovo', 'ул. „Пирински проход“ 47А', '+359878888181', '124541', 12, 11, 'Дамско подстригване', 11, 'from'],
  ['lozenets', 'Лозенец', 'lozenetz', 'ул. „Цветна градина“ 38', '+359893446636', '124535', 11, 11, 'Мъжко подстригване', 11, 'from'],
  ['mladost4', 'Младост 4', 'mladost4', 'ул. „Професор Александър Танев“, бл. 488', '+359884789558', '770991', 11, 11, 'Мъжко подстригване', 11, 'from'],
  ['geo-milev', 'Гео Милев', 'geomilev', 'ул. „Хемус“ 56', '+359888942522', '128947', 11, 10, 'Дамско подстригване', 10, 'from'],
  ['lyulin', 'Люлин', 'lulin', 'ул. „Ген. Никола Генев“ 103', '+359886556689', '128950', 10, 12, 'Дамско подстригване', 16, 'fixed'],
  ['nadezhda', 'Надежда', 'blagoevgrad', 'ул. „Жорж Дантон“ 35', '+359886556671', '334610', 10, 10, 'Дамско подстригване', 11, 'from'],
  ['ovcha-kupel', 'Овча купел', 'ovchakupel', 'ул. „Боряна“ 43', '+359886556601', '527986', 11, 11, 'Мъжко подстригване', 11, 'from'],
  ['hadzhi-dimitar', 'Хаджи Димитър', 'hadjidimitar', 'ул. „Черковна“ 7, комплекс Черковна резидънс', '+359888398802', '732779', 11, 11, 'Дамско подстригване', 11, 'from'],
  ['razsadnika', 'Разсадника', 'razsadnika', 'бул. „Александър Стамболийски“ 249А', '+359885295580', '2739607', 11, 11, 'Дамско подстригване', 12, 'from'],
  ['druzhba2', 'Дружба 2', 'drujba', 'бул. „Проф. Цветан Лазаров“ 602Б, сграда Давид и Авигея', '+359885295847', '2739612', 11, 11, 'Дамско подстригване', 11, 'from'],
]
const records = facts.map(([slug, neighborhood, page, address, phone, bookingId, boy, girl, adultName, adultFee, adultKind]) => {
  const website = `${root}${page}/`
  const newer = ['2739607', '2739612'].includes(bookingId)
  const bookingUrl = `${newer ? 'https://www.fresha.com/bg' : 'https://bg.fresha.com'}/book-now/puzzle-children-s-hair-care-studio-gmlukots/all-offer?id=${bookingId}&pId=115852${newer ? '&share=true' : ''}`
  const service = (name, amount, kind, child = false) => ({
    name, category: 'hair', appointmentModel: 'appointment',
    ...(child ? { description: 'Стандартна начална цена без временната онлайн отстъпка. Крайният вариант и сумата се уточняват при записване.' } : {}),
    price: { amount, currency: 'EUR', kind, sourceUrl: bookingUrl, checkedOn },
    durationMin: 30, durationSourceUrl: bookingUrl, durationCheckedOn: checkedOn,
  })
  return { id: `sofia-puzzle-kids-${slug}`, name: `ПЪЗЕЛ · ${neighborhood}`, cityCode: '68134', neighborhood,
    address: `София, ${address}`, locationKind: 'premises', coordinates: null,
    category: 'hair', website, phone,
    services: [service('Подстригване момче', boy, 'from', true), service('Подстригване момиче', girl, 'from', true), service(adultName, adultFee, adultKind)],
    openingHours: { sourceUrl: website, checkedOn, days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '20:00' }] })) },
    booking: { kind: 'form', url: bookingUrl },
    verification: { status: 'approved', checkedOn, validUntil: '2027-02-11',
      booking: { url: website, excerpt: 'Официалната страница на този филиал предлага онлайн записване чрез неговото собствено меню във Fresha.' }, contact: website },
  }
})
const reviews = records.map(row => ({
  id: row.id, checkedOn, website: row.website, bookingEntry: row.booking.url,
  bookingReview: 'provider_booking_reviewed', reviewedUrls: [row.website, root, row.booking.url],
  notes: `Read this exact owner-listed branch, then its actual browser-rendered Fresha menu separately. Address, names, literal standard EUR fees and30min durations are specific to this venue, not copied from another branch. Child prices are explicitly standard starting fees before the displayed temporary up-to10% online discount; discounted9/9.90/10.80 amounts were not imported. Preserved starting vs fixed adult fee, and the actual adult gender/service (not a generic male substitute). Read shared own price-gallery route, but its multiple undated images were not chosen over the live venue menu. Owner weekday/weekend hours10–20 retained; no invented slots/GPS. Hadzhi Dimitar exact street7 and Druzhba602B are confirmed by the merchant's own linked booking profile against the owner venue/phone. No service selected, cart submitted, personal data entered, appointment, account, photo/review copied or paid request.`,
}))
export default { records, reviews }
