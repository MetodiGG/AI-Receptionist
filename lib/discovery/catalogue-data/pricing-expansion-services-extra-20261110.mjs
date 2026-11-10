// Additional distinct owners reviewed on 10 November 2026. No Google data,
// ratings, photos, currency conversion or appointment availability imported.
const checkedOn = '2026-11-10', validUntil = '2027-02-08'
const fee = (name, amount, sourceUrl, options = {}) => ({
  name, category: options.category || 'other', appointmentModel: options.appointmentModel || 'appointment',
  ...(options.description ? {description:options.description} : {}),
  price:{amount,currency:'EUR',kind:'fixed',sourceUrl,checkedOn,validUntil,...options.price},
  ...(options.minutes ? {durationMin:options.minutes,durationSourceUrl:options.durationSourceUrl||sourceUrl,durationCheckedOn:checkedOn} : {}),
})
const point = (latitude,longitude,source) => ({latitude,longitude,source,method:'first_party_coordinates'})
const record = (id,name,website,phone,address,neighborhood,services,bookingSource,excerpt,options={}) => ({
  id,name,category:'other',cityCode:'68134',address,neighborhood,
  locationKind:options.locationKind||'premises',coordinates:options.coordinates||null,
  website,phone,services,booking:options.booking||{kind:'phone',phone},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:bookingSource,excerpt},contact:bookingSource},
})
const review = (row,urls,notes) => ({
  id:row.id,website:row.website,checkedOn,
  bookingEntry:row.booking.kind==='phone'?'phone':row.booking.url,
  bookingReview:row.booking.kind==='phone'?'phone_booking_reviewed':'owned_booking_reviewed',
  reviewedUrls:[...new Set([row.website,...urls])],notes,
})
const denta='https://dentaconsult.bg/', dentaContact='https://dentaconsult.bg/kontakti/', dentaPrices='https://dentaconsult.bg/tseni/'
const sofia='https://sofianikolova.com/', sofiaPrices='https://sofianikolova.com/pricing-2/'
const ilkova='https://logopedite.com/', ilkovaPrices='https://logopedite.com/ceni/', ilkovaContact='https://logopedite.com/kontakti/'
const vesta='https://vesta.help/', vestaBook='https://vesta.help/zapisvane-na-chas/', vestaPrices='https://vesta.help/czeni/'
const pooh='https://logoped-mechopuh.bg/', poohBook='https://logoped-mechopuh.bg/zapishi-chas', poohPrices='https://logoped-mechopuh.bg/ceni'
const merida='https://logopedmerida.com/', meridaTerms='https://logopedmerida.com/obshti-uslovia/'
const aei='https://www.eiacademy.bg/', aeiBook='https://www.eiacademy.bg/uslugi/individualni-konsultatsii', aeiPrices='https://www.eiacademy.bg/uslugi/tsenorazpis'
const faria='https://psihoterapiafaria.com/', fariaBook='https://psihoterapiafaria.com/adress-kontakti/', fariaPrices='https://psihoterapiafaria.com/ceni/'
const empathy='https://centerempathy.com/', empathyContact='https://centerempathy.com/contacts/'
const psyche='https://psiholog.co/', psycheContact='https://psiholog.co/за-контакт/', psychePrices='https://psiholog.co/цени/'
const change='https://psihoterapia.site/', changeContact='https://psihoterapia.site/контакти/', changePrices='https://psihoterapia.site/цени/'

