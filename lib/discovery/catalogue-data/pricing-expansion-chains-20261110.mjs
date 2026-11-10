// Public rendered booking menus inspected per branch, never a copied chain
// teaser tariff. No services/slots selected and no reservation submitted.
const checkedOn = '2026-11-10', validUntil = '2027-02-08'
const priced = (name, amount, category, sourceUrl, {kind = 'fixed', maximum, unit, minutes, description = '', currency = 'EUR'} = {}) => ({
  name, category, appointmentModel: 'appointment', ...(description ? {description} : {}),
  price: {amount, currency, kind, ...(maximum == null ? {} : {maximum}), ...(unit ? {unit} : {}), sourceUrl, checkedOn, validUntil},
  ...(minutes ? {durationMin:minutes,durationSourceUrl:sourceUrl,durationCheckedOn:checkedOn} : {}),
})
const inspireNames = ['Дамско подстригване със стайлинг','Мъжко подстригване и стайлинг','Стайлинг със сешоар','Стайлинг с преса или маша','Сешоар и един ред екстеншъни','Специална прическа','Премиум СПА маникюр с гел лак','Маникюр с гел лак със сваляне','Маникюр с гел лак без сваляне','Маникюр с класически лак','Speedy маникюр','Мъжки маникюр','Ноктопластика · изграждане','Ноктопластика · поддръжка 1–2 седмици','Ноктопластика · поддръжка 3–4 седмици','Възстановяване на един нокът · самостоятелно','Сваляне на гел лак или ноктопластика · самостоятелно']
// The fixed/from distinction is literal in each branch's menu. Do not copy
// Business Park manicure prices or Studentski junior haircut into another site.
const inspire = [
 ['business-park',221,[25,30,20,20,30,77,39,36,32,29,24,29,65,50,53,10,10],[],[60,null,null,null,null,90,null,60,null,null,30,null,null,null,120,15,20]],
 ['mladost-1',222,[25,30,20,20,30,50,27,24,21,17,14,17,46,31,40,10,13],[6,7,8,9,10,11,12,13,14,15,16],[null,45,null,null,null,null,60,60,60,45,30,40,120,90,120,15,20]],
 ['iztok',223,[25,30,20,20,30,50,27,24,21,17,14,17,46,31,40,10,13],[6,7,8,9,10,11,12,13,14,15,16],[null,45,null,null,null,90,60,60,60,45,30,40,120,90,120,15,20]],
 ['paradise',224,[25,18,20,20,30,50,27,24,21,18,15,18,75,50,53,10,12],[12,13,14],[null,null,null,null,null,90,null,null,null,null,null,null,120,90,120,15,null]],
 ['krastova-vada',225,[25,18,20,20,30,50,27,24,21,18,15,18,75,50,53,10,12],[12,13,14],[null,null,null,null,null,90,null,null,null,null,null,null,120,90,120,15,null]],
 ['manastirski-livadi',226,[25,30,20,20,30,50,27,24,21,18,15,18,46,31,40,10,10],[],[60,null,50,null,null,90,null,null,null,null,null,null,120,null,120,15,20]],
 ['studentski-grad',227,[13,5,10,13,30,25,27,24,21,17,14,17,46,31,40,10,13],[6,7,8,9,10,11,12,13,14,15,16],[null,null,null,null,null,null,60,60,60,45,30,40,120,90,120,15,20]],
]
const inspireUpdates = inspire.map(([slug, site, amounts, fixed, minutes]) => {
 const url = `https://booking.inspirebg.com/inspire/bg/booking/${site}`
 const services = amounts.map((amount,index) => priced(inspireNames[index],amount,index<6?'hair':'nails',url,{kind:fixed.includes(index)?'fixed':'from',minutes:minutes[index],...(index===15?{unit:'нокът'}:{}),description:'Тарифа за този обект според услугата и специалиста. Точният вариант се уточнява при записване.'}))
 if(site===221) services.push(...[['СПА педикюр с гел лак',55],['Класически педикюр с гел лак',50],['Smart педикюр с гел лак',50],['Speedy педикюр без лак',45]].map(([name,amount])=>priced(name,amount,'nails',url,{kind:'from'})))
 return {id:`sofia-inspire-${slug}`,services}
})
const inspireReviews = inspire.map(([slug,site])=>({id:`sofia-inspire-${slug}`,checkedOn,website:'https://www.inspirebg.com/',bookingEntry:'phone',reviewedUrls:['https://www.inspirebg.com/','https://booking.inspirebg.com/inspire/bg/objects',`https://booking.inspirebg.com/inspire/bg/booking/${site}`],bookingReview:'phone_booking_reviewed',notes:'Opened this exact branch in the rendered owner booking UI; expanded Form and Manicure categories, plus Pedicure in Business Park. Import only displayed ordinary EUR tariffs with literal from/fixed distinction. No promotion, slot, date or customer data selected. Existing published phone remains booking route. Duration ranges are not shortened to a fixed duration. Other unopened menu groups are not claimed fully audited.'}))
const theOne = [
 ['studio',1,'Wessam',[['Подстригване',17,30],['Коса и брада',25,45],['Оформяне на брада',12,30],['VIP комбо · коса, брада, вежди, кола маска уши/нос',30,60],['Оформяне на вежди',5,15]]],
 ['deluxe',10,'Алекс',[['Подстригване',13,30],['VIP комбо · коса, брада, вежди, кола маска уши/нос',25,60],['Коса и брада',18,30],['Оформяне на брада',10,30],['Оформяне на вежди',6,null]]],
 ['barbershop',4,'Aws',[['Подстригване',25,30],['Коса и брада',35,45],['VIP комбо · коса, брада, вежди и маска',45,60],['Оформяне на брада',20,30],['VIP СПА комбо',60,90],['Оформяне на вежди',10,null]]],
 ['premium',6,'Abudi',[['VIP комбо · коса, брада, вежди, кола маска уши/нос',45,60],['VIP СПА комбо',60,90],['Коса и брада',35,45],['Оформяне на брада',20,30],['Оформяне на вежди',10,null],['Подстригване',25,30]]],
 ['private',8,'Teodor',[['Подстригване',25,30],['Коса и брада',35,45],['Оформяне на брада',20,30],['VIP ROOM комбо',80,90],['VIP комбо · коса, брада, вежди, кола маска уши/нос',45,60],['Оформяне на вежди',10,null]]],
 ['famous',5,'Senan',[['Подстригване',25,30],['Коса и брада',35,45],['VIP комбо · коса, брада, вежди и маска',45,60],['Оформяне на брада',20,30],['VIP ROOM комбо',80,90],['VIP СПА комбо',60,90],['Оформяне на вежди',10,null]]],
 ['nails-hair',3,'Adelina',[['Класически маникюр без лак',15,30],['Поддръжка на гел и гел лак',40,120],['Изграждане',50,150,80],['Педикюр с гел лак',25,45],['Маникюр с гел лак',25,60],['Маникюр с твърда база · дълги нокти',35,90],['Маникюр с твърда база · къси нокти',30,60],['Парафинова терапия',15,30],['Парафинова терапия на ръце',10,30],['Педикюр с подхранващ лак',25,60],['Сваляне на гел лак плюс оформяне и почистване',20,45],['Сваляне на гел лак с оформяне и почистване',15,30],['СПА педикюр без гел лак',30,60],['СПА педикюр с гел лак',35,60],['СПА педикюр с гел лак и парафин',45,60],['Декорации',2,15,5],['Поправка на счупен нокът',2,15,5]]],
]
const oneUpdates=theOne.map(([slug,site,staff,rows])=>({id:`sofia-the-one-${slug}`,services:rows.map(([name,amount,minutes,maximum])=>priced(`${name} · ${staff}`,amount,slug==='nails-hair'?'nails':'barber',`https://studiotheone.customer.fitsys.co/reservations/start?site=${site}`,{minutes,description:`Публикувана тарифа само при ${staff} в този обект; другите специалисти имат отделни менюта.`,...(maximum?{kind:'range',maximum}:{})}))}))
const oneReviews=theOne.map(([slug,site,staff])=>({id:`sofia-the-one-${slug}`,checkedOn,website:'https://www.wearetheone.bg/',bookingEntry:'phone',reviewedUrls:['https://www.wearetheone.bg/',`https://studiotheone.customer.fitsys.co/reservations/start?site=${site}`],bookingReview:'phone_booking_reviewed',notes:`Followed owner branch link into actual rendered Fitsys menu for ${staff}. Import only that named specialist's visible service tariff, not chain-wide teaser rates or other staff. All missing-duration entries remain blank; explicit nail ranges retained. No service selected (0 selected throughout), no next/date/slot/booking action. Existing published branch phone preserved.`}))
const mgUrl='https://www.mgtheartofbeauty.com/uslugi/'
const mgUpdate={id:'sofia-mg-art-beauty',services:[
 ...[['Дамско подстригване, сешоар и стайлинг',80],['Мъжко подстригване',47],['Детско подстригване',35],['Дамски сешоар и стайлинг',70],['Оформяне на врат, брада и мустаци',28],['Празнична прическа',100],['Мъжко боядисване American Crew',45]].map(([name,amount])=>priced(name,amount,'hair',mgUrl,{currency:'BGN',description:'Публикувано в лева; тарифата и валутата се потвърждават при записване. Косата се оценява след диагностика.'})),
 ...[['Класически маникюр',38],['Маникюр с гел лак',62],['Класически педикюр',50],['Педикюр с гел лак',74],['Медицински педикюр',62],['Сваляне на гел лак',10],['Парафинова терапия за ръце',30],['Изграждане с гел',123],['Поддръжка на полигел',62]].map(([name,amount])=>priced(name,amount,'nails',mgUrl,{currency:'BGN',description:'Сумата е публикувана в лева, без преизчисляване. Потвърдете актуалната тарифа и валута при записване.'})),
 ...[['Боядисване на вежди',25],['Почистване на вежди',22],['Почистване на лице',83],['Грим',100]].map(([name,amount])=>priced(name,amount,'beauty',mgUrl,{currency:'BGN',description:'Публикувано в лева; потвърдете тарифата и валутата при записване.'})),
]}
const mgReview={id:mgUpdate.id,checkedOn,website:'https://www.mgtheartofbeauty.com/',bookingEntry:'phone',reviewedUrls:['https://www.mgtheartofbeauty.com/','https://www.mgtheartofbeauty.com/booking/',mgUrl],bookingReview:'phone_booking_reviewed',notes:'Opened the actual booking entry; embedded calendar did not render a service menu. Published owner phone remains available. Owner Services contains literal BGN prices; retain BGN with currency/current-tariff confirmation note, never convert into allegedly published EUR. Hair time and prices are expressly indicative; no fixed duration imported.'}
const yogaRoot='https://www.yogavibe.net/', yogaPrice='https://www.yogavibe.net/prices'
const sport=(name,amount,url,options={})=>({...priced(name,amount,'fitness',url,options),appointmentModel:options.model||'group_reservation'})
const yogaServices=[
 sport('Йога клас · 55 минути',11.2,yogaPrice,{minutes:55}),
 sport('Йога клас · 80 минути',11.2,yogaPrice,{minutes:80}),
 sport('Йога клас · младежи от 12 до 17,99 години',6.7,yogaPrice),
 ...[[3,28.1,14],[4,36.8,30],[8,69,60],[16,112,120]].map(([count,amount,days])=>sport(`Карта за йога · ${count} посещения`,amount,yogaPrice,{unit:'карта',description:`Общо за ${count} посещения; валидност ${days} дни, лична карта без удължаване. Не включва пилатес реформър.`})),
]
const reformerServices=[
 sport('Индивидуален пилатес реформър',41,yogaPrice,{minutes:50,model:'individual_training'}),
 sport('Пилатес реформър за двама',52,yogaPrice,{minutes:50,unit:'двама',model:'individual_training'}),
 ...[[5,180,60],[10,307,100],[24,615,240]].map(([count,amount,days])=>sport(`Пилатес реформър · карта ${count} посещения`,amount,yogaPrice,{model:'individual_training',unit:'карта',description:`Обща цена, не за една тренировка; валидност ${days} дни. Уточнете вида сесия при записване.`})),
]
const yogaUpdates=['san-stefano','bulgaria','garitage','mladost'].map(slug=>({id:`sofia-yoga-vibe-${slug}`,services:[...yogaServices,...(slug==='mladost'?reformerServices:[])]}))
const fitUrl='https://www.yogavibe.net/timetable/fit-lozenets'
const fitRecord={id:'sofia-yoga-vibe-fit-lozenets',name:'Yoga Vibe · Fit Lozenets',category:'fitness',cityCode:'68134',neighborhood:'Лозенец',address:'София, бул. Джеймс Баучер 120',locationKind:'premises',coordinates:null,website:yogaRoot,phone:'+359892375551',services:reformerServices,booking:{kind:'form',url:fitUrl},verification:{status:'approved',checkedOn,validUntil,booking:{url:fitUrl,excerpt:'За записване, моля свържете се с нас; Пилатес Реформър · Избор'},contact:yogaPrice}}
const yogaReviews=[...yogaUpdates,{id:fitRecord.id}].map(({id})=>{
 const url=`${yogaRoot}timetable/${id.replace('sofia-yoga-vibe-','')}`
 return {id,checkedOn,website:yogaRoot,bookingEntry:url,reviewedUrls:[yogaRoot,url,yogaPrice],bookingReview:'owned_booking_reviewed',notes:'Inspected this exact branch timetable, followed by the current production EUR price table. Fit Lozenets lists reformer only, not group yoga. Mladost explicitly lists reformer; other branches receive only regular yoga tariffs. Cards are total package prices with validity; refundable booking deposit is not a class fee. No reservation, login, payment or customer details submitted.'}
})
const saltRoot='https://saltart.bg/', saltPrice='https://saltart.bg/tseni/', saltIndividual='https://saltart.bg/individualni-praktiki/'
const saltServices=[
 sport('Йога · еднократно посещение',12,saltPrice),
 sport('Йога · дами над 55 години',7,saltPrice),
 sport('Йога · втора практика в същия ден',6,saltPrice,{description:'Само като второ посещение в същия ден; не е стандартната цена.'}),
 ...[[4,40,1],[10,90,2],[20,160,3]].map(([count,amount,months])=>sport(`Карта йога или солна стая · ${count} посещения`,amount,saltPrice,{unit:'карта',description:`Обща цена за ${count} посещения, валидност ${months} месеца; споделима карта според условията на студиото.`})),
 sport('Карта 10 посещения · пенсионери и деца до 12 години',60,saltPrice,{unit:'карта',description:'Общо за 10 посещения; валидност 2 месеца, само за посочената група.'}),
 sport('Индивидуална йога · един човек',48,saltIndividual,{minutes:55,model:'individual_training'}),
 sport('Индивидуална йога · двама',60,saltIndividual,{minutes:55,unit:'двама',model:'individual_training'}),
]
const saltUpdates=['iztok','druzhba','centre'].map(slug=>({id:`sofia-salt-art-${slug}`,services:saltServices}))
const saltReviews=[['iztok','grafik',2,1],['druzhba','grafik-druzhba',5,2],['centre','grafik-czentar',12,3]].map(([slug,path,resource,site])=>({id:`sofia-salt-art-${slug}`,checkedOn,website:saltRoot,bookingEntry:`${saltRoot}${path}/`,reviewedUrls:[saltRoot,`${saltRoot}${path}/`,`https://book.saltart.bg/calendar?resource_id=${resource}&site_id=${site}`,saltPrice,saltIndividual],bookingReview:'provider_booking_reviewed',notes:'Opened branch-specific owner schedule and its rendered public Fitsys calendar (branch name confirmed); no Reserve/Waitlist action or slot selected. Current yoga and individual tariffs imported with package/eligibility conditions; not temporary slot availability. Massage tariffs have a card-holder surcharge condition and are not copied as unconditional prices.'}))
const aradhanaRoot='https://yogabg.com/', aradhanaPrice='https://yogabg.com/tseni/', aradhanaBook='https://yogabg.com/grafik/'
const aradhana={id:'sofia-yoga-aradhana',name:'Йога център Арадхана · Българска йога асоциация',category:'fitness',cityCode:'68134',neighborhood:'Борово',address:'София, ул. Родопски извор 43А, ет. 1, офис 1',locationKind:'premises',coordinates:null,website:aradhanaRoot,phone:'+359882955600',services:[
 sport('Йога · единично посещение',11,aradhanaPrice),
 sport('Йога · единично посещение · пенсионери, деца и учащи до 27 години',10,aradhanaPrice),
 ...[[2,22,20],[3,30,28],[4,39,37],[5,48,44],[6,57,53],[7,65,61],[8,70,66],[9,78,74],[10,84,80],[11,90,85],[12,98,92],[13,106,100]].flatMap(([count,regular,reduced])=>[
  sport(`Абонамент за курс · ${count} занимания`,regular,aradhanaPrice,{unit:'курс',description:'Обща стандартна такса за избрания брой занимания; не е единична цена.'}),
  sport(`Абонамент за курс · ${count} занимания · намалена тарифа`,reduced,aradhanaPrice,{unit:'курс',description:'Общо за пенсионери, деца и учащи до 27 години; не е единична цена.'}),
 ]),
],booking:{kind:'form',url:aradhanaBook},verification:{status:'approved',checkedOn,validUntil,booking:{url:'https://yogabg.com/zapisvane-i-registratsiya-za-kursove/',excerpt:'Записването става през График след избор на съответния курс и абонамент/еднократно посещение'},contact:'https://yogabg.com/ioga-tsentar-aradhana/'}}
const aradhanaReview={id:aradhana.id,checkedOn,website:aradhanaRoot,bookingEntry:aradhanaBook,reviewedUrls:[aradhanaRoot,aradhanaBook,aradhanaPrice,'https://yogabg.com/zapisvane-i-registratsiya-za-kursove/','https://yogabg.com/ioga-tsentar-aradhana/','https://yogabg.com/yoga-courses/ioga-za-nachinaeshti-zala-onlain-i-zapis-11/'],bookingReview:'owned_booking_reviewed',notes:'Read actual rendered weekly course calendar and opened a course registration dialog; stopped at empty personal fields, no choices/terms/cart/payment submitted. Current EUR price table preserves total course fees and reduced eligibility; does not infer course duration or remaining-seat availability. Contact address identifies Borovo centre, not online-only service.'}
// Both actual branch booking menus were rendered separately. Shared rows
// below were compared by name, amount and duration, not presumed chain-wide.
const belamiHair=[
 ['Дамско подстригване',18,45],['Дамско подстригване и сешоар · дълга коса',25,60],['Дамско подстригване и сешоар · средна коса',20.5,60],['Майстор фризьор · дамско подстригване и сешоар · дълга коса',39,60],
 ['Сешоар · средна коса',15.5,60],['Сешоар · дълга коса',18,60],['Сешоар · коса с екстеншъни',25,90],['Майстор фризьор · сешоар',24.5,60],['Къдрици със сешоар · дълга коса',20.5,60],['Мъжко подстригване',15.5,30],['Детско подстригване · до 7 години',11,30],
 ['Боя Q10 · корени / къса коса',29,90],['Боя Q10 · средна коса',41,120],['Боя Q10 · дълга коса',47,120],['Майстор · боядисване на дълга коса',51,120],['Кичури с фолио без сешоар',50.5,240],['Кичури с фолио и сешоар',68.5,240],
 ['Балеаж · къса коса',84.5,180],['Балеаж · средна коса',94,180],['Балеаж · дълга коса',112.5,240],['Балеаж · дълга гъста коса',122,240],['Омбре · къса коса',74.5,120],['Омбре · средна коса',84.5,180],['Омбре · дълга коса',97,180],['Омбре · дълга гъста коса',112.5,180],
 ['Матиране и измиване',15,45],['Хиалуронова терапия за коса и подсушаване',35.5,60],['Ламиниране Bioplex и сешоар · средна коса',30,90],['Хидратираща терапия за коса',15,45],['Брюлаж · обиране на цъфтежи',20.5,30],['Мъжко подстригване с машинка · един номер',8,30],['Прическа с маша на екстеншъни с измиване',31,120],['Прическа с маша на екстеншъни без измиване',25,90],
 ['Преса / маша без измиване · средна коса',16,60],['Преса / маша без измиване · дълга коса',20.5,60],['Преса / маша без измиване · екстеншъни',25,90],['Преса / маша с измиване · средна коса',25,60],['Преса / маша с измиване · екстеншъни',31,90],['Дифузер · средна коса',9,30],['Дифузер · дълга коса',12,45],['Хиалуронова терапия за коса и прав сешоар',40.9,60],['Хидратираща терапия и сешоар · дълга коса',30,90],['Хидратираща терапия с подсушаване',15,60],['Ламиниране Bioplex и сешоар · дълга коса',31.5,90],['Оформяне на брада',7,30],
]
const belamiNails=[
 ['Гел лак без сваляне',24,60],['Маникюр с гел лак и сваляне на старо покритие',24,90],['Маникюр с гел лак, сваляне и изравняване',25.5,90],['Френски гел лак със сваляне · стандартен',27,90],['Поправка / лепене на счупен нокът',4,30],['Френски гел лак със сваляне и изравняване',29,90],['Поддръжка на гел и гел лак',32,150],['Изграждане с гел и Gelish',49,180],['Гел върху естествени нокти',28,119],
 ['Сваляне на гел лак без оформяне',5,30],['Сваляне на гел с оформяне',13.5,30],['Сваляне на гел лак и цялостен маникюр',17,60],['Сваляне на гел лак и оформяне без почистване на кожички',9,30],['Класически маникюр',14.5,45],['Класически маникюр без лак',14.5,40],['Изграждане на един нокът извън процедура',4,20],['Маникюр LUX',38.5,90],['Педикюр с гел лак и сваляне на старо покритие',29.5,90],['Класически педикюр',24,90],['Мъжки педикюр',24,90],['MED педикюр',34,90],['MED педикюр с гел лак',42.5,90],['СПА педикюр',35.5,90],['Сваляне на гел без оформяне',11,30],
]
const belamiWestBeauty=[['Почистване на лице с ултразвукова шпатула',32.21,60],['Почистване на лице с COLLAGENA',38.36,60],['Мануално почистване на лице · проблемен дермис',43.97,90],['SMART водно дермабразио, биолифтинг и криотерапия',32.21,60],['Оформяне на вежди',9.71,30],['Хиалуронова терапия за лице',21.99,60],['Анти-акне терапия',26.59,60],['Боровинкова терапия',21.99,60],['Карбокси терапия Pelart',26.59,45],['Карбонов пилинг без маска',40.92,30],['Карбонов пилинг с маска',45.05,45],['Карбонов пилинг с алго маска',50.63,60],['RF лице с ампула и алго маска',31.7,60],['RF лице с ампула',25.56,45],['RF лице с контактен гел',25.57,45],['HIFU Ultherapy · лице',70.56,30],['Класически масаж лице и деколте с пилинг и маска',20.45,40],['Масаж на лице',14.83,30],['Пробиване на уши',24.54,15]]
const belamiRoot='https://belamistudio.com/'
const belamiMenus=[['westmall',7],['park-center',8]].map(([slug,branch])=>{
 const url=`https://belamistudio.com/quick-booking?branch=${branch}`
 const build=(rows,category)=>rows.map(([name,amount,minutes])=>priced(name,amount,category,url,{minutes,description:'Меню за посочения салон; вариантът и специалистът се потвърждават при записване.'}))
 return {id:`sofia-belami-${slug}`,services:[...build(belamiHair,'hair'),...build(belamiNails,'nails'),...(branch===7?build(belamiWestBeauty,'beauty'):[]),...(branch===8?build([['Сешоар · къса коса',11.5,60]],'hair'):[])]}
})
const belamiReviews=belamiMenus.map(row=>({id:row.id,checkedOn,website:belamiRoot,bookingEntry:'phone',reviewedUrls:[belamiRoot,`https://belamistudio.com/quick-booking?branch=${row.id.endsWith('westmall')?7:8}`],bookingReview:'phone_booking_reviewed',notes:'Rendered this exact owner booking branch separately and compared visible service checkbox labels, EUR amounts and minutes. Existing branch phone preserved. WestMall131 and ParkCenter78 options were read; import only distinct ordinary service rows. Cosmetology not copied into ParkCenter, whose menu lacks it; short blow-dry only ParkCenter. Duplicate ambiguous whole-body/leg variants, dependent ampoules, decorations and laser packages excluded. Zero services selected; Next remained disabled; no staff/date/slot/customer/payment submitted.'}))
const cutRoot='https://cutmenstudio.com/'
const cutNames=['Мъжко подстригване','Подстригване и оформяне на брада','Подстригване на коса, брада и вежди','Оформяне на брада и вежди','Оформяне на брада','Оформяне на вежди с конец','Детско подстригване','Подстригване и оформяне на вежди','Гладко бръснене на брада / глава','Подстригване с машинка · един номер']
const cutBranches=[
 ['manastirski-livadi','Манастирски ливади','ул. Българска легия B2A','cut02',[18,23,25,15,13,5,15,23,13,10],[40,40,40,40,40,20,40,40,40,40]],
 ['yuzhen-park','Стрелбище','ул. Костенски водопад 10','cut01',[18,23,25,15,13,5,15,20,13,10],[30,40,40,30,20,10,30,30,20,20]],
]
const cutRecords=cutBranches.map(([slug,neighborhood,street,code,amounts,minutes])=>({
 id:`sofia-cut-barber-${slug}`,name:`CUT Barber Shop · ${neighborhood==='Стрелбище'?'Южен парк':neighborhood}`,category:'barber',cityCode:'68134',neighborhood,address:`София, ${neighborhood}, ${street}`,locationKind:'premises',coordinates:null,website:cutRoot,phone:'+359898202855',
 services:amounts.map((amount,i)=>priced(cutNames[i],amount,'barber',cutRoot,{minutes:minutes[i],description:'Тарифа само за посочения обект; при записване уточнете правилния салон.'})),
 openingHours:{sourceUrl:cutRoot,checkedOn,days:[1,2,3,4,5,6,7].map(weekday=>({weekday,periods:[{open:'11:00',close:'20:00'}]}))},
 // GoRez's direct-link safety policy rejects fragment-routing URLs. Preserve
 // that protection and use the explicitly published booking phone instead.
 booking:{kind:'phone',phone:'+359898202855'},verification:{status:'approved',checkedOn,validUntil,booking:{url:cutRoot,excerpt:'Онлайн записване за минути. Phone: +359898202855'},contact:cutRoot},
}))
const cutReviews=cutRecords.map((row,i)=>({id:row.id,checkedOn,website:cutRoot,bookingEntry:'phone',reviewedUrls:[cutRoot,'https://cutmenstudio.com/?lang=bg'],bookingReview:'phone_booking_reviewed',notes:`Rendered exact branch ${cutBranches[i][3]} via owner #/booking UI; ten ordinary EUR fees and literal minutes read separately from the other branch. ML eyebrow/hair combo is23EUR/40min, SouthPark20EUR/30min. Initial static page placeholders and generic SEO teaser rates ignored. No service, staff, date or slot selected; no personal data/login/payment submitted. Wax omitted because zone unspecified. Owner #/locations/${cutBranches[i][3]} confirms address/daily hours. Hash-routed forms are not permitted direct destinations in GoRez: preserve policy and published booking phone. Map search is not a coordinate.`}))
export default {records:[fitRecord,aradhana,...cutRecords],updates:[...inspireUpdates,...oneUpdates,mgUpdate,...yogaUpdates,...saltUpdates,...belamiMenus],reviews:[...inspireReviews,...oneReviews,mgReview,...yogaReviews,...saltReviews,aradhanaReview,...belamiReviews,...cutReviews]}
