// Manually reviewed beauty intake only. No shared imports, identities or photos.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const base = { cityCode: '68134', neighborhood: null, locationKind: 'premises', coordinates: null }
const service = (name, category, amount, sourceUrl, minutes, description) => ({ name, category, appointmentModel: 'appointment', price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil }, ...(minutes ? { durationMin: minutes, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn } : {}), ...(description ? { description } : {}) })
const verification = (url, excerpt, contact = url) => ({ status: 'approved', checkedOn, validUntil, booking: { url, excerpt }, contact })
const beautyBar = 'https://www.notino.bg/saloni/beauty-bar/'
const monali = 'https://www.notino.bg/saloni/monali-beauty-art-studio/'
const nova = 'https://www.notino.bg/saloni/nova-hair/'
const rs = 'https://www.notino.bg/saloni/rumi-sertova-beauty-salon/'
const luxy = 'https://www.notino.bg/saloni/luxy-beauty-center/'
const mar = 'https://www.notino.bg/saloni/mar-prive/'
const amur = 'https://www.notino.bg/saloni/hair-gallery-amur-mariyana/'
const ecru = 'https://www.notino.bg/saloni/studio-ekryu/'
const gery = 'https://www.notino.bg/saloni/gery-art/'
const adria = 'https://www.notino.bg/saloni/adria-beauty-and-wellness-boutique/'
const newMe = 'https://www.notino.bg/saloni/new-me-hair-salon/'
const dogma = 'https://www.notino.bg/saloni/dogma-grooming-studio/'
const iva = 'https://www.notino.bg/saloni/nails-art-by-iva%F0%9F%8C%B8/'
const msi = 'https://www.notino.bg/saloni/studio-m-si_1/'
const kris = 'https://www.notino.bg/saloni/kriskatris-nail-barandbeauty-zone/'
const hairport = 'https://www.notino.bg/saloni/hairport-beauty-studio/'
const expert = 'https://www.notino.bg/saloni/studio-beauty-expert-mladost/'
const nineTen = 'https://www.notino.bg/saloni/910-nails-and-barber/'
const ts = 'https://www.notino.bg/saloni/tss-atelier/'
const records = [
  {
    ...base, id: 'sofia-beauty-bar-tsarigradsko91', name: 'Beauty Bar · Цариградско шосе', address: 'София, бул. Цариградско шосе 91, бл. 113, вх. А', category: 'nails', website: beautyBar, phone: '+359878141459',
    booking: { kind: 'phone', phone: '+359878141459' },
    services: [service('Маникюр с гел лак', 'nails', 20.45, beautyBar, 75), service('Педикюр с гел лак', 'nails', 25.56, beautyBar, 75), service('Мъжко подстригване с измиване', 'barber', 12.78, beautyBar, 45)],
    verification: verification(beautyBar, 'Маникюр, педикюр и мъжко фризьорство — резервация по телефон; обадете се за час. +359878141459.'),
  },
  {
    ...base, id: 'sofia-monali-narodno-horo62', name: 'Monali Beauty Art Studio', address: 'София, ул. Народно хоро 62', category: 'nails', website: monali, phone: '+359898503848',
    booking: { kind: 'form', url: monali },
    services: [service('Маникюр с гел лак', 'nails', 26, monali, 60, 'Цената не включва сваляне на покритие от друг салон.'), service('Класически маникюр без покритие', 'nails', 18, monali, 40, 'Цената не включва сваляне на гел лак или гел.'), service('Класически дамски педикюр', 'nails', 28, monali, 60, 'Цената не включва сваляне на гел лак или гел.')],
    verification: verification(monali, 'Резервирайте · Monali Beauty Art Studio, Народно хоро62, София;+359898503848; действително меню за записване.'),
  },
  {
    ...base, id: 'sofia-nova-hair-tvardishki17', name: 'NOVA Hair', address: 'София, ул. Твърдишки проход 17', category: 'hair', website: nova, phone: '+359889982805',
    booking: { kind: 'phone', phone: '+359889982805' },
    services: [
      { ...service('Сешоар', 'hair', 12.78, nova, 60), price: { amount: 12.78, maximum: 17.90, currency: 'EUR', kind: 'range', sourceUrl: nova, checkedOn, validUntil } },
      { ...service('Дамско подстригване със сешоар', 'hair', 15.34, nova, 60), price: { amount: 15.34, maximum: 28.12, currency: 'EUR', kind: 'range', sourceUrl: nova, checkedOn, validUntil } },
      { ...service('Боядисване на корени със сешоар', 'hair', 33.23, nova, 120), price: { amount: 33.23, maximum: 43.46, currency: 'EUR', kind: 'range', sourceUrl: nova, checkedOn, validUntil } },
    ],
    verification: verification(nova, 'Дамско фризьорство — резервация по телефон; обадете се на салона за час. +359889982805.'),
  },
  {
    ...base, id: 'sofia-rs-beauty-okolchitsa31', name: 'RS Beauty Studio · Rumi Sertova', address: 'София, ул. Околчица 31', category: 'hair', website: rs, phone: '+359893259279',
    booking: { kind: 'phone', phone: '+359893259279' },
    services: [service('Дамско подстригване със сешоар', 'hair', 23.01, rs, 60), service('Мъжко подстригване', 'barber', 9.20, rs, 30), service('Маникюр с гел лак', 'nails', 20.45, rs, 60)],
    verification: verification(rs, 'Фризьорство, маникюр и педикюр — резервация по телефон; обадете се на салона за час. +359893259279.'),
  },
  {
    ...base, id: 'sofia-luxy-knyaz-boris97', name: 'Luxy Beauty Center', address: 'София, ул. Княз Борис I 97, в търговския център', category: 'beauty', website: luxy, phone: '+359894444091',
    booking: { kind: 'phone', phone: '+359894444091' },
    services: [service('Оформяне на вежди', 'beauty', 11, luxy, 30), service('Дневен грим', 'beauty', 47, luxy, 60), service('Вечерен грим', 'beauty', 47, luxy, 60)],
    verification: verification(luxy, 'Оформяне на вежди и грим — резервация по телефон; онлайн записването за тези услуги не е възможно. +359894444091.'),
  },
  {
    ...base, id: 'sofia-mar-prive-marinela', name: 'MAR PRIVÉ', address: 'София, бул. Джеймс Баучер 100, хотел Маринела, ниво B', category: 'barber', website: mar, phone: '+359888828838',
    booking: { kind: 'phone', phone: '+359888828838' },
    services: [service('Мъжко подстригване', 'barber', 50, mar, 40), service('Оформяне на брада', 'barber', 30, mar, 30), service('Мъжко подстригване и оформяне на брада', 'barber', 75, mar, 50, 'Включва измиване и финален стайлинг.')],
    verification: verification(mar, 'Barber shop — резервация по телефон; онлайн записването за тези услуги не е възможно. +359888828838.'),
  },
  {
    ...base, id: 'sofia-hair-gallery-amur-exarh60', name: 'Hair Gallery Amur', address: 'София, ул. Екзарх Йосиф 60', category: 'hair', website: amur, phone: '+359877113715',
    booking: { kind: 'phone', phone: '+359877113715' },
    services: [
      { ...service('Дамско подстригване с измиване и сешоар — Марияна', 'hair', 51.13, amur, 90, 'Тарифа на Марияна; не обща цена за всички специалисти.'), price: { amount: 51.13, maximum: 66.47, currency: 'EUR', kind: 'range', sourceUrl: amur, checkedOn, validUntil } },
      service('Матиране с измиване и сешоар — Марияна', 'hair', 46.02, amur, 75, 'Тарифа на Марияна.'),
      service('Мъжко подстригване с измиване и стайлинг — Марияна', 'barber', 25.56, amur, 60, 'Тарифа на Марияна.'),
    ],
    verification: verification(amur, 'Дамско и мъжко фризьорство при Марияна — резервация по телефон; обадете се за час. +359877113715.'),
  },
  {
    ...base, id: 'sofia-ecru-lyulin386', name: 'Студио Екрю', neighborhood: 'Люлин 3', address: 'София, ж.к. Люлин 3, бл. 386, партер', category: 'hair', website: ecru, phone: '+359897728146',
    booking: { kind: 'phone', phone: '+359897728146' },
    services: [service('Дамско подстригване', 'hair', 11.25, ecru, 30), service('Мъжко подстригване', 'barber', 9.71, ecru, null, 'Публикувана продължителност 20–30 минути; уточнете точния вариант при записване.')],
    verification: verification(ecru, 'Дамско и мъжко фризьорство — резервация по телефон; обадете се на салона за час. +359897728146.'),
  },
  {
    ...base, id: 'sofia-gery-art-mladost307', name: 'Gery Art', neighborhood: 'Младост 3', address: 'София, ж.к. Младост 3, бл. 307', category: 'beauty', website: gery, phone: '+359895417839',
    booking: { kind: 'phone', phone: '+359895417839' },
    services: [service('Шугаринг на подмишници', 'beauty', 10.23, gery, 10), service('Кола маска на горна устна', 'beauty', 5.11, gery, 10), service('Оформяне на вежди', 'beauty', 7.67, gery, 15)],
    verification: verification(gery, 'Козметични услуги — резервация по телефон; обадете се на салона, за да запазите час. +359895417839.'),
  },
  {
    ...base, id: 'sofia-adria-nails-lyulin328', name: 'Adria Nails Queen', neighborhood: 'Люлин 8', address: 'София, ж.к. Люлин 8, ул. 328-ма 6', category: 'beauty', website: adria, phone: '+359897989370',
    booking: { kind: 'phone', phone: '+359897989370' },
    services: [service('Боядисване на мигли', 'beauty', 5.11, adria, 30), service('Боядисване на вежди', 'beauty', 5.11, adria, 30), service('Ламиниране на мигли', 'beauty', 30.68, adria, 60)],
    verification: verification(adria, 'Козметични услуги — резервация по телефон; онлайн записването за тези услуги не е възможно. +359897989370.'),
  },
  {
    ...base, id: 'sofia-new-me-yordan-yosifov7', name: 'New Me Hair Salon', neighborhood: 'Студентски град', address: 'София, ул. Йордан Йосифов 7', category: 'hair', website: newMe, phone: '+359879475385',
    booking: { kind: 'phone', phone: '+359879475385' },
    services: [
      { ...service('Дамско подстригване', 'hair', 15.34, newMe, null, 'Публикувана продължителност 30–60 минути; точният вариант се уточнява при записване.'), price: { amount: 15.34, maximum: 20.45, currency: 'EUR', kind: 'range', sourceUrl: newMe, checkedOn, validUntil } },
      service('Мъжко подстригване с машинка', 'barber', 10.23, newMe, 30), service('Оформяне на коса с маша', 'hair', 30.68, newMe, 60),
    ],
    verification: verification(newMe, 'Дамско и мъжко фризьорство — резервация по телефон; обадете се на салона за час. +359879475385.'),
  },
  {
    ...base, id: 'sofia-dogma-grooming-mladost528', name: 'DoGma Grooming Studio', neighborhood: 'Младост 1А', address: 'София, ж.к. Младост 1А, бл. 528', category: 'pets', website: dogma, phone: '+359899150744',
    booking: { kind: 'phone', phone: '+359899150744' },
    services: [
      { ...service('Цялостен груминг на куче — малка порода', 'pets', 38.35, dogma, 120), price: { amount: 38.35, maximum: 43.46, currency: 'EUR', kind: 'range', sourceUrl: dogma, checkedOn, validUntil } },
      { ...service('Цялостен груминг на куче — средна порода', 'pets', 43.46, dogma, 120), price: { amount: 43.46, maximum: 51.13, currency: 'EUR', kind: 'range', sourceUrl: dogma, checkedOn, validUntil } },
      service('Изрязване на нокти на куче — малка порода', 'pets', 5.11, dogma, 10),
    ],
    verification: verification(dogma, 'Груминг салон — отворено със записване, резервация по телефон; обадете се за час. +359899150744.'),
  },
  {
    ...base, id: 'sofia-nails-iva-petleshkov80', name: 'Nails Art by Iva', neighborhood: 'Хаджи Димитър', address: 'София, ж.к. Хаджи Димитър, ул. Васил Петлешков 80', category: 'nails', website: iva, phone: '+359876437444',
    booking: { kind: 'phone', phone: '+359876437444' },
    services: [service('Маникюр с гел лак', 'nails', 25.56, iva, 120), service('Мъжки маникюр', 'nails', 12.78, iva, 30), service('Педикюр с гел лак', 'nails', 25.56, iva, 60)],
    verification: verification(iva, 'Маникюр и педикюр — резервация по телефон; онлайн записването не е възможно. +359876437444.'),
  },
  {
    ...base, id: 'sofia-m-si-goritsa21', name: 'Студио M-SI', address: 'София, ул. Горица 21', category: 'nails', website: msi, phone: '+359879333178',
    booking: { kind: 'form', url: msi },
    services: [service('Маникюр с гел лак', 'nails', 15, msi, 90), service('Маникюр с гел лак и укрепване', 'nails', 20, msi, 120), service('Педикюр с гел лак', 'nails', 20, msi, 90)],
    verification: verification(msi, 'Резервирайте · Студио M-SI, Горица21, София;+359879333178; действителен диалог за избор на услуги.'),
  },
  {
    ...base, id: 'sofia-kriskatris-studentski60g', name: 'KrisKatris Nail Bar & Beauty Zone', neighborhood: 'Студентски град', address: 'София, ж.к. Студентски град, бл. 60Г, партер от вътрешната страна', category: 'nails', website: kris, phone: '+359884039698',
    booking: { kind: 'phone', phone: '+359884039698' },
    services: [
      { ...service('Маникюр с гел лак', 'nails', 16.36, kris, 90, 'Доплащане 8 лв. за сваляне на гел лак, поставен в друг салон.'), price: { amount: 16.36, maximum: 20.45, currency: 'EUR', kind: 'range', sourceUrl: kris, checkedOn, validUntil } },
      { ...service('Педикюр с гел лак', 'nails', 15.34, kris, 70), price: { amount: 15.34, maximum: 20.45, currency: 'EUR', kind: 'range', sourceUrl: kris, checkedOn, validUntil } },
      { ...service('Изграждане с гел и цветен гел лак', 'nails', 25.56, kris, 150), price: { amount: 25.56, maximum: 35.79, currency: 'EUR', kind: 'range', sourceUrl: kris, checkedOn, validUntil } },
    ],
    openingHours: { sourceUrl: 'https://www.kriskatris.bg/', checkedOn, days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '19:30' }] })), { weekday: 6, periods: [{ open: '10:00', close: '17:00' }] }] },
    verification: verification(kris, 'Маникюр и педикюр — резервация по телефон; онлайн записването не е възможно. +359884039698.'),
  },
  {
    ...base, id: 'sofia-hairport-ishirkov9', name: 'Hairport Beauty Studio', neighborhood: 'Студентски град', address: 'София, ул. Проф. Атанас Иширков 9', category: 'barber', website: hairport, phone: '+359884865775',
    booking: { kind: 'phone', phone: '+359884865775' },
    services: [service('Fade с измиване и стайлинг', 'barber', 20.45, hairport, 50), service('Класическо оформяне на брада', 'barber', 7.67, hairport, null, 'Публикувана продължителност 15–30 минути; точният вариант се уточнява при записване.'), service('Мъжко подстригване и стандартно оформяне на брада', 'barber', 23.01, hairport, 70)],
    verification: verification(hairport, 'Barber услуги — резервация по телефон; онлайн записването за тези конкретни услуги не е възможно. +359884865775.'),
  },
  {
    ...base, id: 'sofia-beauty-expert-mladost146', name: 'Студио Beauty Expert · Младост', neighborhood: 'Младост 1', address: 'София, ж.к. Младост 1, бл. 146, от задната страна', category: 'beauty', website: expert, phone: '+359878598170',
    booking: { kind: 'phone', phone: '+359878598170' },
    services: [service('Кола маска на горна устна', 'beauty', 5.11, expert, 15), service('Кола маска на брадичка', 'beauty', 5.11, expert, 30), service('Кола маска на гръб', 'beauty', 15.34, expert, 30)],
    verification: verification(expert, 'Козметични услуги — отворено със записване, резервация по телефон; обадете се за час. +359878598170.'),
  },
  {
    ...base, id: 'sofia-910-nails-barber-vihren45a', name: '910 nails & barber', address: 'София, ул. Вихрен 45А', category: 'barber', website: nineTen, phone: '+359877261237',
    booking: { kind: 'phone', phone: '+359877261237' },
    services: [service('Оформяне на брада с машинка', 'barber', 7.67, nineTen, 30), service('Оформяне на брада с машинка и ножица', 'barber', 10.23, nineTen, 30), service('Мъжко подстригване с ножица', 'barber', 17.90, nineTen, 60)],
    verification: verification(nineTen, 'Barber shop — резервация по телефон; онлайн записването за тези услуги не е възможно. +359877261237.'),
  },
  {
    ...base, id: 'sofia-ts-atelier-uvaliev1', name: 'TS’s Atelier', address: 'София, ул. Петър Увалиев 1', category: 'hair', website: ts, phone: '+359877304664',
    booking: { kind: 'phone', phone: '+359877304664' },
    services: [
      { ...service('Прав сешоар', 'hair', 15.34, ts, null, 'Публикувана продължителност 60–90 минути; точният вариант се уточнява при записване.'), price: { amount: 15.34, maximum: 25.56, currency: 'EUR', kind: 'range', sourceUrl: ts, checkedOn, validUntil } },
      { ...service('Боядисване на корени с измиване и сешоар', 'hair', 40.90, ts, 120), price: { amount: 40.90, maximum: 43.46, currency: 'EUR', kind: 'range', sourceUrl: ts, checkedOn, validUntil } },
      { ...service('Възстановяваща терапия за коса със сешоар', 'hair', 40.90, ts, 90), price: { amount: 40.90, maximum: 46.02, currency: 'EUR', kind: 'range', sourceUrl: ts, checkedOn, validUntil } },
    ],
    verification: verification(ts, 'Дамско фризьорство — резервация по телефон; онлайн записването за тези услуги не е възможно. +359877304664.'),
  },
]
const reviews = [
  {
    id: records[0].id, website: beautyBar, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [beautyBar],
    notes: 'Actual named merchant nail and menhair categories explicitly phone-only appointment booking; then full relevant menus/About/contact/footer reviewed. Gelmanicure20.45EUR75min,pedicuregel25.56EUR75min,men haircut+wash12.78EUR45min only. Women hairlength ranges and variable durations not flattened. Exact Tsarigradsko91/block113/entranceA and0878141459 confirmed by merchant contact, not Maps. No independent own domain found. No full weeklyhours rendered; transient opening status and provider retail-support09-17 are not salon hours. PDF control exposes no URL, no claim of complete PDF review or unpublished tariff. Opened source cached two months, within90day review window, no live slot promise. Exact merchantpath/phone/premises checked against1238base+all available2000intakes/nativepublicphones; no duplicate. No expressive prose, reviews, ratings, photos, coordinates, calls or booking.',
  },
  {
    id: records[1].id, website: monali, checkedOn, bookingEntry: monali, bookingReview: 'provider_booking_reviewed', reviewedUrls: [monali],
    notes: 'Followed actual named merchant Reserve entry; root independently read fresh public merchant menu then real Reserve dialog complete service list. Gel26EUR60min excludes other-salonremoval; classicuncoated18EUR40min andwomenclassicpedicure28EUR60min exclude oldgel/gelremoval, preserved publicly. Exact NarodnoHoro62/Sofia and0898503848 freshly corroborated. Ordinary nailservices only, no therapeutic feet/clinical claims, medical procedures, add-ons or staff clones. No independent owner domain or complete weeklyhours found. No provider retail support or transient status inference. Dedupe1238+all2000intakes/nativepubliccontacts. No service/date/customer chosen, booking submitted or reviews/photos/prose copied; root observed current actual dialog, not a homepage-only completion.',
  },
  {
    id: records[2].id, website: nova, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [nova],
    notes: 'Webreader opened nine-month stale cache; did not approve it. Root independently rendered fresh current actual womenhair merchant menu and explicit phone-only appointment notice. Fresh literal price ranges12.78-17.90EUR60min blowdry,15.34-28.12EUR60min haircut+blow,33.23-43.46EUR120min roots includingblow, not fixed low endpoints or converted oldfees. Exact TvardishkiProhod17/Sofia and0889982805 confirmed fresh. Then branch services/contact/footer checked; no independent domain or complete weeklyhours found. No generic retail-supporthours, live availability, borrowed KPMG address variations, medical claims or staff clones. Dedupe1238+allavailable2000intakes/nativepublicphones. No call, form, service/date/customer selection, reservation, reviews, photos, maps or marketing prose retained.',
  },
  {
    id: records[3].id, website: rs, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [rs],
    notes: 'Read actual merchant explicit phone-only booking for womenhair/menhair/nails first, then full relevant menus, About, exact Okolchitsa31/Sofia contact and footer. Ordinary women haircut+blow23.01EUR60min,men haircut9.20EUR30min,gelmanicure20.45EUR60min literal. Variable length blow/balayage durations not flattened; extensions per-row not imported as fullprocedure. Merchant uses RSBeautyStudio andRumiSertovaBeautySalon for the same venue; one record only. Both published contacts belong to same merchant, primary0893259279 retained, secondary0897807554 checked for duplicates but not cloned. No independent own domain or complete weeklyhours found, no retail09-17/support inference. PDF control lacks public URL, selected explicit menu prices not a complete PDF claim. Dedupe1238+all2000intakes/nativephones. No merchant prose, reviews, photos, coordinates, call or booking.',
  },
  {
    id: records[4].id, website: luxy, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [luxy],
    notes: 'Actual merchant phone-only subsection contains browclean11EUR30min andday/eveningmakeup47EUR60min, followed by full selected service menu, About/contact/footer. These are imported only; active online nail/lamination menus not marked reviewed or borrowed, conflicting naildescriptionamounts excluded. Exact KnyazBorisI97/Sofia/shoppingcentre and0894444091 confirmed. One salon/team, no specialist clones. No independent own domain or complete weeklyhours found. No transient opening snippet or provider retail09-17 schedule used. Source current3weekcache, no slot availability claim. Dedupe1238+all2000intakes/nativepublicphones no match. No medical claims, expressive prose, ratings, reviews, photos, Maps, coordinates, call or booking.',
  },
  {
    id: records[5].id, website: mar, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [mar],
    notes: 'Actual named merchant BarberShop section explicitly phone-only appointment booking, then full selected barber menu/About/exactcontact/footer reviewed. Literal haircut50EUR40min,beard30EUR30min,combo75EUR50min withwash+finish retained. Undefined VIP150EUR andunrelatedbeauty/PMU not selected. Exact JamesBoucher100/HotelMarinela/levelB and0888828838 confirmed; do not treat hotel itself or each barber as another listing. No independent own domain or full weeklyhours found, no retail09-17/transient status inference. Dedupe1238+allavailable2000intakes/nativephones, no match. No media/promo/efficacy claims, merchant prose, reviews, ratings, photos, Maps, coordinates, call or booking.',
  },
  {
    id: records[6].id, website: amur, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [amur],
    notes: 'Actual Mariyana named merchant women/menhair phone-only invitation followed by relevant full menu/About/contact/footer review. About explicitly identifies MariyanaKadieva as owner ofHairGalleryAmur andfounderMKBeautyAcademy: one salon, not multiple staff/academy businesses. Only her exact staffqualified haircut+wash+blow51.13-66.47EUR90min,toner+wash+blow46.02EUR75min,men25.56EUR60min retained. Denis/Pola/Erika separate staff pages not imported or cloned. Exact ExarhYosif60/Sofia and0877113715; unrelated existing psychologist samehouse is different operator/phone/domain. No independent own salon domain or weeklyhours found. No provider retail/transient-hour inference, marketing prose, medical claims, reviews, photos, coordinates, call or booking. Dedupe1238+all2000intakes/nativephones.',
  },
  {
    id: records[7].id, website: ecru, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [ecru, 'https://galinca.com/', 'https://galinca.com/za-nas/frizyorsko-studio-ekryu/', 'https://galinca.com/kontakti/'],
    notes: 'Read actual merchant women/menhair phone-only booking, full selected hair menu/About/contact/footer. Women11.25EUR30min,men9.71EUR published20-30min not flattened. Own corporate Galinca homepage/branch/contact then read liveHTTP200 after webreader timeouts: explicitly secondrealvenueEcru,exactLyulin3 block386; corporate contact0897728146 matches merchantbookingphone. Branchgeneral0899020654 is additionalownercontact, not another salon. Ownpage has actualservices but no separate active booking/tariff; merchant is chosen explicit appointment route, not retail cart. Do not borrow descriptionswashinclusions absent selected merchantcut. No complete weeklyhours, no retail-footer inference. Dedupe1238+all2000intakes/nativephones; no match. No reviews, photos, marketingprose, Maps, coordinates, calls or reservation.',
  },
  {
    id: records[8].id, website: gery, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [gery],
    notes: 'Actual merchant cosmetic category explicitly phone-only appointments, then relevant full menu/About/contact/footer. Exact Mladost3 block307/Sofia and0895417839. Ordinary sugarunderarms10.23EUR10min,upperlipwax5.11EUR10min,browshape7.67EUR15min only; no electricity/medical/pregnancy or hairvariant services imported. Own salon identifies multiplebeautyservices, not separate employee businesses. No independent domain or complete weeklyhours found; transient openingstatus and provider retail09-17 not copied. Current lastweek public menu, no live slots claim. Dedupe1238+all2000intakes/nativepublicphones. Minimal factual labels only, no expressive prose, clinical claims, reviews, ratings, photos, Maps, coordinates, calls or booking.',
  },
  {
    id: records[9].id, website: adria, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [adria],
    notes: 'Actual named merchant cosmetic subsection explicitly phone-only appointment booking; read full relevant brow/lash menu, About/contact/footer. Eyelashdye5.11EUR30min,browdye5.11EUR30min,lashlamination30.68EUR60min. Active online nailservices are not imported or claimed bookingreviewed; undefined phoneonly children/gel services not given invented fees. Exact Lyulin8 street328th6/Sofia and0897989370 verified. One multi-staff salon; no ear-piercing/PMU/medicalclaims imported. No independent own domain or complete weeklyhours, provider retail09-17/transient status not businessschedule. Dedupe1238+all2000intakes/nativephones no match. No marketing prose, reviews, photos, Maps, coordinates, calls or booking.',
  },
  {
    id: records[10].id, website: newMe, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [newMe],
    notes: 'Actual named merchant women/menhair phone-only appointment notices, then full relevant menu/About/exactcontact/footer reviewed. Womenhaircut15.34-20.45EURrange30-60min retained publicly withoutinventedscalartime; menclipper10.23EUR30min,curlingironstyle30.68EUR60min literal. Extensions per-row, variablecolor andtechnicalservices not flattened. Exact YordanYosifov7/Sofia and0879475385; quarterStudentskiGrad explicitly About, not inferred. No independent domain or complete weeklyhours found. Provider retail-support closurebanner/09-17 hours not salonfacts. Dedupe1238+all2000intakes/nativephones no match. No medical claims, expressiveprose, reviews, ratings, photos, Maps, coordinates, call or booking.',
  },
  {
    id: records[11].id, website: dogma, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [dogma],
    notes: 'Actual named merchant grooming category explicitly phone-only appointment booking and openbyappointment. Read full size-qualified menu/About/contact/footer: smallbreedfullgroom38.35-43.46EUR120min,mediumbreed43.46-51.13EUR120min,smallbreedclaw5.11EUR10min. No inventedkg/breedrestriction orcat services. Largebreed120-180min not flattened. Exact Mladost1A block528/Sofia and0899150744. No independent ownerdomain found. Business shows byappointment but no weeklyday/time schedule, no retail09-17/transientstatus inference. Additional pricelist image control not inspected/copied; selected visible menu prices explicit, no complete image/PDF or unpublishedtariff claim. Dedupe1238+all2000intakes/nativephones no match. No sedation/safety claims, reviews, ratings, photos, Maps, coordinates or booking actions.',
  },
  {
    id: records[12].id, website: iva, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [iva],
    notes: 'Actual merchant nail category explicitly phone-only appointments, then full relevant menu/About/contact/footer. Literal gelmanicure25.56EUR120min,men12.78EUR30min,pedicuregel25.56EUR60min. French/ombre rows0.51-5.11EUR10-20min look like decorationaddons, not falsely imported asfullmanicure. Exact HadzhiDimitar/VasilPetleshkov80/Sofia and0876437444. About explicitly says Iva founded the branded salon, not simply staffcalendaratknownbusiness. No independent domain or complete weeklyhours found; provider retail09-17/transientstatus excluded. Dedupe1238+all2000intakes/nativephones no match. No efficacyclaims, expressiveprose, reviews, photos, Maps, coordinates, call or booking.',
  },
  {
    id: records[13].id, website: msi, checkedOn, bookingEntry: msi, bookingReview: 'provider_booking_reviewed', reviewedUrls: [msi],
    notes: 'Actual named merchant Reserve button followed first; root independently rendered full fresh Services dialog afterinitialloading, confirmed gel15EUR90min,gel+strength20EUR120min,pedicuregel20EUR90min. Public selected tariff agrees. Then ownermerchant full relevant menu/About/contact/footer reviewed; exact Goritsa21/Sofia and0879333178. One salon namedM-SI, no extra staffbusiness. No independent domain or complete weeklyhours found; temporaryopening/retailsupport09-17 not salonhours. Haircolor25-105EUR andotherunreviewedservices not imported. No service,time,date,customer selected, no booking submitted. Dedupe1238+all2000intakes/nativephones. No marketingprose, ratings,reviews,photos, Maps orcoordinates retained.',
  },
  {
    id: records[14].id, website: kris, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [kris, 'https://www.kriskatris.bg/', 'https://www.kriskatris.bg/manicure-pedicure', 'https://www.kriskatris.bg/cosmetic-procedures'],
    notes: 'Actual merchant nailcategory phone-only appointment path first, then full relevant menu/About/contact/footer; ownindependent domain discovered and fullroot/nail/cosmeticpages read. Exact StudentskiGrad block60G groundfloorinside and0884039698 match bothsources, secondary0884074955 samevenue not clone. Literal gel16.36-20.45EUR90min plus8BGNother-salonremoval,gelpedicure15.34-20.45EUR70min,gelbuild+color25.56-35.79EUR150min; all ranges preserved. Promo28.12combo excluded. Own site no monetary nailtariff/BookCTA, merchant chosen explicit appointment route, not a no-publicprice claim. Own MonFri10-19:30/Sat10-17 schedule; Sunday unspecified left absent. Medical/rehabilitation/laser/academy rows not imported. Dedupe1238+all2000intakes/nativephones. No marketingprose, reviews,photos,Maps,coordinates,call orbooking.',
  },
  {
    id: records[15].id, website: hairport, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [hairport],
    notes: 'Actual merchant menhair subgroup afteractiveonlinecolourmenu explicitly phone-only: Fade20.45EUR50min withwash+style,beard7.67EURpublished15-30min no scalar invented,combo23.01EUR70min. These exact phone-only barber rows only, not active mainhair service17.90EUR40min orotherunreviewed calendars. Then relevant full menu/About/contact/footer; exact AtanasIshirkov9/Sofia and0884865775, StudentskiGrad explicitAbout. No independent own domain orcompleteweeklyhours found; transient-open/provider retail09-17 excluded. Dedupe1238+all2000intakes/nativephones no match. No medicalclaims, expressiveprose, reviews, photos, Maps,coordinates, call orbooking.',
  },
  {
    id: records[16].id, website: expert, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [expert],
    notes: 'Actual named merchant cosmetics phone-only appointment path andopenbyappointment notice; complete relevant wax menu/About/contact/footer reviewed. Only ordinary upperlip5.11EUR15min,chin5.11EUR30min,back15.34EUR30min wax imported. Mesotherapy/physiotherapy/equipment/clinicalclaims and variabletimebrows excluded; no clinical qualifications assumed from beauty salon. Exact Mladost1 block146/backside/Sofia and0878598170. No independent own domain orweeklydays/times found; byappointment not convertedto schedule, no retail09-17/transientstatus inference. PDFcontrol has no readableURL, no completePDF orunpublishedtariff claim. Dedupe1238+all2000intakes/nativephones no match. No prose,reviews,photos,Maps,coordinates,call orbooking.',
  },
  {
    id: records[17].id, website: nineTen, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [nineTen],
    notes: 'Actual merchant BarberShop subsection explicitly phone-only, then selected full barber menu/About/contact/footer reviewed. Initial older two-month page compared with fresh public web render crawled today: selected beardclipper7.67EUR30min,beardclipper+scissors10.23EUR30min,scissorhaircut17.90EUR60min agree; online nailprices changed and are not imported or marked bookingreviewed. Fade45-60min not flattened. Exact Vihren45A/Sofia and0877261237 corroborated fresh. Ordinary barber rows only, no medical/laser/skin claims imported. No independent own domain or full weeklyhours found; transient opening and provider retail09-17 not salon schedule. All current catalogue/intakes/native contacts checked, no duplicate. No expressive prose, reviews, ratings, photos, Maps, coordinates, call, customer/date choice or booking.',
  },
  {
    id: records[18].id, website: ts, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [ts],
    notes: 'Actual named merchant womenhair subsection explicitly phone-only appointment invitation; complete relevant menu/About/exactcontact/footer reviewed in lastweek public render. Straightblow15.34-25.56EUR with published60-90min not flattened; rootsincludingwash+blow40.90-43.46EUR120min andhairtherapy+blow40.90-46.02EUR90min literal ranges. Active online nails are not imported or marked reviewed. Exact PetarUvaliev1/Sofia and0877304664; secondary0878280003 checked as same venue, no staffclone. Existing GPoint laser samehouse has different ownerbrand/domain/scope, no phone link or evidence it operates TS hair/nails; independent named storefront, not new GPoint department. No independent own domain or full weeklyhours found, Mondaybyrequest snippet not fullschedule. All current catalogue/intakes/native contacts checked. No efficacy claims, merchant prose, ratings, reviews, photos, Maps, coordinates, call or booking.',
  },
]
export default { records, reviews }