const records=[
  record('sofia-denta-consult-kazbek','Denta Consult · Казбек',denta,'+359877815308','София, кв. Манастирски ливади, ул. Казбек 57А, вх. Б','Манастирски ливади',[
    ...[['Клинична консултация',60],['Пълна дигитална диагностика',110],['Кондилография · записи на движенията на челюстта',1000],['Планиране и дизайн на усмивката',500],['Постендодонтска реконструкция',150],['Професионална орална хигиена',110]].map(([name,amount])=>fee(name,amount,dentaPrices,{description:'Ориентировъчна частна тарифа; окончателно според индивидуалния случай и лечебния план.'})),
    ...[['Композитна пломба',150,250],['Кореново лечение под микроскоп',150,600],['Екстракция на мъдрец',150,300],['Пародонтална хигиенна сесия',110,300]].map(([name,amount,maximum])=>fee(name,amount,dentaPrices,{price:{kind:'range',maximum},description:'Публикуван ориентировъчен диапазон според случая; конкретният обхват се уточнява при консултация.'})),
    ...['Керамична възстановителна единица','Хибридна възстановителна единица'].map(name=>fee(name,600,dentaPrices,{price:{unit:'единица'},description:'Ориентировъчна цена за една възстановителна единица.'})),
    fee('Единичен имплант Straumann / Neodent · хирургично поставяне',900,dentaPrices,{description:'Ориентировъчна цена само за хирургично поставяне; коронката не е включена.'}),
    fee('Прозрачни алайнери · цялостно лечение',7500,dentaPrices,{price:{unit:'лечение'},description:'За двете челюсти; ориентировъчен общ лечебен план, не единично посещение.'}),
    fee('Метални брекети Damon Ultima · цялостно лечение',5000,dentaPrices,{price:{unit:'лечение'},description:'За двете челюсти, с поставяне и активации; ориентировъчен общ план, не отделен час.'}),
  ],dentaContact,'За да запазите удобен ден и час за консултация, обадете се или изпратете запитване.',{coordinates:point(42.6657333,23.2824875,dentaContact)}),
  record('sofia-sofia-nikolova-logoped','София Николова · логопед и психолог',sofia,'+359888197297','София, ж.к. Лозенец, ул. Църноок 5','Лозенец',[
    fee('Логопедична консултация',45,sofiaPrices),
    fee('Логопедично обследване и статут',55,sofiaPrices),
    fee('Логопедична терапия',30,sofiaPrices,{minutes:40}),
    fee('Гещалт консултация',50,sofiaPrices,{minutes:50}),
  ],sofiaPrices,'Запазете час; ще се свържем, за да уточним детайлите на резервацията.'),
  record('sofia-veselina-ilkova-home-logoped','Веселина Илкова · логопед на адрес',ilkova,'+359898776090',null,'Надежда',[
    fee('Онлайн логопедична консултация · след първата',40,ilkovaPrices,{minutes:45,description:'Първата онлайн консултация е безплатна; сумата е обичайната следваща консултация.'}),
    fee('Логопедична диагностика / статус',55,ilkovaPrices,{minutes:60}),
    fee('Онлайн логопедична терапия',30,ilkovaPrices,{description:'Публикувана продължителност 30–45 минути.'}),
    fee('Логопедично посещение на адрес · уикенд',65,ilkovaPrices,{appointmentModel:'home_visit',description:'В рамките на София, по предварителна уговорка; 30–45 минути.'}),
    fee('Логопедично посещение на адрес · делничен ден',55,ilkovaPrices,{appointmentModel:'home_visit',price:{kind:'range',maximum:60},description:'София, 30–45 минути; диапазон според сложността и локацията.'}),
    fee('Правоговор / сценична реч',30,ilkovaPrices,{minutes:45}),
    ...[['Оценка с DENVER II',55],['Оценка с DESK 3–6',55],['Пълна орофациална миофункционална оценка',60],['Логопедична диагностика и терапия на възрастни след инсулт',60]].map(([name,amount])=>fee(name,amount,ilkovaPrices)),
    ...[[4,100],[8,200]].map(([count,amount])=>fee(`Онлайн логопедична терапия · пакет ${count} сесии`,amount,ilkovaPrices,{price:{unit:'пакет'},description:'Обща цена за пакета; не е цена за една сесия.'})),
  ],ilkovaContact,'Свържете се по телефон или чрез формата, за да запишете консултация; онлайн и домашни посещения в София.',{locationKind:'service_area'}),
  record('sofia-vesta-help-mladost','Vesta Help · психология и логопедия',vesta,'+359877508700','София, ж.к. Младост 4, бл. 429, партер, вход 4','Младост 4',[
    fee('Психологично консултиране · възрастен',40,vestaPrices,{minutes:50}),
    fee('Психологично консултиране · дете',40,vestaPrices,{description:'40–50 минути според възрастта на детето.'}),
    fee('Логопедична консултация',35,vestaPrices,{minutes:50}),
  ],vestaBook,'Изберете вид консултация и възможни дни; специалистът се свързва, за да уговори първата среща.',{booking:{kind:'form',url:vestaBook},coordinates:point(42.6324326,23.3781813,vesta)}),
  record('sofia-logoped-mecho-puh-kableshkov','Логопедичен център Мечо Пух',pooh,'+359888877600','София, ж.к. Гоце Делчев, бул. Тодор Каблешков 24','Гоце Делчев',[
    ...[['Консултация с логопед / психолог / ерготерапевт',45],['Първичен преглед с Боряна Мургина',50],['Вторично или последващо консултиране',45],['Комплексна програма за родители',55],['Логопедична консултация с Боряна Мургина',45],['Консултация с детски психолог',50],['Детска психологическа терапия',46],['Работа със специален педагог',35]].map(([name,amount])=>fee(name,amount,poohPrices,{minutes:60})),
    fee('Специализирано обследване · една среща',50,poohPrices,{minutes:60,price:{unit:'среща'},description:'Възможни са повече срещи според индивидуалния план; сумата не е обща цена за целия процес.'}),
    ...[[1,45],[2,40],[3,35],[4,30]].map(([frequency,amount])=>fee(`Логопедична терапия · ${frequency} посещения седмично`,amount,poohPrices,{minutes:60,price:{unit:'посещение'},description:`Цена за една сесия при договорена честота ${frequency} пъти седмично, не седмичен пакет.`})),
  ],poohBook,'Заявете консултация чрез формата; центърът ще се свърже с Вас в рамките на 72 часа.',{booking:{kind:'form',url:poohBook}}),
  record('sofia-merida-logoped-iztok','Логопедичен кабинет Мерида',merida,'+359885987127','София, кв. Изток, ул. Райко Алексиев 20, партер','Изток',[
    fee('Логопедична консултация',40,meridaTerms),
    fee('Логопедична терапия · до 3 посещения седмично',30,meridaTerms,{minutes:50,price:{unit:'посещение'},description:'За един клиент при посещение до 3 пъти седмично; отделно заплащане за всяка сесия.'}),
    fee('Логопедична терапия · над 3 посещения седмично',28,meridaTerms,{minutes:50,price:{unit:'посещение'},description:'Условна цена за един клиент при посещение повече от 3 пъти седмично; не общ пакет.'}),
  ],meridaTerms,'Терапията се провежда по предварително уговорен и утвърден индивидуален график.',{coordinates:point(42.674054,23.3567318,merida)}),
  record('sofia-academy-emotional-intelligence-vitosha','Академия за емоционална интелигентност · консултации',aei,'+359883707031','София, Център, бул. Витоша 50, ет. 1','Център',[
    fee('Индивидуална консултация · възрастен',45,aeiPrices,{minutes:50,durationSourceUrl:aeiBook}),
    fee('Индивидуална консултация · дете',38,aeiPrices,{minutes:50,durationSourceUrl:aeiBook}),
    fee('Консултация за двойка',70,aeiPrices),
    ...[[3,120,105],[8,280,240]].flatMap(([count,adult,child])=>[
      fee(`Индивидуални консултации · възрастен, пакет ${count} срещи`,adult,aeiPrices,{price:{unit:'пакет'},description:`Обща цена за ${count} срещи, не цена за едно посещение.`}),
      fee(`Индивидуални консултации · дете, пакет ${count} срещи`,child,aeiPrices,{price:{unit:'пакет'},description:`Обща цена за ${count} срещи, не цена за едно посещение.`}),
    ]),
    fee('Индивидуална консултация · възрастен след изчерпан пакет',40,aeiPrices,{minutes:50,durationSourceUrl:aeiBook,description:'Условна цена за допълнителна среща след закупен и изчерпан пакет.'}),
    fee('Индивидуална консултация · дете след изчерпан пакет',35,aeiPrices,{minutes:50,durationSourceUrl:aeiBook,description:'Условна цена за допълнителна среща след закупен и изчерпан пакет.'}),
  ],aeiBook,'Индивидуални консултации с предварително записване по телефон; екипът съдейства за избора на специалист.'),
  record('sofia-studio-faria-ilinden','Студио Фариа · Мина Касабова',faria,'+359889866798','София, ж.к. Илинден, бул. Александър Стамболийски 186, бл. 12-1, вх. А, ет. 1','Илинден',[
    ...['Консултация на място в Студио Фариа','Онлайн консултация с психолог','Индивидуална терапия'].map(name=>fee(name,40.9,fariaPrices,{minutes:60,description:'Частна услуга; студиото не работи със здравна каса или допълнително здравно осигуряване.'})),
  ],fariaBook,'Запазете си час чрез официалния контакт с психолог Мина Касабова.',{coordinates:point(42.7013282,23.2933319,fariaBook)}),
  record('sofia-empathy-diana-dimitrova','Център Емпатия · Диана Димитрова',empathy,'+359893019526','София, Център, ул. Триадица 5Б, ет. 4, кабинет 401','Център',[
    ...[['Индивидуална психологична консултация · над 18 години',35.79],['Семейна консултация',46.02],['Детско-юношеска консултация · до 18 години',30.68],['Психодиагностика',40.9]].map(([name,amount])=>fee(name,amount,empathy,{minutes:60})),
    fee('Психологично домашно посещение · София',51.13,empathy,{minutes:60,appointmentModel:'home_visit',description:'Само в рамките на град София, с предварителна уговорка.'}),
  ],empathy,'За всички видове консултации е нужно предварително записване на час по посочения телефон.'),
  record('sofia-specialized-psychology-graf-ignatiev','Специализиран център за психология и психотерапия · Граф Игнатиев',psyche,'+359884638696','София, Център, ул. Граф Игнатиев 47Б, ет. 3, вход от ул. Любен Каравелов','Център',[
    ...[['Индивидуална психологична консултация',45],['EMDR терапия',50],['Психотерапия за възрастни',45],['Психологична консултация / психотерапия на английски',80],['Хипноза',55],['Детско-юношеска психологична консултация',45],['Детско-юношеска психотерапия',45],['Консултация родител с дете',60],['Онлайн психологична консултация / психотерапия',45],['Психологична консултация по телефон',45],['Психодиагностика с тестове',80],['Консултация за личностно развитие',45],['Диагностика за дислексия',80]].map(([name,amount])=>fee(name,amount,psychePrices,{minutes:60})),
    fee('Семейно-брачна консултация · двама партньори',65,psychePrices,{minutes:60}),
    fee('Семейно-брачна консултация · един партньор',45,psychePrices,{minutes:60}),
    fee('Психиатрична консултация за възрастни',60,psychePrices,{minutes:45}),
  ],psycheContact,'Телефон за записвания в София; индивидуални и семейни консултации в кабинета.'),
  record('sofia-promyana-sixth-september','Център за психологична помощ и психотерапия Промяна',change,'+359886444024','София, Център, ул. 6-ти септември 45, ет. 1','Център',[
    ...[['Индивидуална психологична консултация · възрастен',40],['Психотерапия за възрастни',45],['Психологична консултация / психотерапия на английски',80],['Хипноза',55],['Детско-юношеска психологична консултация',45],['Детско-юношеска психотерапия',45],['Онлайн психологична консултация / психотерапия',45],['Консултация за личностно развитие',45]].map(([name,amount])=>fee(name,amount,changePrices,{minutes:60})),
    fee('Семейно-брачна консултация · двама партньори',65,changePrices,{minutes:60}),
    fee('Семейно-брачна консултация · един партньор',45,changePrices,{minutes:60}),
    fee('Онлайн психиатрична консултация',60,changePrices,{minutes:40}),
    fee('Психодиагностика с тестове',80,changePrices,{description:'С писмени резултати в рамките на 3 работни дни.'}),
    fee('Домашно посещение от психолог / психотерапевт / психиатър',130,changePrices,{appointmentModel:'home_visit',description:'В рамките на град София; видът специалист и посещението се уточняват предварително.'}),
  ],changeContact,'Запазете час по официалния телефон на центъра в София.'),
]

