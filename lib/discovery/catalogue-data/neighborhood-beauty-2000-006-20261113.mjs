// Manually reviewed intake only. Parent owns shared imports, identities and photos.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const frizior = 'https://www.frizior.bg/'
const friziorMen = 'https://www.frizior.bg/цени-за-него/'
const oldSchool = 'https://old-school-barbershop.com/'
const oldSchoolContact = 'https://old-school-barbershop.com/contact.php'
const oldSchoolAbout = 'https://old-school-barbershop.com/about.php'
const newVision = 'https://newvisionstudio.bg/'
const newVisionContact = 'https://newvisionstudio.bg/kontakti/'
const newVisionBrows = 'https://newvisionstudio.bg/oformyane-na-vezhdi/'
const ariel = 'https://arielbeautystudio.eu/index.php'
const hexaya = 'https://sofia.intercontinental.com/en/spa'
const hexayaMenu = 'https://sofia.intercontinental.com/uploads/pdf/Hexaya_Menu_2024.pdf'
const pompon = 'https://www.studio-pompon.com/'
const pomponPrices = 'https://www.studio-pompon.com/new-page'
const pomponImage = 'https://images.squarespace-cdn.com/content/v1/681621eac0f6200fcc9adf4e/78a8066a-de62-4f85-8da9-6542fdd22e95/Ceni-i-pravila_Pompon_euro_2_web.png'
const malta = 'https://centermalta.com/'
const cultura = 'https://beautycultura.bg/'
const culturaPrices = 'https://beautycultura.bg/цени/'
const culturaFaq = 'https://beautycultura.bg/често-задавани-въпроси/'
const culturaContact = 'https://beautycultura.bg/контакти/'
const base = { cityCode: '68134', neighborhood: null, locationKind: 'premises', coordinates: null, category: 'barber' }
const service = (name, amount, sourceUrl, description) => ({ name, category: 'barber', appointmentModel: 'appointment', price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil }, ...(description ? { description } : {}) })
const beautyBgn = (name, amount, sourceUrl, description) => ({ name, category: 'beauty', appointmentModel: 'appointment', price: { amount, currency: 'BGN', kind: 'fixed', sourceUrl, checkedOn, validUntil }, ...(description ? { description } : {}) })
const healthEur = (name, amount, durationMin, sourceUrl) => ({ name, category: 'health', appointmentModel: 'appointment', price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil }, durationMin, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn, description: 'Предварително записване. Цената включва ДДС; за заявка извън редовното работно време има 50% надценка и се потвърждава наличност на персонал.' })

