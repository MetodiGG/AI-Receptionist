// Manual owner-source review, 10 November 2026. No provider ratings, photos,
// currency conversion, availability claims or appointments have been copied.
const checkedOn = '2026-11-10', validUntil = '2027-02-08'
const service = (name, amount, sourceUrl, category, options = {}) => ({
  name, category, appointmentModel: options.appointmentModel || 'appointment',
  ...(options.description ? { description: options.description } : {}),
  price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil, ...options.price },
  ...(options.minutes ? { durationMin: options.minutes, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn } : {}),
})
const phoneRecord = (id, name, category, website, phone, address, neighborhood, services, bookingUrl, excerpt, locationKind = 'premises') => ({
  id, name, category, cityCode: '68134', neighborhood, address, locationKind, coordinates: null,
  website, phone, services, booking: { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn, validUntil, booking: { url: bookingUrl, excerpt }, contact: bookingUrl },
})
const receipt = (id, website, urls, notes, bookingEntry = 'phone', bookingReview = 'phone_booking_reviewed') => ({
  id, checkedOn, website, bookingEntry, reviewedUrls: [...new Set([website, ...urls])], bookingReview, notes,
})
const physio = 'https://sofiaphysiocenter.com/ceni'
const dental = 'https://dentalplace.bg/ceni/'
const dentalBook = 'https://dentalplace.bg/zapazete-chas/'
const yan = 'https://yanphysio.com/pricelist/'
const nota = 'https://www.notabg.com/цени'
const belief = 'https://www.newbelieftherapy.com/'
const ina = 'https://inacademy.bg/'
const healthMaster = 'https://healthmasterclinic.com/cenorazpis/'
const healthBook = 'https://healthmasterclinic.com/zapishete-chas/'
const point = 'https://www.physiopoint-bg.com/'
const vocal = 'https://vocalvisionhouse.com/tseni/'
const myMusic = 'https://mymusic.center/ceni/'
const guitar = 'https://mymusic.center/product/kitara/'
const topal = 'https://topalcenter.com/prices/'
const phHealth = 'https://physiohealth.bg/ceni/'
const stars = 'https://zvezdichki.com/'
const bba = 'https://www.law-bba.com/online-zapitvane'
const bbaOnline = 'https://www.law-bba.com/online-konsultaciya'
const kavazova = 'https://advokatkavazova.com/консултация/'
const sokol = 'https://www.sokolnedkov.bg/appointment/'
const omniIztok = 'https://app.acuityscheduling.com/schedule/47f44108/?calendarIds=8605907'
const omniAmaya = 'https://omnibodyhealthcare.as.me/amaya-massage-therapy'
const snap = 'https://superdoc.bg/lekar/sashka-hadzhieva'
const petrova = 'https://kantorapetrova.com/consultation'
const petrovaPhone = 'https://kantorapetrova.com/consultation/phone'
const mandala = 'https://www.studiomandala.eu/'
const okto = 'https://okto.bg/tsenorazpis/'
const npDental = 'https://npdentalclinic.com/pricing-list'
const musicBox = 'https://www.music-box.bg/userfiles/files/Fees.pdf'
const paw = 'https://paw-paw.bg/'
const podstrizhime = 'https://podstrizhime.bg/'
const bono = 'https://bonogrooming.com/цени/'
const lovePets = 'https://book.loveyourpets.bg/reservations/start?site=1'
const ketty = 'https://kettyvandova.bg/czeni/'
const kettyBook = 'https://kettyvandova.bg/kontakti/'
const rhythm = 'https://rhythm-academy.com/ceni/'
const dara = 'https://daraphysiotherapy.bg/tcenorazpis/'
const vibomi = 'https://vibomi.bg/tseni'
const office = 'https://officetherapy.bg/czenorazpis/'
const avarton = 'https://avartonmusic.com/prices'
const malki = 'https://www.malkimuzikalniuroci.com/ceni'
const artShock = 'https://artandshock.com/'
const kolev = 'https://kolev.net/'
const kolevBook = 'https://cal.com/akolev/session'
const mvc = 'https://www.mvcbulgaria.com/price'
const dmBook = 'https://www.dmphysi0.com/book'
const dmStudentski = 'https://www.dmphysi0.com/book/hristo-danov'
const dmMladost = 'https://www.dmphysi0.com/book/mladost'
const dmKinet = 'https://www.dmphysi0.com/procedures/details-kinesitherapy.html'
const dmMedical = 'https://www.dmphysi0.com/procedures/lecheben-masaj.html'
const dmDeep = 'https://www.dmphysi0.com/procedures/masaj.deeptisue.html'

const yanServices = [
  service('Консултация на място', 25, yan, 'health', { minutes: 30 }),
  service('Класически масаж', 40, yan, 'health', { minutes: 50 }),
  service('Профилактична мануална терапия', 40, yan, 'health', { minutes: 50 }),
  service('Кинезитерапевтична процедура', 50, yan, 'health', { minutes: 50 }),
  service('Пакет 5 масажа / мануални терапии', 160, yan, 'health', { price: { unit: 'пакет' }, description: 'Обща цена за 5 процедури, не за единично посещение.' }),
  service('Пакет 5 кинезитерапевтични процедури', 200, yan, 'health', { price: { unit: 'пакет' }, description: 'Обща цена за 5 процедури.' }),
]

const oktoServices = [
  ...[['Консултация',40,30],['Физиотерапевтично лечение',60,50],['Рехабилитация',60,50],['Лечебен масаж',70,50],['Спортен масаж',70,50],['Масаж при бременност',70,50],['Частичен масаж',50,30],['Превантивна терапия',60,50],['Консултация и лечение',100,80],['Лечение и рехабилитация',90,80],['Физиотерапевтично лечение · 80 минути',90,80],['Лечебен масаж · 80 минути',100,80],['Спортен масаж · 80 минути',100,80]].map(([name,amount,minutes])=>service(name,amount,okto,'health',{minutes,description:'Частна тарифа; без НЗОК.'})),
  ...[['Превантивна терапия',5,280,50],['Физиотерапия',5,280,50],['Превантивна терапия',10,540,50],['Физиотерапия',10,540,50],['Превантивна терапия',10,800,80],['Физиотерапия',10,800,80]].map(([name,count,amount,minutes])=>service(`${name} · пакет ${count} процедури по ${minutes} минути`,amount,okto,'health',{price:{unit:'пакет'},description:'Предплатен общ пакет, валиден 45 дни; не е цена за единична процедура.'})),
]
const musicBoxServices = [
  ...[[30,20],[45,24],[60,28]].map(([minutes,amount])=>service(`Пеене / пиано / китара / солфеж · единичен урок ${minutes} минути`,amount,musicBox,'education',{minutes,description:'Единично посещение, уговаряно седмица за седмица; не е дългосрочно запазено време.'})),
  ...[[4,30,54],[4,45,66],[4,60,84],[8,30,102],[8,45,126],[8,60,160]].map(([count,minutes,amount])=>service(`Пеене / пиано / китара / солфеж · ${count} урока по ${minutes} минути`,amount,musicBox,'education',{price:{unit:'абонамент'},description:'Общо за 4 последователни седмици, авансово плащане. Тарифа от 01.09.2026; не е цена за единичен урок.'})),
]

