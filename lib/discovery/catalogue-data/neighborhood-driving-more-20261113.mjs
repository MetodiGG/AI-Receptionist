// Ordinary owner-published appointment lessons; no account or booking made.
const checkedOn = '2026-11-13'
const root = 'https://vasilenadrive.com/'
const contact = `${root}contact/`
const services = `${root}services/`
const express = 'https://avtokurs.bg/'
const expressBooking = `${express}online-zapisvane-avtokurs/`
const expressContact = `${express}contact-express-b/`
const expressServices = `${express}avtoshkola/`
const vip = 'https://www.vipdrivebg.com/'
const vipContact = `${vip}contact`
const slavov = 'https://avtokursslavov.com/'
const slavovContact = `${slavov}%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/`
const slavovServices = `${slavov}%D0%BE%D0%BF%D1%80%D0%B5%D1%81%D0%BD%D0%B8%D1%82%D0%B5%D0%BB%D0%BD%D0%B8-%D1%88%D0%BE%D1%84%D1%8C%D0%BE%D1%80%D1%81%D0%BA%D0%B8-%D1%87%D0%B0%D1%81%D0%BE%D0%B2%D0%B5/`
const ucha = 'https://uchazadvolana.bg/'
const uchaContact = `${ucha}contact`
const uchaPrices = `${ucha}prices`
const lider = 'https://liderdrive-bg.com/'
const uchaBranches = [
  ['slavia', 'Славия', 'София, ж.к. Славия, ул. „Коломан“ 6'],
  ['lozenets', 'Лозенец', 'София, ж.к. Лозенец, бул. „Джеймс Баучер“ 99–101'],
]
const expressBranches = [
  ['kirill-popov', 'Проф. Кирил Попов', 'София, Студентски град, ул. „Проф. Кирил Попов“ 55', '+359894777880'],
  ['boris-stefanov', 'Акад. Борис Стефанов', 'София, Студентски град, ул. „Акад. Борис Стефанов“ 1, вх. А, ет. 1, офис 6', '+359894777882'],
]
export default {
  records: [{
    id: 'sofia-vasilena-drive-zheko-voyvoda', name: 'Автошкола Василена Драйв',
    cityCode: '68134', neighborhood: 'Дървеница', address: 'София, ж.к. Дървеница, ул. „Жеко Войвода“ 1',
    locationKind: 'premises', coordinates: null, category: 'education', website: root, phone: '+359885157954',
    services: [{ name: 'Опреснителен шофьорски урок', category: 'education', appointmentModel: 'appointment',
      description: '30 € за кормилен час; записват се минимум два кормилни часа. Опитът и удобният график се уточняват предварително с автошколата. Продължителността на един кормилен час не е уточнена в публикуваната тарифа.',
      price: { amount: 30, currency: 'EUR', kind: 'fixed', unit: 'кормилен час · минимум 2 часа', sourceUrl: root, checkedOn },
    }],
    booking: { kind: 'phone', phone: '+359885157954' },
    verification: { status: 'approved', checkedOn, validUntil: '2027-02-11', contact,
      booking: { url: contact, excerpt: 'Записване за курс и уточняване на стартова дата; ако формулярът не е достъпен, автошколата изрично насочва към директно обаждане.' } },
  }, {
    id: 'sofia-navigator-totleben', name: 'Автошкола Навигатор', cityCode: '68134', neighborhood: null,
    address: 'София, бул. „Ген. Тотлебен“ 34', locationKind: 'premises', coordinates: null,
    category: 'education', website: 'https://navigator-bg.org/', phone: '+359888545375',
    services: [{ name: 'Опреснителен шофьорски урок', category: 'education', appointmentModel: 'appointment',
      description: 'Цена за един учебен час; графикът се уточнява с автоинструктора. Не е публикувана точна продължителност на учебния час.',
      price: { amount: 30, currency: 'EUR', kind: 'fixed', unit: 'учебен час', sourceUrl: 'https://navigator-bg.org/', checkedOn },
    }],
    booking: { kind: 'phone', phone: '+359888545375' },
    verification: { status: 'approved', checkedOn, validUntil: '2027-02-11', contact: 'https://navigator-bg.org/',
      booking: { url: 'https://navigator-bg.org/', excerpt: 'Телефони за информация и записвания: автоинструктор Мартин Кирилов0888545375 и Ирена Герасимова0878522030.' } },
  }, {
    id: 'sofia-ddrive-obelya', name: 'Автошкола DDrive', cityCode: '68134', neighborhood: 'Обеля',
    address: 'София, кв. Обеля, ул. „Акад. Дмитрий Лихачов“ 5', locationKind: 'premises', coordinates: null,
    category: 'education', website: 'https://ddrive.website/', phone: '+359889060031',
    services: [{ name: 'Опреснителен шофьорски час', category: 'education', appointmentModel: 'appointment',
      description: 'Публикуваната цена е за опреснителен час. Точната продължителност и графикът се уточняват предварително. При повече часове може да се договори пакетна отстъпка, която не е включена в тази цена.',
      price: { amount: 40, currency: 'EUR', kind: 'fixed', unit: 'опреснителен час', sourceUrl: 'https://ddrive.website/', checkedOn },
    }],
    booking: { kind: 'form', url: 'https://ddrive.website/' },
    verification: { status: 'approved', checkedOn, validUntil: '2027-02-11', contact: 'https://ddrive.website/',
      booking: { url: 'https://ddrive.website/', excerpt: 'Онлайн запитване за записване с име, телефон и избор на услуга; графикът се уточнява от автошколата.' } },
  }, {
    id: 'sofia-vip-drive-lyulin7', name: 'Автошкола Вип Драйв Кар', cityCode: '68134', neighborhood: 'Люлин 7',
    address: 'София, ж.к. Люлин 7, бул. „Петър Дертлиев“ 42, Грийн Център, ет. 2, офис 55', locationKind: 'premises', coordinates: null,
    category: 'education', website: vip, phone: '+359886649282',
    services: [{ name: 'Опреснителен шофьорски час', category: 'education', appointmentModel: 'appointment',
      description: 'Цена за опреснителен час. Графикът и точната продължителност се уточняват при записване; таксите за цял шофьорски курс са отделни.',
      price: { amount: 30, currency: 'EUR', kind: 'fixed', unit: 'опреснителен час', sourceUrl: vip, checkedOn },
    }],
    booking: { kind: 'form', url: vipContact },
    verification: { status: 'approved', checkedOn, validUntil: '2027-02-11', contact: vipContact,
      booking: { url: vipContact, excerpt: 'Запиши се или се обади сега; форма с име, имейл, телефон и съобщение за записване на урок.' } },
  }, {
    id: 'sofia-avtokursove-slavov-suhata-reka', name: 'Автокурсове Славов', cityCode: '68134', neighborhood: 'Сухата река',
    address: 'София, ж.к. Сухата река, бл. 224', locationKind: 'premises', coordinates: null,
    category: 'education', website: slavov, phone: '+359888331855',
    services: [{ name: 'Опреснителен шофьорски урок · 1–8 учебни часа', category: 'education', appointmentModel: 'appointment',
      description: 'Цена за един учебен час при записани 1–8 учебни часа. Графикът се уговаря индивидуално, включително събота и неделя. Точната продължителност на учебния час се уточнява с инструктора. По-големите пакети имат отделни условия.',
      price: { amount: 25, currency: 'EUR', kind: 'fixed', unit: 'учебен час · при 1–8 часа', sourceUrl: slavovServices, checkedOn },
    }],
    booking: { kind: 'phone', phone: '+359888331855' },
    verification: { status: 'approved', checkedOn, validUntil: '2027-02-11', contact: slavovContact,
      booking: { url: slavovServices, excerpt: 'Обучението се провежда в удобно за курсиста време, включително уикенда; за уточняване на урок е предоставен контакт с инструктора Слави Славов.' } },
  }, {
    id: 'sofia-lider-drive-tsarigradsko100', name: 'Автошкола Lider Drive · София',
    cityCode: '68134', neighborhood: null, address: 'София, бул. „Цариградско шосе“ 100',
    locationKind: 'premises', coordinates: null, category: 'education', website: lider, phone: '+359888659658',
    services: [{ name: 'Опреснителен шофьорски час', category: 'education', appointmentModel: 'appointment',
      description: 'Публикувана цена за опреснителен час. Маршрутът, началната точка и точната продължителност се уточняват предварително с инструктора.',
      price: { amount: 45, currency: 'EUR', kind: 'fixed', unit: 'опреснителен час', sourceUrl: lider, checkedOn },
    }],
    openingHours: { sourceUrl: lider, checkedOn, days: [1, 2, 3, 4, 5, 6].map(weekday => ({ weekday, periods: [{ open: '08:00', close: '21:00' }] })) },
    booking: { kind: 'form', url: lider },
    verification: { status: 'approved', checkedOn, validUntil: '2027-02-11', contact: lider,
      booking: { url: lider, excerpt: 'Изборът на опреснителни часове насочва към формата за записване; школата се свързва за уточняване на графика.' } },
  }, ...uchaBranches.map(([slug, neighborhood, address]) => ({
    id: `sofia-ucha-zad-volana-${slug}`, name: `Автошкола Уча зад Волана · ${neighborhood}`,
    cityCode: '68134', neighborhood, address, locationKind: 'premises', coordinates: null,
    category: 'education', website: ucha, phone: '+359887706548',
    services: [{ name: 'Опреснителни шофьорски уроци · пакет от 5 кормувания', category: 'education', appointmentModel: 'appointment',
      description: 'Обща цена за пет кормувания, не цена за едно посещение. Графикът, началната точка и продължителността на заниманията се уточняват предварително. Има отделни пакети с 10 или 15 кормувания.',
      price: { amount: 300, currency: 'EUR', kind: 'fixed', unit: 'пакет · 5 кормувания', sourceUrl: uchaPrices, checkedOn },
    }],
    booking: { kind: 'form', url: uchaContact },
    verification: { status: 'approved', checkedOn, validUntil: '2027-02-11', contact: uchaContact,
      booking: { url: uchaContact, excerpt: 'Формата приема запитване за обучение и предпочитания за график; школата потвърждава уговорката.' } },
  })), ...expressBranches.map(([slug, label, address, phone]) => ({
    id: `sofia-express-v-${slug}`, name: `Автошкола Експрес–В · ${label}`,
    cityCode: '68134', neighborhood: 'Студентски град', address, locationKind: 'premises', coordinates: null,
    category: 'education', website: express, phone,
    services: [{ name: 'Опреснителен шофьорски урок', category: 'education', appointmentModel: 'appointment', durationMin: 50, durationSourceUrl: express, durationCheckedOn: checkedOn,
      description: 'Индивидуален график и място за тръгване по уговорка с инструктора. Един опреснителен час е 50 минути. Цената се уточнява при запитване; пакетите с повече часове не са цена за едно посещение.' }],
    booking: { kind: 'form', url: expressBooking },
    verification: { status: 'approved', checkedOn, validUntil: '2027-02-11', contact: expressContact,
      booking: { url: expressBooking, excerpt: 'Онлайн записване с име, телефон, категория и желана дата; практическите часове се уговарят с инструктора.' } },
  }))],
  reviews: [{ id: 'sofia-vasilena-drive-zheko-voyvoda', checkedOn, website: root, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [root, contact, services],
    notes: 'Followed actual own ZayaviMyasto link, which points to root signup section; root and contact expose country-restricted form notice and explicitly direct customers to phone if unavailable. Did not bypass restriction. Selected verified ownerphone0885157954, repeated header/footer/contact. Refresher30EUR/hour, minimum2drivinghours, own service page individual schedule and exact DarvenitsaZhekoVoyvoda1 confirmed. No course-package1125EUR mistaken for visit, no60minute duration, teachinghours or coordinates invented; no call or submission.',
  }, { id: 'sofia-navigator-totleben', checkedOn, website: 'https://navigator-bg.org/', bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: ['https://navigator-bg.org/'],
    notes: 'Current own singlepage announces November23course and separately30EUR/academic-hour refresher, exact Totleben34officeandclassroom, and two explicit instructor enrolmentphones. Import one existingvenue only, not eachinstructor. No1200EURfullcourseprice mistaken for visit; no invented45/60minute duration or admin-intakewindow as teachinghours. No calls, coordinates or form submissions.',
  }, { id: 'sofia-ddrive-obelya', checkedOn, website: 'https://ddrive.website/', bookingEntry: 'https://ddrive.website/', bookingReview: 'owned_booking_reviewed',
    reviewedUrls: ['https://ddrive.website/'],
    notes: 'Actual own Book and refresher Enquiry CTA both point to the visible signupform(name,phone,optionalemail,service,message). Actual own40EURrefresher fee separate from899/999EURfullcourses; perhour label retained without inventedminutes. ExactObelyaDmitriyLihachov5office and primaryphone read. Convenient metropickuplocations not imported as extra offices. No ownerGoogle reviews/photos or bankingdetails copied. Form not filled/submitted.',
  }, { id: 'sofia-vip-drive-lyulin7', checkedOn, website: vip, bookingEntry: vipContact, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [vipContact, vip],
    notes: 'Actual own Book CTA leads to Contacts enrolment form, with matching Lyulin7GreenCenterPetarDertliev42floor2office55 and phone. Separate30EUR/hour ordinary refresher tariff read, not discounted Valentine coursebanner or examination/enrolmentfees. No precisehourlength, weeklyschedule, slots or coordinates inferred. No form submission.',
  }, { id: 'sofia-avtokursove-slavov-suhata-reka', checkedOn, website: slavov, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [slavov, slavovServices, slavovContact],
    notes: 'Actual owner refresher page offers individually arranged lesson times including weekends and links instructor contact; read own exact SuhataReka224 address and phone.25EUR peracademic-hour only for1–8hours, not23/22EURbulkdiscount. No assumption academic hour equals45/50/60minutes. No weeklyhours invented from by-arrangement availability; no booking.',
  }, { id: 'sofia-lider-drive-tsarigradsko100', checkedOn, website: lider, bookingEntry: lider, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [lider],
    notes: 'Actual JS owner site read in IAB, selected refresher45EUR/hour ChooseCTA opens owned name/phone/email/message signupform, not submitted. SofiaTsarigradsko100address repeated locationandfooter, actualprimaryphone. Not cloned ElinPelinlocation. Published Mon-Sat08–21 sixdaywindow retained; Sundayunspecified leftabsent, not claimedclosed. No guessed60minute lesson length/coordinates. Refresherfee distinct from1350EURfullcourse orfreetrial.',
  }, ...uchaBranches.map(([slug]) => ({
    id: `sofia-ucha-zad-volana-${slug}`, checkedOn, website: ucha, bookingEntry: uchaContact, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [ucha, `${ucha}enroll`, uchaPrices, uchaContact],
    notes: 'Actual JS owner tariff, enrolment and contact visually read in IAB. Refresher5drives300EUR is explicit PACKAGE, not onevisit/60EURderivedperlesson. General enrolment routes to Viber declaration and300EURdeposit for1300EURfullcourse; not falsely reused as ordinary refresherform. Actual contact enquiry accepts training goals andschedulepreferences. Exact named SlaviaKoloman6 andLozenetsJamesBourchier99–101offices retained; Motopista1404ambiguous postcode-as-number andPancharevo held. No durations/hours/coords inferred orcustomerdata submitted.',
  })), ...expressBranches.map(([slug]) => ({
    id: `sofia-express-v-${slug}`, checkedOn, website: express, bookingEntry: expressBooking, bookingReview: 'owned_booking_reviewed',
    pricingDecision: 'not_publicly_listed', reviewedUrls: [expressBooking, express, expressServices, expressContact],
    priceSearch: { outcome: 'not_published', bookingUrl: expressBooking, serviceUrls: [express, expressServices],
      notes: 'Actual signup form, complete courses page and owner refresher section inspected. Ordinary50minute refresher price not published; full-course1100EUR and motorcycle promotional fees not selected visit amounts.' },
    notes: 'Own contact and footer corroborate two distinct Sofia offices and separate phones. Common owner appointment service is50minute refresher; no chain fee inferred. Actual enrolment form inspected without submission. Third Mladost contact absent in repeated footer held for address check. No lesson hours inferred from admin intake; no coordinates.',
  }))],
}
