// Isolated manually reviewed intake004. Root owns imports, photos and identities.
const checkedOn = '2026-11-13', validUntil = '2027-02-11'
const records = [], reviews = []
const service = (category, name, description, facts = {}) => ({ category, appointmentModel: category === 'home_services' ? 'home_visit' : 'appointment', name, description, ...facts })
const price = (amount, unit, sourceUrl, extra = {}) => ({ amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl, checkedOn, ...extra })
const hours = (sourceUrl, rows) => ({ sourceUrl, checkedOn, days: rows.map(([weekday, open, close]) => open ? { weekday, periods: [{ open, close }] } : { weekday, periods: [], byAppointment: true }) })
function add(facts, evidence) {
  const { bookingUrl, contactUrl = bookingUrl, excerpt, reviewedUrls, notes, priceSearchNotes, serviceUrls, provider = false } = evidence
  const row = { cityCode: '68134', neighborhood: null, address: null, locationKind: 'premises', coordinates: null, ...facts, booking: facts.booking || { kind: 'phone', phone: facts.phone }, verification: { status: 'approved', checkedOn, validUntil, booking: { url: bookingUrl, excerpt }, contact: contactUrl } }
  records.push(row)
  const review = { id: row.id, checkedOn, website: row.website, bookingEntry: row.booking.kind === 'phone' ? 'phone' : row.booking.url, bookingReview: row.booking.kind === 'phone' ? 'phone_booking_reviewed' : provider ? 'provider_booking_reviewed' : 'owned_booking_reviewed', reviewedUrls, notes }
  if (priceSearchNotes) Object.assign(review, { pricingDecision: 'not_publicly_listed', priceSearch: { outcome: 'not_published', bookingUrl: row.booking.kind === 'form' ? row.booking.url : bookingUrl, serviceUrls, notes: priceSearchNotes } })
  reviews.push(review)
}