const updates = [
  { id: 'sofia-sofia-physio-center', services: [
    ...[['Преглед и консултация',50], ['Преглед и консултация · ученици и пенсионери',30], ['Кинезитерапия · гръб, кръст и врат',50], ['Физиотерапия и терапевтичен масаж',70], ['Рехабилитация след травми и операции',50], ['Спортно възстановяване',50], ['Спортно възстановяване и спортен масаж',70]].map(([name, amount]) => service(name, amount, physio, 'health', { minutes: 60 })),
    service('Масаж на гръб',40,physio,'health',{minutes:40}),
    service('Масаж на цяло тяло',60,physio,'health',{minutes:60}),
    service('Масаж при бременност',60,physio,'health',{minutes:50}),
    ...['Лечебен масаж','Спортен масаж','Дълбокотъканен масаж','Класически масаж'].map(name => service(name,60,physio,'health',{minutes:60})),
    service('Рехабилитация у дома',60,physio,'health',{minutes:60,appointmentModel:'home_visit'}),
  ] },
  { id: 'sofia-dental-place', services: [
    ...[['Първичен преглед и статус',35],['Профилактичен преглед',35],['Почистване на зъбен камък · ултразвук',80],['Почистване на зъбен камък и AirFlow',100],['Полиране с AirFlow',30],['Шина против бруксизъм',200],['Домашно избелване със шини',250]].map(([name, amount]) => service(name,amount,dental,'other',{description:'Ориентировъчна частна тарифа; окончателно след преглед и план.'})),
    service('Клинично избелване',350,dental,'other',{description:'Не включва ултразвуково почистване; ориентировъчно.'}),
    service('Кюретаж на пародонтален джоб',50,dental,'other',{price:{unit:'зъб'},description:'Ориентировъчна цена за един зъб.'}),
    service('Бондинг на преден зъб',200,dental,'other',{price:{unit:'зъб'},description:'Ориентировъчно, според случая.'}),
    service('Керамична фасета',500,dental,'other',{price:{unit:'зъб'},description:'Ориентировъчно, според случая.'}),
    ...[[1,80],[2,100],[3,120]].map(([walls,amount])=>service(`Фотополимерна пломба · ${walls} стени`,amount,dental,'other',{description:'Ориентировъчна цена; според обема на възстановяването.'})),
    ...[[1,180],[2,240],[3,300],[4,360]].map(([canals,amount])=>service(`Кореново лечение · ${canals} канала`,amount,dental,'other',{description:'Пломбата не е включена; ориентировъчно.'})),
    service('Дигитален отпечатък · две челюсти',100,dental,'other'),
    service('Металокерамична корона',300,dental,'other',{price:{unit:'бр.'},description:'С циментиране; ориентировъчно.'}),
    service('Циркониева корона',400,dental,'other',{price:{unit:'бр.'},description:'С циментиране; ориентировъчно.'}),
    service('Екстракция на еднокоренов зъб',70,dental,'other',{description:'Ориентировъчна тарифа; според случая.'}),
    service('Екстракция на многокоренов зъб',100,dental,'other',{description:'Ориентировъчна тарифа; според случая.'}),
  ] },
  { id:'sofia-yan-physio-borovo',services:yanServices },
  { id:'sofia-yan-physio-stranski',services:yanServices },
  { id:'sofia-nota-music-room', services:[
    service('Индивидуален урок по пиано',35,nota,'education',{minutes:50}),
    service('Пиано · предплатени 4 урока',132,nota,'education',{price:{unit:'пакет'},description:'4 индивидуални урока по 50 минути; обща предплатена цена.'}),
    service('Пиано · предплатени 8 урока',248,nota,'education',{price:{unit:'пакет'},description:'8 индивидуални урока по 50 минути; обща предплатена цена.'}),
    service('Индивидуален урок по флейта / блокфлейта',32,nota,'education',{minutes:50}),
    service('Флейта / блокфлейта · предплатени 4 урока',120,nota,'education',{price:{unit:'пакет'},description:'4 урока по 50 минути; обща цена.'}),
    service('Флейта / блокфлейта · предплатени 8 урока',224,nota,'education',{price:{unit:'пакет'},description:'8 урока по 50 минути; обща цена.'}),
    service('Групова блокфлейта и музикална теория · 60 минути',17,nota,'education',{minutes:60,appointmentModel:'group_reservation',price:{unit:'участник'},description:'Група при минимум две деца.'}),
    service('Групова блокфлейта и музикална теория · 90 минути',27,nota,'education',{minutes:90,appointmentModel:'group_reservation',price:{unit:'участник'},description:'Група при минимум две деца.'}),
  ] },
  { id:'sofia-physio-point', services:[
    service('Първичен преглед',30,point,'health'),
    service('Кинезитерапевтична процедура',25,point,'health',{minutes:45}),
    service('Класически масаж',40,point,'health',{minutes:60}),
    service('Физиотерапевтичен масаж · 30 минути',20,point,'health',{minutes:30}),
    service('Физиотерапевтичен масаж · 60 минути',45,point,'health',{minutes:60}),
    service('Спортен масаж',50,point,'health',{minutes:60}),
    service('Китайски точков масаж',65,point,'health',{minutes:90}),
    service('Сегментарен масаж · яка, гръб или долни крайници',25,point,'health',{minutes:30}),
    ...[['Индивидуална кинезитерапевтична програма',30],['Кинезиотейпинг',20],['Стречинг и мануални техники',30],['Електролечение',15],['Ултразвукова терапия',15],['Лазертерапия',15],['Миопунктура / суха игла',30]].map(([name,amount])=>service(name,amount,point,'health')),
  ] },
  { id:'sofia-vocal-vision-house', services:[
    ...[[4,120],[8,220]].map(([count,amount])=>service(`Индивидуално вокално обучение · ${count} урока`,amount,vocal,'education',{price:{unit:'месечна карта'},description:`Общо за ${count} посещения по 60 минути, използвани в съответния календарен месец; на място или онлайн.`})),
    service('Вокална консултация с преподавател на V.V.H.',40,vocal,'education',{minutes:60}),
    service('Вокална консултация с Иван Димитров',60,vocal,'education',{minutes:60}),
    service('Вокален педагог при звукозапис · на терен',50,vocal,'education',{price:{unit:'час'},description:'В избрано от клиента студио, с предварителна уговорка.'}),
    service('Вокален състав · месечно участие',60,vocal,'education',{appointmentModel:'group_reservation',price:{unit:'месец'},description:'Веднъж седмично по 60 минути; месечната цена не е единично посещение.'}),
  ] },
  { id:'sofia-mymusic-center', services:[
    service('Китара с Ангел Демирев',47,guitar,'education',{description:'Индивидуален урок. Продължителността се уточнява: страницата за записване сочи 40 минути, общата тарифа — 45.'}),
    ...[[4,124],[8,248]].map(([count,amount])=>service(`Индивидуална китара · ${count} урока`,amount,guitar,'education',{price:{unit:'месечна карта'},description:`${count} урока по 45 минути за 4 седмици, карта 31 дни; при изброените стандартни преподаватели, не при Ангел Демирев.`})),
    ...['Цигулка','Флейта','Тамбура','Народно пеене','Пиано','Барабани'].flatMap(name=>[[1,124],[2,248]].map(([frequency,amount])=>service(`${name} · ${frequency} посещения седмично`,amount,myMusic,'education',{price:{unit:'месечна такса'},description:'Месечна такса за посочената честота; не е цена за един урок.'}))),
    service('Пеене · едно посещение седмично',124,myMusic,'education',{price:{unit:'месечна такса'},description:'Стандартна преподавателска тарифа; отделна цена при Натаса Андреу.'}),
    service('Пеене · две посещения седмично',248,myMusic,'education',{price:{unit:'месечна такса'}}),
    service('Пеене с Натаса Андреу · едно посещение седмично',140,myMusic,'education',{price:{unit:'месечна такса'}}),
    service('Музикални бебета · едно посещение',10,myMusic,'education',{appointmentModel:'group_reservation'}),
    service('Музикален Party петък · едно посещение',13,myMusic,'education',{appointmentModel:'group_reservation'}),
    service('Музикален Party петък · 4 посещения',50,myMusic,'education',{appointmentModel:'group_reservation',price:{unit:'пакет'}}),
    service('Вокална група · 4 посещения',65,myMusic,'education',{appointmentModel:'group_reservation',price:{unit:'пакет'},description:'Общо за 4 групови посещения по 90 минути.'}),
  ] },
  { id:'sofia-topal-center', services:[
    service('Преглед и консултация',30,topal,'health',{description:'Без терапевтична процедура; частна тарифа, без НЗОК.'}),
    ...[['Мануална терапия',50],['Комплексна мануална терапия',80],['Физиотерапия и рехабилитация',55],['Първоначална консултация · сколиоза и стойка',30],['Комплексна оценка и индивидуален терапевтичен план',60],['Индивидуална терапевтична сесия · гръбначни изкривявания',45],['Лечебен масаж',70],['Класически масаж',65],['Спортен масаж',70],['Масаж при бременност',70],['Релаксиращ масаж',65],['Антицелулитен масаж',50],['Лимфен дренаж',30]].map(([name,amount])=>service(name,amount,topal,'health')),
  ] },
  { id:'sofia-physio-health-sofia', services:[
    service('Преглед · София',30,phHealth,'health'),
    service('Рехабилитация · София',40,phHealth,'health',{minutes:60}),
    service('Рехабилитация · 5 посещения',190,phHealth,'health',{price:{unit:'пакет'},description:'Предплатен общ пакет, валиден 3 месеца; София.'}),
    service('Рехабилитация · 10 посещения',360,phHealth,'health',{price:{unit:'пакет'},description:'Предплатен общ пакет, валиден 6 месеца; София.'}),
    service('Масаж · 60 минути · София',45,phHealth,'health',{minutes:60}),
    service('Масаж · 90 минути · София',75,phHealth,'health',{minutes:90}),
    service('Масаж на гръб · София',30,phHealth,'health',{minutes:30}),
    service('Пакет 5 масажа · София',215,phHealth,'health',{price:{unit:'пакет'},description:'Общо за 5 посещения.'}),
    service('Пакет 10 масажа · София',410,phHealth,'health',{price:{unit:'пакет'},description:'Общо за 10 посещения.'}),
    service('Домашна рехабилитация · София',45,phHealth,'health',{minutes:60,appointmentModel:'home_visit'}),
    service('Домашна рехабилитация · 10 посещения в София',385,phHealth,'health',{appointmentModel:'home_visit',price:{unit:'пакет'},description:'Общ предплатен пакет за 10 посещения, валиден 6 месеца.'}),
  ] },
  { id:'sofia-law-bba', services:[
    service('Правна консултация в кантората',80,bba,'consulting',{price:{unit:'започнат час'},description:'Предплаща се първият астрономически час; всеки следващ започнат час е по отделната публикувана почасова тарифа.'}),
    service('Онлайн правна консултация',80,bbaOnline,'consulting',{price:{unit:'започнат час'},description:'Предплащане за първия започнат астрономически час; начинът на връзка се уговаря.'}),
  ] },
  { id:'sofia-kavazova-tax-law', services:[
    service('Онлайн консултация · данъчно и митническо право',100,kavazova,'consulting',{description:'Таксата включва публикуваните данъци и уточняващите въпроси; последваща възложена работа се договаря отделно.'}),
    service('Консултация в кантората · данъчно и митническо право',150,kavazova,'consulting',{description:'Включени уточняващи въпроси; отделните правни услуги се договарят според казуса.'}),
  ] },
  { id:'sofia-sokol-nedkov', services:[
    service('Правна консултация · Сокол Недков',120,sokol,'consulting',{minutes:30,description:'Публикувана обща такса с включени данъци; в офиса, по телефон или видео. Изисква авансово плащане при записване.'}),
  ] },
  { id:'sofia-omni-iztok', services:[
    ...[['Физиотерапия · Цветелин Ценков · Изток',60,50],['Вторичен преглед · Цветелин Ценков · Изток',40,30],['Физиотерапия за студенти · Цветелин Ценков · Изток',45,50],['Масажна терапия · 30 минути · Цветелин Ценков',40,30],['Масажна терапия · 60 минути · Цветелин Ценков',70,60],['Масажна терапия · 90 минути · Цветелин Ценков',120,90]].map(([name,amount,minutes])=>service(name,amount,omniIztok,'health',{minutes,description:'Само за посочения терапевт в Изток; не е обща цена за всички обекти/специалисти.'})),
  ] },
  { id:'sofia-omni-amaya-massage', services:[
    ...[[30,30],[60,50],[90,70]].map(([minutes,amount])=>service(`Масажна терапия / иглотерапия · Амая · ${minutes} минути`,amount,omniAmaya,'health',{minutes,description:'Само менюто OMNI Physio Amaya — Масажна терапия; не е тарифа за физиотерапия в Изток.'})),
  ] },
  { id:'sofia-snap-dental-care', services:[
    service('Първичен дентален преглед · д-р Сашка Хаджиева',25.56,snap,'other',{description:'Публикувана такса в профила на конкретния специалист; лечение и допълнителни процедури не са включени.'}),
  ] },
]