const reviews=[
  review(records[0],[dentaContact,dentaPrices],'Actual consultation form and explicit phone-booking instructions reviewed before current owner EUR table. Common doctor tariff explicitly stated. Ranges, per-unit and whole-treatment prices retained; implant crown exclusion preserved. Exact owner-linked map marker, not viewport center. No medical outcome, availability, patient cases or photos imported.'),
  review(records[1],[sofiaPrices,'https://sofianikolova.com/book-therapy/'],'Actual owner Book link returned 502; existing owner phone and explicit reserve/confirmation instructions retained as fallback. Current owner ordinary EUR fees and only explicit fixed durations imported. No invented address coordinates or promised form availability.'),
  review(records[2],[ilkovaContact,ilkovaPrices],'Actual consultation booking/contact route reviewed before owner prices. Mobile service-area listing with no invented street or coordinates. Free first-online consultation condition retained without importing a promotional zero price. Duration ranges not flattened. Four/eight-session totals not treated as per-visit prices.'),
  review(records[3],[vestaBook,vestaPrices],'Actual appointment form for consultation type and preferred day/time read-only; clinician confirms by callback. Ordinary owner EUR fees read; child session is 40–50-minute range, not fixed. Owner-linked exact map marker retained. No personal or health information entered, no schedule selected.'),
  review(records[4],[poohBook,poohPrices],'Actual consultation request form reviewed before current owner EUR tariff. Per-session weekly-frequency discounts distinguished from package totals. In-depth assessment can require multiple sessions, so fee per meeting explicitly retained. Childcare subscriptions, food charges and document-only fees excluded. No personal data or application submitted.'),
  review(records[5],[meridaTerms,'https://logopedmerida.com/uslugi/logopedichna-konsultatsia/'],'Actual owner Book/contact invitation and consultation route reviewed; owner general working terms explicitly define advance individual schedule and literal EUR tariffs. 50-minute therapy and attendance-frequency conditions preserved. No 5% prepaid reduction computed; owner map marker only, no patient data or forms submitted.'),
  review(records[6],[aeiBook,aeiPrices],'Actual individual consultation route explicitly states advance phone booking and team selection. Owner tariff read before subsequent 429; no challenge bypass or retry. Desislava Damyanova has stopped individual sessions: record is the academy team, not an appointment with her. Ordinary adult/child fees, distinct couple fee, three/eight-session package totals and post-package conditions retained. No city-center coordinates invented.'),
  review(records[7],[fariaBook,fariaPrices],'Actual root Book button leads to the owner contact page. Three literal published EUR fees each explicitly cover 60 minutes; no currency conversion, unnamed group price, document-only fee or course imported. Exact owner GPS destination includes address and coordinates; not a generic map viewport. No patient or booking data submitted.'),
  review(records[8],[empathyContact],'Owner consultation flow explicitly requires advance phone appointment. Five literal dual-published EUR amounts and 60-minute sessions retained without converting BGN. Home service restricted to Sofia. Contact embed is viewport-only, so no unverified precise coordinates copied. No claims of clinical outcomes or available slots.'),
  review(records[9],[psycheContact,psychePrices,'https://psiholog.co/групова-психотерапия/'],'Actual owner office page explicitly gives appointment phone. Distinct owner/contact from Promyana, not merged by similar services. Current owner EUR core tariffs used; psychiatric duration is the specific 45-minute exception. Home-visit tariff conflicts between owner pages (120 versus 130), therefore those prices withheld rather than choosing one. Document-only/expert fees excluded; generic embedded map center not used as a location marker.'),
  review(records[10],[changeContact,changePrices],'Actual appointment phone and precise Sofia office read before owner EUR table. Distinct address and phone from psiholog.co verified. Partner-count price conditions and explicit online psychiatry 40-minute duration preserved. Home fee is Sofia only; no document/weapon/TELK fees or availability imported, and no invented map point.'),
]

export const pendingPricingResearch=[
  {id:'new-anmavi',urls:['https://www.logoped-sofia.com/bg/contacts.html','https://www.logoped-sofia.com/bg/ceni.html'],reason:'Owner publishes tariff and two offices, but explicit advance-booking route not yet established from reviewed contact-only page. Do not add two offices or assign generic phone to appointment flow without evidence.'},
  {id:'new-intherapy',urls:['https://intherapy.bg/czeni/','https://intherapy.bg/kontakti/'],reason:'Owner tariff lists Rakovski 70, while actual appointment contact route lists Moskovska 27B with the same phone. Premises conflict unresolved; no invented active address or duplicate branch.'},
  {id:'new-albena-venkova',urls:['https://psihologsofia.bg/','https://psihologsofia.bg/contacts/'],reason:'Owner consultation price visible but real Sofia premises not published; phone appears only in modal with placeholder-like digits. Contact quality requires confirmation before catalogue admission.'},
  {id:'new-adeli',urls:['https://adeli.bg/logoped/','https://adeli.bg/bezplatna-konsultatziya/'],reason:'Actual appointment request route and Sofia address readable, but fee page incomplete/timeouts. Do not promote search-snippet prices to verified price facts.'},
]
export default {records,updates:[],reviews}
