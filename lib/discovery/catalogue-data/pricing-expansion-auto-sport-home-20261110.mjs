// Manual first-party booking/menu review, 10 November 2026. No Google data,
// inferred prices, currency conversion, reservations or customer data.
const checkedOn = '2026-11-10'
const validUntil = '2027-02-08'
const price = (amount, sourceUrl, options = {}) => ({ amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil, ...options })
const service = (category, name, amount, sourceUrl, options = {}) => ({
  name, category,
  appointmentModel: options.model || (category === 'fitness' ? 'group_reservation' : category === 'home_services' ? 'home_visit' : 'appointment'),
  ...(options.description ? { description: options.description } : {}),
  price: price(amount, sourceUrl, options.price),
  ...(options.minutes ? { durationMin: options.minutes, durationSourceUrl: options.durationSource || sourceUrl, durationCheckedOn: checkedOn } : {}),
})
const range = (category, name, low, high, url, options = {}) => service(category, name, low, url, { ...options, price: { ...options.price, kind: 'range', maximum: high } })
const receipts = []
const enrich = (id, website, reviewedUrls, notes, services, bookingEntry = 'phone', bookingReview = 'phone_booking_reviewed') => {
  receipts.push({ id, checkedOn, website, bookingEntry, reviewedUrls, bookingReview, notes, services })
  return { id, services }
}

const signature = 'https://signaturedetailing.bg/'
const heal = 'https://healfit.bg/'
const healPrices = 'https://healfit.bg/ceni'
const body = 'https://thebodylab.bg/'
const factor = 'https://factordetailing.com/tseni/'
const top = 'https://topcleaner.bg/tseni'
const chistnik = 'https://www.chistnik.bg/ceni/'
const cleanrs = 'https://cleanrs.bg/'
const impact = 'https://www.boxovazala.com/'
const eden = 'https://edenpilates.eu/'
const edenPrices = 'https://edenpilates.eu/tseni'
const edenBooking = 'https://book.edenpilates.eu/calendar/public'
const luxspa = 'https://luxspadetailing.com/ceni'
const pulsar = 'https://pulsardetailing.com/услуги-мобилен-детайлинг-софия'
const jp = 'https://jpstudio.bg/'
const one = 'https://one-space.eu/ceni'
const steel = 'https://boksovatazala.com/'
const vibe = 'https://reformer-vibe.com/pricing'
const fresh = 'https://freshclean.bg/uslugi/pochistvane-na-apartamenti'
const pochisteno = 'https://pochisteno.com/'
const shining = 'https://polishingauto.bg/'
const shiningPrices = 'https://polishingauto.bg/uslugi/'
const shiningBooking = 'https://polishingauto.bg/product/polirane-i-pastirane-na-avtomobil/'
const matraci = 'https://pranenamatraci.com/'
const matraciPrices = 'https://pranenamatraci.com/tseni/'
const georgiBooking = 'https://rezervauto.com/customer'
const topclass = 'https://topclass-cars.com/'
const pilatesClub = 'https://thepilatesclub.bg/'
const rozetka = 'https://rozetka.bg/'
const rozetkaPrices = 'https://rozetka.bg/tseni'
const electro = 'https://electrouslugi.com/'
const electroPrices = 'https://electrouslugi.com/ceni/'
const obekt = 'https://el-uslugi.net/'
const obektPrices = 'https://el-uslugi.net/czeni-na-nashite-elektro-uslugi-sofiya/'
const remontfix = 'https://remontfix.bg/'
const remontfixPrices = 'https://remontfix.bg/tseni/'
const topchiev = 'https://topchievdetailed.com/'
const topchievBooking = 'https://topchievdetailed.com/zapazi'
const topchievHome = 'https://topchievdetailed.com/zapazi?flow=home-care'
const elscape = 'https://electro.elscape.com/'
const elscapePrices = 'https://electro.elscape.com/pricing'
const slavia = 'https://slaviasportess.eu/'
const slaviaBoxing = 'https://slaviasportess.eu/boks-kikboks/'
const carkings = 'https://carkings.bg/'
const carkingsClean = 'https://carkings.bg/b2c/services/full-detailing'
const carkingsExtra = 'https://carkings.bg/b2c/services/additional-services'
const carkingsFlood = 'https://carkings.bg/b2c/services/flood-restoration'
const aleksov = 'https://aleksovauto.bg/'
const aleksovPrices = 'https://aleksovauto.bg/uslugi/tseni/'
const sgumi = 'https://s-gumi.bg/'
const sofiagas = 'https://sofiagas.com/'
const sofiagasPrices = 'https://sofiagas.com/ceni'
const sofiagasBooking = 'https://sofiagas.com/zapazi-chas'
const lion = 'https://mobilen-avtoserviz.bg/'
const lionPrices = 'https://mobilen-avtoserviz.bg/tseni-za-avtoservis/'
const dojoto = 'https://www.dojoto.org/'
const dojotoPrices = 'https://www.dojoto.org/prices'
const dojotoBooking = 'https://www.dojoto.org/registration-sofia'
const katerene = 'https://www.katerene.bg/'
const katerenePrivate = 'https://www.katerene.bg/courses/private/individualni-zanimaniia-po-katerene-v-zala'