updates.push(
  { id:'sofia-malki-muzikalni-uroci',services:[
    service('Малки музикални уроци · групово посещение',15,malki,'education',{minutes:45,appointmentModel:'group_reservation'}),
    service('Индивидуален музикален урок · 45 минути',25,malki,'education',{minutes:45}),
    service('Индивидуален музикален урок · 60 минути',30,malki,'education',{minutes:60}),
    ...[[4,45,92],[4,60,112],[8,45,168],[8,60,200]].map(([count,minutes,amount])=>service(`Индивидуални уроци · ${count} посещения по ${minutes} минути`,amount,malki,'education',{price:{unit:'предплатена карта'},description:'Обща такса за картата, валидна 40 дни от покупката; не е цена за един урок.'})),
    service('Пеене в начинаеща група · веднъж седмично',50,malki,'education',{appointmentModel:'group_reservation',price:{unit:'месец'},description:'Месечна предплатена групова карта, съботна сесия 45 минути.'}),
    service('Вокална група · два пъти седмично',60,malki,'education',{appointmentModel:'group_reservation',price:{unit:'месец'},description:'Месечна предплатена карта; графикът се уговаря.'}),
  ] },
  { id:'sofia-art-and-shock',services:[
    service('Индивидуален музикален урок',30,artShock,'education'),
    service('Музикални уроци · пакет 4 сесии',110,artShock,'education',{price:{unit:'пакет'},description:'Общо за 4 сесии в рамките на един месец от първия урок.'}),
    service('Музикални уроци · пакет 8 сесии',210,artShock,'education',{price:{unit:'пакет'},description:'Общо за 8 сесии в рамките на един месец от първия урок.'}),
  ] },
  { id:'sofia-avarton-music-academy',services:[
    service('Индивидуален урок · пеене, пиано, китара, барабани, солфеж или актьорско майсторство',36,avarton,'education',{minutes:50}),
    ...[[1,125],[2,250]].map(([n,amount])=>service(`Индивидуални уроци · ${n} пъти седмично`,amount,avarton,'education',{price:{unit:'месец'},description:'Фиксиран месечен абонамент за посочената седмична честота; не единичен урок.'})),
    service('Сценична реч / дублаж · консултация с Анислав Лазаров',70,avarton,'education',{minutes:50}),
    ...[[1,200],[2,400]].map(([n,amount])=>service(`Сценична реч / дублаж · ${n} пъти седмично`,amount,avarton,'education',{price:{unit:'месец'}})),
    service('Комбиниран урок · инструмент и пеене',45,avarton,'education',{minutes:60,description:'Пиано с пеене или китара с пеене.'}),
    ...[[1,155],[2,310]].map(([n,amount])=>service(`Комбинирано обучение · ${n} пъти седмично`,amount,avarton,'education',{price:{unit:'месец'}})),
    service('Урок за двама · пеене, китара или актьорско майсторство',30,avarton,'education',{minutes:50,appointmentModel:'group_reservation',price:{unit:'участник'}}),
    ...[[1,100],[2,200]].map(([n,amount])=>service(`Уроци за двама · ${n} пъти седмично`,amount,avarton,'education',{appointmentModel:'group_reservation',price:{unit:'участник / месец'}})),
    service('Групов урок · барабани, ритмика или солфеж',30,avarton,'education',{minutes:50,appointmentModel:'group_reservation'}),
    service('Музикални занимания · деца 5–7 г.',25,avarton,'education',{minutes:40,appointmentModel:'group_reservation'}),
    service('Актьорско майсторство · деца 7–12 г.',25,avarton,'education',{minutes:60,appointmentModel:'group_reservation'}),
    service('Актьорско майсторство · 13–18 г.',30,avarton,'education',{minutes:90,appointmentModel:'group_reservation'}),
    service('Актьорско майсторство · възрастни',35,avarton,'education',{minutes:120,appointmentModel:'group_reservation'}),
    service('Дублаж · едномесечен групов курс',480,avarton,'education',{appointmentModel:'group_reservation',price:{unit:'курс'},description:'Общо 16 занятия по 60 минути; група до 5 участници.'}),
    service('Подготовка за кастинг · едномесечен групов курс',120,avarton,'education',{appointmentModel:'group_reservation',price:{unit:'курс'},description:'Общо 4 занятия по 60 минути; група до 5 участници.'}),
    service('Индивидуален музикален урок на английски',46,avarton,'education',{minutes:50,description:'Отделна публикувана английска тарифа, с включено езиково доплащане.'}),
    ...[[1,165],[2,330]].map(([n,amount])=>service(`Индивидуални уроци на английски · ${n} пъти седмично`,amount,avarton,'education',{price:{unit:'месец'}})),
  ] },
  { id:'sofia-dara-physiotherapy',services:[
    service('Консултация с кинезитерапевт',35,dara,'health'),
    service('Онлайн консултация с кинезитерапевт',30,dara,'health'),
    ...[['Кинезиологичен тейпинг',20,30],['Кинезитерапия',40,55],['Комплексна лечебна процедура',45,55],['Физиотерапия',30,30],['Мануална терапия',30,30],['Акупунктура',35,50],['Аурикулотерапия',30,30],['Класически цялостен масаж',50,55],['Класически частичен масаж',35,30],['Лечебен масаж',60,55],['Масаж на лице и глава',30,30],['Спортен масаж',50,45],['Масаж при бременност',50,55],['Ръчен антицелулитен масаж',45,45],['Комбиниран антицелулитен масаж',55,50],['Лимфодренажен масаж · до 3 зони',45,45],['Лимфодренажен масаж · над 3 зони',55,55]].map(([name,amount,minutes])=>service(name,amount,dara,'health',{minutes})),
    ...[['Кинезитерапия',5,180,55],['Кинезитерапия',10,340,55],['Комплексна лечебна процедура',5,205,55],['Комплексна лечебна процедура',10,390,55],['Физиотерапия',5,130,30],['Физиотерапия',10,240,30]].map(([name,count,amount,minutes])=>service(`${name} · пакет ${count} посещения`,amount,dara,'health',{price:{unit:'пакет'},description:`Общо за ${count} посещения по ${minutes} минути; без НЗОК.`})),
    ...[['Ръчен антицелулитен масаж',5,205],['Ръчен антицелулитен масаж',10,390],['Комбиниран антицелулитен масаж',5,255],['Комбиниран антицелулитен масаж',10,490],['Лимфодренаж до 3 зони',5,205],['Лимфодренаж до 3 зони',10,390],['Лимфодренаж над 3 зони',5,255],['Лимфодренаж над 3 зони',10,490]].map(([name,count,amount])=>service(`${name} · ${count} посещения`,amount,dara,'health',{price:{unit:'пакет'}})),
  ] },
  { id:'sofia-vibomi',services:[
    ...[['Частичен лечебен масаж · гръб',30,30],['Лечебен масаж',50,60],['Ръчен антицелулитен масаж',60,60],['Терапевтичен масаж',60,60],['Юмейхо · крайници и таз',35,30],['Юмейхо терапия',50,80],['Юмейхо · консултация и сеанс',70,90],['Моксотерапия',30,30],['Вендузотерапия',30,30],['Акупунктура',50,45],['Индивидуална кинезитерапия',50,45],['Остеоестетика',80,60]].map(([name,amount,minutes])=>service(name,amount,vibomi,'health',{minutes,description:'Ориентировъчна тарифа; точната цена се уточнява след консултация.'})),
    service('Комплексен пакет · масаж, мокса и вендузи',90,vibomi,'health',{price:{unit:'пакет'},description:'Обща ориентировъчна цена за публикуваната комбинация.'}),
    service('Комплексен пакет · юмейхо, акупунктура и вендузи',100,vibomi,'health',{price:{unit:'пакет'},description:'Обща ориентировъчна цена за публикуваната комбинация.'}),
    service('Лечебни масажи · 5 посещения',220,vibomi,'health',{price:{unit:'пакет'},description:'Обща ориентировъчна цена, не за единичен масаж.'}),
    service('Комплексен пакет · по 5 сеанса от 3 метода',500,vibomi,'health',{price:{unit:'пакет'},description:'Общо за 5 юмейхо, 5 акупунктури и 5 вендузотерапии; без медицински обещания.'}),
  ] },
  { id:'sofia-office-therapy',services:[
    ...['Първична консултация и терапия','Индивидуална терапия','Следоперативна рехабилитация','Масаж на цяло тяло / гръб'].map(name=>service(name,45,office,'health',{minutes:60})),
    service('Терапия при болки и травми',45,office,'health'),
    service('Домашно посещение',55,office,'health',{minutes:45,appointmentModel:'home_visit'}),
    ...[[5,205],[10,380],[15,540]].map(([count,amount])=>service(`Терапии · пакет ${count} посещения`,amount,office,'health',{price:{unit:'пакет'},description:'Обща пакетна цена; програмата се съставя индивидуално.'})),
  ] },
  { id:'sofia-rhythm-academy',services:[
    service('Индивидуален музикален урок · без абонамент',30,rhythm,'education',{minutes:50,description:'Пеене, китара, пиано, барабани или бас.'}),
    service('4 индивидуални урока · месечен абонамент',100,rhythm,'education',{price:{unit:'месец'},description:'Общо за 4 урока по 50 минути, не единично посещение.'}),
    service('8 индивидуални урока · месечен абонамент',200,rhythm,'education',{price:{unit:'месец'},description:'Общо за 8 урока по 50 минути.'}),
    service('Китара или пиано · годишен абонамент',92,rhythm,'education',{price:{unit:'месец'},description:'Само при 12-месечно обвързване, 4 урока по 50 минути месечно; не е едномесечна необвързваща оферта.'}),
    service('Групов музикален урок',18,rhythm,'education',{minutes:50,appointmentModel:'group_reservation'}),
    service('Репетиция с банда и преподавател',15,rhythm,'education',{minutes:50,appointmentModel:'group_reservation'}),
    service('Кратка репетиция с банда',10,rhythm,'education',{minutes:30,appointmentModel:'group_reservation'}),
    service('Пробен първи музикален урок',15,rhythm,'education',{minutes:50,description:'Само пробно първо посещение; обичайният единичен урок е с друга тарифа.'}),
  ] },
  { id:'sofia-music-box-sinanishko',services:musicBoxServices },
  { id:'sofia-music-box-mladost',services:musicBoxServices },
  { id:'sofia-paw-paw-mobile', services:[
    ...[['Цялостен груминг · куче до 5 кг',55],['Цялостен груминг · средно куче до 15 кг',65],['Цялостен груминг · голямо куче до 30 кг',75],['Спа вана · куче до 5 кг',40],['Спа вана · средно куче до 15 кг',50],['Спа вана · голямо куче до 30 кг',60],['Цялостен груминг · късокосместа котка',45],['Цялостен груминг · дългокосместа котка',55]].map(([name,amount])=>service(name,amount,paw,'pets',{appointmentModel:'home_visit',description:'Мобилна услуга на уговорения адрес в София; не е салон с постоянен клиентски адрес.'})),
  ] },
  { id:'sofia-podstrizhime-grooming', services:[
    ...[['Куче · къпане',15,35],['Куче · къпане и разресване',20,55],['Куче · оформяне на козина',10,20],['Куче · премахване на мъртъв косъм',25,35],['Куче · очи и уши',10,15],['Куче · цялостен груминг',30,80]].map(([name,amount,maximum])=>service(name,amount,podstrizhime,'pets',{price:{kind:'range',maximum},description:'Ориентировъчно според козина и размер; за кучета над 20 кг цената се уточнява на място.'})),
    service('Куче · подрязване на нокти',10,podstrizhime,'pets'),
    ...[['Котка · къпане',15,20],['Котка · подстригване',15,35],['Котка · разресване',15,20],['Котка · нокти',5,10],['Котка · цялостен груминг',25,30]].map(([name,amount,maximum])=>service(name,amount,podstrizhime,'pets',{price:{kind:'range',maximum},description:'Ориентировъчно; за трудно поведение или сплъстена козина е възможна допълнителна такса 5–10 €.'})),
    service('Котка · почистване на очи и уши',5,podstrizhime,'pets',{description:'Възможно доплащане 5–10 € според поведение/козина.'}),
    service('Котка · премахване на мъртъв косъм',20,podstrizhime,'pets',{description:'Възможно доплащане 5–10 € според поведение/козина.'}),
    ...[['Гризач · къпане',10,20],['Гризач · подстригване',10,20],['Гризач · нокти',5,10],['Гризач · цялостен груминг',20,30]].map(([name,amount,maximum])=>service(name,amount,podstrizhime,'pets',{price:{kind:'range',maximum},description:'Ориентировъчно, според животното и козината.'})),
    service('Гризач · почистване на уши',5,podstrizhime,'pets'),
  ] },
  { id:'sofia-bono-grooming', services:[
    ...[['Акита ину',65],['Аляски маламут',85],['Английски булдог',45],['Басет хаунд',45],['Бийвър',45],['Бигъл',45],['Бордър коли',65],['Бишон',50],['Борзой',80],['Българско овчарско куче',110],['Голдън ретривър',65],['Далматин',50],['Корги',40],['Коли',70],['Каракачанско куче',110],['Лабрадор',60],['Лагото романьоло',65],['Малтийска болонка',40],['Мопс',35],['Немска овчарка',75],['Нюфаундленд',120],['Пекинез',40],['Самоед',80],['Санбернар',120],['Уести',45],['Френски булдог',35],['Хъски',75],['Чау-чау',75],['Ши тцу',50],['Шиба ину',45],['Немски шпиц',50]].map(([name,amount])=>service(`Цялостен груминг · ${name}`,amount,bono,'pets')),
    ...[['Йоркширски териер до 5 кг',40],['Йоркширски териер над 5 кг',45],['Кавалер до 7 кг',45],['Кавалер над 7 кг',50],['Померан до 5 кг',45],['Померан над 5 кг',50],['Пудел той / мини',50],['Пудел среден',55],['Пудел голям',70],['Чихуахуа късокосместо',35],['Чихуахуа дългокосместо',45],['Шнауцер мини',40],['Шнауцер среден',45],['Шнауцер голям',50]].map(([name,amount])=>service(`Цялостен груминг · ${name}`,amount,bono,'pets')),
    ...[[5,23],[10,28],[20,40],[30,50]].map(([kg,amount])=>service(`Къпане · куче до ${kg} кг`,amount,bono,'pets')),
    service('Подрязване на нокти',10,bono,'pets'),
    service('Почистване на уши',10,bono,'pets'),
    service('Почистване на зъбен камък · към цялостен груминг',50,bono,'pets',{description:'Само за кучета, записани за цялостен груминг; след преценка на грумъра на място.'}),
  ] },
  { id:'sofia-love-your-pets-grooming', services:[
    ...[['Английски булдог',55,90],['Бигъл',55,90],['Дакел',40,90],['Далматин',60,90],['Джак ръсел териер',40,90],['Лабрадор',65,150],['Малиноа',65,180],['Мопс',45,90],['Пинчер',40,90],['Френски булдог',45,90],['Чихуахуа · къс косъм',45,90],['Акита ину',75,240],['Бишон фризе',60,180],['Голдън ретривър',70,180],['Йоркширски териер',50,90],['Кавалер Кинг Чарлс',55,120],['Кавапу',60,120],['Кокапу',65,120],['Корги',45,90],['Лабрадудел',100,240],['Лагото Романьоло',80,180],['Малтийска болонка',60,120],['Малтипу',60,120],['Мини пудел',65,150],['Немска овчарка',70,240],['Немски шпиц',60,90],['Нюфаундленд',110,180],['Пекинез',60,90],['Померан',60,90],['Самоед',75,240],['Спаниел',60,120],['Среден пудел',70,180],['Стандартен пудел',110,180],['Той пудел',60,120],['Хъски',75,240],['Чау-чау',85,240],['Чихуахуа · дълъг косъм',55,120],['Ши тцу',60,120],['Шиба ину',40,90]].map(([name,amount,minutes])=>service(`Груминг · ${name}`,amount,lovePets,'pets',{minutes})),
    ...[['Дакел',60,180],['Джак Ръсел',60,180],['Кавалер Кинг Чарлз',75,180],['Митълшнауцер',100,240],['Ризеншнауцер',105,330],['Спаниел',75,180],['Цвергшнауцер',75,180]].map(([name,amount,minutes])=>service(`Стрипинг · ${name}`,amount,lovePets,'pets',{minutes})),
    ...[['Дългокосместа котка · без подстригване',65,120],['Дългокосместа котка · с подстригване',70,120],['Късокосместа котка',50,90],['Разресване на котка',25,30],['Бръснене на лапи',10,15],['Къпане и ресане · голяма порода',50,60],['Къпане и ресане · малка порода',40,60],['Почистване на уши',8,10],['Подрязване на нокти',10,15]].map(([name,amount,minutes])=>service(name,amount,lovePets,'pets',{minutes})),
  ] },
  { id:'sofia-okto-oborishte', services:oktoServices },
  { id:'sofia-okto-lozenets', services:oktoServices },
  { id:'sofia-np-dental-clinic', services:[
    ...[['Дентален преглед',40],['Консултация с орален хирург и разчитане на скенер',150],['Консултация с ортодонт и разчитане на снимки',150],['Металокерамична корона',400],['Временна пластмасова корона',100],['Циркониева корона',550],['Керамична фасета · немска',800],['Пломба без упойка',110],['Пломба с упойка',160],['Бондинг на преден зъб',250],['Полиране със сода',70],['Домашно избелване',250],['Професионална орална хигиена',60],['Шина за бруксизъм',200],['Екстракция на еднокоренов зъб с упойка',130],['Екстракция на млечен зъб с упойка',70]].map(([name,amount])=>service(name,amount,npDental,'other',{description:'Ориентировъчно; окончателно след преглед. След 18 ч., в почивни и празнични дни е възможно до 20% доплащане.'})),
    ...[['Пломба на млечен зъб',130,180],['Лечение на пулпит · еднокоренов зъб',450,550],['Лечение на пулпит · многокоренов зъб',650,850],['Зъбен камък и полиране',110,140],['Клинично избелване',360,500],['Екстракция на мъдрец с упойка',300,850]].map(([name,amount,maximum])=>service(name,amount,npDental,'other',{price:{kind:'range',maximum},description:'Ориентировъчен диапазон; окончателно след преглед. Вечер/почивен/празничен ден може до 20% доплащане.'})),
  ] },
)