const pharos = 'https://pharos.bg/', pharosBook = `${pharos}kontakti-pharos/`, pharosSofia = `${pharos}angliyski-ezik-v-sofiya/`, pharosCourses = `${pharos}kyrsove/`, pharosChildren = `${pharos}kursove-po-anglijski-ezik-za-malki-uchenitsi/`, pharosFaq = `${pharos}faq/`
const pharosTerms = 'https://pharos.bg/wp-content/uploads/2025/05/%D0%9E%D0%91%D0%A9%D0%98-%D0%A3%D0%A1%D0%9B%D0%9E%D0%92%D0%98%D0%AF-%D0%9D%D0%90-%D0%A3%D0%A7%D0%98%D0%9B%D0%98%D0%A9%D0%90-%D0%A4%D0%90%D0%A0%D0%9E%D0%A1_29.08.2025.pdf'
const pharosVenues = [
  ['sofia-pharos-bulgaria60v', 'бул. България', null, 'София, бул. България 60В, ет.3', '+359876105400'],
  ['sofia-pharos-dianabad-pimen59', 'Дианабад', 'Дианабад', 'София, ж.к. Дианабад, ул. Свети Пимен Зографски, бл.59, вх.4, ет.1, ап.29', '+359878644491'],
  ['sofia-pharos-lozenets-dobri-voynikov33', 'Лозенец', 'Лозенец', 'София, ул. Добри Войников 33', '+359876601073'],
  ['sofia-pharos-lyulin4-block446', 'Люлин', 'Люлин 4', 'София, ж.к. Люлин 4, бл.446, вх.Б', '+359878278024'],
  ['sofia-pharos-nadezhda2-dravski-boy14', 'Надежда', 'Надежда 2', 'София, ж.к. Надежда 2, ул. Дравски бой 14', '+359878945048'],
  ['sofia-pharos-razsadnika-hashove21a', 'Стамболийски', 'Разсадника', 'София, ж.к. Разсадника, ул. Хъшове, бл.21А', '+359878119294'],
  ['sofia-pharos-spartak-hadzhikotsev51', 'Спартак – Лозенец', 'Лозенец', 'София, ул. Димитър Хаджикоцев 51', '+359878601135'],
  ['sofia-pharos-darvenitsa-ignatov7', 'Мусагеница', 'Дървеница', 'София, ж.к. Дървеница, ул. Константин Игнатов 7', '+359878601135'],
]
for (const [id, branch, neighborhood, address, phone] of pharosVenues) add({
  id, name: `Училища Фарос · ${branch}`, category: 'education', neighborhood, address, website: pharos, phone,
  services: [service('education', 'Групов курс по английски език за ученици', 'Ниво и група след входящ тест и предварително записване с първа вноска. Графикът и таксата се уточняват с конкретния клон. Учебници и външни изпити се плащат отделно. Отсъствията не намаляват таксата; при прекъсване важат ограниченията за възстановяване по общите условия.')],
}, {
  bookingUrl: pharosBook, excerpt: 'Желаете да се запишете за курс? ... Свържете се с нас ... по телефон ... информация за филиалите ни',
  reviewedUrls: [pharos, pharosBook, pharosSofia, pharosCourses, pharosChildren, pharosFaq, pharosTerms],
  serviceUrls: [pharosSofia, pharosCourses, pharosChildren, pharosFaq, pharosTerms],
  priceSearchNotes: `Actual own enrollment/contact page and complete preferred-branch selector include ${branch}; public branch phone and precise teaching venue reviewed, then Sofia courses, ordinary course pages, FAQ and complete official terms PDF. Selected school-year course has no numeric fee online: the child service invites contact for schedule/fees, terms III.1 says tariffs are in each branch. Materials and external exams are separate. Old/summer fees and 2025–26 discounts are not the ordinary current course tariff; no inaccessible current price menu was substituted.`,
  notes: `Real distinct teaching venue ${branch}, not a quarter landing page or administrative HQ, corroborated by own Sofia service-location roster and current branch contact. Actual request form has named preferred-branch option and own phone enrollment invitation; no selection, fields, consent, test or submission. Two branches share a school-projects telephone but have separate named premises and booking choices. No price or duration invented; timetable depends on group/term, not office hours. Full official terms text read: registration plus first payment, textbooks/external exams extra and absence/withdrawal rules; PDF screenshot cache misses are not claimed visual inspection. No pupil photos, source prose or map points reused.`,
})

add({
  id: 'sofia-dauchim-simeonovo-vitoshki-ezera8', name: 'Dauchim · Симеоново', category: 'education', neighborhood: 'Симеоново', address: 'София, кв. Симеоново, ул. Витошки езера 8', website: 'https://dauchim.com/', phone: '+359878850031',
  services: [service('education', 'Индивидуален урок по математика за ученици', 'За I–XII клас, с предварително уговорени преподавател и график. Предлагат се 60 или 90 минути според нуждите. Таксата се уточнява и потвърждава преди започване; заявката става записване едва след потвърждение от центъра.')],
}, {
  bookingUrl: 'https://dauchim.com/kontakti/', excerpt: 'Как да запиша детето си? Обадете се или попълнете формата.',
  reviewedUrls: ['https://dauchim.com/', 'https://dauchim.com/kontakti/', 'https://dauchim.com/individualni-uroci/', 'https://dauchim.com/lokacii/simeonovo/', 'https://dauchim.com/lokacii/darvenitsa/', 'https://dauchim.com/obshti-usloviya/'],
  serviceUrls: ['https://dauchim.com/individualni-uroci/', 'https://dauchim.com/lokacii/simeonovo/', 'https://dauchim.com/obshti-usloviya/'],
  priceSearchNotes: 'Actual enrollment contact/form first, then complete individual-lesson and exact Simeonovo teaching-venue pages, homepage and complete August 2026 terms via ordinary public HTTPS GET after reader cache miss. Terms 3 explicitly says current fees are provided at enrollment and confirmed in writing/email before classes; no numeric fee for the selected individual mathematics lesson appears on these pages or the booking form. No blocked tariff is being called unpublished.',
  notes: 'Own current venue page expressly says all programs run at both actual premises and schedule is agreed on enrollment. Simeonovo is a new physical branch; Darvenitsa shares exact phone and address with existing sofia-amakids-darvenitsa and is intentionally NOT duplicated. Contact FAQ explicitly permits phone enrollment; form requests preferred location and class. No fields, dates or consent entered. Public terms contain some administrative placeholders; no contract details invented. Service length is a choice of 60/90, not a fixed duration; no weekly lesson hours published.',
})