const signatureServices = [
  ...[['Интериорен детайлинг · лек автомобил',230],['Интериорен детайлинг · джип',280],['Едностъпково полиране · лек автомобил',330],['Едностъпково полиране · джип',500],['Защитно покритие · лек автомобил',400],['Защитно покритие · джип',500],['Полиране и защита на джанти',200],['Полиране на фарове',100],['Безводно почистване на двигател',75]].map(([name, amount]) => service('detailing',name,amount,signature,{
    price:{kind:'from'}, description:name.startsWith('Защитно покритие') ? 'Начална цена; задължително е предварително полиране. Условията и цената се потвърждават според автомобила.' : 'Начална цена; зависи от размера, модела и състоянието на автомобила.',
  })),
  service('detailing','Керамична защита на предно стъкло',77,signature),
  service('detailing','Керамична защита на всички стъкла',179,signature),
]
const healServices = [
  service('fitness','Групова гимнастика · единично посещение',10.5,heal,{description:'Часът се записва предварително; група на живо в студиото на ул. Казбек 30.'}),
  service('fitness','Индивидуална тренировка · един човек',27,healPrices,{model:'individual_training',description:'Публикувана продължителност 50–60 минути; не се представя като фиксиран час.'}),
  service('fitness','Индивидуална тренировка · двама',38,healPrices,{model:'individual_training',price:{unit:'двама'},description:'Обща цена за тренировка на двама; продължителност 50–60 минути.'}),
  service('fitness','Карта за 12 тренировки на живо',85,healPrices,{price:{unit:'пакет 12 посещения'},description:'За 4 последователни седмици в избран часови диапазон. Пропуснати посещения не се прехвърлят.'}),
]
const bodyServices = [
  service('fitness','Групова тренировка по пилатес реформър',25,body,{price:{kind:'from'},minutes:50,description:'Публикувана начална цена. Задължително предварително записване; няма потвърдена GoRez наличност.'}),
  service('fitness','Индивидуална тренировка по пилатес реформър',30,body,{model:'individual_training',price:{kind:'from'},minutes:50,description:'Публикувана начална цена; 1:1 с инструктор.'}),
]
const factorServices = [
  service('detailing','Полиране на два фара/стопа със защита',55,factor,{price:{unit:'два броя'},description:'Публикуваната видима тарифа за комплект от два броя.'}),
  range('detailing','Импрегниране на екстериорни пластмаси',15,25,factor),
  service('detailing','Импрегниране на стъкла',25,factor),
  service('detailing','Почистване на четири джанти от нагар и асфалт със защита',36,factor,{price:{unit:'четири броя'}}),
  service('detailing','Възстановяване на лаково покритие',200,factor,{price:{kind:'from'},description:'Точната цена за цялостно полиране е след оглед.'}),
  range('detailing','Освежаване на интериора с Торнадор',40,54,factor),
  service('detailing','Дезинфекция с озонатор',25,factor),
  range('detailing','Цялостно пране на интериора',180,210,factor,{description:'Точна цена след оглед според размера и замърсяването.'}),
  service('detailing','Керамична защита на седалки · пет места',100,factor,{price:{unit:'автомобил с пет места'}}),
  service('detailing','Керамична защита на четири врати',30,factor,{price:{unit:'четири врати'}}),
]
const topNote = 'Ориентировъчна цена; окончателна оферта след оглед. Минимална поръчка за посещение 60 €. Има доплащане при утежнени условия.'
const topServices = [
  service('home_services','Основно почистване на жилище',2.5,top,{price:{kind:'from',unit:'м²'},description:topNote}),
  service('home_services','Почистване след ремонт',3.5,top,{price:{kind:'from',unit:'м²'},description:topNote}),
  ...[['Пране на двуместен диван',25],['Пране на триместен диван',35],['Пране на четириместен диван',50],['Пране на фотьойл',15.34],['Пране на единичен матрак · едностранно',15],['Пране на двоен матрак · едностранно',30],['Пране на двоен матрак · двустранно',30],['Почистване на фурна',35],['Почистване на пералня',20],['Почистване на хладилник',35],['Почистване на съдомиялна',25]].map(([name,amount])=>service('home_services',name,amount,top,{price:{unit:'брой'},description:topNote})),
  service('home_services','Почистване на стъкла до 3 м · едностранно',1.02,top,{price:{unit:'м²'},description:topNote}),
]
const chistnikNote = 'Минимална поръчка 45 €. Окончателна оферта след оглед; оскъпяване 30–100% при утежнени условия според тарифата.'
const chistnikServices = [
  service('home_services','Основно почистване на дом',3,chistnik,{price:{kind:'from',unit:'м²'},description:chistnikNote}),
  ...[['Пране на двуместен диван',25],['Пране на триместен диван',30],['Пране на ъглов холен диван',45],['Пране на фотьойл',12],['Пране на стол с облегалка',6],['Пране на единичен матрак · еднолицев',15],['Пране на единичен матрак · двулицев',20],['Пране на матрак за спалня · еднолицев',20],['Пране на матрак за спалня · двулицев',30],['Комплексно почистване на баня',55]].map(([name,amount])=>service('home_services',name,amount,chistnik,{price:{unit:'брой'},description:chistnikNote})),
  service('home_services','Машинно почистване на твърда настилка',1,chistnik,{price:{unit:'м²'},description:chistnikNote}),
  service('home_services','Почистване на стъкла до 3 м · едностранно',1,chistnik,{price:{unit:'м²'},description:chistnikNote}),
]
const cleanrsServices = [
  service('home_services','Почистване на дома на адрес',3,cleanrs,{price:{unit:'м²'},description:'Базова единична тарифа; крайната цена се потвърждава след оглед според обекта и избраните задачи.'}),
  service('home_services','Почистване след ремонт на адрес',4.7,cleanrs,{price:{unit:'м²'},description:'Базова единична тарифа; крайна оферта след оглед.'}),
]
const impactServices = [
  service('fitness','Индивидуална тренировка по бокс с Аспарух Георгиев – Сочи',15.34,impact,{model:'individual_training',description:'Само с предварително записване. Не е свободен достъп до фитнес.'}),
]
const edenServices = [
  service('fitness','Пилатес реформър · групова тренировка',17,edenPrices,{minutes:50,durationSource:eden}),
  ...[[4,65],[8,125],[12,170],[16,200]].map(([count,amount])=>service('fitness',`Пилатес реформър · карта ${count} групови тренировки`,amount,edenPrices,{price:{unit:`пакет ${count} посещения`},description:'Цена за цялата карта, не за едно посещение. Условията и часовете се уточняват със студиото.'})),
  service('fitness','Пилатес реформър · индивидуална тренировка',35,edenPrices,{model:'individual_training',minutes:50,durationSource:eden}),
  ...[[4,132],[8,256],[12,360]].map(([count,amount])=>service('fitness',`Пилатес реформър · карта ${count} индивидуални тренировки`,amount,edenPrices,{model:'individual_training',price:{unit:`пакет ${count} посещения`},description:'Обща цена на картата, не цена за единична тренировка.'})),
]
const luxspaServices = [['Базов мобилен пакет · седан/купе',55],['Голд мобилен пакет · седан/купе',95],['Премиум мобилен пакет · седан/купе',220]].map(([name,amount])=>service('detailing',name,amount,luxspa,{price:{kind:'from'},description:'Начална цена за седан/купе; SUV и комби са по-скъпи. Обхватът, състоянието и условията на адреса се потвърждават предварително.'}))
const pulsarServices = [
  ...[['Cabin Refresh · интериорен детайлинг',150],['Exterior Radiance · екстериорен детайлинг',50],['Pulsar Detail · интериор и екстериор',185],['Импрегнация на текстилен салон',40],['Керамика на кожен салон',50],['Керамика на екстериорни пластмаси',50],['Импрегнация на мек покрив на кабрио',50],['Отстраняване на животински косми',20],['Нанасяне на твърда вакса',35]].map(([name,amount])=>service('detailing',name,amount,pulsar,{price:{kind:'from'},description:'Начална цена; окончателна оферта според размера и замърсяването. При работа на открито часът зависи и от времето.'})),
  service('detailing','Озониране · допълнителна услуга',20,pulsar,{description:'Допълнение към мобилен детайлинг; условията за посещение се уточняват предварително.'}),
  service('detailing','Хидрофобно покритие на челно стъкло',30,pulsar,{description:'Допълнителна услуга; крайните условия се потвърждават при записване.'}),
]
const jpServices = [
  ...[['Групова',15,'group_reservation'],['Индивидуална',30,'individual_training'],['Дуо',50,'individual_training']].map(([format,amount,model])=>service('fitness',`${format} тренировка по пилатес реформър · само за жени`,amount,jp,{model,price:format==='Дуо'?{unit:'двама'}:{},description:format==='Дуо'?'Обща цена за двете трениращи. Студиото работи само с жени.':'Студиото работи само с жени.'})),
  ...[['групови',4,56],['групови',8,104],['групови',12,144],['индивидуални',4,116],['индивидуални',8,224],['индивидуални',12,312],['дуо',4,192],['дуо',8,376],['дуо',12,540]].map(([format,count,amount])=>service('fitness',`Пилатес реформър · карта ${count} ${format} тренировки · жени`,amount,jp,{model:format==='групови'?'group_reservation':'individual_training',price:{unit:`пакет ${count} посещения`},description:`Обща цена за картата${format==='дуо'?' за двете трениращи':''}. Валидност ${count===12?45:30} дни.`})),
]
const oneServices = [
  ...[['Пилатес',10],['Гръцки танци',10],['Народни танци',8],['Йога / Cardio Workout',11],['Терапевтична йога',5],['Кунг фу · деца',10],['Кунг фу · възрастни',11],['Хип-хоп · тийнейджъри и възрастни',8.5],['Тай чи с Валери Иванов',10],['Belly Dance Fusion',11],['Балет за възрастни',12],['Divine танци и хореографии',10],['Балет за деца 4+',12.5],['Карате Шотокан за деца 6+',8.5],['Кей-поп за деца 10+',8.5]].map(([name,amount])=>service('fitness',`${name} · единично посещение`,amount,one,{description:'Необходимо е предварително записване за конкретния клас. Приемането на спортни карти зависи от заниманието.'})),
  ...[['Кунг фу · деца',66],['Кунг фу · възрастни',76],['Карате Шотокан за деца 6+',60]].map(([name,amount])=>service('fitness',`${name} · карта 8 посещения`,amount,one,{price:{unit:'пакет 8 посещения'},description:'Обща цена за 8 резервирани занимания; валидност на картата 45 дни. Не се предлага с MultiSport или Coolfit.'})),
]
const steelServices = [
  service('fitness','Индивидуален бокс с главен треньор Иво Табаков',36,steel,{model:'individual_training',minutes:60}),
  service('fitness','Индивидуален бокс с помощник-треньор',30,steel,{model:'individual_training',minutes:60}),
  service('fitness','Карта 6 индивидуални тренировки с Иво Табаков',198,steel,{model:'individual_training',price:{unit:'пакет 6 посещения'}}),
  service('fitness','Карта 6 индивидуални тренировки с помощник-треньор',169,steel,{model:'individual_training',price:{unit:'пакет 6 посещения'}}),
]
const vibeServices = [
  service('fitness','Пилатес реформър · групова тренировка',19,vibe,{minutes:50}),
  service('fitness','Пилатес реформър · индивидуална тренировка',29,vibe,{model:'individual_training',minutes:50}),
  service('fitness','Пилатес реформър · дуетна тренировка за двама',45,vibe,{model:'individual_training',minutes:50,price:{unit:'двама'}}),
  ...[['групови',4,69],['групови',8,121],['групови',12,167],['индивидуални',4,91],['индивидуални',8,175],['индивидуални',12,235]].map(([format,count,amount])=>service('fitness',`Пилатес реформър · карта ${count} ${format} тренировки`,amount,vibe,{model:format==='групови'?'group_reservation':'individual_training',price:{unit:`пакет ${count} посещения`},description:`Публикувана обща цена за пакета, не зачеркнатата стойност на единични посещения.${format==='групови'&&count===12?' Валидност 2 месеца.':''}`})),
]
const freshServices = [
  ...[[50,2.94],[100,2.65]].map(([area,amount])=>service('home_services',`Еднократно почистване на апартамент до ${area} м²`,amount,fresh,{price:{kind:'from',unit:'м²'},description:'Начална тарифа. При силно замърсяване, експресна работа, празници или след 22:00 се прилага оскъпяване от 50%.'})),
  service('home_services','Еднократно почистване на апартамент над 100 м²',2.35,fresh,{price:{kind:'from',unit:'м²'},description:'Начална тарифа; точна оферта след уточняване на обекта.'}),
  ...[[50,38.22],[100,44.1]].map(([area,amount])=>service('home_services',`Абонаментно почистване на апартамент до ${area} м²`,amount,fresh,{price:{kind:'from',unit:'посещение'},description:'Тарифа при абонамент, не еднократно основно почистване. Графикът и крайната цена се уговарят предварително.'})),
]
const pochistenoServices = [
  service('home_services','Основно почистване на дом',2,pochisteno,{price:{kind:'from',unit:'м²'},description:'Минимална поръчка 40 €. За над 100 м² – индивидуална оферта; според състоянието може да е нужен оглед.'}),
  service('home_services','Почистване след ремонт',3,pochisteno,{price:{kind:'from',unit:'м²'},description:'Минимална поръчка 40 €. Крайна цена според площта и замърсяването.'}),
  service('home_services','Абонаментно почистване на дом',40,pochisteno,{price:{kind:'from',unit:'посещение'},description:'Начална цена за едно посещение при абонамент; честотата и задачите се уточняват.'}),
]
const elproServices = [
  service('home_services','Смяна на апартаментно електрическо табло',150,'https://elpro.bg/смяна-на-ел-табло/',{price:{kind:'from'},description:'Начална цена; конкретните защити и обхват се описват в индивидуална оферта преди работа.'}),
  service('home_services','Монтаж на ключ или контакт в готова конзола',10,'https://elpro.bg/монтаж-на-контакти-и-ключове/',{price:{kind:'from',unit:'брой'},description:'Начална цена за труд в стандартен случай. Материалите са отделно.'}),
  service('home_services','Нова електрическа точка',20,'https://elpro.bg/ел-инсталация-софия/',{price:{kind:'from',unit:'точка'},description:'Начална цена за труд; материали и конкретни трасета се оферират отделно.'}),
  service('home_services','Монтаж на захранващ кабел за печка',40,'https://elpro.bg/монтаж-на-кабел-за-готварска-печка/',{price:{kind:'from'},description:'Начална цена за труд при стандартен случай. Материалите се избират и заплащат отделно.'}),
]
const shiningServices = [
  ...[['хечбек',180,250],['седан',200,280],['комби',250,320],['джип',300,450]].map(([type,low,high])=>range('detailing',`Пастиране и полиране на автомобил · ${type}`,low,high,shiningPrices,{description:'Публикуван диапазон. Силно увредени детайли може да оскъпят услугата; окончателно потвърждение след оглед.'})),
  range('detailing','Пастиране и полиране на два фара',35,50,shiningPrices,{price:{unit:'два фара'}}),
  range('detailing','PPF UV защитно фолио на два фара',70,100,shiningPrices,{price:{unit:'два фара'},description:'За по-големи детайли се изготвя отделна оферта.'}),
  ...[['Нано защита на странично стъкло',30,'брой'],['Нано защита на челно или задно стъкло',60,'брой'],['Нано защита на всички стъкла · седан/хечбек',160,'комплект осем стъкла'],['Нано защита на всички стъкла · комби/джип',180,'комплект осем стъкла'],['Пастиране и полиране на челно стъкло',180,'брой'],['Пастиране и полиране на задно стъкло',180,'брой']].map(([name,amount,unit])=>service('detailing',name,amount,shiningPrices,{price:{unit}})),
]
const matraciServices = [
  ...[['Пране на единичен матрак · едностранно',25],['Пране на двоен матрак · едностранно',30],['Пране на детски матрак',20],['Пране на бебешко матраче/кошара',15]].map(([name,amount])=>service('home_services',name,amount,matraciPrices,{price:{unit:'брой'},description:'На адрес в София без такса за посещение. Двустранното пране е с 50% доплащане; тежко замърсяване се уточнява по телефона.'})),
  ...[['Пране на голям/нестандартен матрак над 180 см',35],['Пране на топ матрак',20],['Пране на матрак от мемори пяна',30],['Дълбоко почистване на матрак',30],['Сухо пране на матрак',30],['Ензимно почистване на матрак от урина',25],['Локално премахване на петно от матрак',15],['Премахване на миризми от матрак',15],['Дезинфекция на матрак',15],['Антиакарна обработка на матрак',15]].map(([name,amount])=>service('home_services',name,amount,matraciPrices,{price:{kind:'from',unit:'брой'},description:'Начална цена. Посещението в София е без транспортна такса; точният обхват се уточнява предварително по телефона.'})),
]
const georgiServices = [
  ...[['Фолио на задни стъкла · GG Films 5 г.',180],['Почистване на двигателен отсек с външно измиване',80],['PPF защитно фолио · предна част',1450],['Фолио на предни и челно стъкло · GG Films 10 г.',250],['Полиране и защита на стъкла',100],['Полиране на хромирани елементи',50],['Полиране на интериорни елементи',50],['Фолиране на екстериорни елементи',100],['Защитно фолио за фарове',100],['Фолио на задни стъкла · GG Films 10 г.',250],['Цялостно PPF облепяне',3500],['Фолио на предни и челно стъкло · GG Films 5 г.',200],['Детайлно почистване и пране на интериора',250],['Фолиране на интериорни елементи',80],['Почистване и защита на джанти',150],['Възстановяване на стопове и фарове',100],['Възстановяване на лаково покритие',350],['Полуперманентно защитно покритие',100],['Перманентно керамично покритие',300]].map(([name,amount])=>service('detailing',name,amount,georgiBooking,{price:{kind:'from'},description:'Начална цена от действителното меню за резервации. Точна сума след уточняване на автомобила; фолирането на стъкла се отнася само за посочената зона. При възстановяване на фарове защитното фолио е отделно.'})),
]
const topclassServices = [
  ...[['Основно мобилно измиване · автомобил',35,'car_wash'],['Основно мобилно измиване · SUV/ван',45,'car_wash'],['Супер мобилно измиване · автомобил',50,'car_wash'],['Супер мобилно измиване · SUV/ван',70,'car_wash'],['Лукс мобилен детайлинг · автомобил',120,'detailing'],['Лукс мобилен детайлинг · SUV/ван',150,'detailing'],['Пълно мобилно почистване на бус',200,'car_wash'],['Полиране на фарове · допълнителна услуга',30,'detailing'],['Вакса за защита на боята · допълнение',20,'detailing'],['Премахване на неприятни миризми · допълнение',30,'detailing'],['Почистване на двигателен отсек · допълнение',40,'detailing'],['Почистване на детско столче · допълнение',20,'detailing']].map(([name,amount,category])=>service(category,name,amount,topclass,{description:'На адрес в София; за стандартно замърсяване. При силно замърсяване крайната цена се потвърждава след оглед преди посещението. Допълненията се уточняват към избрания пакет.'})),
]
const clubServices = [
  ...[['Пилатес реформър',20,'reformer'],['Мега-интензивен реформър',25,'mega']].flatMap(([type,amount,path])=>[
    service('fitness',`${type} · единична групова тренировка`,amount,`${pilatesClub}prices/${path}`,{minutes:50,durationSource:`${pilatesClub}schedule`}),
    ...(path==='reformer'?[[4,75],[8,136],[12,200]]:[[4,90],[8,140],[12,205]]).map(([count,total])=>service('fitness',`${type} · карта ${count} тренировки`,total,`${pilatesClub}prices/${path}`,{price:{unit:`пакет ${count} посещения`},description:'Обща цена на поименна карта. Посещенията се записват предварително; валидността започва при покупка.'})),
  ]),
  ...[[4,95],[8,145],[12,210]].map(([count,amount])=>service('fitness',`Комбо реформър и мега-интензивен реформър · ${count} посещения`,amount,`${pilatesClub}prices/combo`,{price:{unit:`пакет ${count} посещения`},description:'Обща цена. Клиентът разпределя общия брой посещения между двата вида тренировка; картата е поименна.'})),
]
const rozetkaNote = 'Ориентировъчна единична тарифа. Посещението в София се заплаща 30 €; крайната оферта зависи от обема и сложността.'
const rozetkaServices = [
  service('home_services','Посещение на електротехник в София',30,rozetkaPrices,{description:'Такса за посещение независимо дали е извършена работа.'}),
  service('home_services','Оглед и индивидуална оферта',40,rozetkaPrices,{price:{unit:'час'},description:'При възлагане на ремонта се приспада от общата цена.'}),
  service('home_services','Посещение, електродиагностика и ремонт до 30 минути',50,rozetkaPrices,{description:'След първите 30 минути се начислява 35 € на човекочас. Тарифата не означава гарантирано отстраняване на всеки дефект.'}),
  ...[['Монтаж на монофазен предпазител до 63 A',18],['Монтаж на трифазен предпазител до 63 A',25],['Монтаж на монофазна ДТЗ/УЗО до 40 A',35],['Монтаж на трифазна ДТЗ/УЗО до 40 A',49],['Монтаж на ключ/контакт · скрит монтаж',8],['Монтаж на ключ/контакт · открит монтаж',8],['Монтаж на вентилатор за баня',30],['Монтаж на полилей/пендел до пет лампи',40],['Монтаж на плафон',25],['Свързване на фурна',30],['Свързване на котлони',25],['Свързване на бойлер',30]].map(([name,amount])=>service('home_services',name,amount,rozetkaPrices,{price:{unit:'брой'},description:rozetkaNote})),
]
const electroNote = 'Ориентировъчна цена за труд, без материали. Посещението/диагностиката е отделен ориентир; общият обхват се уточнява преди работа.'
const electroServices = [
  service('home_services','Посещение и първоначална електродиагностика',30,electroPrices,{description:'При сложна или продължителна диагностика се уговарят допълнителни условия.'}),
  ...[['Монтаж или смяна на контакт/ключ',15,30,'брой'],['Монтаж на стандартно осветително тяло',20,40,'брой'],['Монтаж на полилей/сложно осветление',40,70,'брой'],['Смяна на автоматичен предпазител',18,35,'брой'],['Монтаж на ДТЗ/комбинирана защита',35,65,'брой'],['Подмяна и подреждане на електрическо табло',120,280,'табло'],['Свързване на бойлер',30,50,'брой'],['Свързване на фурна/котлони',30,60,'брой'],['Изграждане на нова електрическа точка',25,45,'точка'],['Полагане на кабелно трасе',4,8,'м']].map(([name,low,high,unit])=>range('home_services',name,low,high,electroPrices,{price:{unit},description:electroNote})),
]
const obektNote = 'Ориентировъчна тарифа. Минимално посещение с ремонт 50 €; стандартна такса посещение/диагностика 30 €. Материали и паркиране се уточняват отделно; извънредните посещения са по-скъпи.'
const obektServices = [
  service('home_services','Посещение и диагностика на адрес в София',30,obektPrices,{description:'При отказ от ремонт таксата остава дължима. Посещение с извършен ремонт е минимум 50 €; възможни такси за паркиране и извънредно време.'}),
  ...[['външен монтаж',6,200],['вграден монтаж',6,220],['външен монтаж',8,220],['вграден монтаж',8,250],['външен монтаж',12,280],['вграден монтаж',12,310],['външен монтаж',16,330],['вграден монтаж',16,360]].map(([type,count,amount])=>service('home_services',`Доставка и монтаж на апартаментно ел. табло · ${count} модула · ${type}`,amount,obektPrices,{description:'Публикувана оферта за доставка и монтаж, според броя модули. Точният обхват се потвърждава предварително.'})),
  ...[['Монтаж на вграден контакт',10],['Монтаж на външен контакт',12],['Монтаж на ключ',10],['Монтаж на плафон до 3,20 м',25],['Монтаж на полилей до пет крушки и 3,20 м',30],['Свързване на бойлер',20],['Свързване на готварска печка',25]].map(([name,amount])=>service('home_services',name,amount,obektPrices,{price:{unit:'брой'},description:obektNote})),
]
const remontfixNote = 'Ориентировъчен труд без материали. Огледът струва 40 € и се приспада при приета оферта. Точна цена след оглед и договор.'
const remontfixServices = [
  service('home_services','Оглед на жилище и подробна оферта',40,`${remontfix}kontakti/`,{description:'Цялата такса се приспада от стойността на ремонта при приемане на офертата.'}),
  ...[['Изравняваща гипсова шпакловка',6,9,'м²'],['Фина шпакловка с шитрок · две ръце',6,11,'м²'],['Бял латекс · две ръце',5,8,'м²'],['Цветен латекс · две ръце',6,10,'м²'],['Фаянс по стени',35,50,'м²'],['Теракот/гранитогрес по под',35,50,'м²'],['Едроформатни плочки над 60×60 см',50,70,'м²'],['Нова водопроводна точка',35,55,'точка'],['Монтаж на тоалетна чиния',40,60,'брой'],['Монтаж на мивка',40,60,'брой'],['Монтаж на бойлер',75,110,'брой'],['Нова електрическа точка',22,35,'точка'],['Монтаж на осветително тяло',35,60,'брой'],['Подмяна на старо електрическо табло',100,150,'брой']].map(([name,low,high,unit])=>range('home_services',name,low,high,remontfixPrices,{price:{unit},description:remontfixNote})),
]