updates.push(
  {id:'sofia-dm-physio-studentski',services:[
    ...[['Индивидуална кинезитерапия',dmKinet],['Лечебен масаж',dmMedical],['Дълбокотъканен масаж',dmDeep]].map(([name,url])=>service(name,50,url,'health',{minutes:60,description:'Тарифа от страницата на процедурата с адрес ул. Проф. Христо Данов 19; не се пренася автоматично към друг обект или специалист.'})),
    ...['Даниел','Елица'].map(name=>service(`Пакет 5 процедури · ${name}`,180,dmStudentski,'health',{price:{unit:'пакет'},description:'Обща публикувана цена при посочения терапевт в Студентски град. Видът, продължителността и условията се уточняват с кабинета; не е цена за една процедура.'})),
  ]},
  {id:'sofia-dm-physio-mladost',services:[
    ...[['Иван',150],['Даниел',180],['Елица',180]].map(([name,amount])=>service(`Пакет 5 процедури · ${name}`,amount,dmMladost,'health',{price:{unit:'пакет'},description:'Обща цена за посочения терапевт в Младост 1А; не е единично посещение. Видът, продължителността и условията се уточняват при записването.'})),
  ]},
  {id:'sofia-mvc-bulgaria',services:[
    ...[['Стандартен ветеринарен преглед',33],['Консултация',32],['Онлайн консултация',60],['Контролен преглед',32],['Контролен преглед при специалист',40],['Преглед през уикенда',38],['Второ мнение по документи',56],['Първичен преглед · д-р Войчев',100],['Преглед · доц. д-р Генов',75],['Преглед · д-р Йордан Стоянов',65],['Преглед · д-р Христов',75],['Преглед · д-р Ивановски',60],['Преглед · д-р Веселинов',60],['Преглед · д-р Вачева',75],['Преглед · д-р Митев',75],['Преглед · д-р Саламитова',50],['Контролен преглед · д-р Войчев',60],['Контролен преглед · д-р Ивановски',50],['Контролен преглед · д-р Христов',60],['Контролен преглед · д-р Митев',60],['Контролен преглед · доц. д-р Генов',60],['Контролен преглед · д-р Веселинов',50],['ЕКГ на домашен любимец',25],['Ехокардиография на домашен любимец',85],['Контрастна ехокардиография · Bubble study',115]].map(([name,amount])=>service(name,amount,mvc,'other',{description:'Ветеринарна услуга с предварително записване и потвърждение от клиниката; на официални празници важат отделни цени.'})),
  ]},
)

