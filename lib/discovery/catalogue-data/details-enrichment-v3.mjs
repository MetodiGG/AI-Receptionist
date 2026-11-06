// First-party contact -> services/prices/booking review, 2026-11-06.
// No Google requests, imported ratings, inferred availability or deposits
// presented as service prices. Branch restrictions and price units matter.
const checkedOn = '2026-11-06'
const priced = (name, category, amount, sourceUrl, description, kind = 'fixed', appointmentModel = 'appointment') => ({
  name, category, appointmentModel, price: { amount, currency: 'EUR', kind, sourceUrl, checkedOn }, ...(description ? { description } : {}),
})
const service = (name, category, description) => ({ name, category, appointmentModel: 'appointment', ...(description ? { description } : {}) })
const hours = (sourceUrl, weekdays, open, close) => ({ sourceUrl, checkedOn, days: weekdays.map(weekday => ({ weekday, periods: [{ open, close }] })) })
const abiPrices = 'https://abibeauty.bg/tseni/'
const abiContacts = 'https://abibeauty.bg/kontakti/'
const zonaPrices = 'https://zonawash.bg/цени/'
const motoristaPrices = 'https://www.motorista.bg/avtomivka/leki-avtomobili'
const washGoPrices = 'https://www.washandgodetail.com/services'
const bastetPrices = 'https://bastetkickboxing.com/цени/'
const marryServices = [
  service('Туистър къдрици', 'hair', 'Оформяне с туистър техника; цената се уточнява при записване.'),
  service('Анна вълни', 'hair'),
  service('Афро плитки', 'hair'),
  service('Boho Braids', 'hair'),
  service('Опашка с къдрици', 'hair'),
  service('Прави туистъри', 'hair'),
  service('Опашка с плитки', 'hair'),
  service('Оформяне на прическа', 'hair'),
]