const topchievServices = [
  ...[['Auto Refresh · мобилно освежаване на автомобил',45],['Deep Clean · дълбоко почистване на автомобил',190],['SOS · локално почистване на петно или миризма',100],['Полиране и UV защита на фарове на адрес',69]].map(([name,amount])=>service('detailing',name,amount,topchiev,{price:{kind:'from'},description:'Начална цена; крайната оферта зависи от автомобила и състоянието. Auto Refresh не включва пране на салона. Часът се потвърждава от изпълнителя.'})),
  service('detailing','Почистване на двигателен отсек · добавка към пакет',40,topchiev,{description:'Допълнение към основна резервация, не самостоятелна услуга.'}),
  service('detailing','Почистване на двигателен отсек · самостоятелно',75,topchiev),
  ...[['Пране на фотьойл',39],['Пране на диван',69],['Пране на трапезарни столове',12],['Почистване на матрак',35],['Комбинация от мебели · Home Care',99]].map(([name,amount])=>service('home_services',name,amount,topchievHome,{price:{kind:'from'},description:'Начална цена според размер, материя и състояние. Минимална стойност за самостоятелно Home Care посещение 65 €; крайната цена се потвърждава след уточнение.'})),
  ...[['стандартен автомобил',1,65],['SUV/седем места',1,75],['стандартен автомобил',2,100],['SUV/седем места',2,120]].map(([vehicle,count,amount])=>service('car_wash',`Monthly Care · ${vehicle} · ${count} посещени${count===1?'е':'я'}`,amount,topchiev,{price:{unit:`пакет ${count} посещения`},description:'Абонаментна поддръжка само след първоначален Auto Refresh или Deep Clean. Общата цена е за посочения брой посещения.'})),
]
const elscapeNote = 'Прогнозна единична тарифа; крайна оферта според обекта, обема и срока. Минимална цена за посещение 34 €. Материали и транспорт се уточняват отделно.'
const elscapeServices = [
  service('home_services','Оглед от електротехник',12.5,elscapePrices,{price:{kind:'from',unit:'единична тарифа за оглед'},description:'Ориентировъчна единична тарифа, не обща цена на посещение. Минимална цена за посещение 34 €; обхватът се уговаря преди заявка.'}),
  service('home_services','Откриване на електрически проблем',25,elscapePrices,{price:{unit:'час'},description:elscapeNote}),
  ...[['Монтаж на апартаментно ел. табло',26,'брой'],['Монтаж на предпазител или ДТЗ',12.5,'позиция'],['Монтаж на монофазен електромер',43,'брой'],['Монтаж на трифазен електромер',77,'брой'],['Монтаж на ключ, контакт или TV/NET розетка',5.6,'брой'],['Монтаж на трифазен контакт',17,'брой'],['Монтаж на бойлерно табло',25,'брой'],['Монтаж на вентилатор',25,'брой'],['Свързване на разклонителна кутия',13.5,'брой'],['Монтаж на полилей до пет лампи',26,'брой'],['Монтаж на аплик или плафон',17,'брой'],['Монтаж на луничка',12.5,'брой'],['Монтаж на LED лента',3.5,'м'],['Полагане на кабел до 15 мм² сумарно сечение',1.2,'м'],['Полагане на кабел до 30 мм² сумарно сечение',2.2,'м'],['Прокопаване на кабелен улей в бетон',8,'м']].map(([name,amount,unit])=>service('home_services',name,amount,elscapePrices,{price:{unit},description:elscapeNote})),
]
const slaviaServices = ['Бокс','Кикбокс'].map(type=>service('fitness',`${type} · персонален треньор`,10,slaviaBoxing,{model:'individual_training',price:{unit:'тарифа за треньор'},description:'Само с уговорен час. Публикувана тарифа за персонален треньор; входът за залата и конкретните условия се уточняват отделно, не е обявена обща пакетна цена.'}))
const carkingsServices = [
  ...[['хечбек',79,235],['седан/купе',89,259],['SUV/комби/ван',99,285],['бус LCV',129,369],['камион с каросерия',179,495],['TIR',219,625]].flatMap(([type,basic,deep])=>[
    service('car_wash',`Стандартно почистване · ${type}`,basic,carkingsClean,{price:{kind:'from'},description:'Начална цена от конфигуратора за посочения вид МПС. Пране, кожени елементи, озониране и външно измиване се добавят отделно; крайна оферта след уточняване.'}),
    service('detailing',`Пълен детайлинг · ${type}`,deep,carkingsClean,{price:{kind:'from'},description:'Начална цена за посочения вид МПС. Включва частичните интериорни услуги; външното измиване е отделно. При мобилна услуга са нужни ток, вода и свободно място.'}),
  ]),
  ...[['Пране на текстилни/алкантара седалки · цял салон',119],['Пране на една предна седалка',35],['Пране на две предни седалки',70],['Пране на задни седалки',49],['Пране на мокет',55],['Пране на багажник',39],['Пране на таван',69],['Пране на подови стелки',20],['Почистване и подхранване на кожени седалки · цял салон',89],['Почистване на кожени кори на врати',39],['Почистване на кожени конзоли, табло и волан',45],['Озониране за премахване на миризми',35]].map(([name,amount])=>service('detailing',name,amount,carkingsExtra,{description:'Публикувана частична услуга; при стандартния пакет е допълнение, а при пълния детайлинг е включена. Уточнете дали е приложима самостоятелно.'})),
  service('detailing','Мобилно почистване на двигателен отсек',49,carkingsExtra,{description:'Посочено като мобилна услуга; не се предлага стационарно според тарифната таблица.'}),
  ...[['Полиране и керамика на фарове · комплект',90,'комплект'],['Полиране на фарове · комплект',70,'комплект'],['Керамична защита на фарове · комплект',30,'комплект'],['Полиране на един фар',35,'брой'],['Керамична защита на един фар',15,'брой']].map(([name,amount,unit])=>service('detailing',name,amount,carkingsExtra,{price:{unit}})),
  ...[['Лепене на лип спойлер',39],['Реставрация на волан',119],['Боядисване на четири спирачни апарата',110]].map(([name,amount])=>service('detailing',name,amount,carkingsExtra,{description:'Само в стационарното студио, след предварителна уговорка.'})),
  service('auto_repair','Компютърна диагностика за откриване на грешки',49,carkingsExtra),
  service('auto_repair','Смяна на масло и филтри · труд',69,carkingsExtra,{description:'Само стационарно. Консумативите се заплащат допълнително без надценка; публикуваната сума не включва масло и филтри.'}),
  ...[['хечбек',549,599],['седан/купе',575,625],['SUV/комби/ван',599,649]].flatMap(([type,interior,full])=>[
    service('detailing',`След наводнение · интериорен детайлинг · ${type}`,interior,carkingsFlood,{description:'Ориентировъчна цена с разглобяване според размера и състоянието; потвърждава се след оглед. Автомобилът остава няколко дни; работните часове не са фиксирана продължителност на резервация.'}),
    service('detailing',`След наводнение · комплексен детайлинг · ${type}`,full,carkingsFlood,{description:'Ориентировъчна цена с разглобяване и външна обработка; точен обхват след оглед. Нужни са няколко дни за работа и съхнене; не се обещава еднодневна услуга.'}),
  ]),
]
const aleksovServices = [
  ...[['Смяна на биалетка',15.23],['Смяна на носач',20.34],['Смяна на втулки на носач',25.45],['Смяна на шарнирен болт',17.78],['Смяна на амортисьор',28.01],['Смяна на стабилизираща щанга',20.34],['Смяна на тампон за амортисьор',28.01],['Смяна на тампон на двигател',25.45],['Диагностика на автомобил',22.9],['Компютърна диагностика',25.45],['Ремонт на автоелектроника',15.23],['Профилактика на автоклиматик',17.78],['Смяна на кондензатор на климатик',40.79],['Смяна на радиатор на парното',81.69],['Смяна на накладки',15.23],['Смяна на дискове и накладки',22.9],['Смяна на спирачен маркуч',15.23],['Смяна на гърне',15.23],['Смяна на ангренажен ремък с ролки',56.13],['Смяна на съединител · комплект',107.26],['Смяна на главина',35.68],['Смяна на лагер на главина',30.56],['Ремонт на окачване',10.11],['Смяна на маслен тампон',28.01],['Смяна на полуоска',30.56],['Смяна на каре',25.45],['Смяна на водна помпа',35.68],['Смяна на термостат',20.34],['Смяна на воден радиатор',30.56],['Смяна на воден фланец',20.34],['Смяна на масло и филтри',17.78],['Смяна на масло на скоростна кутия',15.23],['Смяна на тампон на скоростна кутия',25.45],['Смяна на свещи',12.67],['Смяна на гарнитура на капак на клапани',22.9],['Смяна на бензинова помпа',25.45],['Регулиране на фарове',15.23],['Смяна на жило на съединител',25.45],['Смяна на жило на ръчна спирачка',25.45],['Смяна на жило на скорости',35.68],['Изчукване на ламарина',12.67],['Смяна на калник',25.45],['Смяна на преден капак',25.45],['Смяна на заден капак',25.45],['Смяна на врата',25.45]].map(([name,amount])=>service('auto_repair',name,amount,aleksovPrices,{price:{kind:'from'},description:'Публикувана ориентировъчна начална цена. Точен обхват, части и консумативи се уточняват със сервиза преди ремонт; не е обещана обща цена за всеки модел.'})),
  service('auto_repair','Фреон R134 · 100 грама',9.09,aleksovPrices,{price:{kind:'from',unit:'100 грама'},description:'Начална цена само за посоченото количество фреон; профилактика и необходимото количество се уточняват отделно.'}),
]
const sgumiNote = 'Тарифа за една гума. Посещение в София 20 €; отпада при поне два автомобила на адрес. RSC +50%, гуми с джанти −20%; подземен гараж без достъп +10 €. След 20:00 е възможна корекция.'
const sgumiServices = [
  ...[[13,9.4,12.3,null],[14,10.3,13.2,13.2],[15,11.1,14.1,14.6],[16,12.6,16.2,16.8],[17,14.1,17.7,18.6],[18,15.8,18.8,null],[19,17.6,22.5,null],[20,21.9,24.9,null],[21,23.8,27.5,null],[22,26.8,30.4,null]].flatMap(([size,car,suv,van])=>[['лек автомобил',car],['SUV/джип',suv],['бус',van]].filter(([,amount])=>amount!==null).map(([type,amount])=>service('auto_repair',`Мобилна смяна на гума · ${type} · ${size} цола`,amount,sgumi,{price:{unit:'една гума'},description:sgumiNote}))),
  ...[['лек автомобил',55],['SUV/джип/бус',60]].map(([type,amount])=>service('auto_repair',`Мобилен ремонт/смяна на една гума · ${type}`,amount,sgumi,{price:{unit:'една гума'},description:'Включва консумативи и посещение. При обслужване само на една гума се прилага тази тарифа, не единичната сезонна цена. Над 20 цола се добавят 10 € за всеки следващ цол.'})),
  ...[['12–14',13,20],['15–16',15,22],['17–18',null,28],['19–20',null,32],['21–26',null,40]].flatMap(([size,steelPrice,alloyPrice])=>[['стоманена',steelPrice],['алуминиева',alloyPrice]].filter(([,amount])=>amount!==null).map(([type,amount])=>service('auto_repair',`Изправяне на ${type} джанта · ${size} цола`,amount,sgumi,{price:{unit:'една джанта'},description:'Публикувана единична тарифа. Състоянието на джантата, възможността за ремонт и посещението се уточняват по телефона.'}))),
  ...[['13–15',10],['16',11],['17–18',12],['19–20',13],['над 21',14]].map(([size,amount])=>service('auto_repair',`Хотел за гума · ${size} цола · до 9 месеца`,amount,sgumi,{price:{unit:'една гума за до 9 месеца'},description:'Пълна цена за периода до 9 месеца, не месечна такса. При гума върху джанта +50%; предаването се уговаря предварително.'})),
  ...[['Изхвърляне на стара гума',2,'една гума'],['Почистване на джанта',2.5,'една джанта'],['Гумен вентил',2,'брой'],['Метален вентил',5,'брой'],['Развиване на изгубен секретен болт',25,'брой']].map(([name,amount,unit])=>service('auto_repair',name,amount,sgumi,{price:{unit},description:'Допълнение към обслужването; самостоятелен монтаж/демонтаж и такса посещение се уточняват отделно.'})),
]
const sofiagasServices = [
  ...[['Годишен технически преглед · лек автомобил',40.9],['Годишен технически преглед · такси',46.02],['Годишен технически преглед · туристическо ремарке',40.9],['Годишен технически преглед · мотоциклет/мотопед',40.9],['Тест за екологична група',25.51],['Първоначална регистрация на газова/метанова уредба',40.9]].map(([name,amount])=>service('auto_repair',name,amount,sofiagasPrices,{description:'Публикувана тарифа за посочената категория/проверка. Таксата за ГТП се дължи независимо от резултата; платен преглед не гарантира успешно преминаване.'})),
  service('auto_repair','Компютърна диагностика',25.56,'https://sofiagas.com/zapazi-chas/diagnostika',{description:'Цена от действителната форма за диагностика, преди избор на дата. Ремонтът и частите не са включени.'}),
  ...[['Зимна подготовка',40.85],['Измерване на антифриз и течност за чистачки',5],['Проверка на акумулатор с уред и разпечатка',10],['Измерване на вода в спирачната течност',5],['Измерване на протектора на гуми',5],['Проверка на налягането на гуми',5]].map(([name,amount])=>service('auto_repair',name,amount,sofiagasPrices,{description:'Публикувана цена за проверката, не за подмяна на течности/части. Самостоятелен час или добавяне към преглед се уточнява с пункта.'})),
]
const lionNote = 'Приблизителна тарифа за услуга на място в сервиза; крайната цена зависи от състоянието и сложността. Части, материали и точен обхват се потвърждават предварително.'
const lionServices = [
  ...[['Смяна на двигателно масло',20,40,60],['Смяна на охлаждаща течност',20,30,90],['Смяна на накладки',20,50,30],['Смяна на спирачни дискове',30,55,60],['Смяна на спирачна течност',20,50,60],['Реглаж на преден мост',30,50,30],['Смяна на носач',25,50,30],['Смяна на воден радиатор',35,90,60]].map(([name,low,high,minutes])=>range('auto_repair',name,low,high,lionPrices,{minutes,description:lionNote})),
  service('auto_repair','Диагностика на автомобил',35,lionPrices,{minutes:30,description:lionNote}),
]
const dojotoServices = [
  service('fitness','Занятие по бойни изкуства на основата на айкидо · едно посещение',20,dojotoPrices,{minutes:60,durationSource:'https://www.dojoto.org/first-time',description:'Предварителна уговорка за първо посещение; възрастта/нивото определят групата. Общо 60 минути: 15 минути подготовка и беседа + 45 минути тренировка. Методиката не е курс по практическа самозащита.'}),
]
const katereneServices = [[60,20,26,36],[90,23,31,38],[120,27,34,44]].flatMap(([minutes,one,two,three])=>[[1,one],[2,two],[3,three]].map(([count,amount])=>service('fitness',`Катерене с инструктор · ${count===1?'един човек':`${count} души`} · ${minutes} минути`,amount,katerenePrivate,{model:'individual_training',minutes,price:{unit:count===1?'инструктор за един човек':`инструктор общо за ${count} души`},description:'Уговаря се индивидуален час. Включва инструктор и екипировка без катерачни обувки. Не включва вход в залата 10,23 €/човек (ако нямате абонамент/Multisport), обувки и застраховка.'})))