const records = [
  ...[
    ['sofia-anton-kolev-pirin','Манастирски ливади','София, ул. Пирин 73, ет. 4, БИНАП',42.6646895,23.2823631],
    ['sofia-anton-kolev-calma','Студентски град','София, ул. Джон Ленън 8, ет. 2, Calma Space',42.6522129,23.3406628],
  ].map(([id,neighborhood,address,latitude,longitude])=>({
    ...phoneRecord(id,`Антон Колев · ${neighborhood}`,'other',kolev,'+359884059106',address,neighborhood,[
      service('Психотерапия / консултиране · първа среща',55,kolevBook,'other',{minutes:75,description:'По предварително записване; кабинетът се избира според деня. Продължителността за първа среща е посочена изрично в описанието на резервацията.'}),
      service('Психотерапия / консултиране · следваща среща',55,kolevBook,'other',{minutes:60,description:'Тарифа за следваща среща, след предварително записване; кабинетът зависи от избрания ден.'}),
    ],kolev,'Запази час — срещите са в кабинет в София; локацията зависи от избрания ден.'),
    booking:{kind:'form',url:kolevBook},
    coordinates:{latitude,longitude,method:'first_party_coordinates',source:kolev},
  })),
  phoneRecord('sofia-ketty-vandova-boyana','Кети Вандова · психолог и психотерапевт','other','https://kettyvandova.bg/','+359888218686','София, кв. Бояна, ул. Зелен парк 8Б','Бояна',[
    ...['Индивидуална психологическа консултация','Консултация със спортен психолог','Консултация с детски / юношески психолог','Мотивационно интервюиране','Схема терапия','Лайф коучинг','Онлайн психотерапия'].map(name=>service(name,60,ketty,'other',{minutes:60,price:{unit:'човек'},description:'Тарифа за записване директно при специалиста; не е универсална цена за външна платформа.'})),
    service('Семейна терапия · двойка',75,ketty,'other',{minutes:60,price:{unit:'двойка'}}),
    service('Групова терапия',50,ketty,'other',{minutes:60,appointmentModel:'group_reservation',description:'Провежда се при минимум 5 участници; начинът на таксуване се уточнява при записването.'}),
  ],kettyBook,'Използвайте формата за контакт и резервация на час или +359 888 21 86 86.'),
  phoneRecord('sofia-mandala-ivan-susanin','Масажно студио Мандала','health',mandala,'+359888553458','София, кв. Манастирски ливади, ул. Иван Сусанин 59','Манастирски ливади',[
    service('Частичен класически масаж',45,mandala,'health',{minutes:60}),
    service('Цялостен класически масаж',65,mandala,'health',{minutes:90}),
    service('Продължителен класически масаж',90,mandala,'health',{minutes:120}),
    service('Рейки сесия',45,mandala,'health',{minutes:60,description:'Уелнес сесия; не се представя като медицинско лечение.'}),
  ],mandala,'Георги Тушев — Запазете час: 0888 55 34 58.'),
  {
    ...phoneRecord('sofia-kantora-petrova-damyan-gruev','Адвокатска кантора Петрова','consulting',petrova,'+359878903069','София, ул. Дамян Груев 10–12',null,[
      service('Телефонна правна консултация',30,petrovaPhone,'consulting',{description:'До 30 минути, след авансово плащане и потвърждение; не е цена за представителство по дело.'}),
      service('Правна консултация в онлайн чат',30,petrova,'consulting',{description:'До 30 минути; провежда се след предварително записване и плащане.'}),
    ],petrovaPhone,'Запазете час за телефонна правна консултация.'),
    booking: { kind:'form',url:petrovaPhone },
  },
  phoneRecord('sofia-zvezdichki-boyanski-vodopad','Център за деца Звездички','other',stars,'+359889318385','София, кв. Манастирски ливади – Изток, ул. Боянски водопад 101','Манастирски ливади',[
    service('Индивидуална сесия с детски психолог',30,'https://zvezdichki.com/uslugi/detski-psiholog/','other',{description:'За деца на 1–10 години; публикувана продължителност 45–50 минути.'}),
    service('Групово занимание по психомоторика',25,stars,'other',{minutes:45,appointmentModel:'group_reservation'}),
    service('Консултация за родители',35,stars,'other',{minutes:60}),
    service('Онлайн консултация за родители',25,stars,'other'),
    service('Оценка на детското развитие',30,stars,'other',{price:{kind:'range',maximum:40},description:'Публикуван диапазон за диагностика; конкретният тест се уточнява с центъра.'}),
  ],stars,'Запиши час или се обадете на 0889 318 385.'),
  phoneRecord('sofia-new-belief-markovska','New Belief · Вили Марковска','other',belief,'+359885553026','София, бул. България 98, сграда Астра, партер, студио METTASENSE','Манастирски ливади',
    ['Индивидуална терапия','Онлайн терапия','Психологическа сесия · младежи от 13 г.','Психологическа сесия · спортисти от 13 г.'].map(name => service(name,40,belief,'other',{description:'Публикувана продължителност 45–50 минути.'})),belief,'Запази сесия по тел.: +359885553026'),
  phoneRecord('sofia-inacademy-home-lessons','INacademy · Ина Маринова · уроци на адрес','education',ina,'+359877406420',null,'Манастирски ливади',
    [[4,240],[8,440],[12,600]].map(([count,amount])=>service(`Математика на адрес · ${count} урока месечно`,amount,ina,'education',{appointmentModel:'home_visit',price:{unit:'пакет'},description:`Общо за ${count} урока по 90 минути на адреса на ученика, до 8. клас. Включено доплащане за посещение; не е цена за единичен урок.`})),ina,'Свържете се с мен за информация, консултация и записване.','service_area'),
  phoneRecord('sofia-health-master-clinic-ralevitsa','Health Master Clinic · Ралевица','other',healthMaster,'+359882424243','София, кв. Манастирски ливади, ул. Ралевица 87, партер, вход А','Манастирски ливади',[
    ...[['Първичен преглед · дежурен лекар',62],['Първичен преглед · лекар с две специалности',83],['Първичен преглед · доцент',115],['Първичен преглед · професор',146],['Консултация по документи',55],['Годишен профилактичен преглед с ехография и ЕКГ',94],['Вторичен преглед до 30 дни · лекар',42],['Вторичен преглед до 30 дни · доцент',81],['Вторичен преглед до 30 дни · професор',102],['Клиничен психолог · първична консултация',70],['Клиничен психолог · първична онлайн консултация',80],['Клиничен психолог · вторична консултация',46],['Клиничен психолог · вторична онлайн консултация',55]].map(([name,amount])=>service(name,amount,healthMaster,'other',{description:'Обикновена тарифа; почивни/празнични дни и чужд език имат отделни цени.'})),
  ],healthBook,'Запазване на час при избран специалист; телефон +359 882 424 243.'),
]