const records = [
  {
    ...base, id: 'sofia-frizior-bogdanovets8', name: 'Frizior.bg · салон за коса',
    address: 'София, ул. Богдановец 8', website: frizior, phone: '+359876421127',
    booking: { kind: 'phone', phone: '+359876421127' },
    services: [
      service('Мъжко подстригване с измиване и стайлинг', 18, friziorMen, 'Включва измиване преди и след подстригване, масаж и стайлинг според публикуваното меню.'),
      service('Оформяне на брада с машинка и ножица', 8, friziorMen),
      service('Подстригване на коса и оформяне на брада', 25, friziorMen, 'Комбинирана услуга в едно посещение: измиване, подстригване, масаж и стайлинг плюс оформяне на брада с машинка и ножица.'),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: frizior, excerpt: 'Запиши си час сега на +359 876 421127. София, ул. Богдановец 8. Салонът предлага дамско, мъжко и детско подстригване и оформяне на брада.' }, contact: frizior },
  },
  {
    ...base, id: 'sofia-old-school-barbershop-vitosha116', name: 'Old School Barber Shop · Витоша 116', neighborhood: 'Център',
    address: 'София, бул. Витоша 116', website: oldSchool, phone: '+359878666207',
    booking: { kind: 'phone', phone: '+359878666207' },
    services: [
      { name: 'Мъжко подстригване', category: 'barber', appointmentModel: 'appointment' },
      { name: 'Оформяне на брада', category: 'barber', appointmentModel: 'appointment' },
      { name: 'Подстригване на коса и оформяне на брада', category: 'barber', appointmentModel: 'appointment' },
    ],
    openingHours: { sourceUrl: oldSchoolContact, checkedOn, days: [...[1, 2, 3, 4, 5, 6].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '19:00' }] })), { weekday: 7, periods: [{ open: '10:00', close: '17:00' }] }] },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: oldSchoolContact, excerpt: 'ЗАПАЗЕТЕ ЧАС СЕГА. Обадете се на +359 878 666 207 и ние ще ви насрочим удобен час. Бул. Витоша 116, София.' }, contact: oldSchoolContact },
  },
  {
    ...base, id: 'sofia-new-vision-sveta-troitsa367a', name: 'New Vision Aesthetic', category: 'beauty', neighborhood: 'Света Троица',
    address: 'София, ж.к. Света Троица, бл. 367А', website: newVision, phone: '+359887444663',
    booking: { kind: 'phone', phone: '+359887444663' },
    services: [
      beautyBgn('Ламиниране на мигли', 90, newVisionBrows, 'Една процедура. Публикувана продължителност 50–60 минути; диапазонът не е фиксиран час.'),
      beautyBgn('Ламиниране на вежди', 80, newVisionBrows, 'Една процедура. Публикувана продължителност 50–60 минути; диапазонът не е фиксиран час.'),
      beautyBgn('Оформяне и почистване на вежди', 25, newVisionBrows, 'Една публикувана салонна процедура; без добавена непосочена продължителност.'),
    ],
    openingHours: { sourceUrl: newVisionContact, checkedOn, days: [...[1, 2, 3, 4, 5, 6].map(weekday => ({ weekday, periods: [{ open: '08:00', close: '20:00' }] })), { weekday: 7, periods: [{ open: '09:00', close: '20:00' }] }] },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: newVisionContact, excerpt: 'Свържете се с нас за консултация или запазване на час за процедура. +359 887 444 663. Запази час сега води към собствения телефон.' }, contact: newVisionContact },
  },
  {
    ...base, id: 'sofia-ariel-beauty-lyulin3', name: 'Ariel Beauty Studio', category: 'hair', neighborhood: 'Люлин 3',
    address: 'София, ж.к. Люлин 3, бул. Добринова скала 370, партер', website: ariel, phone: '+359888808858',
    booking: { kind: 'phone', phone: '+359888808858' },
    services: [
      { name: 'Подстригване и стайлинг', category: 'hair', appointmentModel: 'appointment' },
      { name: 'Боядисване и кичури', category: 'hair', appointmentModel: 'appointment' },
      { name: 'Официална прическа', category: 'hair', appointmentModel: 'appointment' },
    ],
    openingHours: { sourceUrl: ariel, checkedOn, days: [1, 2, 3, 4, 5, 6].map(weekday => ({ weekday, periods: [{ open: '11:00', close: '19:00' }] })) },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: ariel, excerpt: 'За записване: 0888 808 858. Работи с предварително записване. Обади се или изпрати запитване през формата; ще се свържем за потвърждение.' }, contact: ariel },
  },
  {
    ...base, id: 'sofia-hexaya-intercontinental', name: 'Hexaya Health & Wellness · InterContinental Sofia', category: 'health',
    address: 'София, пл. Народно събрание 4, InterContinental Sofia', website: hexaya, phone: '+35929334731',
    booking: { kind: 'phone', phone: '+35929334731' },
    services: [
      healthEur('Шведски релаксиращ масаж — 55 минути', 75, 55, hexayaMenu),
      healthEur('Релаксиращ масаж на шия и гръб — 40 минути', 58, 40, hexayaMenu),
      healthEur('Ароматерапевтичен масаж с българско розово масло — 55 минути', 96, 55, hexayaMenu),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: hexaya, excerpt: 'FOR PREMIUM TREATMENT BOOKINGS: Phone +359 2 9334 731. Menu: PLEASE BOOK IN ADVANCE at the same dedicated spa phone.' }, contact: hexaya },
  },
  {
    ...base, id: 'sofia-studio-pompon-nartsis3', name: 'Груминг студио Помпон', category: 'pets', neighborhood: 'Драгалевци',
    address: 'София, кв. Драгалевци, ул. Нарцис 3', website: pompon, phone: '+359876775010',
    booking: { kind: 'phone', phone: '+359876775010' },
    services: [
      { name: 'Стандартен груминг — късокосместо куче, малка порода до 4 кг', category: 'pets', appointmentModel: 'appointment', price: { amount: 80, maximum: 90, currency: 'BGN', kind: 'range', sourceUrl: pomponImage, checkedOn, validUntil }, description: 'Къпане, сушене, разресване, породна прическа, нокти, очи и уши. Диапазон според състоянието. Доплащане: сплъстявания 40 лв., бълхи 40 лв., кърлеж 10 лв./бр. Не се приемат агресивни и хапещи кучета.' },
      { name: 'Стандартен груминг — свободнопадаща козина, малка порода до 4 кг', category: 'pets', appointmentModel: 'appointment', price: { amount: 90, currency: 'BGN', kind: 'fixed', sourceUrl: pomponImage, checkedOn, validUntil }, description: 'Къпане, сушене, разресване, породна прическа, нокти, очи и уши. Доплащане: сплъстявания 40 лв., бълхи 40 лв., кърлеж 10 лв./бр. Не се приемат агресивни и хапещи кучета.' },
      { name: 'Стандартен груминг — обемна/двойна козина, малка порода до 4 кг', category: 'pets', appointmentModel: 'appointment', price: { amount: 95, maximum: 100, currency: 'BGN', kind: 'range', sourceUrl: pomponImage, checkedOn, validUntil }, description: 'Къпане, сушене, разресване, породна прическа, нокти, очи и уши. Диапазон според състоянието. Доплащане: сплъстявания 40 лв., бълхи 40 лв., кърлеж 10 лв./бр. Не се приемат агресивни и хапещи кучета.' },
    ],
    openingHours: { sourceUrl: pompon, checkedOn, days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })), { weekday: 6, periods: [{ open: '10:00', close: '13:00' }] }] },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: pompon, excerpt: 'Запишете час на телефон +359876775010. Студио Помпон работи само със запазени часове. Ул. Нарцис 3, Драгалевци, София.' }, contact: pompon },
  },
  {
    ...base, id: 'sofia-malta-ovcha-kupel426', name: 'Malta Health & Beauty Center', category: 'hair', neighborhood: 'Овча купел 1',
    address: 'София, ж.к. Овча купел 1, бл. 426, от страната на паркинга', website: malta, phone: '+359896654564',
    booking: { kind: 'phone', phone: '+359896654564' },
    services: [
      { name: 'Мъжко подстригване', category: 'hair', appointmentModel: 'appointment', price: { amount: 15, currency: 'BGN', kind: 'fixed', sourceUrl: malta, checkedOn, validUntil } },
      { name: 'Мъжко подстригване с измиване', category: 'hair', appointmentModel: 'appointment', price: { amount: 18, currency: 'BGN', kind: 'fixed', sourceUrl: malta, checkedOn, validUntil } },
      { name: 'Дамско подстригване, измиване и сешоар — къса коса', category: 'hair', appointmentModel: 'appointment', price: { amount: 25, currency: 'BGN', kind: 'fixed', sourceUrl: malta, checkedOn, validUntil } },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: malta, excerpt: 'Резервации: 0896 654 564. Собственият бутон запиши час води към tel:+359896654564. Овча купел 1, бл. 426, откъм паркинга.' }, contact: malta },
  },
  {
    ...base, id: 'sofia-beauty-cultura-trakia17', name: 'Beauty Cultura', category: 'beauty',
    address: 'София, ул. Тракия 17', website: cultura, phone: '+359897810725',
    booking: { kind: 'phone', phone: '+359897810725' },
    services: [
      { name: 'Класически масаж на лице', category: 'beauty', appointmentModel: 'appointment', price: { amount: 30, currency: 'EUR', kind: 'fixed', sourceUrl: culturaPrices, checkedOn, validUntil } },
      { name: 'Оформяне на вежди', category: 'beauty', appointmentModel: 'appointment', price: { amount: 5, currency: 'EUR', kind: 'fixed', sourceUrl: culturaPrices, checkedOn, validUntil } },
      { name: 'Боядисване на вежди', category: 'beauty', appointmentModel: 'appointment', price: { amount: 10, currency: 'EUR', kind: 'fixed', sourceUrl: culturaPrices, checkedOn, validUntil } },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: culturaFaq, excerpt: 'Как мога да запиша час? През Studio24 или като се свържете с нас по телефона. Собствените контакти: +359897810725, ул. Тракия 17, София.' }, contact: culturaContact },
  },
]