const nextDoorPrices = 'https://www.english-nextdoor.com/kursove-i-ceni'
add({
  id: 'sofia-english-next-door-mladost3-block301', name: 'English Next Door', category: 'education', neighborhood: 'Младост 3', address: 'София, ж.к. Младост 3, бл.301, вх. офиси, офис 10', website: 'https://www.english-nextdoor.com/', phone: '+359884618190',
  services: [
    service('education', 'Индивидуален урок по английски за деца и ученици', 'Предварително записване и уговорен график. Публикуваната такса е за един 40-минутен учебен час за нов курсист без отстъпки.', { durationMin: 40, durationSourceUrl: nextDoorPrices, durationCheckedOn: checkedOn, price: price(14, 'учебен час от 40 минути', nextDoorPrices) }),
    service('education', 'Индивидуален урок по английски за възрастни', 'Общ, бизнес или разговорен английски според целите и уговорения график. Такса за един 40-минутен учебен час за нов курсист без отстъпки.', { durationMin: 40, durationSourceUrl: nextDoorPrices, durationCheckedOn: checkedOn, price: price(16, 'учебен час от 40 минути', nextDoorPrices) }),
  ],
}, {
  bookingUrl: nextDoorPrices, excerpt: 'Индивидуално обучение ... ЗАПАЗЕТЕ МЯСТО ... 0884 618 190',
  reviewedUrls: ['https://www.english-nextdoor.com/', 'https://www.english-nextdoor.com/book-online', nextDoorPrices, 'https://www.english-nextdoor.com/za-nas', 'https://www.english-nextdoor.com/politika-za-poveritelnost'],
  notes: 'Followed actual Book Online first: current ordinary HTTPS GET says nothing is available to reserve, not a blocked fee menu. Independent selected course-page reserve-place CTAs link to tel:+359884618190; current homepage invites enrollment by the same number. Actual tariffs read fresh over HTTPS are 14 EUR child/student and 16 EUR adult per 40-minute academic unit; no certificate or online-only French/German fee imported, and no older search snapshot substituted. Shared form untouched. Public address is exact office entrance in block301. No weekly teaching hours: event/open-day and group timetables are not general opening hours. Privacy text review was partial, not represented as full terms clearance; independently phrased factual facts only.',
})