const reviews = [
  receipt('sofia-dm-physio-studentski','https://www.dmphysi0.com/',[dmBook,dmStudentski,dmKinet,dmMedical,dmDeep],'Actual owner Book selector followed and rendered Studentski branch inspected without selecting any date, therapist, duration or appointment slot. Both therapist cards show a 5-procedure total of 180 EUR; no package duration inferred. Separate owner procedure pages explicitly publish 50 EUR/60 minutes with this exact address. No health-outcome claims or copied schedule/rating.',dmBook,'owned_booking_reviewed'),
  receipt('sofia-dm-physio-mladost','https://www.dmphysi0.com/',[dmBook,dmMladost],'Actual rendered Mladost branch booking page inspected without changing automatic selections or selecting a time. Practitioner-specific 5-procedure totals differ: Ivan 150 EUR, Daniel/Elitsa 180 EUR. Generic procedure pages display only Studentski address, so no single-visit tariff copied into Mladost. No duration inferred for packages, no availability or outcome claim.',dmBook,'owned_booking_reviewed'),
  receipt('sofia-mvc-bulgaria','https://www.mvcbulgaria.com/',['https://www.mvcbulgaria.com/appoinment',mvc],'Actual owner appointment request form read first: requests require clinic confirmation and appointment times are indicative. Current public EUR tariff imported only for consultations, named-practitioner visits and non-invasive imaging. No surgical fee falsely presented as inclusive of venous access, analgesia or anesthesia; no emergency/walk-in fees, retail products, vaccine products or indefinite weight-based treatment totals imported. No form, CAPTCHA or booking submitted.','https://www.mvcbulgaria.com/appoinment','owned_booking_reviewed'),
  ...['sofia-anton-kolev-pirin','sofia-anton-kolev-calma'].map(id=>receipt(id,kolev,[kolevBook,'https://superdoc.bg/lekar/anton-kolev'],'Followed actual owner Book link and rendered Cal.com event read-only. Description explicitly gives 55 EUR, first meeting 75 minutes and following 60 minutes, overriding generic one-hour header for first meeting. Owner lists two separate offices, same phone and own exact-address map marker links; marker !3d/!4d retained, not viewport center. Provider branch fees independently agree. No date, time, appointment, rating, review or image selected/copied.',kolevBook,'provider_booking_reviewed')),
  receipt('sofia-malki-muzikalni-uroci','https://www.malkimuzikalniuroci.com/',['https://www.malkimuzikalniuroci.com/kontakti',malki],'Actual Reserve lesson/contact form reviewed before EUR tariff. One-off lesson duration and card totals retained. Group month cards not confused with individual 40-day cards. No child information, forms or enrollment submitted.'),
  receipt('sofia-art-and-shock',artShock,[],'Owner page includes actual Book section with unselected lesson/session inputs and the same EUR totals as displayed tariff. Read-only public booking form reviewed without choosing session, entering data, agreeing to terms or paying. Package validity one month from first lesson; no duration inferred.',artShock,'owned_booking_reviewed'),
  receipt('sofia-avarton-music-academy','https://avartonmusic.com/',['https://avartonmusic.com/contacts','https://avartonmusic.com/conditions',avarton],'Followed actual piano Book link to owner contacts and enrollment terms. Current ordinary EUR tariffs imported with month versus course versus single units. Duo fees are per participant. English fees only literal published amounts, not inferred conversion/surcharges. Trial promotions and unconfirmed hours omitted.'),
  receipt('sofia-dara-physiotherapy','https://daraphysiotherapy.bg/',['https://reservation.studio/en/location/dara-physiotherapy','https://superdoc.bg/lekar/darina-kavlakova',dara],'Followed actual owner reservation provider first; then owner-linked specialist booking and full current EUR price page. Core fees agree with scheduler. Duration only when explicit on the owner price page; packs are totals. Pilates and trial promotions excluded from this rehabilitation update, no appointments selected.','https://reservation.studio/en/location/dara-physiotherapy','provider_booking_reviewed'),
  receipt('sofia-vibomi','https://vibomi.bg/',['https://vibomi.bg/zapazi-chas',vibomi],'Actual owner Book page reviewed before ordinary EUR tariff, requiring team confirmation rather than claiming availability. All prices explicitly indicative; literal durations and combination/package totals retained. Unpriced custom combinations omitted, no form or calendar submission.','https://vibomi.bg/zapazi-chas','owned_booking_reviewed'),
  receipt('sofia-office-therapy','https://officetherapy.bg/',['https://book.officetherapy.bg/direct-appointment/',office],'Followed actual owner Book flow and public initial-appointment entry before owner EUR tariff. Did not fill sensitive health questionnaire, log in or book. Whole-body/back is one tariff not separate invented variants. Home-visit duration and package totals retained; no DZO reimbursement promise.','https://book.officetherapy.bg/direct-appointment/','owned_booking_reviewed'),
  receipt('sofia-ketty-vandova-boyana','https://kettyvandova.bg/',[kettyBook,ketty],'Actual owner Book entry and reservation/contact form inspected. Ordinary owner direct-booking EUR fees and durations imported, not older provider-specific amounts. Monthly promo omitted. Group minimum and couple price unit retained; no health-outcome claims or appointment availability.'),
  receipt('sofia-rhythm-academy','https://rhythm-academy.com/',['https://rhythm-academy.com/online-booking/',rhythm],'Actual appointment request form read before current owner EUR tariff. Single lessons, monthly package totals and conditional 12-month guitar/piano subscription distinguished. Trial explicitly labelled first visit, not used as standard lesson price. No request submitted.','https://rhythm-academy.com/online-booking/','owned_booking_reviewed'),
  ...['sofia-music-box-sinanishko','sofia-music-box-mladost'].map(id=>receipt(id,'https://www.music-box.bg/',[musicBox,'https://www.music-box.bg/цени','https://www.music-box.bg/контакти'],'Actual signup instructions and common branch phone reviewed. Owner-linked PDF visually rendered to verify table columns, expressly current from 01.09.2026. Four-week prepaid package totals separated from weekly-arranged single visits; free introductory lesson not used as ordinary rate.')),
  receipt('sofia-paw-paw-mobile',paw,['https://pawpaw.setmore.com/'],'Followed actual owner Book link to public Setmore service menu before importing owner EUR rates. All eight amounts agree. Only menu viewed, no service/time selected; mobile home-visit model retained. No ratings or photographs copied.'),
  receipt('sofia-podstrizhime-grooming',podstrizhime,[],'Actual Book anchor goes to same-page phone/contacts. Own EUR tariff reviewed with ranges, over-20kg quote rule and cat coat/behaviour surcharge retained. No exact duration invented. Dental treatment of rodents omitted; no veterinary competence inferred.'),
  receipt('sofia-bono-grooming','https://bonogrooming.com/',[bono,'https://bonogrooming.com/контакти/','https://bonogrooming.com/wp-content/uploads/2026/06/Kopie-von-Uberschrift-768x1024.png'],'Actual owner Book link goes to contacts and matching phone. Browser visibly inspected complete image tariff and rules; OCR/search snippets alone were insufficient. Breed, weight and size variants retained. Dental-cleaning fee only for full-grooming bookings after on-site assessment. No provider images copied.'),
  receipt('sofia-love-your-pets-grooming','https://loveyourpets.bg/',[lovePets],'Actual rendered owner-linked scheduler inspected: only category tabs opened, never individual service/appointment/time, login or form. Breed/coat, stripping and cat menus publish literal EUR fees and durations. Untariffed detangling and ambiguous antiparasitic/ozone add-ons omitted. No schedule, ratings or images copied.',lovePets,'provider_booking_reviewed'),
  receipt('sofia-mandala-ivan-susanin',mandala,[],'Owner root publishes explicit advance booking phone and ML street together with four literal EUR session fees and durations. No claimed medical outcomes or availability imported.'),
  ...['sofia-okto-oborishte','sofia-okto-lozenets'].map(id=>receipt(id,'https://okto.bg/',[okto,'https://okto.bg/kontakti/'],'Actual owner Book entry goes to Contacts, with both Sofia branches and shared phone. Common ordinary EUR tariff reviewed. Package totals and 45-day validity preserved; additional-device surcharges and NHIF coverage not inferred.')),
  receipt('sofia-np-dental-clinic','https://npdentalclinic.com/',[npDental],'Actual owner Book link opens the same page appointment modal; no CAPTCHA, personal data or request submitted. Current private EUR tariff is indicative with final quote after examination; evening/weekend/holiday surcharge up to 20% retained. NHIF co-payments not imported.','https://npdentalclinic.com/','owned_booking_reviewed'),
  receipt('sofia-sofia-physio-center','https://sofiaphysiocenter.com/',[physio,'https://superdoc.bg/klinika/Sofia-Physio-Center'],'Owner phone channel and current owner EUR tariff reviewed. Provider-specific doctor tariffs may differ: these are the owner phone-channel prices, not a universal Superdoc tariff. Specific 40/50-minute massages override the general 60-minute session heading.'),
  receipt('sofia-dental-place','https://dentalplace.bg/',[dentalBook,dental],'Actual rendered owner Book page and date/time modal inspected without choosing a day or slot; first visit starts with examination. Prices are indicative private owner tariff, final plan after exam. NHIF co-payments excluded, canal treatment excludes final filling. No booking submitted.',dentalBook,'owned_booking_reviewed'),
  ...['sofia-yan-physio-borovo','sofia-yan-physio-stranski'].map(id=>receipt(id,'https://yanphysio.com/',[yan,'https://yanphysio.com/about/'],'Owner Book/phone entry reviewed. Shared owner price page lists both Sofia addresses and the identical booking phone. Only physiotherapy tariffs imported; gym-entry fee and training packages omitted. Five-procedure packages are totals, not single sessions.')),
  receipt('sofia-nota-music-room','https://www.notabg.com/',[nota],'Owner root explicitly offers phone/email appointment for lessons; then current ordinary EUR tariff reviewed. Individual and group formats and prepaid package totals kept separate. Free trial and conditional referral promotion not used as ordinary prices.'),
  receipt('sofia-new-belief-markovska',belief,[],'Owner actual Reserve session section supplies the ML address, booking phone and four literal EUR fees. Published duration is a 45–50 minute range, so no single durationMin invented. Unpriced couples therapy omitted; age 13+ conditions retained.'),
  receipt('sofia-inacademy-home-lessons',ina,[],'Owner explicitly offers visits to the pupil and phone booking. Teacher street is disclosed only after booking: service_area with no invented street or coordinates. Imported only explicitly published at-pupil package totals including travel surcharge, not conditional per-lesson teaser prices.'),
  receipt('sofia-health-master-clinic-ralevitsa',healthMaster,[healthBook],'Actual owner Book page inspected, which embeds specialist booking and publishes the clinic telephone/address. Phone route retained; no calendar slots selected. Current EUR owner tariff imported for named qualification/day conditions; emergency, laboratory and package treatment claims omitted.'),
  receipt('sofia-physio-point',point,[],'Actual Reserve appointment anchor leads to the same owner page phone invitation. Literal EUR therapy fees read, with separate 30/60-minute massage variants, blank combined-therapy row excluded. No availability or health-outcome claim.'),
  receipt('sofia-vocal-vision-house','https://vocalvisionhouse.com/',[vocal,'https://vocalvisionhouse.com/kontakti/'],'All owner Reserve appointment links lead to Contacts with the same phone and explicit lesson scheduling. Imported ordinary single-consultation and calendar-month package prices; studio support is hourly and by prior arrangement. No form submitted.'),
  receipt('sofia-mymusic-center','https://mymusic.center/',[guitar,myMusic,'https://mymusic.center/product/piano/'],'Actual Guitar signup product and public teacher/visit options inspected without adding to cart or sending data. Current EUR owner tariff used. Conflicting 40 vs 45 minute Angel lesson duration left unstructured. Old cached bass-guitar product fee is excluded rather than overwritten or converted.'),
  receipt('sofia-topal-center','https://topalcenter.com/',[topal,'https://book.topalcenter.com/reservations/start?site=1'],'Owner explicitly offers appointment phone. Actual online-book link returned 502 in this read-only check; retained existing published phone route. Own EUR prices and ML address verified; no invented duration or claimed online availability. Private prices, not NHIF.'),
  receipt('sofia-physio-health-sofia','https://physiohealth.bg/',[phHealth,'https://physiohealth.bg/zapazi-chas/','https://booking.physiohealth.bg/physiohealth/bg/booking/233'],'Followed actual Sofia booking link before own tariff. Provider page says temporarily unavailable and requires registration: no login attempted, phone route retained. Imported only explicit Sofia owner rows, not Varna or practitioner-specific alternatives. Packages preserve totals/expiry.'),
  receipt('sofia-zvezdichki-boyanski-vodopad',stars,['https://zvezdichki.com/uslugi/detski-psiholog/'],'Owner actual Book section/phone and full ML address verified. FAQ publishes ordinary EUR session fees; free first-visit promotion not imported as normal price. Individual duration has 45 vs 45–50 minute text, so range stays in description. Parent consultation is explicitly 60 minutes. No client data sent.'),
  receipt('sofia-law-bba','https://www.law-bba.com/',[bba,bbaOnline],'Actual owner in-office and online Book pages inspected. Literal EUR charge is per started astronomical hour with first-hour advance payment, not a fixed total for any case. Did not submit calendar/form, pay or send legal data.',bba,'owned_booking_reviewed'),
  receipt('sofia-kavazova-tax-law','https://advokatkavazova.com/',[kavazova],'Actual owner date/time consultation form inspected, including separate online/office EUR prices and included follow-up questions/taxes. No CAPTCHA solved, form submitted or client details entered.',kavazova,'owned_booking_reviewed'),
  receipt('sofia-sokol-nedkov','https://www.sokolnedkov.bg/',[sokol,'https://www.sokolnedkov.bg/faq/'],'Actual current Book page specifies 120 EUR total for 30 minutes, consistent with current FAQ. Older cached 100 EUR excerpt not used as payable total. Payment is in provider flow; no slot selected, payment attempted or personal case supplied.',sokol,'owned_booking_reviewed'),
  receipt('sofia-omni-iztok','https://www.omnibodyclinic.com/',[omniIztok],'Rendered actual branch/practitioner menu inspected in browser: explicitly Tsvetelin Tsenkov, Iztok; literal EUR amounts and durations read before any Book action. Student restriction retained. No appointment type or time selected, and no fees copied across therapists/branches.',omniIztok,'provider_booking_reviewed'),
  receipt('sofia-omni-amaya-massage','https://www.omnibodyclinic.com/',[omniAmaya],'Rendered actual Amaya massage menu inspected in browser. Three fees are literally in service names (30/50/70 EUR) with 30/60/90-minute durations, not inherited from Iztok. No Book action, availability claim or personal data.',omniAmaya,'provider_booking_reviewed'),
  receipt('sofia-snap-dental-care','https://snapdental.eu/',[snap,'https://superdoc.bg/uslovia-za-polzvane'],'Owner-linked practitioner profile opened and public See prices accordion expanded in the browser. Only one first-exam EUR fact, for named doctor at exact ML branch; no rating/review/photo or schedule copied, no appointment reason/time selected.',snap,'provider_booking_reviewed'),
  receipt('sofia-kantora-petrova-damyan-gruev',petrova,[petrovaPhone],'Owner actual phone-consultation booking page shows 30 EUR total and scheduling/payment form. Reviewed without selecting date or submitting. Chat is a separate up-to-30-minute fee. Excluded unpriced video variant and asynchronous written advice from appointment list; contacts challenge not bypassed.',petrovaPhone,'owned_booking_reviewed'),
]