const reviews = [
  {
    id: 'sofia-frizior-bogdanovets8', website: frizior, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [frizior, friziorMen, 'https://www.frizior.bg/manicurepedicure/', 'https://www.frizior.bg/за-нея/', 'https://www.frizior.bg/ко/'],
    notes: 'Actual own booking instruction is native header Запиши си час сега876421127; chosen phone path, not a fabricated online form or a call actually made. Fully readable own root and entire native Men menu independently give Bogdanovets8/Sofia and literal18EUR haircut,8EUR beard,25EUR same-visit haircut/beard with exact inclusions. No invented durations, child age-limit interpretation, conversion or addon price. Root calls itself both Frizior and Frizor, one venue/operator only. A simultaneous owner-navigation review found verification challenge responses on Women and Cosmetics pages; STOP all further Frizior access, no HTTP/UI/English alternate or challenge bypass. Those services are not imported and are not called unpriced. Nails page is an older seven-month snapshot with a separate specialist phone and different hours; no nails/staff clone imported. All weekly hours omitted because inspected native snapshots differ; no guessed quarter or coordinates. No source photos/reviews/ratings used.',
  },
  {
    id: 'sofia-old-school-barbershop-vitosha116', website: oldSchool, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [oldSchool, oldSchoolContact, oldSchoolAbout, 'https://old-school-barbershop.com/shop.php'],
    pricingDecision: 'not_publicly_listed',
    priceSearch: { outcome: 'not_published', bookingUrl: oldSchoolContact, serviceUrls: [oldSchool, oldSchoolAbout], notes: 'Actual owner Book entry first follows contact.php and explicitly says call878666207 to arrange a convenient appointment. Full native root service list, About, contact, relevant navigation/footer and Products page read by ordinary public HTTPS. Haircut, beard shaping and same-visit hair/beard are explicitly offered, but no service fee or duration tariff, Prices link or external booking engine is published. Products is a separate shop, not an unread appointment calendar. No challenge, blocked service menu or conflicting price is relabelled unpublished.' },
    notes: 'Fresh whole owner booking/contact/About/root read, plus Products check, confirms exact Vitosha116/Centre/Sofia and explicit phone reservations. Ordinary barber appointments only, one real venue not individual staff profiles. Owner schedule is explicitly Mon–Sat10–19,Sun10–17, consistently root/contact/About. Source reviews/photos, ratings, inflated experience claims and health/skin outcomes are excluded. No invented price/duration, quarter pin, online request form or availability. Service-reviewed without public price, not a completed price review.',
  },
  {
    id: 'sofia-new-vision-sveta-troitsa367a', website: newVision, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [newVision, newVisionContact, 'https://newvisionstudio.bg/za-nas/', newVisionBrows, 'https://newvisionstudio.bg/kola-maska/', 'https://newvisionstudio.bg/masazhi-litse-dekolte-shia/'],
    notes: 'Actual hero Book first is native tel:+359887444663, independently reinforced by complete own Contact explicit appointment invitation. Own About identifies a family beauty salon and GabrielaStoichkova joining the family operation, not a physician clinic; only three ordinary lash/brow services imported after scope review. Own native lamination page completely read gives single-procedure90BGN lashes,80BGN brows and25BGN shape/clean. Literal BGN retained; native EUR46/40.90/12.78 also displayed, not calculated by us. Both lamination rows explicitly50–60minute ranges remain public description text, not durationMin; no duration supplied for shaping. Current full contact/About/root consistently MonSat08–20,Sun09–20 and SvetaTroitsa367A. Footer Studio24 online entry not requested or claimed reviewed; chosen phone path and native fees independently verified. Waxing page read but not imported; massage page reader cache miss not a completed service review. All lasers/LaseMD/Venus protocols, medical/skin/hair-loss results, device safety claims, injections, free consultations, packages/promotions, source photos/reviews and coordinates excluded.',
  },
  {
    id: 'sofia-ariel-beauty-lyulin3', website: ariel, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [ariel],
    pricingDecision: 'not_publicly_listed',
    priceSearch: { outcome: 'not_published', bookingUrl: ariel, serviceUrls: [ariel], notes: 'Actual hero Book is native tel0888808858; owned appointment-request form also fully read, including real standalone haircut/hairstyle, coloring/highlights and formal-hairstyle options and staff-confirmation notice. Whole current November2026 native services, contact/About sections, navigation/footer and promotional price blocks reviewed. No regular individual tariff for the three selected ordinary hair services, separate price page or external booking calendar is published. Visible November extension discounts, half-price therapies and holiday hair-plus-makeup99EUR bundle are explicitly promotional/different services and are excluded, not relabelled as unpriced regular variants. No blocked/unrendered appointment menu involved.' },
    notes: 'Only three independently offered standalone ordinary hair services, not the promoted extension/therapy/combo products. Exact Lyulin3/DobrinovaSkala370parter and explicit phone booking verified own current root. Owned request form is optional alternative, not claimed an automatic confirmation and never submitted. Current own partial schedule MonSat11–19 retained; Sunday is not stated in current page, so old cached Sundayclosed is not imported. Old cached laser-focused root is superseded by fresh current November hair-focused page; no laser/clinical claims or promotional rates imported. No guessed durations, source photos/reviews or coordinates. Service-reviewed selected normal tariff absence, not a completed price review.',
  },
  {
    id: 'sofia-hexaya-intercontinental', website: hexaya, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [hexaya, hexayaMenu, 'https://www.ihg.com/intercontinental/hotels/us/en/sofia/sofco/hoteldetail/amenities'],
    notes: 'Actual own spa booking path explicitly dedicated premium-treatment phone29334731 reviewed before its Menu link; generic hotel-room Book Now/availability form is not imported. Actual currently linked Hexaya_Menu_2024.pdf downloaded and all four pages rendered/visually read, preserving table alignment: Swedish55min75EUR,neck/back40min58EUR,rosearoma55min96EUR. Single ordinary massage fees, VAT included; public descriptions retain50% surcharge and staff-availability confirmation for out-of-hours requests. No manual currency conversion, unsupported80minute Swedish option, addons, flotation, four-hand or medical outcomes imported. Own spa footer binds exact NarodnoSabranie4 hotel and samePDFphone. IHG amenities publishes another dedicated spa mobile888383212 and12–20 without explicit weekdays; selected current own landline corroborates PDF, not a phone mismatch silently fixed. Weekly hours omitted, not hotel fitness24/7 or third-party schedule. Current owner active link, not guessed freshness from filename2024; old unlinked IHG_menu_2024.pdf discovery not used for fees. No source reviews/photos, guessed quarter or coordinates.',
  },
  {
    id: 'sofia-studio-pompon-nartsis3', website: pompon, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [pompon, pomponPrices, pomponImage, 'https://www.studio-pompon.com/page'],
    notes: 'Actual owner Book is explicit telephone876775010; full root services/rules/contact/footer read first, then actual OurPrices page and its whole current tariff image visually inspected. Three small-breed up-to4kg coat-specific standard grooming rows retain literalBGN80–90/90/95–100, not invented averages or convertedEUR. All washing/drying/combing/breed haircut/nail/eye/ear inclusions, condition-based ranges and40BGNmatting surcharge reflected without medical/ozone/dental outcome claims. Native menu also lists flea40BGN/tick10BGNeach additional charges, excluded as distinct healthcare services rather than imported appointments. Owner no aggressive/biting dogs condition retained. No invented duration. Root schedule explicitMonFri09–18,Sat10–13;Sundayabsent remains absent. Actual Contact navigation /page returns branded404, not a completed contact page; full root independently supplies exactNartsis3/Dragalevtsi/Sofia and samephone. No sourceimage copied into catalogue, reviews/ratings/coordinates or staff clones.',
  },
  {
    id: 'sofia-malta-ovcha-kupel426', website: malta, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [malta],
    notes: 'Fresh entire owner-native one-page salon service menu, tariff, team and reservation/contact/footer read. Actual header and separate ЗапишиЧас CTA native tel:+359896654564, explicit Reservations samephone, exactOvchaKupel1bl426 parking-side entrance. Only three ordinary hair rows imported, literal publishedBGN15men,18menwithwash,25shortwomencutwashblow, no conversions or fabricated durations. Team explicitly hairdresserOlga and ordinary salon specialists, no doctor identity imported; medicalpedicure/Bowen/osteopathy/laser/clinical/outcome claims and all other inventories excluded. No Prices/calendar separate link on the actual native onepager, actual selected telephone path fully reviewed not simulatedonline. Weeklyhours absent from owned page, not copied directoryMonSat10–19. One physical centre not staff/service aliases. No source reviews/media/coordinates.',
  },
  {
    id: 'sofia-beauty-cultura-trakia17', website: cultura, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [cultura, culturaFaq, culturaPrices, culturaContact],
    notes: 'Actual own nav offers externalS24booking, not requested after current platform challenge; no claim of reviewed calendar or unpublished fees. Independently entire ownerFAQ explicitly allows telephone appointments and current ordinaryHTML confirms that fallback; contact exactTrakia17/Sofia/897810725. Whole native current ServicesPrices menu read and only three ordinary facialmassage/browshape/browdye fees30/5/10EUR selected. No doctor/medicalclinic identity claimed; all lasers/IPL/microneedling/osteopathy/clinical/safety/outcome prose, packages, nailtariff absence and sourcephotos excluded. No fees inferred from generic premiumpackage, absent hours/durations or guessedquarter/coordinates. Contactform is genericenquiry and not imported as booking. Full ownerFAQ medicalclaims not reused.',
  },
]

export default { records, reviews }
