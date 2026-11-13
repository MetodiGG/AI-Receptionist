// Manually reviewed independent premises intake. No shared imports, identities or photos.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const base = { cityCode: '68134', neighborhood: null, locationKind: 'premises', coordinates: null }
const service = (name, category, amount, sourceUrl, minutes, description) => ({ name, category, appointmentModel: 'appointment', price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil }, ...(minutes ? { durationMin: minutes, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn } : {}), ...(description ? { description } : {}) })
const verification = (url, excerpt) => ({ status: 'approved', checkedOn, validUntil, booking: { url, excerpt }, contact: url })
const paws = 'https://www.notino.bg/saloni/zoomagazinandgruming-salon-,,shastlivi-lapi_1/'
const persefona = 'https://www.notino.bg/saloni/salon-persefona/'
const madrid = 'https://www.notino.bg/saloni/beauty-center/'
const mix = 'https://www.notino.bg/saloni/studio-za-krasota-miks/'
const mc = 'https://magicvetanova.com/'
const mcBook = 'https://magicvetanova.com/reserve/'
const mcWomen = 'https://magicvetanova.com/womenshaircut/'
const mcMen = 'https://magicvetanova.com/manhaircut/'
const paola = 'https://www.notino.bg/saloni/paola-hair-studio/'
const rHair = 'https://www.notino.bg/saloni/r-hair/'
const newWave = 'https://www.notino.bg/saloni/studio-new-wave/'
const studio27 = 'https://www.notino.bg/saloni/studio-27_1/'
const over = 'https://www.notino.bg/saloni/over-and-over/'
const feeling = 'https://www.notino.bg/saloni/feeling/'
const marart = 'https://www.notino.bg/saloni/marart-studio_1/'
const silver = 'https://www.notino.bg/saloni/studio-silver-star_1/'
const records = [
  {
    ...base, id: 'sofia-shtastlivi-lapi-druzhba108', name: 'Груминг салон Щастливи лапи', neighborhood: 'Дружба 1', address: 'София, ж.к. Дружба 1, бл. 108', category: 'pets', website: paws, phone: '+359892302087',
    booking: { kind: 'phone', phone: '+359892302087' },
    services: [service('Къпане на куче до 10 кг', 'pets', 25, paws, null, 'Сплъстена козина се доплаща според състоянието и времето за обработка. Салонът не приема агресивни кучета.'), service('Къпане на куче над 10 кг', 'pets', 30, paws, null, 'Сплъстена козина се доплаща според състоянието и времето за обработка. Салонът не приема агресивни кучета.'), service('Разресване на куче', 'pets', 20, paws, null, 'Сплъстена козина се доплаща според състоянието и времето за обработка. Салонът не приема агресивни кучета.')],
    verification: verification(paws, 'Груминг салони — резервация по телефон; обадете се на салона, за да запазите час. +359892302087.'),
  },
  {
    ...base, id: 'sofia-persefona-uzunov14', name: 'Салон Персефона', address: 'София, ул. Атанас Узунов 14', category: 'beauty', website: persefona, phone: '+359877678020',
    booking: { kind: 'phone', phone: '+359877678020' },
    services: [service('Оформяне и боядисване на вежди', 'beauty', 15.34, persefona, 50), service('Ламиниране на вежди', 'beauty', 20.45, persefona, 80), service('Ламиниране и боядисване на вежди', 'beauty', 30.68, persefona, 90)],
    verification: verification(persefona, 'Козметични услуги — резервация по телефон; онлайн записването за тези услуги не е възможно. +359877678020.'),
  },
  {
    ...base, id: 'sofia-beauty-center-madrid34', name: 'Beauty Center · Мадрид', address: 'София, бул. Мадрид 34', category: 'hair', website: madrid, phone: '+359885877507',
    booking: { kind: 'phone', phone: '+359885877507' },
    services: [{ ...service('Сешоар', 'hair', 12.78, madrid, 25), price: { amount: 12.78, maximum: 15.34, currency: 'EUR', kind: 'range', sourceUrl: madrid, checkedOn, validUntil } }, service('Боядисване на корени с подсушаване със сешоар', 'hair', 20.45, madrid, 80), service('Дамско подстригване и стайлинг със сешоар', 'hair', 20.45, madrid, 40)],
    verification: verification(madrid, 'Дамско фризьорство — резервация по телефон; обадете се на салона, за да запазите час. +359885877507.'),
  },
  {
    ...base, id: 'sofia-studio-mix-oborishte46', name: 'Студио за красота Микс', address: 'София, ул. Оборище 46', category: 'beauty', website: mix, phone: '+359887803227',
    booking: { kind: 'phone', phone: '+359887803227' },
    services: [service('Оформяне на вежди', 'beauty', 7.67, mix, 15), service('Кола маска на горна устна', 'beauty', 5.11, mix, 15), service('Кола маска на подмишници', 'beauty', 7.67, mix, 15)],
    verification: verification(mix, 'Козметични услуги — резервация по телефон; обадете се на салона, за да запазите час. +359887803227.'),
  },
  {
    ...base, id: 'sofia-mc-studio-maragidik26', name: 'MC Studio · Маги Цветанова', neighborhood: 'Редута', address: 'София, кв. Редута, ул. Марагидик 26', category: 'hair', website: mc, phone: '+359894313137',
    booking: { kind: 'form', url: mcBook },
    services: [service('Дамско подстригване — стилист', 'hair', 40, mcWomen, null, 'Тарифа за стилист. Онлайн заявката подлежи на потвърждение от студиото.'), service('Стилизиране със сешоар — стилист', 'hair', 35, mcWomen, null, 'Тарифа за стилист. Онлайн заявката подлежи на потвърждение от студиото.'), service('Мъжко подстригване — стилист', 'barber', 25, mcMen, null, 'Тарифа за стилист. Онлайн заявката подлежи на потвърждение от студиото.')],
    openingHours: { sourceUrl: 'https://magicvetanova.com/contacts/', checkedOn, days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '19:00' }] })), { weekday: 6, periods: [{ open: '10:00', close: '16:00' }] }, { weekday: 7, periods: [] }] },
    verification: { ...verification(mcBook, 'Запазете своя час — изберете услуга, ден и час. Ще получите потвърждение от студиото; за резервация 0894313137.'), contact: 'https://magicvetanova.com/contacts/' },
  },
  {
    ...base, id: 'sofia-paola-hair-targovska19', name: 'Paola Hair Studio', neighborhood: 'Надежда 4', address: 'София, ж.к. Надежда 4, ул. Търговска 19', category: 'nails', website: paola, phone: '+359885214959',
    booking: { kind: 'phone', phone: '+359885214959' },
    services: [service('Маникюр с гел лак', 'nails', 12.78, paola, 90), service('Маникюр с гел лак и укрепване', 'nails', 17.90, paola, 105), service('Педикюр с гел лак', 'nails', 17.90, paola, 60)],
    verification: verification(paola, 'Маникюр и педикюр — резервация по телефон; обадете се на салона, за да запазите час. +359885214959.'),
  },
  {
    ...base, id: 'sofia-r-hair-kishinev2', name: 'R-hair', address: 'София, ул. Кишинев 2', category: 'barber', website: rHair, phone: '+359882998518',
    booking: { kind: 'phone', phone: '+359882998518' },
    services: [service('Мъжко подстригване с машинка и ножица', 'barber', 12.78, rHair, 30), service('Мъжко подстригване с измиване', 'barber', 12.78, rHair, 45), service('Оформяне на брада с машинка', 'barber', 2.56, rHair, 15)],
    verification: verification(rHair, 'Мъжко фризьорство и бръснарски услуги — резервация по телефон; обадете се за час. +359882998518.'),
  },
  {
    ...base, id: 'sofia-new-wave-solun31', name: 'Studio New Wave', address: 'София, ул. Солун 31', category: 'hair', website: newWave, phone: '+359896783976',
    booking: { kind: 'phone', phone: '+359896783976' },
    services: [service('Дамско подстригване и стайлинг със сешоар', 'hair', 26, newWave, 80), service('Боядисване на корени с измиване и стайлинг със сешоар', 'hair', 64, newWave, 135), service('Мъжко подстригване с измиване и стайлинг', 'barber', 15, newWave, 40)],
    verification: verification(newWave, 'Дамско и мъжко фризьорство — резервация по телефон; обадете се на салона за час. +359896783976.'),
  },
  {
    ...base, id: 'sofia-studio27-boris-stefanov35', name: 'Studio 27', address: 'София, ул. Акад. Борис Стефанов 35', category: 'nails', website: studio27, phone: '+359879272722',
    booking: { kind: 'phone', phone: '+359879272722' },
    services: [service('Сух маникюр без лак', 'nails', 28.12, studio27, 45), service('Маникюр с гел лак', 'nails', 28.12, studio27, 60), service('Педикюр с гел лак', 'nails', 28.12, studio27, 60)],
    verification: verification(studio27, 'Маникюр и педикюр — резервация по телефон; онлайн записването за тези услуги не е възможно. +359879272722.'),
  },
  {
    ...base, id: 'sofia-over-over-vrabnitsa635', name: 'Over and over', neighborhood: 'Връбница 2', address: 'София, ж.к. Връбница 2, бл. 635', category: 'barber', website: over, phone: '+359877506539',
    booking: { kind: 'phone', phone: '+359877506539' },
    services: [service('Мъжко подстригване', 'barber', 7.67, over, null, 'Публикувана продължителност 30–40 минути; точният вариант се уточнява при записване.'), service('Мъжко подстригване и стандартно оформяне на брада', 'barber', 10.23, over, 60), service('Оформяне на брада с машинка', 'barber', 5.11, over, 30)],
    verification: verification(over, 'Мъжко фризьорство и Barber shop — резервация по телефон; обадете се на салона за час. +359877506539.'),
  },
  {
    ...base, id: 'sofia-feeling-musagenitsa107', name: 'Feeling', neighborhood: 'Мусагеница', address: 'София, ж.к. Мусагеница, бл. 107', category: 'hair', website: feeling, phone: '+359888414869',
    booking: { kind: 'phone', phone: '+359888414869' },
    services: [service('Дамско подстригване', 'hair', 10.23, feeling, 30), service('Боядисване на корени с подсушаване със сешоар', 'hair', 20.45, feeling, 75), service('Мъжко подстригване', 'barber', 8.69, feeling, 15)],
    verification: verification(feeling, 'Дамско и мъжко фризьорство — резервация по телефон; обадете се на салона за час. +359888414869.'),
  },
  {
    ...base, id: 'sofia-marart-vasil-levski1a', name: 'MARART Studio', address: 'София, бул. Васил Левски 1А', category: 'nails', website: marart, phone: '+359876333736',
    booking: { kind: 'phone', phone: '+359876333736' },
    services: [service('Маникюр с обикновен лак', 'nails', 20.45, marart, 60), service('Мъжки маникюр', 'nails', 15.34, marart, 45), service('Естетичен педикюр с гел лак', 'nails', 33.23, marart, 90, 'Козметичен педикюр, без обработка на терапевтични проблеми.')],
    verification: verification(marart, 'Маникюр и педикюр — резервация по телефон; обадете се на салона, за да запазите час. +359876333736.'),
  },
  {
    ...base, id: 'sofia-silver-star-iskar47', name: 'Studio Silver Star', address: 'София, ул. Искър 47', category: 'beauty', website: silver, phone: '+359878881078',
    booking: { kind: 'phone', phone: '+359878881078' },
    services: [service('Кола маска на корем', 'beauty', 10, silver, 10)],
    verification: verification(silver, 'Козметични услуги — резервация по телефон; обадете се на салона, за да запазите час. +359878881078.'),
  },
]
const reviews = [
  {
    id: records[0].id, website: paws, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [paws],
    notes: 'Actual named merchant grooming section explicitly phone-only appointments, then full selected menu/About/contact/footer read. Own merchant About current literal bathingdog<=10kg25EUR/>10kg30EUR andbrush20EUR, no durations published for these rows, not borrowed generic120min. Generic fullgroom33.23-66.47EUR differs breed67EUR endpoints, so no conflicting fullgroom imported. Mattedfur conditional supplement and aggressive-dog exclusion preserved publicly; no medical/tickremoval services selected. Exact Druzhba1 block108/Sofia and0892302087, no independent ownerdomain found. Petshop retail is not itself an appointment; only actualgrooming selected. No complete weeklyhours, retail09-17/transientopening not schedule. Current five-day source. Dedupe catalogue/all2000intakes/native contacts, no match. No reviews, ratings, photos, expressive prose, Maps, coordinates, call or booking.',
  },
  {
    id: records[1].id, website: persefona, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [persefona],
    notes: 'Actual merchant cosmetic subsection explicitly phone-only appointments; full relevant browmenu/About/contact/footer read. Shape+dye15.34EUR50min,lamination20.45EUR80min,lamination+dye30.68EUR90min literal, no durationflattening. Exact AtanasUzunov14/Sofia and0877678020. Active online nailmenus not imported or claimed reviewed, no PMU/laser/therapeutic foot rows. Own merchant identifies ordinary beauty/nail salon; no independent own domain found. PDFcontrol exposes no URL, no complete PDF or unpublished-tariff claim. No complete weeklyhours, providerretail09-17/transientstatus not salon schedule. Current lastmonth source. Dedupe catalogue/all2000intakes/native contacts, no match. No expressive prose, reviews, photos, Maps, coordinates, calls or booking.',
  },
  {
    id: records[2].id, website: madrid, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [madrid],
    notes: 'Actual merchant womenhair section explicitly phone-only appointments; full relevant hairmenu/About/contact/footer read. Blow12.78-15.34EURrange25min,rootswithdry20.45EUR80min,womenhaircut+blow20.45EUR40min literal; no manualconversion. Active online nails not imported or claimed bookingreviewed. Exact Madrid34/Sofia and0885877507, generic brand remains exact named premises not employee clone. No independent own domain found. No complete weeklyhours, providerretail09-17/transientopening not salon schedule. Current threeweek source. Dedupe catalogue/all2000intakes/nativecontacts, no match. No efficacy claims, expressive prose, reviews, ratings, photos, Maps, coordinates, call or reservation.',
  },
  {
    id: records[3].id, website: mix, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [mix],
    notes: 'Actual named merchant cosmetic category explicitly phone-only appointments; full selected brow/waxmenu/About/contact/footer read. Brow7.67EUR15min,upperlipwax5.11EUR15min,underarmwax7.67EUR15min literal, no therapeutic or aesthetic claims imported. Exact Oborishte46/Sofia, merchant additional entrance GiovanniGorini and0887803227. One salon, not each stylist/cosmetician business. Independent own domain search not yet resolved; merchant itself identifies exact operator and appointmentroute. PDFcontrol exposes no readableURL, no completePDF or unpublishedtariff claim. No complete weeklyhours, providerretail09-17/transientstatus not salon schedule. Current lastweek source. Dedupe catalogue/all2000intakes/nativecontacts. No marketing prose, reviews, ratings, photos, Maps, coordinates, calls or booking.',
  },
  {
    id: records[4].id, website: mc, checkedOn, bookingEntry: mcBook, bookingReview: 'owned_booking_reviewed', reviewedUrls: [mc, mcBook, mcWomen, mcMen, 'https://magicvetanova.com/contacts/', 'https://magicvetanova.com/about-us/', 'https://www.notino.bg/saloni/mc-studio/'],
    notes: 'Discovered exact owner MCStudio/MagiTsvetanova website after merchant manual review; actual own Book first followed to/reserve. Webreader cachemiss, ordinary public liveHTTP200 read full real form: service selector with womenhaircut/blowdry/menhaircut, date/time section, customer fields and explicit studio confirmation; nothing selected or submitted. Then full own women/men tariff/About/contact/root liveHTTP200 read. Exact stylist-tier women40EUR,blow35EUR,men25EUR distinct from cheaper hairdresser36/25/21; no specialistmix or invented durations from merchant aggregate. Own prices are literal current EUR, not converted. Current owner primary routes all link own form; cached women page old external Notino CTA not treated as current source. Exact Reduta/Maragidik26/0894313137 corroborates merchant. Full ownerMonFri10-19/Sat10-16/Sunclosed. Monthly hairmemberships and extensionmaterial costs excluded. One MCStudio, not separate Magi staff business. Dedupe all current catalogue/intakes/native contacts. No reviews/photos/marketingprose/Maps/coordinates/booking/customerentry retained.',
  },
  {
    id: records[5].id, website: paola, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [paola, 'https://dpacademy.bg/kursove-friziorstvo-sofia/'],
    notes: 'Actual merchant nail subsection explicitly phone-only appointments, full nailmenu/About/contact/footer read. Gel12.78EUR90min,gel+strength17.90EUR105min,gelpedicure17.90EUR60min literal. Active online hair/massage not imported or marked reviewed; no therapeutic services. Exact Sofia/Nadezhda4/Targovska19 and0885214959. Own training page atDPAcademy liveHTTP200 separately confirms PaolaHairStudio samephone/venue as coursehost; no separate academy listing at this venue and no irrelevant academy officehours imported. Main academyPernik87-89 is different not this record. No independent salon domain found, merchant chosen actual client appointment path. PDFcontrol lacks readableURL, no completePDF/unpublished claim. No full weeklyhours; providerretail09-17/transientstatus not schedule. Current two-month source within90days. Dedupe all current catalogue/intakes/nativecontacts. No expressive prose,reviews,photos,Maps,coordinates,call orbooking.',
  },
  {
    id: records[6].id, website: rHair, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [rHair],
    notes: 'Actual named merchant menhair/barber sections explicitly phone-only appointments; full selected menus/About/exactcontact/footer read. Menclipper+scissors12.78EUR30min,menwithwash12.78EUR45min,beardclipper2.56EUR15min literal, not inferred from inexpensivefee. Unnumberedclippervariants7.67-10.23EUR andwomanlength/unitcolor variations excluded. Exact Kishinev2/Sofia and0882998518. About explicitly identifies owner Zdravka foundedR-hair, onevenue not staffcalendarclone. No independent domain found. PDFcontrol unexposedURL, no completePDF/unpublished claim. No fullweeklyhours; providerretail09-17/transientstatus not salon schedule. Two-month source within90days. Dedupe all catalogue/intakes/nativecontacts. No merchant prose, efficacyclaims, reviews, photos, Maps, coordinates, call or booking.',
  },
  {
    id: records[7].id, website: newWave, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [newWave],
    notes: 'Actual named merchant women/menhair phone-only appointment sections first, then full relevant menu/About/contact/footer read. Explicit haircut+blow26EUR80min chosen, not alternate sameprice generichaircut70min; rootswithwash+style64EUR135min,menwashstyle15EUR40min literal. Different color+cut rows not mixed. Exact Solun31/Sofia and0896783976 confirmed, no quarter guessed from map. Own independent domain not found. No full weeklyhours; transient18:00status/providerretail09-17 not schedule. PDFcontrol no readableURL, selected visibleprices only, no completePDF/unpublishedclaim. Four-week source. One salon noteach stylistbusiness; dedupe current catalogue/all2000intakes/nativecontacts. No safety/organic claims, reviews, photos, Maps, coordinates, call orbooking.',
  },
  {
    id: records[8].id, website: studio27, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [studio27],
    notes: 'Actual merchant nail subsection explicitly phone-only appointments, full relevant nailmenu/About/contact/footer read. Dryuncoated28.12EUR45min,gel28.12EUR60min,gelpedicure28.12EUR60min literal, not categoryminfees. Active online hair/menmakeup not imported or marked bookingreviewed; vagueagegirls not needed. Exact AkademikBorisStefanov35/Sofia and0879272722, owner storefront describes multi-staffsalon so onevenue, no specialistclones. No independent domain found. No fullweeklyhours; transient21:00closing/providerretail09-17 not schedule. PDFcontrol no readableURL, no completePDF/unpublishedclaim. Two-month source within90days. Dedupe current catalogue/all2000intakes/nativecontacts. No expressiveprose, efficacyclaims, reviews, ratings, photos, Maps,coordinates,call orbooking.',
  },
  {
    id: records[9].id, website: over, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [over],
    notes: 'Actual named merchant menhair/barber sections explicitly phone-only appointments; full relevant barbermenu/About/contact/footer read. Men7.67EUR published30-40min no scalarflattening,combo10.23EUR60min,beardclipper5.11EUR30min literal. Massage/physiotherapy and otherclinical or efficacyclaims not imported. Exact Vrabnitsa2 block635/Sofia and0877506539. About identifies ownbeautysalon, onevenue noteachbarber. No independent own domain found. No fullweeklyhours; transient20:00opening/providerretail09-17 not schedule. PDFcontrol exposes noURL, no completePDF/unpublishedclaim. Lastmonth source. Dedupe all catalogue/intakes/nativecontacts, no match. No expressiveprose, reviews, photos, Maps,coordinates,call orbooking.',
  },
  {
    id: records[10].id, website: feeling, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [feeling],
    notes: 'Actual merchant women/menhair sections explicitly phone-only appointments, full relevant hairmenu/About/contact/footer read. Women10.23EUR30min,rootswithdry20.45EUR75min,men8.69EUR15min literal; variableblowdry8.69-17.90EUR20-50min not flattened or substituted. Merchant block107 repeated107 and contact explicitly locates salon next to Musagenitsapostoffice; normalized oneblock107, not inventedstreetnumber. Sofia and0888414869 exact. Otheraesthetic/massage services not imported. No independent own domain found. No fullweeklyhours; byrequest/transientopening/providerretail09-17 not schedule. PDFcontrol lacks readableURL, no completePDF/unpublishedclaim. Lastmonth source. Dedupe current catalogue/all2000intakes/nativecontacts no match. No expressiveprose,medicalclaims,reviews,photos,Maps,coordinates,call orbooking.',
  },
  {
    id: records[11].id, website: marart, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [marart],
    notes: 'Actual named merchant nail category explicitly phone-only appointments; complete selected menu/About/contact/footer manually read, then source rechecked after environment recovery. Ordinarypolish20.45EUR60min,male15.34EUR45min,gelped33.23EUR90min literal. Pedicure explicitly aesthetic/nontherapeutic, public qualifier retained. Short/healthy-medium<=5mm gel25.56 variant not imported or mixed with extensions/removal. Exact VasilLevski1A/Sofia and0876333736. OwnAbout independent smallnailstudio; ownsite search found no independent salon domain. No weeklyschedule, transient20:00/providerretail09-17 not hours. Source two months within90days. Current catalogue/all2000intake ID/domain/fullmerchantpath/phone/venue check finds no match; known publicnative contacts differ. No reviews/ratings/photos/marketingprose/Maps/coordinates/call/booking.',
  },
  {
    id: records[12].id, website: silver, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [silver],
    notes: 'Actual merchant cosmetic phone-only subsection followed before reviewing its selected tariff; abdomenwax10EUR10min literal withCallbutton. Active online hair/nails/otherwax menus not marked reviewed or imported. Unpriced phonebrow/wax options not claimed unpublished or substituted for actualonline menu. Exact Iskar47/Sofia and0878881078 corroborated fullAbout/contact/footer; About ordinarysalon, no medicaloperator evidence. Current four-week primary source rechecked after recovery; no independent ownerdomain found. No completeweeklyhours, transient20:00/providerretail09-17 not schedule. Current catalogue/all2000intake ID/domain/fullmerchantpath/phone/venue dedupe no match; known publicnativecontacts differ. Partial one-service inventory deliberate. No reviews/ratings/photos/prose/Maps/coordinates/call/customerinput/reservation.',
  },
]
export default { records, reviews }