const jey = 'https://jey.bg/', jeyEnglish = `${jey}english/`, jeyRules = `${jey}%D0%BF%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%B0-%D0%BD%D0%B0-%D1%83%D1%87%D0%B5%D0%B1%D0%B5%D0%BD-%D1%86%D0%B5%D0%BD%D1%82%D1%8A%D1%80-jey/`, jeyTerms = `${jey}wp-content/uploads/2025/10/%D0%9E%D0%B1%D1%89%D0%B8-%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F.pdf`
add({
  id: 'sofia-jey-ovcha-kupel1-promishlena430', name: 'Учебен център JEY', category: 'education', neighborhood: 'Овча купел 1', address: 'София, ж.к. Овча купел 1, ул. Промишлена, бл.430, партер', website: jey, phone: '+359882989999', booking: { kind: 'form', url: jeyEnglish },
  services: [service('education', 'Индивидуални уроци по английски за деца', 'Форма за предварително записване с избор на индивидуални уроци; центърът уточнява нивото и графика. Таксите са месечни. Неявяване или непосредствена отмяна се заплаща; при прекъсване на курса важат неустойките от общите условия.')],
}, {
  bookingUrl: jeyEnglish, excerpt: 'За записване, моля, попълнете формата за контакт ... Курс или индивидуални уроци предпочитате?',
  reviewedUrls: [jey, jeyEnglish, jeyRules, jeyTerms], serviceUrls: [jeyEnglish, jeyRules, jeyTerms],
  priceSearchNotes: 'Actual English enrollment form first, including parent/child, email/phone, course-versus-individual preference, prior study and school class. Complete current own English service, homepage, rules and full official 3-page PDF terms were reviewed. No numeric fee for these individual English lessons or current tariff link appears in the reviewed own booking/service pages. Terms says tariffs are announced on site/social networks, but does not supply the selected numeric fee; old daycare penalty examples are not English lesson fees. No blocked price menu was passed as absent.',
  notes: 'Current public English form is a real pre-enrollment request, not an invented generic appointment. Own PDF confirms courses and individual lessons occur at Promishlena block430 ground floor. Did not fill or submit. Rules require monthly payment1–10, late surcharge5%, missed/late-cancelled individual lesson paid in full and withdrawal penalty50% remaining monthly charges; description preserves cancellation constraints without inventing a fee. Homepage08:30–17:30 conflicts with evening English groups, so omitted rather than calling office/daycare hours lesson hours. No unrequested logoped or medical services imported; PDF text read, not claimed visually inspected.',
})

const ezik = 'https://ezik.eu/', ezikBook = `${ezik}contacts/`, ezikIndividual = `${ezik}individual/`
add({
  id: 'sofia-cultural-language-centre-kiril-botev3a', name: 'Културен и образователен център София', category: 'education', neighborhood: 'Мотописта', address: 'София, кв. Мотописта, ул. Кирил Ботев 3А', website: ezik, phone: '+359878701031', booking: { kind: 'form', url: ezikBook },
  services: [service('education', 'Индивидуален урок по английски език', 'Индивидуална програма и предварително уговорени начало и график. Урокът е 50 минути. Учебните материали се заплащат отделно; страницата посочва безплатни PDF и видео материали.', { durationMin: 50, durationSourceUrl: ezikIndividual, durationCheckedOn: checkedOn })],
}, {
  bookingUrl: ezikBook, excerpt: 'ИЗПРАТЕТЕ ЗАПИТВАНЕ ... При индивидуално обучение Вие определяте кога да започнете и с какъв график',
  reviewedUrls: [ezik, ezikBook, ezikIndividual, `${ezik}our-courses/`, `${ezik}privacy-policy/`], serviceUrls: [ezikIndividual, `${ezik}our-courses/`, ezikBook],
  priceSearchNotes: 'Followed actual individual-course request entry to own contact/request form and enrollment FAQ, then full individual lesson page and course roster plus current2026–27 homepage over ordinary HTTPS GET after reader misses. Selected50-minute individual English lesson has no numeric tariff or inaccessible tariff link on these pages. Materials are excluded; no fee is inferred from absent amount, bank installments or old online/pandemic lesson page. Booking FAQ expressly says individual start and timetable are agreed rather than fixed group enrollment deadline.',
  notes: 'Actual own form has name/email/message, enrollment FAQ and precise Sofia teaching address corroborated by privacy policy. Individual service specifically invites a request and enrollment and is not an unbookable walk-in language retail listing. Current homepage group enrollment deadline20September does not override the individual FAQ allowing agreed start; no availability claim made. No form fields, arithmetic anti-spam or consent submitted. Contact says09:00 while repeated footers09:30, and may be administrative, so all hours omitted. Old pandemic-only page not used to assert present online-only delivery.',
})

