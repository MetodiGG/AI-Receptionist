// Manually checked first-party prices/hours, 2026-11-06. These are facts about
// existing records, not new branches and not Google ratings or provider data.
const checkedOn = '2026-11-06'
const hours = (sourceUrl, days) => ({ sourceUrl, checkedOn, days })
const daily = (days, open, close) => days.map(weekday => ({ weekday, periods: [{ open, close }] }))
const price = (amount, sourceUrl) => ({ amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn })
export const CATALOGUE_DETAILS_ENRICHMENT = [
  ...['sofia-belami-westmall', 'sofia-belami-park-center'].map(id => ({ id,
    prices: { 'Дамско подстригване': price(18, 'https://belamistudio.com/'), 'Оформяне на вежди': price(9.71, 'https://belamistudio.com/') },
    openingHours: hours('https://belamistudio.com/', daily([1,2,3,4,5,6,7], '10:00', '21:10')),
  })),
  { id: 'sofia-po-noti', prices: { 'Индивидуален урок по пиано': price(28, 'https://po-noti.com/'), 'Урок по китара или барабани': price(28, 'https://po-noti.com/') },
    openingHours: hours('https://po-noti.com/', daily([1,2,3,4,5,6,7], '09:00', '21:00')) },
  { id: 'sofia-beauty-studio-99', openingHours: hours('https://beautystudio99.com/', [...daily([1,2,3,4,5], '10:00', '19:00'), { weekday: 6, periods: [], byAppointment: true }, { weekday: 7, periods: [] }]) },
  { id: 'sofia-neda-art-nails', openingHours: hours('https://neda-art-nails.setmore.com/', [...daily([1,2,3,4,5], '10:00', '20:00'), { weekday: 6, periods: [] }, ...daily([7], '10:00', '18:00')]) },
  { id: 'sofia-lux-mbal-sveta-sofia-carwash', openingHours: hours('https://www.mbal-sofia.com/services/1', daily([1,2,3,4,5], '08:00', '17:30')) },
]

export function enrichCatalogueDetails(records) {
  const enrichments = new Map(CATALOGUE_DETAILS_ENRICHMENT.map(update => [update.id, update]))
  for (const update of enrichments.values()) {
    const record = records.find(row => row.id === update.id)
    if (!record || Object.keys(update.prices || {}).some(name => !record.services.some(service => service.name === name))) throw Error(`Unknown catalogue details target: ${update.id}`)
  }
  return records.map(row => {
    const update = enrichments.get(row.id)
    return update ? { ...row, ...(update.openingHours ? { openingHours: update.openingHours } : {}), services: row.services.map(service => update.prices?.[service.name] ? { ...service, price: update.prices[service.name] } : service) } : row
  })
}