export const CATALOGUE_DETAILS_V3 = [
  ...['serdika', 'lozenets', 'druzhba-1', 'druzhba-2', 'nadezhda', 'bul-bulgaria'].map(branch => {
    const nails = ['serdika', 'lozenets', 'druzhba-1', 'druzhba-2'].includes(branch)
    const pedicure = ['lozenets', 'druzhba-1', 'druzhba-2'].includes(branch)
    const hair = ['lozenets', 'druzhba-1'].includes(branch)
    return { id: `sofia-abi-beauty-${branch}`,
      services: [
        ...(nails ? [
          priced('Маникюр с гел лак', 'nails', 24.99, abiPrices),
        ] : []),
        ...(pedicure ? [priced('Педикюр с гел лак', 'nails', 39.99, abiPrices)] : []),
        service('Лазерно обезкосмяване', 'beauty'),
        priced('Лазерна епилация на цяло тяло · жени', 'beauty', 105, abiPrices, 'Една процедура при онлайн резервация. Включва цели крака, цели ръце, пълен интим и подмишници.'),
        priced('Лазерна епилация на цяло тяло · мъже', 'beauty', 280, abiPrices, 'Една процедура при онлайн резервация. Включените зони са посочени в ценоразписа.'),
        ...(nails ? [
          priced('Маникюр с обикновен лак', 'nails', 15.99, abiPrices),
          priced('Сваляне на гел лак', 'nails', 7.99, abiPrices),
        ] : []),
        ...(hair ? [
          priced('Дамско подстригване със сешоар', 'hair', 23.01, abiPrices, 'Публикуван диапазон 23,01–28,12 € според косата.', 'from'),
          priced('Мъжко подстригване с машинка', 'hair', 10.23, abiPrices),
          priced('Мъжко подстригване с ножица', 'hair', 12.78, abiPrices),
        ] : []),
      ],
      openingHours: hours(abiContacts, [1,2,3,4,5,6,7], '10:00', '20:00'),
    }
  }),
  { id: 'sofia-zona-wash',
    services: [
      priced('Комплексно измиване · лек автомобил', 'car_wash', 25, zonaPrices, 'Обслужване с предварително записване; не е услуга на самообслужване.'),
      priced('Комплексно измиване · джип', 'car_wash', 28, zonaPrices),
      priced('Пране на една автомобилна седалка', 'car_wash', 25, zonaPrices, 'Цената е за една седалка, не за целия салон.'),
      priced('Полимерна защита · лек автомобил', 'detailing', 40, zonaPrices),
      priced('Полимерна защита · джип', 'detailing', 45, zonaPrices),
    ],
    booking: { kind: 'form', url: 'https://book.timify.com/?accountId=65d0b03e97be140dc74e5ddd&hideCloseButton=true' },
    bookingSource: { url: 'https://zonawash.bg/контакти/', excerpt: 'Запазете час онлайн или използвайте посочените телефони.' },
  },
  { id: 'sofia-motorista-carwash',
    services: [
      priced('Комплексно почистване · лек автомобил', 'car_wash', 30, motoristaPrices, 'За поддържан седан или хечбек. При силно замърсяване цената се договаря.'),
      priced('Безконтактно външно измиване · лек автомобил', 'car_wash', 18, motoristaPrices),
      priced('Вътрешно почистване · лек автомобил', 'car_wash', 18, motoristaPrices, 'За поддържан седан или хечбек.'),
      priced('Външно измиване с гъба · лек автомобил', 'car_wash', 25, motoristaPrices),
      priced('Пране на целия салон · лек автомобил', 'car_wash', 200, motoristaPrices, 'Публикуван диапазон 200–340 € за седан или хечбек.', 'from'),
      priced('Полиране на комплект фарове', 'detailing', 50, motoristaPrices),
    ],
    openingHours: { sourceUrl: 'https://www.motorista.bg/avtomivka', checkedOn, days: [
      ...[1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '08:00', close: '19:00' }] })),
      ...[6,7].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
    ] },
  },
  { id: 'sofia-wash-go-detailing',
    services: [
      priced('Външно измиване · Exterior Basic', 'car_wash', 50, washGoPrices, 'Пакет; началната цена зависи от автомобила и състоянието му.', 'from'),
      priced('Външен детайлинг · Exterior Premium', 'detailing', 75, washGoPrices, 'Пакет; крайната цена се потвърждава след преглед на автомобила.', 'from'),
      priced('Керамично покритие', 'detailing', 260, washGoPrices, 'Начална цена според автомобила и подготовката.', 'from'),
      priced('Озониране на автомобил', 'detailing', 30, washGoPrices),
      priced('Пране на текстилен автомобилен салон', 'car_wash', 80, washGoPrices, 'Начална цена; зависи от големината и замърсяването.', 'from'),
      priced('Полиране на фарове', 'detailing', 80, washGoPrices, undefined, 'from'),
    ],
    // The site prints 00:00–00:00. It is not evidence of 24-hour opening.
  },
  { id: 'sofia-lux-mbal-sveta-sofia-carwash', services: [
    // Read the EUR price poster linked under Цени, not just the HTML text.
    priced('Комплексно почистване · лек автомобил', 'car_wash', 20, 'https://www.mbal-sofia.com/services/1'),
    priced('Външно измиване · лек автомобил', 'car_wash', 13, 'https://www.mbal-sofia.com/services/1'),
    priced('Вътрешно почистване · лек автомобил', 'car_wash', 10, 'https://www.mbal-sofia.com/services/1'),
    priced('Цялостно пране · лек автомобил', 'car_wash', 150, 'https://www.mbal-sofia.com/services/1'),
    priced('Пране на една автомобилна седалка', 'car_wash', 20, 'https://www.mbal-sofia.com/services/1', 'За една седалка, не за целия автомобил.'),
    priced('Почистване на четири джанти', 'car_wash', 15, 'https://www.mbal-sofia.com/services/1'),
    priced('Почистване и освежаване на кожен салон', 'car_wash', 70, 'https://www.mbal-sofia.com/services/1'),
    priced('Полиране на фарове', 'detailing', 35, 'https://www.mbal-sofia.com/services/1', 'Публикуван диапазон 35–40 €.', 'from'),
  ] },
  { id: 'sofia-bastet-kickboxing', services: [
    priced('Индивидуално занятие по бокс и кикбокс', 'fitness', 15.34, bastetPrices, 'При треньор Цанка Карова, след предварително записване.', 'fixed', 'individual_training'),
    priced('Месечна карта за групов бокс и кикбокс', 'fitness', 30.68, bastetPrices, 'Месечна карта, не единично посещение. Занятията са с предварително записване.', 'fixed', 'group_reservation'),
  ] },
  ...['manastirski', 'hipodruma', 'gotse-delchev', 'sveta-troitsa', 'zaharna-fabrika'].map(branch => ({ id: `sofia-tsanev-${branch}`,
    services: [priced('Резервирана пробна тренировка по карате', 'fitness', 0, 'https://tsanev.bg/', 'Само първата пробна тренировка е безплатна; запази предварително за избраната зала.', 'fixed', 'group_reservation')],
  })),
  ...['moskovska', 'kuklata'].map(branch => ({ id: `sofia-beauty-studio-marry-${branch}`, services: marryServices,
    openingHours: hours('https://beautystudiomarry.com/contact', [1,2,3,4,5,6], '10:00', '20:00'),
    // The booking page's 50 € is a deposit, not a haircut/styling price.
  })),
  { id: 'sofia-twisted-hladilnika', coordinates: { latitude: 42.6622735, longitude: 23.3180413, method: 'first_party_coordinates', source: 'https://twistedjiujitsu.com/contact/?lang=en' } },
  { id: 'sofia-twisted-slatina', coordinates: { latitude: 42.6792746, longitude: 23.3666724, method: 'first_party_coordinates', source: 'https://twistedjiujitsu.com/contact/?lang=en' } },
]

export function enrichCatalogueDetailsV3(records) {
  const updates = new Map()
  for (const update of CATALOGUE_DETAILS_V3) {
    const row = records.find(row => row.id === update.id)
    if (!row || updates.has(update.id) || (update.coordinates && row.coordinates)) throw Error(`Invalid first-party details update: ${update.id}`)
    updates.set(update.id, update)
  }
  return records.map(row => {
    const update = updates.get(row.id)
    if (!update) return row
    return { ...row,
      ...(update.services ? { services: update.services } : {}),
      ...(update.openingHours ? { openingHours: update.openingHours } : {}),
      ...(update.coordinates ? { coordinates: update.coordinates } : {}),
      ...(update.booking ? { booking: update.booking, verification: { ...row.verification, checkedOn, validUntil: '2027-02-04', booking: update.bookingSource } } : {}),
    }
  })
}