const excelsior = 'https://excelsiorclinic.com/'
add({
  id: 'sofia-excelsior-dent-dospat42', name: 'Дентален център Excelsior', category: 'other', address: 'София, ул. Доспат 42', website: excelsior, phone: '+359876537424',
  services: [
    service('other', 'Стоматологичен преглед и консултация', 'Профилактичен преглед и план за лечение след предварително записване. Посочените 30 минути са ориентировъчни; точните лечение, продължителност и цена се уточняват след преглед.'),
    service('other', 'Професионално почистване на зъби', 'Почистване на зъбен камък и плака с полиране, след предварително записване. Публикуваните 45 минути са ориентировъчни; окончателният план и цена се уточняват с кабинета.'),
  ],
  openingHours: hours(excelsior, [1,2,3,4,5].map(day => [day, '08:00', '20:00'])),
}, {
  bookingUrl: excelsior, excerpt: 'Може да запишете час и на +359 876 537 424.',
  reviewedUrls: [excelsior, `${excelsior}uslovia.php`], serviceUrls: [excelsior, `${excelsior}uslovia.php`],
  priceSearchNotes: 'Actual owned Book section first: complete public service radio menu, day/time stage and customer fields read without selection or submission, followed by whole service roster, contact/footer and complete terms dated22October2026 via ordinary public HTTPS GET. Neither booking menu nor selected dentist services publish numeric procedure prices; terms2 explicitly says treatment, duration and price are determined after exam. Free online booking is not a free dental service. No hidden/blocked tariff was treated as unpublished.',
  notes: 'Own actual booking section explicitly offers voice-phone alternative on the exact same number, so phone entry is honest even though interactive calendar was not exercised. All8public dentist offerings visible; only ordinary exam and cleaning selected, not unrelated medicine. Terms3 says requested hour requires final clinic confirmation and procedure lengths are approximate; no duration scalar or automated availability promise imported. Exact patient venue and weekdays08–20 corroborated in terms. Copyright clause covers texts/photos/logo/design; root expressly cleared minimal independently phrased factual business data only, no asset/prose reuse.',
})

const saghir = 'https://www.saghirdent.com/', saghirBook = `${saghir}kontakti/`
add({
  id: 'sofia-saghir-dent-vasil-levski13', name: 'Saghir Dent', category: 'other', address: 'София, бул. Васил Левски 13', website: saghir, phone: '+359885505205', booking: { kind: 'form', url: saghirBook },
  services: [service('other', 'Първичен стоматологичен преглед', 'Предварителна заявка за преглед и план за дентално лечение. Клиниката се свързва за потвърждение; желаните ден и час може да са заети. Точният обхват и финансовите условия се уточняват с екипа.')],
  openingHours: hours(saghirBook, [1,2,3,4,5].map(day => [day, '09:00', '20:00'])),
}, {
  bookingUrl: saghirBook, excerpt: 'Запишете час за преглед ... Ние ще се свържем с вас, за да потвърдим запазването на прегледа.',
  reviewedUrls: [saghir, saghirBook, `${saghir}uslugi/`, `${saghir}nashata-klinika/`], serviceUrls: [`${saghir}uslugi/`, `${saghir}nashata-klinika/`],
  priceSearchNotes: 'Followed own Reserve-exam entry into the actual examination-request form, not merely contact details, then complete own general dental-services page and clinic first-consultation FAQ plus footer. Visible form asks name/phone/email and desired appointment; no procedure prices in this flow or reviewed selected examination description and no tariff link in those menus. No inaccessible price page was labelled unpublished; exact service fee remains absent.',
  notes: 'One genuine dental venue corroborated by contact and clinic FAQ, not repeated staff or equivalent Cyrillic URL alias. Actual public examination-request form and confirmation warning read without fields, consent, calendar choice or submission. First consultation is an exam/diagnostic discussion and treatment plan; no unrelated medicine, fillers or other injection service imported. MonFri09–20 literal contact schedule only; first/third Saturday monthly pattern cannot be represented as every Saturday, so Saturdays omitted. No fee, duration, map point, source photo or clinical outcome claim invented.',
})

