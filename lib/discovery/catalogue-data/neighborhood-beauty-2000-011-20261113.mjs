// Source-reviewed research intake only. Parent owns shared imports, identities and photos.
const checkedOn = '2026-11-14'
const validUntil = '2027-02-12'
const valentin = 'https://www.valentinhairspot.bg/'
const valentinPrices = 'https://www.valentinhairspot.bg/tsenova-lista/'
const valentinContact = 'https://www.valentinhairspot.bg/kontakt/'
const vitosha = 'https://www.vitoshaparkhotel.com/en/relax-centre/'
const vitoshaBook = 'https://spa.vitoshaparkhotel.com/spa/reservations'
const fixed = (name, category, amount, sourceUrl) => ({ name, category, appointmentModel: 'appointment', price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil } })
const massage = (name, amount, durationMin) => ({ ...fixed(name, 'health', amount, vitoshaBook), durationMin, durationSourceUrl: vitoshaBook, durationCheckedOn: checkedOn, description: 'Класически SPA масаж. Заявката изисква потвърждение чрез получения имейл в рамките на 15 минути.' + (name.includes('частичен') ? ' Зоната се уточнява при записване.' : '') })
const records = [
  {
    id: 'sofia-valentin-hair-spot-san-stefano22', name: 'VALENTIN Hair Spot · San Stefano Plaza', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Сан Стефано 22, San Stefano Plaza, ет. 2', locationKind: 'premises', coordinates: null, category: 'hair', website: valentin, phone: '+359884777538',
    booking: { kind: 'phone', phone: '+359884777538' },
    services: [
      fixed('Дамско подстригване и сешоар — къса или средна коса', 'hair', 49, valentinPrices),
      fixed('Дамско подстригване и сешоар — дълга коса', 'hair', 59, valentinPrices),
      fixed('Мъжко подстригване с машинка и ножица', 'barber', 24, valentinPrices),
    ],
    openingHours: { sourceUrl: valentin, checkedOn, days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '20:00' }] })), { weekday: 6, periods: [{ open: '09:00', close: '18:00' }] }, { weekday: 7, periods: [] }] },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: valentin, excerpt: 'Собствената начална страница изрично дава Записване: +359884777538 за Valentin Hair Spot, San Stefano Plaza, Сан Стефано22, ет.2, София.' }, contact: valentinContact },
  },
  {
    id: 'sofia-vitosha-park-spa-baku5', name: 'Vitosha Park Hotel · SPA масажи', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Баку 5, Vitosha Park Hotel', locationKind: 'premises', coordinates: null, category: 'health', website: vitosha, phone: '+359886803271',
    booking: { kind: 'form', url: vitoshaBook },
    services: [
      massage('Класически цялостен масаж — 55 минути', 49, 55),
      massage('Класически цялостен масаж — 90 минути', 65, 90),
      massage('Класически частичен масаж — избрана зона', 29, 30),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: vitosha, excerpt: 'Собственият Book a massage води към branded SPA резервации с актуално меню, цени, продължителности и форма за заявка. Контакт: wellness, 0886803271; Баку5, София.' }, contact: vitosha },
  },
]
const reviews = [
  {
    id: 'sofia-valentin-hair-spot-san-stefano22', website: valentin, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: ['https://valentinhairspot.bg/robots.txt', 'https://valentinhairspot.bg/', `${valentin}robots.txt`, valentin, valentinPrices, valentinContact],
    notes: 'Actual owner root first read on normal observed301canonicalwww, explicit Записване884777538 supplies independent voicebooking path. Whole current native price page then read: women cut+blow short/mid49EUR,long59EUR, men clip+scissors24EUR. No durations or wash/treatment inclusion invented. Native Contact exact same name/phone/premise, root explicitlyfloor2 and fullweek09–20MonFri/09–18Sat/Sunclosed. Website has default placeholder email, not used as contact; selected factual phone and specific current tariff independently visible, no claim that placeholder is valid. Actual navigation/contact/footer expose no Terms/Privacy links, whole native cookie overview read; generic copyright not permission. RobotsDisallow/servers/frontend and10secondcrawl delay respected, no server endpoints, bundles, booking provider or maps requested. Runtime+every2000 intake domain/name/phone no duplicate; sameSanStefano22building YogaVibe is a different branded activity/operator/phone, not this salon. No source media/reviews/ratings, credentials/results claims, calls, client data, appointments or identity/coordinate writes.',
  },
  {
    id: 'sofia-vitosha-park-spa-baku5', website: vitosha, checkedOn, bookingEntry: vitoshaBook, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: ['https://www.vitoshaparkhotel.com/robots.txt', vitosha, 'https://www.vitoshaparkhotel.com/en/booking-conditions/', 'https://www.vitoshaparkhotel.com/en/cookie-policy/', 'https://spa.vitoshaparkhotel.com/robots.txt', 'https://spa.vitoshaparkhotel.com', vitoshaBook],
    notes: 'Owner actual Book a massage first followed after main and exactSPAhostrobots plus owner-linked Terms/Cookies review; normal302observedroot→/spa/reservations. Current native publicHTML initial menu actually shows19named procedures, literalfees/durations, actual unselectedprocedure/staff/day controls and customer requestfields. No JS/API/bundle/UI bypass, service/date/staff selection, client/consent entry or submission. Imported only3ordinary classic variants, whole55min49EUR/whole90min65EUR/partial30min29EUR; partial area unspecified, not invented as back. Actual form15min email-confirmation condition retained; no free-slot/calendar-availability or successful-booking claim. Hotel primary page independently gives exactBaku5/Sofia and dedicatedwellness886803271, distinct from accommodationreception; no provider or lodgingfees copied. Full lodgingbookingTerms/Cookies read, ordinary booking/privacy clauses no express automation/extraction restriction identified, not a globallegalclearance. No SPAweeklyhours established; hotelcheck-in/frontdeskhours not used. No clinical/rehab/pain/safety/results claims, packages, saunapoolinclusions or Moarstaff/business clone imported. Runtime+all2000 intake domain/name/Baku/phone overlap0. No source art/reviews/ratings/Maps, photos, coords or inventoryIdentity.',
  },
]
export default { records, reviews }