const records = [{
  id:'sofia-eden-reformer-pilates', name:'EDEN Reformer Pilates', cityCode:'68134', neighborhood:'Манастирски ливади',
  address:'София, Манастирски ливади, ул. Борис Димовски 8', locationKind:'premises', coordinates:null,
  category:'fitness', website:eden, phone:'+359888054540', services:edenServices,
  booking:{kind:'form',url:edenBooking},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:eden,excerpt:'Часовете се резервират онлайн чрез нашата система за резервации.'},contact:'https://edenpilates.eu/kontakt'},
},{
  id:'sofia-shining-polishing-auto',name:'Shining Polishing AUTO',cityCode:'68134',neighborhood:'НПЗ Искър',
  // 2026-11-13: exact street reconfirmed, old numeric pin not corroborated;
  // suspended after a150m municipal discrepancy (dated evidence retained).
  address:'София, НПЗ Искър, ул. Мюнхен 14',locationKind:'premises',coordinates:null,
  category:'detailing',website:shining,phone:'+359893941418',services:shiningServices,
  booking:{kind:'form',url:shiningBooking},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:shiningBooking,excerpt:'Изберете удобна дата. Ще се свържем с Вас, за да потвърдим точния час.'},contact:'https://polishingauto.bg/kontakti/'},
},{
  id:'sofia-prane-na-matraci',name:'Пране на Матраци · София',cityCode:'68134',neighborhood:'Неуточнен',
  address:null,locationKind:'service_area',coordinates:null,
  category:'home_services',website:matraci,phone:'+359899881654',services:matraciServices,
  booking:{kind:'phone',phone:'+359899881654'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:'https://pranenamatraci.com/kontakti/',excerpt:'Най-бързият начин да запишете час е обаждане; получавате предложение за ден и час.'},contact:'https://pranenamatraci.com/kontakti/'},
},{
  id:'sofia-top-class-mobile-detailing',name:'Top Class · мобилно измиване и детайлинг',cityCode:'68134',neighborhood:'Неуточнен',
  address:null,locationKind:'service_area',coordinates:null,category:'detailing',website:topclass,phone:'+359876766339',services:topclassServices,
  booking:{kind:'phone',phone:'+359876766339'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:topclass,excerpt:'Свързваме се с теб, избираме удобен час и потвърждаваме точната цена.'},contact:topclass},
},{
  id:'sofia-rozetka-electrical',name:'Rozetka.bg · електроуслуги',cityCode:'68134',neighborhood:'Неуточнен',address:null,locationKind:'service_area',coordinates:null,
  category:'home_services',website:rozetka,phone:'+359887733868',services:rozetkaServices,booking:{kind:'phone',phone:'+359887733868'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:rozetka,excerpt:'Получавате услугата с предварително планиране; формулярът „Планирай ме“ е за заявка.'},contact:'https://rozetka.bg/kontakti'},
},{
  id:'sofia-electrouslugi-home-visits',name:'Electrouslugi.com · електротехник на адрес',cityCode:'68134',neighborhood:'Неуточнен',address:null,locationKind:'service_area',coordinates:null,
  category:'home_services',website:electro,phone:'+359878840449',services:electroServices,booking:{kind:'phone',phone:'+359878840449'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:electro,excerpt:'Посещението се потвърждава според адреса, вида на задачата и текущия график.'},contact:'https://electrouslugi.com/kontakti/'},
},{
  id:'sofia-obekt-pro-electrical',name:'ОБЕКТ ПРО · електроуслуги',cityCode:'68134',neighborhood:'Неуточнен',address:null,locationKind:'service_area',coordinates:null,
  category:'home_services',website:obekt,phone:'+359876733901',services:obektServices,booking:{kind:'phone',phone:'+359876733901'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:obekt,excerpt:'Работа по предварителен график; за ремонт, монтаж или диагностика се обадете на 0876 733 901.'},contact:'https://el-uslugi.net/contacts/'},
},{
  id:'sofia-remontfix-home-renovation',name:'RemontFix · ремонти на дома',cityCode:'68134',neighborhood:'Неуточнен',address:null,locationKind:'service_area',coordinates:null,
  category:'home_services',website:remontfix,phone:'+359878535308',services:remontfixServices,booking:{kind:'phone',phone:'+359878535308'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:`${remontfix}kontakti/`,excerpt:'Заявете оглед в София; позвънете или пишете, за да дойдем на място.'},contact:`${remontfix}kontakti/`},
},{
  id:'sofia-elscape-electrical',name:'ELSCAPE · електротехник',cityCode:'68134',neighborhood:'Неуточнен',address:null,locationKind:'service_area',coordinates:null,
  category:'home_services',website:elscape,phone:'+359896871768',services:elscapeServices,booking:{kind:'phone',phone:'+359896871768'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:'https://electro.elscape.com/contactus',excerpt:'За да заявите оглед, използвайте формата или се свържете с нас по телефона.'},contact:'https://electro.elscape.com/contactus'},
},{
  id:'sofia-slavia-sportes-private-boxing',name:'Славия Спортес · бокс и кикбокс',cityCode:'68134',neighborhood:'Овча купел',address:'София, Овча купел, ул. Коломан 1',locationKind:'premises',coordinates:null,
  category:'fitness',website:slavia,phone:'+359888992371',services:slaviaServices,booking:{kind:'phone',phone:'+359888992371'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:slaviaBoxing,excerpt:'Персонална тренировка по бокс и кикбокс с уговорен час; Емил Младенов 0888 99 23 71.'},contact:slaviaBoxing},
},{
  id:'sofia-aleksov-auto-trebich',name:'Алексов Ауто',cityCode:'68134',neighborhood:'Требич',address:'София, Требич, ул. Доло 19',locationKind:'premises',
  coordinates:{latitude:42.7662758,longitude:23.3107015,method:'first_party_coordinates',source:'https://aleksovauto.bg/kontakti/'},
  category:'auto_repair',website:aleksov,phone:'+359887560111',services:aleksovServices,booking:{kind:'phone',phone:'+359887560111'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:aleksov,excerpt:'Свържете се с нас на 0887 560 111 и уговорете удобен за Вас час.'},contact:'https://aleksovauto.bg/kontakti/'},
},{
  id:'sofia-gas-comers-rezbarska',name:'София Газ Комерс',cityCode:'68134',neighborhood:'Неуточнен',address:'София, ул. Резбарска 1Д',locationKind:'premises',
  coordinates:{latitude:42.70901976036203,longitude:23.343910014424548,method:'first_party_coordinates',source:sofiagas},
  category:'auto_repair',website:sofiagas,phone:'+359879155374',services:sofiagasServices,booking:{kind:'form',url:sofiagasBooking},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:sofiagasBooking,excerpt:'Запази час онлайн: данни за автомобила, дата и час, допълнителни услуги и плащане.'},contact:sofiagas},
},{
  id:'sofia-lion-services-avtoserviz',name:'Лайън Сървисиз · автосервиз',cityCode:'68134',neighborhood:'Христо Ботев',address:'София, Христо Ботев, ул. Мими Балканска 96',locationKind:'premises',coordinates:null,
  category:'auto_repair',website:lion,phone:'+359876770021',services:lionServices,booking:{kind:'phone',phone:'+359876770021'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:lion,excerpt:'Оценка за ремонт на автомобили – уговорете своя час днес, на 0876 77 00 21.'},contact:'https://mobilen-avtoserviz.bg/kontakti/'},
},{
  id:'sofia-dojoto-manastirski-livadi',name:'ДОДЖОТО · Манастирски ливади',cityCode:'68134',neighborhood:'Манастирски ливади',address:'София, Манастирски ливади, ул. Флора 65, бизнес сграда Евроцентър, ет. 4',locationKind:'premises',coordinates:null,
  category:'fitness',website:dojoto,phone:'+359883323874',services:dojotoServices,booking:{kind:'form',url:dojotoBooking},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:dojotoBooking,excerpt:'Изберете ДОДЖОТО 2 Манастирски ливади, час и ден за тренировка; първо посещение само с предварителна уговорка.'},contact:'https://www.dojoto.org/contacts'},
},{
  id:'sofia-dojoto-geo-milev',name:'ДОДЖОТО · Гео Милев',cityCode:'68134',neighborhood:'Гео Милев',address:'София, Гео Милев, бул. Шипченски проход 63, завод Електроника, ет. 2',locationKind:'premises',coordinates:null,
  category:'fitness',website:dojoto,phone:'+359883323874',services:dojotoServices,booking:{kind:'form',url:dojotoBooking},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:dojotoBooking,excerpt:'Изберете ДОДЖОТО 1 Гео Милев, час и ден за тренировка; първо посещение само с предварителна уговорка.'},contact:'https://www.dojoto.org/contacts'},
},{
  id:'sofia-katerene-europe-private',name:'Школа по алпинизъм и катерене · Европа',cityCode:'68134',neighborhood:'Дружба 1',address:'София, Дружба 1, бул. Искърско шосе 7, Търговски център Европа, сграда 1',locationKind:'premises',
  // 2026-11-13: building1 entrance remains unresolved in a multi-building
  // complex; neither the old pin nor the postal point is assumed correct.
  coordinates:null,
  category:'fitness',website:katerene,phone:'+359878669003',services:katereneServices,booking:{kind:'phone',phone:'+359878669003'},
  verification:{status:'approved',checkedOn,validUntil,booking:{url:katerenePrivate,excerpt:'Индивидуални занимания: Вие избирате час и продължителност; информация и записване на 0878 669 003.'},contact:katerenePrivate},
}]
receipts.push({id:records[0].id,checkedOn,website:eden,bookingEntry:edenBooking,bookingReview:'owned_booking_reviewed',reviewedUrls:[eden,edenBooking,edenPrices,'https://edenpilates.eu/kontakt'],notes:'Owner Book button followed to the public Fitsys calendar and rendered group-class menu. No class/date/slot selected and no reservation. Prices read from owner tariff; group and individual package totals kept distinct, no claimed availability. Address and phone verified on owner contact page.',services:edenServices})
receipts.push({id:'sofia-shining-polishing-auto',checkedOn,website:shining,bookingEntry:shiningBooking,bookingReview:'owned_booking_reviewed',reviewedUrls:[shining,shiningPrices,shiningBooking,'https://polishingauto.bg/kontakti/'],notes:'Followed actual service Book link to owner vehicle/date request menu without selecting dates or submitting. Tariff covers performed detailing services, not retail supplies. Exact Sofia address and dedicated detailing phone checked; online-shop-only contact note is not confused with the separate services studio. Ranges and two-headlight/eight-glass units retained.',services:shiningServices})
receipts.push({id:'sofia-prane-na-matraci',checkedOn,website:matraci,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[matraci,matraciPrices,'https://pranenamatraci.com/kontakti/','https://pranenamatraci.com/kvartali/manastirski-livadi/'],notes:'Owner instructs customers to call and agree a day/time; full city-wide Sofia service area and ML page confirmed. No premises or distance point invented. Per-mattress prices preserve one-sided scope, 50% double-sided supplement and quoted heavy-soiling condition. No per-minute price inferred from broad visit-duration range.',services:matraciServices})
receipts.push({id:'sofia-top-class-mobile-detailing',checkedOn,website:topclass,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[topclass],notes:'Read actual Book-anchor request form and owner callback process, without entering data. City-wide mobile Sofia service, real phone and each vehicle-specific EUR package confirmed. Full bus service distinguished from SUV/van package; extras are labelled additions and no headlight count assumed. No Google rating/photo copied.',services:topclassServices})
receipts.push({id:'sofia-rozetka-electrical',checkedOn,website:rozetka,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[rozetka,'https://rozetka.bg/kontakti',rozetkaPrices],notes:'Actual Plan-me callback form and explicit advance-planning process reviewed, no submission. Owner confirms Sofia-wide home service. Selected EUR prices retain visit charge, three-phase/single-phase distinctions and overtime diagnosis condition; low per-item price not represented as whole-visit total.',services:rozetkaServices})
receipts.push({id:'sofia-electrouslugi-home-visits',checkedOn,website:electro,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[electro,'https://electrouslugi.com/kontakti/',electroPrices],notes:'Actual request section has preferred-time field and owner confirmation-by-current-schedule rule. City-wide Sofia home visits and phone verified. Home electrical labour ranges imported with materials/visit caveat, not unrelated computer services or fictional fixed job totals. No personal data supplied.',services:electroServices})
receipts.push({id:'sofia-obekt-pro-electrical',checkedOn,website:obekt,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[obekt,'https://el-uslugi.net/contacts/',obektPrices],notes:'Owner publishes planned work and weekend visits by prior agreement, with Sofia service area and company identity. Exact tariff reviewed after contact instructions. Per-item labour keeps €50 minimum completed visit and €30 diagnostic visit, material/parking/out-of-hours qualification. Bulk 1000m cable rates not imported as domestic small-job prices.',services:obektServices})
receipts.push({id:'sofia-remontfix-home-renovation',checkedOn,website:remontfix,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[remontfix,`${remontfix}kontakti/`,remontfixPrices],notes:'Owner Book-inspection button followed to real contact/request page. Sofia-wide work, phone and paid inspection confirmed. Used full current tariff table rather than conflicting service-page teasers. Ranges retain unit and labour-only qualification; did not confuse full-renovation materials-inclusive bundles with small labour tasks.',services:remontfixServices})
receipts.push({id:'sofia-elscape-electrical',checkedOn,website:elscape,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[elscape,'https://electro.elscape.com/contactus',elscapePrices],notes:'Read actual inspection-request/contact route before the owner tariff. Sofia base and home installations verified. Selected published EUR unit rates retain €34 minimum visit and estimate/transport conditions; no large-apartment approximate total treated as firm quote and no home-address coordinates invented.',services:elscapeServices})
receipts.push({id:'sofia-slavia-sportes-private-boxing',checkedOn,website:slavia,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[slavia,slaviaBoxing,'https://slaviasportess.eu/tseni/'],notes:'Owner publishes specific prearranged private boxing/kickboxing sessions with named trainer and phone at exact Sofia premises. Only personal-trainer tariff imported; admission is separately qualified, no fabricated all-inclusive total or group walk-in availability. General fitness/membership passes excluded.',services:slaviaServices})
receipts.push({id:'sofia-aleksov-auto-trebich',checkedOn,website:aleksov,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[aleksov,'https://aleksovauto.bg/kontakti/',aleksovPrices],notes:'Owner explicitly asks customers to call and agree a time, then provides complete EUR from-price table. Exact Sofia/Trebich street and phone confirmed. Marker coordinates taken from owner contact navigation selected-place !3d/!4d pair, not @viewport. All amounts remain starting tariffs; no parts-inclusive total or one-hour repair promise invented.',services:aleksovServices})
receipts.push({id:'sofia-gas-comers-rezbarska',checkedOn,website:sofiagas,bookingEntry:sofiagasBooking,bookingReview:'owned_booking_reviewed',reviewedUrls:[sofiagas,sofiagasBooking,'https://sofiagas.com/zapazi-chas/diagnostika',sofiagasPrices,'https://sofiagas.com/vazhna-informatsiya'],notes:'Rendered owner Book flow and separate diagnostic flow; no personal data entered, category/date/slot chosen or request submitted. Diagnostic price read directly before date selection, remaining current EUR prices from owner tariff. GTP outcome/payment condition retained; low supplementary checks not sold as repair. Exact destination coordinates are explicitly published in owner navigation URL, not inferred from a map viewport. Dedicated GTP phone used, not shop telephone.',services:sofiagasServices})
receipts.push({id:'sofia-lion-services-avtoserviz',checkedOn,website:lion,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[lion,'https://mobilen-avtoserviz.bg/kontakti/',lionPrices],notes:'Read actual call/consultation route and explicit agree-an-appointment instruction. Exact Sofia workshop and company identity confirmed. Owner service tariff explicitly applies at workshop; did not misrepresent it as mobile roadside price. Published ranges and durations retained, unpriced rear-axle alignment omitted. Contact page distinguishes workshop weekday hours from 24/7 towing, so no invented round-the-clock repair availability.',services:lionServices})
for (const id of ['sofia-dojoto-manastirski-livadi','sofia-dojoto-geo-milev']) receipts.push({id,checkedOn,website:dojoto,bookingEntry:dojotoBooking,bookingReview:'owned_booking_reviewed',reviewedUrls:[dojoto,'https://www.dojoto.org/registrations',dojotoBooking,'https://www.dojoto.org/first-time','https://www.dojoto.org/q-and-a','https://www.dojoto.org/contacts',dojotoPrices],notes:'Followed actual trial/registration route to Sofia branch/day/time form without entering data or submitting. FAQ requires advance agreement for first participation; age and ability groups are assigned by school, not GoRez. Current rendered tariff image explicitly shows €20 per ordinary visit, matching comparison text; older indexed €95 and current unlimited memberships not imported. Free introductory promotion excluded. Exact branch streets verified on owner contact page, rather than incomplete footer block label; 60 minutes explicitly includes 15-minute briefing and 45-minute class.',services:dojotoServices})
receipts.push({id:'sofia-katerene-europe-private',checkedOn,website:katerene,bookingEntry:'phone',bookingReview:'phone_booking_reviewed',reviewedUrls:[katerene,katerenePrivate,'https://europe.sportcentereurope.bg/','https://europe.sportcentereurope.bg/контакти/'],notes:'Actual private-lesson page gives phone booking with chosen time and duration. Instructor price grid read for one/two/three people and 60/90/120 minutes; group totals retained without dividing. Required €10.23 venue admission per participant explicitly excluded, as are shoes and insurance. Owner explicitly links Europa venue location, resolved selected-place marker !3d/!4d (not viewport); venue contact supplies exact street/building. Main owner site also rendered and read, confirming current school identity. Gift vouchers and general gym admission excluded.',services:katereneServices})