const iris = 'https://irisception.com/', irisBook = `${iris}zapazete-chas/`, irisFaq = `${iris}chesto-zadavani-vaprosi/`, irisPrices = `${iris}czeni/`, irisContact = `${iris}kontakti/`
add({
  id: 'sofia-irisception-tsar-asen47', name: 'Irisception · ирисова фотография', category: 'other', address: 'София, ул. Цар Асен 47', website: iris, phone: '+359888852036',
  services: [service('other', 'Ирисова фотосесия · един ирис и фотохартия 20×20 см', 'Базова цена за заснемане на един ирис с печат върху фотохартия 20×20 см. Рамка, ефекти и дигитален файл са по отделни тарифи. Предварително записване по телефон; целият процес е приблизително 30–40 минути, според страницата с цени.', { price: price(40.9, 'един ирис + фотохартия 20×20 см · базова цена', irisPrices) })],
  openingHours: hours(irisContact, [2,3,4,5,6,7].map(day => [day, '11:00', '18:00'])),
}, {
  bookingUrl: irisFaq, contactUrl: irisContact, excerpt: 'Можете да запазите час ... като се свържете с нас на телефон 088 885 2036.',
  reviewedUrls: [iris, irisBook, irisFaq, irisPrices, irisContact, `${iris}obsthi-usloviya/`],
  notes: 'Actual Bookly Book page visited first: readable instructions but HTML widget only Loading, not claimed exercised or rendered calendar. Independent complete owner FAQ expressly permits voice-phone booking, so row honestly uses phone booking. Current own tariff table explicitly one-iris20×20 photo-paper base80BGN/40.9EUR; literal EUR retained, no conversion, voucher fee or ambiguous digital-file/add-on sum invented. Booking says30minutes, tariff30–40, so no fixed duration scalar. Exact TsarAsen47 patient-free photo venue/contactTueSun11–18 corroborated. Terms concern gift vouchers and copyright texts/images/graphics, not a ban on independently phrased factual business data; no source artwork or prose reused.',
})

const belev = 'https://advokatbg.net/', belevBook = `${belev}advokat-lazar-belev-kontakti/`, belevPrice = `${belev}bezplatni-pravni-konsultacii/`
add({
  id: 'sofia-lazar-belev-tundzha3', name: 'Адвокат Лазар Белев', category: 'consulting', address: 'София, ул. Тунджа 3, ет.1', website: belev, phone: '+359876217476',
  services: [service('consulting', 'Правна консултация в кантората', 'Присъствена платена консултация след предварително уговорени дата и час по телефон. Публикуваната ставка е 30,68 € за час, не безплатната форма за кратки онлайн въпроси. Обхватът и заплащането се уточняват при записване.', { price: price(30.68, 'час · консултация на място в офиса', belevPrice) })],
  openingHours: hours(belev, [1,2,3,4,5].map(day => [day, '10:00', '19:00'])),
}, {
  bookingUrl: belevBook, excerpt: 'консултации ... след предварително уговорени дата и час за среща на тел. 0876 217 476',
  reviewedUrls: [belev, belevBook, belevPrice],
  notes: 'Actual own appointments/contact page explicitly phone-agreed Sofia office visit, followed by accessible actual consultation fee section: onsite30.68EUR/60BGN perhour; remote20minute15.34EUR and asynchronous email excluded. No automatic60-minute appointment scalar inferred from hourly billing. Current homepage/footer identifies Tundzha3floor1 and weekday10–19; contact body has obvious missing-n typo Tud zha but header/footer agree Tundzha. Specific family-law detail returned verification challenge; stopped that path, not treated as reviewed or used as a no-public-price receipt. Only independently sourced general paid consultation selected; no client comments, legal advice or case stories imported.',
})