// Keep unresolved owner/provider/branch evidence outside the approved payload.
// These are research findings, not imported prices or security accusations.
export const pendingPricingResearch = [
  {id:'sofia-radoslav-valev-law',urls:['https://www.rvalev.bg/','https://www.rvalev.bg/kontakti/'],reason:'Actual Reserve consultation/contact form and practice areas reviewed. Advance appointments explicit but no numeric consultation tariff visible; no legal fee inferred from general professional schedules.'},
  {id:'sofia-mokro-nosle',urls:['https://www.mokronosle.com/','https://easybook.bg/gruming-studio-mokro-nosle-sofiya-manastirski-livadi','https://easybook.bg/page/terms'],reason:'Actual owner-linked rendered Easybook menu reviewed, but legacy review records provider republication restriction. Do not import its detailed tariff. Owner generic from-prices are not accepted as replacements for conflicting booking amounts; owner confirmation and reusable owner-owned tariff remain needed.'},
  {id:'sofia-yoyo-vet',urls:['https://yoyovet.com/contact-us/','https://yoyovet.com/dogs/'],reason:'Actual Book entry goes to owner contacts/phone. Owner dog-service page lists consultations and procedures without numeric fee; no veterinary price guessed.'},
  {id:'sofia-vet-mei',urls:['https://vetmei.com/','https://vetmei.com/index.php?main_page=appointment','https://vetmei.com/index.php?cPath=1_3&main_page=document_general_info&products_id=4'],reason:'Actual Book entry has access challenge, not bypassed. Examination/service page has no numeric fee; shop food/product prices excluded.'},
  {id:'sofia-vet-vyara-nadezhda-lyubov',urls:['https://vnl-vet.com/','https://vnl-vet.com/ценоразпис/'],reason:'Actual advance appointment phone and owner price page reviewed. Price page explicitly says rates are being updated and to call; no numeric tariff published there. No stale fees guessed.'},
  { id:'sofia-city-music-school',urls:['https://citymusic-school.com/','https://citymusic-school.com/уроци/','https://citymusic-school.com/контакти/'],reason:'Actual enrollment/price page explicitly instructs calling for offer and contains no numeric rate. Contacts page has access challenge, not bypassed. No quoted price guessed.' },
  { id:'new-elena-mecheva-mytalkspace',urls:['https://www.mytalkspace.bg/','https://www.mytalkspace.bg/kontakti','https://www.mytalkspace.bg/запиши-час','https://www.mytalkspace.bg/individualna-rabota'],reason:'Actual owner Book/contact route, exact ML Kosher address and phone reviewed. Session duration ranges and payment rules published, but no numeric price on reviewed pages; no invented fee.' },
  { id:'sofia-q-life-kinezitherapy',urls:['https://www.qlife.bg/','https://www.qlife.bg/klasicheski-masazh/'],reason:'Actual Book anchor and booking phone reviewed; linked classical-massage service page presents access challenge, not bypassed. No numeric ordinary price taken from unrelated holistic claims.' },
  { id:'sofia-baron-grooming',urls:['https://barongrooming.bg/','https://barongrooming.bg/services/'],reason:'Owner phone booking verified. Service page shows implausibly broad BGN subscription bundles (30 for 3 months etc.) with inconsistent second phone; not assumed current ordinary groom price, no conversion or service quote invented.' },
  { id:'sofia-doctor-dent',urls:['https://www.drdent.bg/','https://drdent.bg/rezervirai_chas'],reason:'Actual booking link returned404; visible NHIF tables/articles dated2015–2016 are not accepted as current private fees.' },
  { id:'sofia-ramona-grooming',urls:['https://www.ramonapet.com/','https://www.ramonapet.com/gruming/'],reason:'Actual owner booking-by-phone section and services read; no ordinary public EUR grooming tariff found. Retail product prices are not service prices.' },
  { id:'sofia-new-vita-grooming',urls:['https://www.newvita.bg/kontakti','https://www.newvita.bg/uslugi/gruming-salon'],reason:'Actual booking form and grooming page reviewed. Owner explicitly says request a quote based on coat/sedation and surcharge; no numeric fee invented.' },
  { id:'sofia-omni-druzhba',urls:['https://www.omnibodyclinic.com/','https://omnibodyhealthcare.as.me/monika-iztok'],reason:'Owner Druzhba Book link resolves to a menu explicitly labelled Monika—Iztok. No branch-specific tariff copied into Druzhba without clarification.' },
  { id:'sofia-felix-dogs-lyulin',urls:['https://www.felixdogs.com/','https://www.felixdogs.com/onlayn-zapisvane/','https://www.felixdogs.com/tsenorazpis-grooming/'],reason:'Owner EUR coat/weight tariff exists. Root rendering also showed unrelated crypto-wallet blog entries, while the service pages did not. Treat as unresolved source anomaly, not proof of compromise; no removal or new phone/booking destination inferred.' },
  { id:'new-sisters-of-dogs',urls:['https://sistersofdogs.com/','https://sistersofdogs.com/kontakti','https://sistersofdogs.com/uslugi-i-ceni'],reason:'Own complete EUR tariff/address/phones read but explicit advance-appointment invitation not found on those pages. Not promoted to approved catalogue merely because a contact phone exists.' },
  { id:'new-novainsight',urls:['https://novainsight.bg/','https://novainsight.bg/uslugi/','https://calendly.com/ivan-penchev-novainsight/meet-with-me'],reason:'Real ML address, services and owner-linked Calendly identified; no public ordinary numeric tariff visible without further scheduler inspection. No price inferred.' },
  { id:'new-cognitiva',urls:['https://cognitiva.bg/','https://cognitiva.bg/contacts/','https://cognitiva.bg/activities/individual-consultations/'],reason:'Own ML Kazbek addresses, phone and consultation services read; ordinary numeric tariff not found. Distinct offices not multiplied just to inflate coverage.' },
]

export default { records, updates, reviews }