const updates = [
  enrich('sofia-signature-detailing',signature,[signature,'https://signaturedetailing.bg/контакти/'],'Owner Book button opens the contact/request form and publishes the existing phone and exact ML address. Explicit EUR starting prices read service by service; required prior polishing retained for coatings. No form submitted.',signatureServices),
  enrich('sofia-heal-fit-gymnastics',heal,[heal,'https://healfit.bg/na-zhivo',healPrices,'https://healfit.bg/kontakti?paket=individualna-trenirovka'],'Read the live-class booking calendar first; online booking requires an account, so no login. Existing phone remains valid. Imported only scheduled live/individual prices, not video library or programme subscriptions. No inferred 8-class amount or fixed duration from a 50–60-minute range.',healServices),
  enrich('sofia-body-lab-pilates',body,[body,'https://tidycal.com/the-body-lab','https://tidycal.com/the-body-lab/group-pilates-class-per-session'],'Rendered the actual owner-embedded TidyCal menu and group details. Both menus show 50 minutes, but no price before selecting a slot; retained the owner site explicit starting EUR rates. No date/time clicked, reservation or free-intro price inferred. Package promotions omitted.',bodyServices),
  enrich('sofia-factor-detailing','https://factordetailing.com/',['https://factordetailing.com/','https://factordetailing.com/nashite-obekti/',factor],'Book links lead to owner location/phone instructions. Both current visible tariff tabs inspected in browser: exterior and interior. Stale hidden duplicate BGN panels and English template dollar plans ignored. Current EUR values and vehicle/count qualifications retained; no Google reviews imported.',factorServices),
  enrich('sofia-topcleaner','https://topcleaner.bg/',['https://topcleaner.bg/','https://topcleaner.bg/poiskai-oferta',top],'Actual Book page contains date/service request form, read without entering data. Selected owner EUR tariff rows preserve the €60 minimum order and quote-after-inspection condition. Conflicting one/double-sided single mattress prices omitted; no promotional 15% reduction applied.',topServices),
  enrich('sofia-chistnik','https://www.chistnik.bg/',['https://www.chistnik.bg/','https://www.chistnik.bg/pochistvane-na-domove/',chistnik],'Owner contact route and explicit scheduled home visit confirmed, then own tariff read. €45 minimum and inspection/30–100% surcharge conditions retained. No guessed label for unlabeled 1.50/3.50 teaser panels; no ambiguous subscription total converted into per-visit cost.',chistnikServices),
  enrich('sofia-cleanrs',cleanrs,[cleanrs],'Read own phone-booking process and service calculator. Explicit €3/m² home and €4.70/m² post-renovation base tariffs retained, with final inspection condition. Did not treat default calculator estimate for a 60 m² example as universal price.',cleanrsServices),
  enrich('sofia-impact-boxing',impact,[impact],'Owner price and contact page explicitly permits only prebooked individual sessions with Asparuh Georgiev at published €15.34. Imported that service, not walk-in group admission or a general gym pass; no session duration inferred from timetable.',impactServices),
  enrich('sofia-luxspa-mobile-detailing','https://luxspadetailing.com/',['https://luxspadetailing.com/',luxspa],'Followed Book anchor to the request-by-date/time section; phone and confirmation process checked. Published starting rates apply to sedan/coupe, not every vehicle. SUV/estate pricing needs confirmation. No exact duration inferred from broad ranges.',luxspaServices),
  enrich('sofia-pulsar-mobile-detailing','https://pulsardetailing.com/',['https://pulsardetailing.com/','https://pulsardetailing.com/контакт-мобилен-детайлинг-софия',pulsar],'Actual Book links open owner request/contact form. Full packages and extras tariff read; beginning amounts preserved, future unavailable Paint Enhancement/engine cleaning omitted, expired May promo and referral discounts not applied. No appointment submitted.',pulsarServices),
  enrich('sofia-jp-studio-reformer',jp,[jp,'https://book.jpstudio.bg/?from=top_nav'],'Followed owner Book button to public weekly calendar, with group €15 and individual €30 entries, without selecting a slot. Owner single/group/individual/duo price lists read separately; ladies-only rule and package validity/total-for-two kept. Ignored misleading €5 teaser not backed by a current tariff.',jpServices),
  enrich('sofia-one-space','https://one-space.eu/',['https://one-space.eu/',one,'https://book.one-space.eu/calendar/public'],'Actual public Fitsys calendar rendered and class names checked, including kung fu, Shotokan karate, pilates and tai chi. No slot chosen. Prices from owner class-specific tariff; sport-card eligibility not assumed across all classes. Package amounts remain full totals.',oneServices,'https://book.one-space.eu/calendar/public','owned_booking_reviewed'),
  enrich('sofia-steel-style-boxing',steel,[steel],'Owner phone/schedule route reviewed. Imported only individual trainer-specific sessions and six-session package totals. General group admission, Club Pass and unrestricted gym subscription excluded; 60-minute duration is explicitly published for private lessons.',steelServices),
  enrich('sofia-reformer-vibe','https://reformer-vibe.com/',['https://reformer-vibe.com/','https://reformer-vibe.com/booking',vibe],'Actual owner reservation date selector read without selecting dates. Price page rendered in browser because text-only extraction omits numeric values. Read current single, duo and package amounts; struck comparison totals and rounded per-session equivalents not imported. Three-visit introductory promotion and annual commitments omitted.',vibeServices),
  enrich('sofia-freshclean','https://freshclean.bg/',['https://freshclean.bg/','https://freshclean.bg/oferta',fresh],'Owner Book request form read first, then apartment-service tariff. Exact floor-area tiers and per-visit subscription units retained. No price inferred from generic affordable-price copy, and no form data entered.',freshServices),
  enrich('sofia-pochisteno',pochisteno,[pochisteno,'https://pochisteno.com/services/home'],'Owner phone/contact and quoted visit process reviewed. Published basic/post-renovation per-m² and subscription per-visit rates retained with €40 minimum and >100 m² quote condition. The calculator default €140 is not a general fixed visit price.',pochistenoServices),
  enrich('sofia-elpro','https://elpro.bg/',['https://elpro.bg/',...elproServices.map(s=>s.price.sourceUrl)],'Owner explicitly schedules a day/time by phone. Each of four actual service pages read after booking instructions; labour/material and standard-case scope retained, no complete-installation total invented from point-based price.',elproServices),
  enrich('sofia-georgis-garage-sofia','https://www.georgisgarage.com/',['https://www.georgisgarage.com/',georgiBooking],'Followed the owner Book button into Rezervauto and read the complete rendered service-selection menu, without selecting any service/date/slot. Actual booking amounts are explicitly from and differ from the approximate homepage examples (rear-window films €180/€250); booking menu takes precedence. Existing Sofia phone route retained; no unsupported duration >24h or availability imported.',georgiServices),
  enrich('sofia-pilates-club-boyana',pilatesClub,[pilatesClub,`${pilatesClub}schedule`,`${pilatesClub}prices`,`${pilatesClub}prices/reformer`,`${pilatesClub}prices/mega`,`${pilatesClub}prices/combo`],'Rendered actual booking calendar and all three owner tariff detail pages in browser; no date/slot selected. Current individual group-visit prices and full card totals distinguished from rounded per-visit equivalents. Two class types and combo kept separate; old one-off September event and unrestricted monthly package not imported.',clubServices),
  enrich('sofia-topchiev-detailed',topchiev,[topchiev,topchievBooking,topchievHome,'https://topchievdetailed.com/kontakti'],'Rendered actual owner booking entry and separate Home Care service-selection menu; no date/time, contact data or submission. EUR starting prices read for furniture with explicit €65 minimum visit, and car tariff read with engine standalone/add-on distinction. Monthly-maintenance packages retain prerequisite initial clean and full visit count; Google ratings and gift-voucher promotional values excluded.',topchievServices),
  enrich('sofia-carkings',carkings,[carkings,'https://carkings.bg/b2c',carkingsClean,carkingsExtra,carkingsFlood],'Followed current B2C Book/contact anchor and explicit phone day/time confirmation process. Read actual rendered vehicle configurator for all six vehicle classes; only vehicle-type controls used, no appointment/date/contact submission. Current EUR B2C pages supersede legacy BGN service page. Add-ons remain labelled, parts excluded from oil labour, flood working-hour estimates not shown as bookable duration. No Google reviews copied.',carkingsServices),
  enrich('sofia-s-gumi-mobile',sgumi,[sgumi],'Actual advance-phone-booking FAQ read first; complete owner tyre-change, repair, rim and storage tariff reviewed. Per-wheel units and €20 visit, RSC, mounted-wheel and garage conditions preserved. One-tyre intervention correctly uses €55/€60 including visit rather than misleading low seasonal rate. Nine-month storage is a full-period price, not monthly. No form submitted or arrival-time estimate invented.',sgumiServices),
]