const veselinov = 'https://lawyer-georgiveselinov.com/', veselinovBook = `${veselinov}online-booking/`, veselinovServices = `${veselinov}practice-areas-2/`, veselinovContact = `${veselinov}contacts/`
add({
  id: 'sofia-georgi-veselinov-lavele19', name: 'Адвокатска кантора Георги Веселинов и партньори', category: 'consulting', address: 'София, ул. Лавеле 19, ет.3', website: veselinov, phone: '+359899121711',
  services: [service('consulting', 'Правна консултация в кантората', 'Предварително уговорена лична среща за преглед на случая и възможните правни действия. Хонорарът зависи от вида, сложността и обема на работата и се уточнява с кантората. Онлайн записването има изрична телефонна алтернатива.')],
  openingHours: hours(veselinovContact, [1,2,3,4,5].map(day => [day, '09:00', '18:00'])),
}, {
  bookingUrl: veselinovBook, contactUrl: veselinovContact, excerpt: 'Алтернативно можете да се свържете с нас по телефон на (0899) 121711 ... за ... записване на час',
  reviewedUrls: [veselinov, veselinovBook, veselinovServices, veselinovContact], serviceUrls: [veselinovServices, veselinovBook],
  priceSearchNotes: 'Followed actual Online-consultation booking entry first, visible November calendar plus complete appointment FAQ explicitly offering alternative voice-phone booking, then complete Services roster and own Contact/footer via ordinary HTTPS after reader cache misses. No numeric consultation fee in these pages. FAQ says fee is individually set by case complexity/volume; statutory guideline reference is not a published business quote and was not converted into an amount. No blocked tariff link or incomplete rendered price menu used as absence evidence.',
  notes: 'Specific first-party FAQ explicitly supplies phone appointment alternative and exact Lavele19floor3 office; contact corroborates same publicphone and weekday09–18. Calendar stage only was inspected, no date selected and no online availability/completed booking claimed. One law office not staff clones; service roster includes onsite legal consultation plus separately online services, so online-only service not relabelled. Contact template info@email.com ignored in favour of consistent official businessphone, no email stored. No prices/duration inferred or source legal advice/photos reused.',
})

const filipova = 'https://advokatfilipova.eu/', filipovaBook = `${filipova}kontakti/`, filipovaService = `${filipova}drugi-pravni-uslugi/`
add({
  id: 'sofia-desislava-filipova-parchevich1', name: 'Адвокатска кантора Десислава Филипова', category: 'consulting', address: 'София, ул. Петър Парчевич 1, ет.5, ап.14', website: filipova, phone: '+359879021272',
  services: [service('consulting', 'Правна консултация в кантората', 'Лична консултация след предварително уговорен час. Разглеждат се фактите, документите и възможните правни рискове. Преди възлагане се съгласуват обхватът, срокът и адвокатското възнаграждение.')],
  openingHours: hours(filipovaBook, [1,2,3,4,5].map(day => [day, '09:00', '17:30'])),
}, {
  bookingUrl: filipovaBook, excerpt: 'Консултациите са след предварително записване на час! ... +359 879 021 272',
  reviewedUrls: [filipova, filipovaBook, filipovaService], serviceUrls: [filipovaService, filipovaBook],
  priceSearchNotes: 'Followed real Legal-help inquiry/Contact entry first with explicit prior-appointment consultations and voice-phone call CTA, then complete general legal-services offer over ordinary current HTTPS after reader timeout. No numeric consultation tariff or fee-menu link on these selected pages or homepage; full service says scope, deadline and honorarium agreed before assignment. Missing fee left absent, not free. No inaccessible price menu substituted; Own menu General Terms actually points to Contact and is not represented as substantive separate terms.',
  notes: 'Current owned Contact and homepage corroborate exact Parchevich1floor5apt14, publicphone and MonFri09–17:30. Phone entry is explicit appointment-only consultation, not a generic contact claim. Reader service timeout resolved by ordinary public HTTPS200 GET, not a refusal, CAPTCHA or bypass. Robots200 general search/reference permitted, training crawlers disallowed; no training, articles/images reuse or general license claimed. No fields/consent or embedded map activated; cached map-plugin coordinates intentionally NOT imported. Copyright materials/publications not copied; minimal independently phrased factual reference only. One firm, no staff/foreign-client aliases; no fee/duration invented.',
})

