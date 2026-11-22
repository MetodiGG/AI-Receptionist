const checkedOn = '2026-11-22', validUntil = '2026-11-29'
const bookingUrl = 'https://gpoint.bg/запазване-час'
// Independently read in the owner UI with Лом / Славянска51 selected, women
// and men separately. These are current strong-tag online prices, not crossed
// old fees, the empty basket's zero or the separate 100% bonus-credit campaign.
const women = [
  ['Цяло лице',30,20],['Гърди',24,15],['1/2 корем',24,10],['Ръце',28,20],['1/2 ръце',19,15],['Мишници',19,10],
  ['Пълен интим',24,15],['Цели крака',45,40],['Шия',13,5],['Врат',13,5],['Корем – лента',13,5],['Гръб',32,15],
  ['Кръст',27,10],['Седалище',24,10],['Горна устна',13,10],['Брадичка',13,5],['Бакенбарди',11,5],['Скули',11,5],
  ['Бедра',27,20],['Подбедрици',27,20],['Ареоли',13,5],['Бикини',19,15],['Уши',13,5],['Корем',32,15],
]
const men = [
  ['Гръб',54,40],['Рамене',25,10],['Мишници',22,10],['Гърди',35,15],['Корем',35,15],['Кръст',35,10],['Седалище',35,10],
  ['Ръце',41,30],['1/2 ръце',25,15],['Бедра',49,30],['Подбедрици',41,20],['Крака - бедра, подбедрици',76,60],
  ['Шия',17,5],['Врат',17,5],['Уши',15,5],['Скули',18,5],['Цяло лице',41,25],
]
const service = ([name,amount,durationMin], gender) => ({
  name: `Лазерна епилация · ${name} · ${gender}`, category: 'beauty', appointmentModel: 'appointment',
  description: 'Текуща цена с отстъпка, валидна САМО при онлайн записване, проверена на 22.11.2026. Условията се потвърждават при записване; не е зачеркнатата стара цена.',
  price: { amount, currency: 'EUR', kind: 'fixed', unit: 'процедура', sourceUrl: bookingUrl, checkedOn, validUntil },
  durationMin, durationSourceUrl: bookingUrl, durationCheckedOn: checkedOn,
})
export const LOM_GPOINT_RAW_RECORDS = [{
  id: 'lom-gpoint-slavyanska51', name: 'G Point · Лом', cityCode: '44238', neighborhood: null,
  address: 'Лом, ул. Славянска 51', locationKind: 'premises', coordinates: null,
  category: 'beauty', website: 'https://gpoint.bg/', phone: null,
  services: [...women.map(row => service(row,'жени')), ...men.map(row => service(row,'мъже'))],
  booking: { kind: 'form', url: bookingUrl },
  verification: { status: 'approved', checkedOn, validUntil,
    booking: { url: bookingUrl, excerpt: 'Запазване на час · Лом · ул. Славянска №51' }, contact: bookingUrl },
}]
export const LOM_GPOINT_PRICE_REVIEWS = LOM_GPOINT_RAW_RECORDS.map(row => ({
  id: row.id, checkedOn, website: row.website, bookingEntry: bookingUrl,
  reviewedUrls: [row.website, bookingUrl], bookingReview: 'owned_booking_reviewed',
  // Literal binding of the schema-normalized inventory after all41 menu rows
  // were independently reviewed. Never auto-refresh when source data changes.
  inventoryIdentity: '20d8c0ded62047f53307fd09eada153c226bc4897adf57d61fc1bd0a15b67a4c',
  notes: 'Root actual rendered owner booking UI6.10.111: explicitly expanded and selected Лом, Славянска51, verified selected header before reading all24women and17men rows including individual minutes. Initial hover preview showed Kozloduy and was rejected, never imported. No male intimate row shown or added. Current online strong-tag EUR fees only, no crossed-out fees, basketzero or bonuscredit deducted. All41amounts independently match actual Lom UI; no transfer of Sofia branch prices or durations. The7dayvalidUntil is an internal recheck deadline, not a promised campaign end. Address confirmed in actual owner location list; no quarter, street number inference, hours, precise point or available slot invented. No service checkbox, date, time, customer input, consent, payment or booking submitted.',
}))
