const id = 'sofia-garage46-serdika-ivanivanov67'
const cityCode = '68134', neighborhood = 'Сердика', category = 'auto_repair'
const address = 'София, ж.к. Сердика, бул. Инж. Иван Иванов 67'
const website = 'https://garage46.bg/pages/garage46-montaj-na-led-krushki-v-grad-sofia-serdika'
// The form is at #zapazi-chas and this branch's tariff at #uslugi. Persisted
// public and booking source URLs deliberately do not include fragments.
const phone = '+359887737477'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'
const from = amount => ({ amount, currency: 'EUR', kind: 'from', sourceUrl: website, checkedOn })

export const GARAGE46_SERDIKA_20261127_RECORDS = [{
  id, name: 'Garage46 · Сердика', cityCode, neighborhood, address, category, website, phone,
  locationKind: 'premises',
  coordinates: {
    latitude: 42.6901267, longitude: 23.2878061, method: 'first_party_coordinates',
    source: website, sourceAddress: address,
  },
  services: [{
    name: 'Монтаж на LED крушки за фарове · автоелектроника', category, appointmentModel: 'appointment',
    description: 'Начална цена за монтаж; крушките се заплащат отделно (от 60 € за фарове). Реглажът е включен. Крайната цена зависи от модела и сложността на монтажа и се уточнява предварително.',
    price: { ...from(15), unit: 'монтаж, без крушки' },
  }, {
    name: 'Регулиране на фарове · автоелектроника', category, appointmentModel: 'appointment',
    description: 'Начална цена за самостоятелно регулиране на светлинния сноп. При монтаж на LED крушки в този център реглажът е включен и не се таксува отделно.',
    price: { ...from(15), unit: 'самостоятелен реглаж' },
  }, {
    name: 'Смяна на фарове · автоелектроника', category, appointmentModel: 'appointment',
    description: 'Начална цена за демонтаж и монтаж на фар. Крайната сума се уточнява предварително за конкретния автомобил; цена на новия фар не е посочена.',
    price: from(35),
  }],
  openingHours: {
    days: [
      ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '17:00' }] })),
      { weekday: 6, periods: [] },
      { weekday: 7, periods: [] },
    ],
    sourceUrl: website, checkedOn,
  },
  booking: { kind: 'form', url: website },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: {
      url: website,
      excerpt: 'Записването в София е задължително. Попълнете формата на тази страница; връщаме обаждане, за да потвърдим часа и цената за конкретния модел.',
    },
  },
}]

export const GARAGE46_SERDIKA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: website, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website],
  inventoryIdentity: 'ec648a2faa49ac39ef71df3b3f0a33f1944ab07b3de1ea3c2da308a8ba34da56',
  notes: 'Opened the exact Sofia Serdika branch and the owner’s Запази час section (#zapazi-chas) with a public inquiry form, Sofia branch and service selection, then the branch tariffs (#uslugi). No form was submitted, no live appointment was made, and no estimated duration is shown as a guaranteed slot. The branch’s structured data and named directions link give the same point; the nearby municipal street-number pin was not substituted for the owner-selected workshop. The installer behind the same contact is treated as one venue.',
}]