const edelvais = 'https://edelvaische.com/', edelvaisTerms = `${edelvais}pages/terms-and-conditions.html`
add({
  id: 'sofia-edelvais-vitosha50', name: 'Учебен център Еделвайс · НДК', category: 'education', address: 'София, бул. Витоша 50', website: edelvais, phone: '+359897825505', booking: { kind: 'form', url: edelvais },
  services: [service('education', 'Индивидуален урок по български език и литература за ученици', 'Работа едно към едно с преподавател след заявка и потвърждение от центъра. Публикувана продължителност 90 минути; конкретните програма, присъствен график и такса се уточняват при записването.', { durationMin: 90, durationSourceUrl: edelvais, durationCheckedOn: checkedOn })],
}, {
  bookingUrl: edelvais, excerpt: 'Запишете се ... Получаваме запитването ... Обаждаме се ... Предлагаме подходящия курс',
  reviewedUrls: [edelvais, edelvaisTerms], serviceUrls: [edelvais, edelvaisTerms],
  priceSearchNotes: 'Actual own Enroll entry is homepage contact form with personal contact fields and course-interest selector including BEL, then staff callback; inspected without inputs or submit. Complete visible homepage service/individual-format/pricing sections and full May2026 terms via ordinary public HTTPS. They explicitly invite contact for current individual fee and terms4 says price determined by course, format and duration; no numeric fee or blocked tariff link in the reviewed flow. Dynamic general course-card area was not claimed a reviewed numeric price menu; selected individual offer and its fee instruction are fully public.',
  notes: 'Only ONE school record at primary Vitosha50 venue: own school-classrooms/NDK presentation, current Contact and full terms corroborate first address. Secondary HanAsparuh39 is NOT cloned because branch-specific lesson enrollment not independently established. Own service explicitly individual90minutes alongside separate small/standard groups; selected BEL tutoring only, no daycare or unverified art-therapy specialist. Request→callback→agreed program/format is real advance enrollment, not automatic availability. ContactMonSat09–19 may be administration rather than individual teaching timetable, so omitted. Terms retain unfilled registry placeholder, not invented owner identity; no student photos/testimonials or source prose copied.',
})

const chenkov = 'https://architectureconsulting.eu/bg/', chenkovBook = `${chenkov}%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/`, chenkovService = `${chenkov}%D0%BA%D0%BE%D0%BD%D1%81%D1%83%D0%BB%D1%82%D0%B0%D1%86%D0%B8%D0%B8/`
add({
  id: 'sofia-chavdar-chenkov-site-consultation', name: 'Арх. Чавдар Ченков · консултация на място', category: 'consulting', locationKind: 'service_area', website: chenkov, phone: null, booking: { kind: 'form', url: chenkovBook },
  services: [service('consulting', 'Архитектурна консултация на място в София', 'Еднократна устна консултация на обекта след предварителна заявка. Публикувани 150 € без ДДС, плюс транспорт. Крайната цена може да варира според обема, времето, отдалечеността и спешността; писмено становище е отделна услуга.', { appointmentModel: 'home_visit', price: price(150, 'еднократна устна консултация · без ДДС и транспорт', chenkovService) })],
}, {
  bookingUrl: chenkovBook, excerpt: 'Ако желаете да запазите час за консултация на място в София ... попълнете формата за контакт.',
  reviewedUrls: [chenkov, chenkovBook, chenkovService],
  notes: 'Followed actual Reserve-consultation→owner contact form first, real name/email/property-region/service/question and optional document-upload fields plus explained confirmation→proposed onsite/online meeting. Did not enter/upload/submit. Full selected service explicitly offers onsite appointment in Sofia with travel and property-size/time/distance/urgency qualifiers; one Sofia mobile provider, not invented offices or quarter clones. Literal onsite architectural150EUR excludingVAT+transport retained; online100/email60, constructordifferent80 and written220 not conflated. No phone or exact weekly schedule published in these inspected pages; nullphone, nulladdress and nullcoordinates honest service_area. Privacy link reader cache miss is not claimed a full terms review; no source photographs/project plans or prose reused.',
})

export default { records, reviews }