// Research queue only: never exported as approved listings or fabricated prices.
export const pendingResearch = [
  { name:'Маргел · София (осем обекта)', url:'https://margel.info/bg/obsluzhvane-na-klienti/usloviya-za-polzvane.html', reason:'Owner §11.1 restricts public/commercial use without written permission. Exact branch contacts, actual Timify entry, tyre tariff and RingMall wash menu found, but not imported.' },
  { name:'Studio Reform · София Център', url:'https://studioreform.bg/terms-of-use', reason:'Owner §2 requires written consent for content use. Actual Sofia Planny calendar and own Sofia tariff found; excluded pending permission, not confused with Varna rates.' },
  { name:'Самокишев Ауто', url:'https://samokishevauto.bg/', reason:'Actual appointment entry and EUR tariff found, but owner location text conflicts between Malinova Dolina/Nadezhda and lacks exact verified street. No premises point invented.' },
  { name:'Студио Stanoeva · София', url:'https://www.stanoeva.com/membership/', reason:'Owner private lesson €12 and phone confirmed. Exact Tempo premises street is not published by instructor; separate facility corroboration remains pending owner confirmation.' },
  { name:'BB Sport Center', url:'https://bbsport.bg/produkt/индивидуална-тренировка/', reason:'Owner private product €19.94 and exact Sofia address found, but product request did not establish a sufficiently clear appointment-confirmation process. Group gym admission not substituted.' },
  { name:'Twisted Jiu Jitsu · индивидуални занимания', url:'https://twistedjiujitsu.com/', reason:'Actual Gymdesk private-lesson entries inspected; price requires later selection and no date/slot was selected. Do not publish a guessed instructor rate.' },
  { name:'Lazarov Athletics · бокс', url:'https://lazarovathletics.com/', reason:'Owner advance-booking phone process found but no published numeric private-training tariff in booking/service/contact pages.' },
  { name:'Apex Boxing Club', url:'https://apexboxing.bg/', reason:'Price appears on owner page, but no reliable exact Sofia street and unfinished template details prevent a verified premises listing.' },
  { name:'AR Studio / Golden Fit Body · Манастирски ливади', url:'https://fitsys.com/', reason:'No independent current owner tariff found; third-party mirrored offer expired. Account-only provider screen not bypassed.' },
  { name:'EL Reforme / New Sense · Манастирски ливади', url:'https://www.mylink.bg/terms-of-service', reason:'Only provider-held tariff found; MyLink §7 extraction/competitive-use restrictions mean no import without an authorized source.' },
  { name:'Bachevski Garage · Манастирски ливади', url:'https://easybook.bg/avtoserviz-cat467', reason:'Provider-only service menu found including promotion, but no independent current owner tariff. No provider review or promotional price represented as approved owner data.' },
  { name:'Мобилна Диагностика', url:'https://mobilnadiagnostika.bg/ceni/', reason:'Owner explicitly explains why it does not publish universal prices. Real contact/request route reviewed; quote remains required.' },
  { name:'Drumnik', url:'https://drumnik.com/book-an-appointment', reason:'Actual appointment request menu inspected before service pages; no published numeric tariff found. No request submitted.' },
  { name:'Автосервиз Петков', url:'https://serviz-petkov.com/prices/', reason:'Real preferred-day/time request form confirmed. Current complete tariff says price on enquiry for every service, so amounts cannot honestly be supplied.' },
  { name:'Мобилен Автосервиз .com', url:'https://www.mobilen-avtoserviz.com/ceni/', reason:'Rich current EUR labour tariff and mobile Sofia contact exist, but site mainly describes call-out repairs without explicit prebooked appointment process; held for owner confirmation.' },
  { name:'Автосервиз София от собственик', url:'https://avtoservizsofia.com/', reason:'Detailed current prices and online request exist, but no reliable named operator/official phone or exact workshop street; not added from generic neighborhood SEO text.' },
]

export default { records, updates, reviews: receipts }
