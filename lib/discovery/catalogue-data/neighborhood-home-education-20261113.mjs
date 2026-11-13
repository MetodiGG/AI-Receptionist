// Dated own-source Sofia appointment review, 2026-11-13. No runtime requests.
// Inventory fingerprints are assigned by the root integrator only after source verification.
export default {
  "records": [
    {
      "id": "sofia-chisto-home-visits",
      "name": "Чисто · домашно почистване в София",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://chisto.bg/",
      "phone": "+359887036642",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Основно почистване · пакет Стандарт",
          "description": "С ДДС; минимална поръчка за София 40 €. Възможно оскъпяване при силно замърсяване, опасна работа, затруднен достъп или работа с други лица. Офертата се уточнява предварително.",
          "price": {
            "amount": 3,
            "currency": "EUR",
            "kind": "range",
            "maximum": 4.5,
            "unit": "м² · минимум 40 €",
            "sourceUrl": "https://chisto.bg/prices/",
            "checkedOn": "2026-11-13"
          }
        },
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Пране на тапицерия на място",
          "description": "С ДДС; минимална поръчка за София 40 €. Цената може да се промени според замърсяването и достъпа. Посещението се уточнява при поръчка.",
          "price": {
            "amount": 7,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "седящо място · минимум 40 €",
            "sourceUrl": "https://chisto.bg/prices/",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359887036642"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://chisto.bg/",
          "excerpt": "Сайтът приема поръчки по телефон за почистване на домове в София; публикуван е минимум за посещението."
        },
        "contact": "https://chisto.bg/prices/"
      }
    },
    {
      "id": "sofia-feite-home-cleaning",
      "name": "Феите · домашно почистване",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://feite.bg/",
      "phone": "+359885419022",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Почистване на дома",
          "description": "Еднократно или регулярно посещение на адрес в София. Офертата зависи от площта и допълнителните задачи; датата и часът се потвърждават от екипа."
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://feite.bg/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://feite.bg/",
          "excerpt": "Заявява се оферта, дата и час за почистване; екипът се свързва за потвърждение и посещава адреса."
        },
        "contact": "https://feite.bg/"
      },
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "09:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "09:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "09:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "09:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "09:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": [],
            "byAppointment": true
          },
          {
            "weekday": 7,
            "periods": [],
            "byAppointment": true
          }
        ],
        "sourceUrl": "https://feite.bg/",
        "checkedOn": "2026-11-13"
      }
    },
    {
      "id": "sofia-cleaningcompany-home-visits",
      "name": "CleaningCompany.BG · почистване на дома",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://cleaningcompany.bg/",
      "phone": "+359897656660",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Почистване на едностаен апартамент",
          "description": "Начална цена при стандартно замърсяване; окончателна оферта според състоянието след безплатна оценка. Предварително насрочено посещение; ДДС не е уточнен.",
          "price": {
            "amount": 50.6,
            "currency": "EUR",
            "kind": "from",
            "sourceUrl": "https://cleaningcompany.bg/pochistvane-na-domove-apartamenti-sofia-ceni/",
            "checkedOn": "2026-11-13"
          }
        },
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Почистване на двустаен апартамент",
          "description": "Начална цена при стандартно замърсяване; окончателна оферта според състоянието след безплатна оценка. Предварително насрочено посещение; ДДС не е уточнен.",
          "price": {
            "amount": 65.95,
            "currency": "EUR",
            "kind": "from",
            "sourceUrl": "https://cleaningcompany.bg/pochistvane-na-domove-apartamenti-sofia-ceni/",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://cleaningcompany.bg/contacts/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://cleaningcompany.bg/",
          "excerpt": "Официалният FAQ предлага форма или обаждане за насрочване на удобен ден и час за почистване."
        },
        "contact": "https://cleaningcompany.bg/contacts/"
      }
    },
    {
      "id": "sofia-handyservices-home-visits",
      "name": "Handy Services · домашно почистване",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://handyservices.bg/",
      "phone": "+359886462907",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Поддържащо почистване на дома",
          "description": "Базова ставка с ДДС; минимум 75 € еднократно. Калкулаторът е ориентир, не окончателна оферта. Обхватът и цената се потвърждават след разговор, снимки или оглед.",
          "price": {
            "amount": 2.54,
            "currency": "EUR",
            "kind": "from",
            "unit": "м² · минимум 75 € еднократно",
            "sourceUrl": "https://handyservices.bg/ceni/",
            "checkedOn": "2026-11-13"
          }
        },
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Пране на мека мебел",
          "description": "Базова ставка с ДДС; минимум 75 € еднократно. Отделна услуга от поддържащото почистване. Крайната оферта и времевият прозорец се потвърждават лично.",
          "price": {
            "amount": 7,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "седящо място · минимум 75 € еднократно",
            "sourceUrl": "https://handyservices.bg/ceni/",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://handyservices.bg/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://handyservices.bg/",
          "excerpt": "Формата приема услуга, район и предпочитана дата; обхватът, цената и удобният час се потвърждават лично."
        },
        "contact": "https://handyservices.bg/"
      }
    },
    {
      "id": "sofia-eco-clean-home-visits",
      "name": "Еко Хоум Клийнинг · посещения в София",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://eco-clean-home.com/contact-us/",
      "phone": "+359888515129",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Пране на двоен диван",
          "description": "Литерална публикувана тарифа в лева, не крайна оферта; минимум 100 лв. Без паркомясто +2 лв./час, без асансьор +1 лв./етаж, извън Околовръстното +0,40 лв./км. Корекция според замърсяване, площ и изисквания.",
          "price": {
            "amount": 35,
            "currency": "BGN",
            "kind": "fixed",
            "sourceUrl": "https://eco-clean-home.com/цени/",
            "checkedOn": "2026-11-13",
            "unit": "диван · минимум 100 лв."
          }
        },
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Пране на единичен матрак · едностранно",
          "description": "Литерална публикувана тарифа в лева, не крайна оферта; минимум 100 лв. Без паркомясто +2 лв./час, без асансьор +1 лв./етаж, извън Околовръстното +0,40 лв./км. Корекция според замърсяване, площ и изисквания.",
          "price": {
            "amount": 15,
            "currency": "BGN",
            "kind": "fixed",
            "sourceUrl": "https://eco-clean-home.com/цени/",
            "checkedOn": "2026-11-13",
            "unit": "матрак · минимум 100 лв."
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359888515129"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://eco-clean-home.com/rezervaciq/",
          "excerpt": "Собствената страница Резервация кани за записване на почистване и публикува телефон за уточняване на офертата."
        },
        "contact": "https://eco-clean-home.com/contact-us/"
      },
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "09:30",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "09:30",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "09:30",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "09:30",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "09:30",
                "close": "18:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://eco-clean-home.com/rezervaciq/",
        "checkedOn": "2026-11-13"
      }
    },
    {
      "id": "sofia-hometech-home-visits",
      "name": "Хоум Тех Сервиз · ремонт на перални на адрес",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://hometechbg.com/",
      "phone": "+359899920385",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Диагностика и ремонт на пералня на адрес",
          "description": "Предварително уговорен ден и час в София. Крайната цена се определя след диагностика; възможността за ремонт зависи от повредата, модела и наличните части."
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359899920385"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://hometechbg.com/remont-na-peralni",
          "excerpt": "Официалната услуга предлага техник на адрес в София след предварително уговорен ден и час."
        },
        "contact": "https://hometechbg.com/contacts"
      }
    },
    {
      "id": "sofia-panservice-home-appliance-visits",
      "name": "Pan Service · ремонт на перални на адрес",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://panservice-bg.com/",
      "phone": "+359897996155",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Посещение, диагностика и лек ремонт на пералня",
          "description": "Публикувана цена за труд в София. След диагностика се обявява ремонтната оферта; при отказ се дължат 30 € за посещение и диагностика. Части и транспорт до сервиз не са включени в тази трудова позиция.",
          "price": {
            "amount": 30,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "посещение · труд",
            "sourceUrl": "https://panservice-bg.com/перални/",
            "checkedOn": "2026-11-13"
          }
        },
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Смяна на маркуч на пералня",
          "description": "Цена за труд, не за резервната част; уточнява се след диагностика. Тежки ремонти може да са в сервиз; транспортът е за сметка на клиента. Посещението се заявява предварително.",
          "price": {
            "amount": 15,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "труд · без резервната част",
            "sourceUrl": "https://panservice-bg.com/перални/",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359897996155"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://panservice-bg.com/перални/",
          "excerpt": "Официалната страница Перални приема заявки по телефон в София и уточнява, че ремонтът е в дома на клиента."
        },
        "contact": "https://panservice-bg.com/перални/"
      }
    },
    {
      "id": "sofia-elektrotehnik-info-home-visits",
      "name": "Elektrotehnik.info · електроуслуги в София",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://elektrotehnik.info/",
      "phone": "+359875357121",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Посещение и диагностика на електроинсталация",
          "description": "Тарифа от октомври 2026 г.; минимум за София 30 €. Ремонтът се оценява преди работа; материалите се уточняват отделно. ДДС не е уточнен.",
          "price": {
            "amount": 30,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "посещение",
            "sourceUrl": "https://elektrotehnik.info/цени/",
            "checkedOn": "2026-11-13"
          }
        },
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Монтаж на ключ или контакт",
          "description": "Труд на брой; посещение отделно 30 €, материалите се уточняват отделно. Диапазон според обем и сложност; ДДС не е уточнен. Крайна оферта преди работа.",
          "price": {
            "amount": 10,
            "currency": "EUR",
            "kind": "range",
            "maximum": 20,
            "unit": "брой · посещение 30 € отделно",
            "sourceUrl": "https://elektrotehnik.info/цени/",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359875357121"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://elektrotehnik.info/",
          "excerpt": "Собственият сайт кани за заявка за посещение от електротехник в София; тарифата отделя посещение от труд."
        },
        "contact": "https://elektrotehnik.info/контакти/"
      }
    },
    {
      "id": "sofia-eltablo-er-stroy-home-visits",
      "name": "Ер Строй Ремонти · електроуслуги на адрес",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://eltablo.bg/",
      "phone": "+359877553643",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Посещение с диагностика за електроремонт",
          "description": "Изрично публикувана задължителна такса 30 лв. за работен ден и в работно време. Цената и условията за същинския ремонт се обявяват след диагностика; не е цена за пълен ремонт.",
          "price": {
            "amount": 30,
            "currency": "BGN",
            "kind": "fixed",
            "sourceUrl": "https://eltablo.bg/el-uslugi-tseni",
            "checkedOn": "2026-11-13",
            "unit": "посещение · работен ден и работно време"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://eltablo.bg/vrazka-s-firma-er-stroy-remonti-eood"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://eltablo.bg/el-uslugi-tseni",
          "excerpt": "Тарифата описва посещение с диагностика и уговаряне на следващ ден и час за ремонт при липсващи части."
        },
        "contact": "https://eltablo.bg/vrazka-s-firma-er-stroy-remonti-eood"
      }
    },
    {
      "id": "sofia-rodgers-design-home-assembly",
      "name": "Rodgers Design · монтаж на мебели и санитария",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://rodgers-design.com/",
      "phone": "+359882292435",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Сглобяване и монтаж на долен кухненски шкаф",
          "description": "Начална цена за стандартен долен единичен шкаф в София за 2026 г. Обхватът и посещението се уточняват с изпълнителя; ДДС и консумативи не са уточнени.",
          "price": {
            "amount": 60,
            "currency": "EUR",
            "kind": "from",
            "sourceUrl": "https://rodgers-design.com/montazh-mebeli-sanitaria-sofia.html",
            "checkedOn": "2026-11-13"
          }
        },
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Монтаж на смесителна батерия",
          "description": "Начална цена за София за 2026 г. Конкретният монтаж и посещението се уточняват с изпълнителя; ДДС и консумативи не са уточнени.",
          "price": {
            "amount": 35,
            "currency": "EUR",
            "kind": "from",
            "sourceUrl": "https://rodgers-design.com/montazh-mebeli-sanitaria-sofia.html",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://www.rodgers-design.com/contact.html"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.rodgers-design.com/contact.html",
          "excerpt": "Собствената форма приема запитване за услугите; изпълнителят отговаря по телефон или имейл за уточняване на проекта."
        },
        "contact": "https://www.rodgers-design.com/contact.html"
      }
    },
    {
      "id": "sofia-rainfreshclean-home-visits",
      "name": "RainFreshClean · почистване на адрес",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://rainfreshclean.eu/",
      "phone": "+359988334167",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Основно почистване · SMALL до 50 м²",
          "description": "Обща цена за обект до 50 м², не на м². Пакетът включва прах, външни кухненски шкафове, санитарни помещения, прахосмукачка, под, печка, абсорбатор, прозорци, врати, чаршафи и боклук. ДДС не е уточнен; посещението се уточнява.",
          "price": {
            "amount": 185,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "пакет за обект до 50 м²",
            "sourceUrl": "https://rainfreshclean.eu/",
            "checkedOn": "2026-11-13"
          }
        },
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Пране на текстилна тапицерия",
          "description": "Публикувана ставка на седящо място за мека мебел и столове. Обхватът, достъпът и датата се уточняват при поръчка; ДДС не е уточнен.",
          "price": {
            "amount": 7.67,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "седящо място",
            "sourceUrl": "https://rainfreshclean.eu/",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://rainfreshclean.eu/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://rainfreshclean.eu/",
          "excerpt": "Собствената форма Поръчка приема име, телефон, адрес и дата за почистване на дома в София."
        },
        "contact": "https://rainfreshclean.eu/"
      }
    },
    {
      "id": "sofia-radulov-cleaning-home-visits",
      "name": "Radulov Cleaning · почистване след ремонт",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://www.radulovcleaning.bg/contacti/",
      "phone": "+359887490169",
      "services": [
        {
          "category": "home_services",
          "appointmentModel": "home_visit",
          "name": "Почистване след ремонт на жилище",
          "description": "София; оферта след безплатен оглед според площ, замърсяване и допълнителни услуги. Дата, задачи и посещение се уточняват с екипа."
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359887490169"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.radulovcleaning.bg/pochistvane-sled-remont/",
          "excerpt": "Официалната услуга за почистване след ремонт в София кани за обаждане или запитване за оглед и оферта."
        },
        "contact": "https://www.radulovcleaning.bg/contacti/"
      }
    },
    {
      "id": "sofia-voice-lab-karpuzitsa",
      "name": "Voice Lab · Преслава Мръвкова",
      "cityCode": "68134",
      "neighborhood": "Карпузица",
      "address": "София, ж.к. Карпузица, ул. Капка 3",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://www.voicelab.bg/",
      "phone": null,
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Пиано · основи · 4 индивидуални урока месечно",
          "description": "Обща месечна цена за 4 индивидуални урока, не цена на един урок. За начинаещи деца и възрастни. Графикът и записването се уточняват със студиото; продължителност не е публикувана.",
          "price": {
            "amount": 120,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "месец · 4 индивидуални урока",
            "sourceUrl": "https://www.voicelab.bg/",
            "checkedOn": "2026-11-13"
          }
        },
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Пеене · вокален старт · 4 индивидуални урока месечно",
          "description": "Обща месечна цена за 4 индивидуални урока, не цена на един урок. Има присъствен или онлайн формат; тук се заявява присъствено обучение в София. Графикът се потвърждава от студиото.",
          "price": {
            "amount": 120,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "месец · 4 индивидуални урока",
            "sourceUrl": "https://www.voicelab.bg/",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://www.voicelab.bg/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.voicelab.bg/",
          "excerpt": "Собствената форма е за въпроси, записване на час или индивидуална консултация; програмите имат покана Запиши се."
        },
        "contact": "https://www.voicelab.bg/"
      }
    },
    {
      "id": "sofia-little-big-talents-otets-paisiy",
      "name": "Малките Големи Таланти · музикален център",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Отец Паисий 53",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://www.thelittlebigtalents.bg/",
      "phone": "+359876191718",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Поп и джаз пеене · начинаещи · 4 урока месечно",
          "description": "Обща месечна такса за 4 индивидуални урока; всеки е с публикувана продължителност 45–60 минути. Не е цена за един урок. Записване и график чрез центъра.",
          "price": {
            "amount": 120,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "месец · 4 урока по 45–60 минути",
            "sourceUrl": "https://www.thelittlebigtalents.bg/pricing",
            "checkedOn": "2026-11-13"
          }
        },
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Солфеж · индивидуална програма · 4 урока месечно",
          "description": "Обща месечна такса за 4 урока по 45 минути. Не е цена за един урок; графикът се уточнява при записване.",
          "price": {
            "amount": 70,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "месец · 4 урока по 45 минути",
            "sourceUrl": "https://www.thelittlebigtalents.bg/pricing",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359876191718"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.thelittlebigtalents.bg/",
          "excerpt": "Официалният сайт кани Запиши урок и Обади се, публикува телефон за центъра и индивидуални музикални програми."
        },
        "contact": "https://www.thelittlebigtalents.bg/"
      },
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "10:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "10:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "10:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "10:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "10:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": [
              {
                "open": "11:00",
                "close": "16:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://www.thelittlebigtalents.bg/",
        "checkedOn": "2026-11-13"
      }
    },
    {
      "id": "sofia-bravo-center-gotse-delchev",
      "name": "BRAVO Center · Гоце Делчев",
      "cityCode": "68134",
      "neighborhood": "Гоце Делчев",
      "address": "София, кв. Гоце Делчев, ул. Метличина поляна, бл. 29, вх. В",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://bravocenter.bg/",
      "phone": "+359877108608",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуални уроци по английски език",
          "description": "За деца, юноши и възрастни; програмата и удобният график се уточняват след консултация и входящ тест. Цената се потвърждава от школата."
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://bravocenter.bg/kontakt/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://bravocenter.bg/запиши-се/",
          "excerpt": "Собствената страница Запиши се предлага телефон или контактна форма за консултация и входящ тест в удобно време."
        },
        "contact": "https://bravocenter.bg/kontakt/"
      },
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "10:00",
                "close": "18:30"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "10:00",
                "close": "18:30"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "10:00",
                "close": "18:30"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "10:00",
                "close": "18:30"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "10:00",
                "close": "18:30"
              }
            ]
          }
        ],
        "sourceUrl": "https://bravocenter.bg/запиши-се/",
        "checkedOn": "2026-11-13"
      }
    },
    {
      "id": "sofia-elina-lyuben-karavelov",
      "name": "Учебен център Елина · Любен Каравелов",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Любен Каравелов 19, ет. 2",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://www.elina-av.com/lang_courses.html",
      "phone": "+359888616911",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуален урок по английски език",
          "description": "Присъствено в школата; ниво, цели, брой и честота на уроците се уточняват индивидуално. Предлага се и онлайн формат, който не е отделно софийско място. Цена при запитване."
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359888616911"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.elina-av.com/uroci_po_angliiski.html",
          "excerpt": "Страницата за частни уроци кани за обаждане; броят, честотата и темпото на занятията се съобразяват с ученика."
        },
        "contact": "https://www.elina-av.com/contact.html"
      },
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "09:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "09:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "09:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "09:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "09:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": [
              {
                "open": "09:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 7,
            "periods": [
              {
                "open": "09:00",
                "close": "20:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://www.elina-av.com/contact.html",
        "checkedOn": "2026-11-13"
      }
    },
    {
      "id": "sofia-art-center-home-drawing",
      "name": "Art Center · уроци по рисуване на адрес",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "education",
      "website": "https://alo372.wixsite.com/1234",
      "phone": "+359877889898",
      "services": [
        {
          "category": "education",
          "appointmentModel": "home_visit",
          "name": "Индивидуален урок по рисуване на адрес",
          "description": "Публикувана цена в лева за 60 минути; минимум 4 урока месечно. Графикът се записва за следващата седмица. Пропуснат час се пренасрочва при обаждане най-късно предишния ден.",
          "price": {
            "amount": 40,
            "currency": "BGN",
            "kind": "fixed",
            "sourceUrl": "https://alo372.wixsite.com/1234",
            "checkedOn": "2026-11-13",
            "unit": "урок · минимум 4 урока месечно"
          },
          "durationMin": 60,
          "durationSourceUrl": "https://alo372.wixsite.com/1234",
          "durationCheckedOn": "2026-11-13"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359877889898"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://alo372.wixsite.com/1234",
          "excerpt": "Официалната страница предлага индивидуални уроци на адрес в София с предварителен график и записване по телефон."
        },
        "contact": "https://alo372.wixsite.com/1234"
      },
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "10:30",
                "close": "15:30"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "10:30",
                "close": "15:30"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "10:30",
                "close": "15:30"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "10:30",
                "close": "15:30"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "10:30",
                "close": "15:30"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": [
              {
                "open": "10:30",
                "close": "15:30"
              }
            ]
          },
          {
            "weekday": 7,
            "periods": [
              {
                "open": "10:30",
                "close": "15:30"
              }
            ]
          }
        ],
        "sourceUrl": "https://alo372.wixsite.com/1234",
        "checkedOn": "2026-11-13"
      }
    },
    {
      "id": "sofia-arliz-orfey",
      "name": "Езикова школа Арлиз · Лозенец",
      "cityCode": "68134",
      "neighborhood": "Лозенец",
      "address": "София, ж.к. Лозенец, ул. Орфей 17",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://arliz.bg/",
      "phone": "+359896832564",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуални уроци по английски език",
          "description": "Помощ за училище, повишаване на ниво или изпитен тренинг; програма и удобен график според целите на курсиста. Записване по телефон; цената се уточнява със школата."
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359896832564"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://arliz.bg/zapisvaneto-za-uchebnata-2026-2027-godina-zapochna/",
          "excerpt": "Собствената покана за учебната 2026/2027 година включва индивидуални програми и телефон за записване и удобен график."
        },
        "contact": "https://arliz.bg/kontakti/"
      }
    },
    {
      "id": "sofia-accent-benkovski",
      "name": "АКЦЕНТ · Георги Бенковски",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Георги Бенковски 21, ет. 1",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://www.accentschool.net/",
      "phone": "+359888591605",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуално езиково обучение · карта 10 учебни часа",
          "description": "Предплатена карта: общо 10 учебни часа по 45 минути, валидна 5 седмици; занятия минимум по 90 минути. Цената е за обучение в школата, не в офис на клиента. Зала и график се потвърждават при записване.",
          "price": {
            "amount": 280,
            "currency": "BGN",
            "kind": "fixed",
            "sourceUrl": "https://www.accentschool.net/uslugi/individualno-obuchenie",
            "checkedOn": "2026-11-13",
            "unit": "карта 10 учебни часа · валидност 5 седмици"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359888591605"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.accentschool.net/uslugi/individualno-obuchenie",
          "excerpt": "Собствената услуга предлага индивидуални занятия по удобен график и заявка за обучение; записването е чрез централния офис."
        },
        "contact": "https://www.accentschool.net/contact"
      }
    },
    {
      "id": "sofia-accent-vitosha",
      "name": "АКЦЕНТ · Витоша",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Витоша 28",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://www.accentschool.net/",
      "phone": "+359888591605",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуално езиково обучение · карта 10 учебни часа",
          "description": "Предплатена карта: общо 10 учебни часа по 45 минути, валидна 5 седмици; занятия минимум по 90 минути. Цената е за обучение в школата, не в офис на клиента. Зала и график се потвърждават при записване.",
          "price": {
            "amount": 280,
            "currency": "BGN",
            "kind": "fixed",
            "sourceUrl": "https://www.accentschool.net/uslugi/individualno-obuchenie",
            "checkedOn": "2026-11-13",
            "unit": "карта 10 учебни часа · валидност 5 седмици"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359888591605"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.accentschool.net/uslugi/individualno-obuchenie",
          "excerpt": "Собствената услуга предлага индивидуални занятия по удобен график и заявка за обучение; записването е чрез централния офис."
        },
        "contact": "https://www.accentschool.net/contact"
      }
    },
    {
      "id": "sofia-avo-dondukov",
      "name": "АВО · Паметник Левски",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Княз Александър Дондуков 64",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://avo.bg/",
      "phone": "+359896888458",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуално обучение по английски език",
          "description": "Общ, бизнес или комуникативен английски според целите. За присъствено обучение се избира учебна зала на АВО; конкретният клон, преподавател, график и оферта се потвърждават от екипа. Заявката не е потвърден час."
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://avo.bg/apply_individual?package=mini"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://avo.bg/apply_individual?package=mini",
          "excerpt": "Собствената заявка за индивидуално обучение приема вид курс, ниво, хорариум, интензивност, удобно време и учебна зала на АВО."
        },
        "contact": "https://avo.bg/contacts"
      }
    },
    {
      "id": "sofia-avo-graf-ignatiev",
      "name": "АВО · Граф Игнатиев",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Граф Игнатиев 78",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://avo.bg/",
      "phone": "+359896896896",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуално обучение по английски език",
          "description": "Общ, бизнес или комуникативен английски според целите. За присъствено обучение се избира учебна зала на АВО; конкретният клон, преподавател, график и оферта се потвърждават от екипа. Заявката не е потвърден час."
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://avo.bg/apply_individual?package=mini"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://avo.bg/apply_individual?package=mini",
          "excerpt": "Собствената заявка за индивидуално обучение приема вид курс, ниво, хорариум, интензивност, удобно време и учебна зала на АВО."
        },
        "contact": "https://avo.bg/contacts"
      }
    },
    {
      "id": "sofia-avo-mladost",
      "name": "АВО · Младост",
      "cityCode": "68134",
      "neighborhood": "Младост 1",
      "address": "София, ж.к. Младост 1, ул. Никола Генадиев 7",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://avo.bg/",
      "phone": "+359882359628",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуално обучение по английски език",
          "description": "Общ, бизнес или комуникативен английски според целите. За присъствено обучение се избира учебна зала на АВО; конкретният клон, преподавател, график и оферта се потвърждават от екипа. Заявката не е потвърден час."
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://avo.bg/apply_individual?package=mini"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://avo.bg/apply_individual?package=mini",
          "excerpt": "Собствената заявка за индивидуално обучение приема вид курс, ниво, хорариум, интензивност, удобно време и учебна зала на АВО."
        },
        "contact": "https://avo.bg/contacts"
      }
    },
    {
      "id": "sofia-avo-opalchenska",
      "name": "АВО · учебна база Опълченска",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Средна гора 93",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://avo.bg/",
      "phone": "+359896888455",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуално обучение по английски език",
          "description": "Общ, бизнес или комуникативен английски според целите. За присъствено обучение се избира учебна зала на АВО; конкретният клон, преподавател, график и оферта се потвърждават от екипа. Заявката не е потвърден час."
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://avo.bg/apply_individual?package=mini"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://avo.bg/apply_individual?package=mini",
          "excerpt": "Собствената заявка за индивидуално обучение приема вид курс, ниво, хорариум, интензивност, удобно време и учебна зала на АВО."
        },
        "contact": "https://avo.bg/contacts"
      }
    },
    {
      "id": "sofia-booktree-dragalevtsi",
      "name": "Езикова школа БУК · Драгалевци",
      "cityCode": "68134",
      "neighborhood": "Драгалевци",
      "address": "София, кв. Драгалевци, пл. Цар Иван Александър 6, ет. 2, читалище Св. св. Кирил и Методий",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://www.booktree.bg/",
      "phone": "+359885049075",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуално езиково обучение · учебен час",
          "description": "За 1 учебен час от 40 минути. При плащане на урок се оставя депозит за последните 2 учебни часа. Материалите се заплащат отделно. Отлагане поне 3 часа предварително; иначе урокът се таксува. Графикът се уговаря със школата.",
          "price": {
            "amount": 25,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "учебен час · 40 минути",
            "sourceUrl": "https://www.booktree.bg/tseni/",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://www.booktree.bg/contacts/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.booktree.bg/contacts/",
          "excerpt": "Официалният Запишете се води до собствена форма за курс и съобщение; индивидуалната програма се уговаря със школата."
        },
        "contact": "https://www.booktree.bg/contacts/"
      }
    },
    {
      "id": "sofia-booktree-gotse-delchev",
      "name": "Езикова школа БУК · Гоце Делчев",
      "cityCode": "68134",
      "neighborhood": "Гоце Делчев",
      "address": "София, кв. Гоце Делчев, ул. Силиврия 23",
      "locationKind": "premises",
      "coordinates": null,
      "category": "education",
      "website": "https://www.booktree.bg/",
      "phone": "+359885049075",
      "services": [
        {
          "category": "education",
          "appointmentModel": "appointment",
          "name": "Индивидуално езиково обучение · учебен час",
          "description": "За 1 учебен час от 40 минути. При плащане на урок се оставя депозит за последните 2 учебни часа. Материалите се заплащат отделно. Отлагане поне 3 часа предварително; иначе урокът се таксува. Графикът се уговаря със школата.",
          "price": {
            "amount": 25,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "учебен час · 40 минути",
            "sourceUrl": "https://www.booktree.bg/tseni/",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://www.booktree.bg/contacts/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.booktree.bg/contacts/",
          "excerpt": "Официалният Запишете се води до собствена форма за курс и съобщение; индивидуалната програма се уговаря със школата."
        },
        "contact": "https://www.booktree.bg/contacts/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-chisto-home-visits",
      "checkedOn": "2026-11-13",
      "website": "https://chisto.bg/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://chisto.bg/",
        "https://chisto.bg/prices/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Owner order-by-phone invitation and exact home-cleaning tariff reviewed, not retail cart. VAT, minimum and adjustment conditions retained. No day-specific visit hours found; one mobile Sofia record."
    },
    {
      "id": "sofia-feite-home-cleaning",
      "checkedOn": "2026-11-13",
      "website": "https://feite.bg/",
      "bookingEntry": "https://feite.bg/",
      "reviewedUrls": [
        "https://feite.bg/"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual Book entry resolves to inspected in-page form with name/email/phone/area/service. Substantive service/pricing FAQ on this same page reviewed. Separate house-cleaning link cache-missed, not counted as inspected. Explicit weekday hours and weekend by-request footer retained; no numeric price claimed.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://feite.bg/",
        "serviceUrls": [
          "https://feite.bg/"
        ],
        "notes": "Actual in-page booking form, home-service menu, pricing FAQ and footer reviewed. Owner says price depends on area/extras and requests inquiry for exact offer; no numeric tariff there."
      }
    },
    {
      "id": "sofia-cleaningcompany-home-visits",
      "checkedOn": "2026-11-13",
      "website": "https://cleaningcompany.bg/",
      "bookingEntry": "https://cleaningcompany.bg/contacts/",
      "reviewedUrls": [
        "https://cleaningcompany.bg/",
        "https://cleaningcompany.bg/contacts/",
        "https://cleaningcompany.bg/pochistvane-na-domove-apartamenti-sofia-ceni/"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Owner booking FAQ followed to actual contact form, then full exact apartment service tariff. Starting prices and standard dirt condition retained. Flexible morning/evening/weekend prose not converted into clock hours; office not treated as mobile destination."
    },
    {
      "id": "sofia-handyservices-home-visits",
      "checkedOn": "2026-11-13",
      "website": "https://handyservices.bg/",
      "bookingEntry": "https://handyservices.bg/",
      "reviewedUrls": [
        "https://handyservices.bg/",
        "https://handyservices.bg/ceni/"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual Request cleaning entry and in-page form with preferred date reviewed before full tariff and FAQ. Deeper service links cache-missed; no facts from them claimed. Homepage and tariff substantively name exact services. Minimum/VAT/indicative-final-offer conditions retained. Seven-day wording has no clock schedule."
    },
    {
      "id": "sofia-eco-clean-home-visits",
      "checkedOn": "2026-11-13",
      "website": "https://eco-clean-home.com/contact-us/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://eco-clean-home.com/contact-us/",
        "https://eco-clean-home.com/rezervaciq/",
        "https://eco-clean-home.com/цени/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Actual Reservation page first, accessible owner contact and full tariff next. No readable reservation form controls: explicit phone fallback used, no successful online flow claimed. Root and deeper service/FAQ pages timed out; accessible owner contact landing used as website. BGN amounts not converted; minimum and access/transport conditions retained."
    },
    {
      "id": "sofia-hometech-home-visits",
      "checkedOn": "2026-11-13",
      "website": "https://hometechbg.com/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://hometechbg.com/",
        "https://hometechbg.com/contacts",
        "https://hometechbg.com/services",
        "https://hometechbg.com/remont-na-peralni"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Book visit route /visit-request cache-missed; published phone fallback and explicit scheduled-home-visit service instructions reviewed instead. Full repair FAQ read. Office 10–18 hours are not home-visit availability. No successful form or numeric repair tariff claimed.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://hometechbg.com/remont-na-peralni",
        "serviceUrls": [
          "https://hometechbg.com/services",
          "https://hometechbg.com/remont-na-peralni"
        ],
        "notes": "Owner inventory, exact washing-machine service, booking instructions and contact/footer reviewed. FAQ states final price after diagnosis; no numeric service tariff in these inspected pages. Shop retail prices excluded."
      }
    },
    {
      "id": "sofia-panservice-home-appliance-visits",
      "checkedOn": "2026-11-13",
      "website": "https://panservice-bg.com/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://panservice-bg.com/",
        "https://panservice-bg.com/заявки-в-софия/",
        "https://panservice-bg.com/перални/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Actual Sofia requests entry followed to washing-machine booking/tariff, including labour heading, refusal/diagnosis, parts and charged transport notes. One mobile Sofia record despite two service bases. One base 09–19 hours not generalized to home-visit schedule."
    },
    {
      "id": "sofia-elektrotehnik-info-home-visits",
      "checkedOn": "2026-11-13",
      "website": "https://elektrotehnik.info/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://elektrotehnik.info/",
        "https://elektrotehnik.info/контакти/",
        "https://elektrotehnik.info/цени/",
        "https://elektrotehnik.info/policy/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Owner visit-request instructions, actual October-2026 fee table and privacy/contact phone reviewed. Burgas registered office not misrepresented as Sofia premises; explicit Sofia home-service coverage supports one mobile record. No guessed hours, chatbot submission or materials/VAT inference."
    },
    {
      "id": "sofia-eltablo-er-stroy-home-visits",
      "checkedOn": "2026-11-13",
      "website": "https://eltablo.bg/",
      "bookingEntry": "https://eltablo.bg/vrazka-s-firma-er-stroy-remonti-eood",
      "reviewedUrls": [
        "https://eltablo.bg/",
        "https://eltablo.bg/vrazka-s-firma-er-stroy-remonti-eood",
        "https://eltablo.bg/el-uslugi-tseni"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual owner inquiry form and full price page reviewed. General repair tariff explicitly not maintained; separately published mandatory 30 BGN diagnostic-visit fee is the only priced inventory row. Follow-up day/hour agreement explicit. Contact 09–18 has no clear weekday schedule, so hours omitted."
    },
    {
      "id": "sofia-rodgers-design-home-assembly",
      "checkedOn": "2026-11-13",
      "website": "https://rodgers-design.com/",
      "bookingEntry": "https://www.rodgers-design.com/contact.html",
      "reviewedUrls": [
        "https://rodgers-design.com/",
        "https://www.rodgers-design.com/contact.html",
        "https://rodgers-design.com/montazh-mebeli-sanitaria-sofia.html"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Owner actual Contact entry inspected on accessible www variant (non-www cache miss), then exact Sofia-2026 furniture/sanitary tariff. Home services, not retail. Starting prices preserved without parts/VAT/duration assumptions. No clock schedule published in inspected pages."
    },
    {
      "id": "sofia-rainfreshclean-home-visits",
      "checkedOn": "2026-11-13",
      "website": "https://rainfreshclean.eu/",
      "bookingEntry": "https://rainfreshclean.eu/",
      "reviewedUrls": [
        "https://rainfreshclean.eu/"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual Order modal fields, full package/service tariff, contacts and terms inspected on same substantive long owner page. Whole-object package not treated as unit price. First-party office GPS deliberately excluded because mobile Sofia service area; no structured hours found."
    },
    {
      "id": "sofia-radulov-cleaning-home-visits",
      "checkedOn": "2026-11-13",
      "website": "https://www.radulovcleaning.bg/contacti/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://www.radulovcleaning.bg/contacti/",
        "https://www.radulovcleaning.bg/pochistvane-sled-remont/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Actual Book inspection route cache-missed; owner service-page phone fallback and readable contact form inspected instead. Exact included service has explicit quote-after-free-inspection pricing section. Root and separate entrance service timed out, so accessible owner contact page is website. Office address is not a mobile visit destination.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://www.radulovcleaning.bg/pochistvane-sled-remont/",
        "serviceUrls": [
          "https://www.radulovcleaning.bg/pochistvane-sled-remont/"
        ],
        "notes": "Exact owner after-renovation page pricing section has no numeric tariff: apartments up to70 m²,70–120 m² and business areas all quoted after free inspection. Contact/form/footer reviewed. Unavailable generic pages not called reviewed."
      }
    },
    {
      "id": "sofia-voice-lab-karpuzitsa",
      "checkedOn": "2026-11-13",
      "website": "https://www.voicelab.bg/",
      "bookingEntry": "https://www.voicelab.bg/",
      "reviewedUrls": [
        "https://www.voicelab.bg/",
        "https://www.voicelab.bg/uroci-po-peene-sofia"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Followed owner Book consultation entry to the substantive singing page, then inspected actual homepage contact/appointment form and full monthly programme tariff. Only piano/vocal starter packages included, never divided into a supposed unit fee. Owner street address retained; image-only working hours and unreadable call phone not guessed."
    },
    {
      "id": "sofia-little-big-talents-otets-paisiy",
      "checkedOn": "2026-11-13",
      "website": "https://www.thelittlebigtalents.bg/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://www.thelittlebigtalents.bg/",
        "https://www.thelittlebigtalents.bg/pricing",
        "https://www.thelittlebigtalents.bg/individual-lessons/pop-jazz-singing"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Owner Book lesson/call invitation, official local phone/address, individual vocal page and full tariff reviewed. Monthly packages are whole totals. Duration range45–60 not encoded as guessed single duration. Weekday hours sourced; Saturday11–16 separately retained in record hours."
    },
    {
      "id": "sofia-bravo-center-gotse-delchev",
      "checkedOn": "2026-11-13",
      "website": "https://bravocenter.bg/",
      "bookingEntry": "https://bravocenter.bg/kontakt/",
      "reviewedUrls": [
        "https://bravocenter.bg/",
        "https://bravocenter.bg/запиши-се/",
        "https://bravocenter.bg/kontakt/",
        "https://bravocenter.bg/individualno-obuchenie-angliiski/"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual enrollment page followed first and individual service/contact details inspected. It links to owner contact form and provides local booking phone; no booking submitted. Homepage group-year promos not treated as individual price. Genuine unpublished individual tariff, not an inaccessible price-menu claim.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://bravocenter.bg/kontakt/",
        "serviceUrls": [
          "https://bravocenter.bg/individualno-obuchenie-angliiski/"
        ],
        "notes": "Owner actual enrollment instruction, individual-teaching page, contact and footer checked. These pages describe individual instruction and assessment but publish no numeric fee for that inventory; no promotion or old group tuition reused."
      }
    },
    {
      "id": "sofia-elina-lyuben-karavelov",
      "checkedOn": "2026-11-13",
      "website": "https://www.elina-av.com/lang_courses.html",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://www.elina-av.com/lang_courses.html",
        "https://www.elina-av.com/uroci_po_angliiski.html",
        "https://www.elina-av.com/contact.html"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Owner exact lesson call instruction supports appointment, not just a generic contact number. Contact page supplies actual street address and every-day09–20 schedule. No inferred duration, price, geocode, teacher-wide fee or unrelated retail material.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://www.elina-av.com/uroci_po_angliiski.html",
        "serviceUrls": [
          "https://www.elina-av.com/lang_courses.html",
          "https://www.elina-av.com/uroci_po_angliiski.html"
        ],
        "notes": "Full official language-service inventory, exact private-English lesson page, phone call invitation, contact and footer reviewed. No numeric tariff is present on these service/contact pages and no price-menu link is offered there; fees require school confirmation."
      }
    },
    {
      "id": "sofia-art-center-home-drawing",
      "checkedOn": "2026-11-13",
      "website": "https://alo372.wixsite.com/1234",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://alo372.wixsite.com/1234"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Substantive owner page inspected completely: actual phone enrollment, home visits within Sofia,60-minute tariff, minimum4/month, rebooking rule and every-day10:30–15:30 teaching window. Literal BGN not converted. Single service-area listing, not a fabricated studio address."
    },
    {
      "id": "sofia-arliz-orfey",
      "checkedOn": "2026-11-13",
      "website": "https://arliz.bg/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://arliz.bg/",
        "https://arliz.bg/individualno-obuchenie/",
        "https://arliz.bg/kontakti/",
        "https://arliz.bg/zapisvaneto-za-uchebnata-2026-2027-godina-zapochna/",
        "https://arliz.bg/obshti-uslovia/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Current owner enrollment invitation explicitly includes individual programmes and call-to-enroll; exact individual service page and actual street contact reviewed. Terms link readable but only generic site shell. No purported complete tuition tariff, individual duration, ratings or Google hours copied.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://arliz.bg/zapisvaneto-za-uchebnata-2026-2027-godina-zapochna/",
        "serviceUrls": [
          "https://arliz.bg/individualno-obuchenie/"
        ],
        "notes": "Owner2026/2027 enrollment invitation, exact individual-English programme, contact and linked terms/footer inspected. No numeric individual-lesson price or tariff link is published on the inspected programme/enrollment pages. No third-party opening hours imported."
      }
    },
    {
      "id": "sofia-accent-benkovski",
      "checkedOn": "2026-11-13",
      "website": "https://www.accentschool.net/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://www.accentschool.net/",
        "https://www.accentschool.net/uslugi/individualno-obuchenie",
        "https://www.accentschool.net/contact",
        "https://www.accentschool.net/za-nas/uchebni-bazi"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Actual individual-teaching page links application route (cache miss); official phone/central enrollment fallback and full tariff checked. Owner teaching-bases page names both real addresses and tariff expressly applies to school teaching. No staff-specific tariffs or branch hours invented; actual classroom assigned by school. Whole10-hour BGN card,5-week validity and90-minute blocks retained."
    },
    {
      "id": "sofia-accent-vitosha",
      "checkedOn": "2026-11-13",
      "website": "https://www.accentschool.net/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://www.accentschool.net/",
        "https://www.accentschool.net/uslugi/individualno-obuchenie",
        "https://www.accentschool.net/contact",
        "https://www.accentschool.net/za-nas/uchebni-bazi"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Actual individual-teaching page links application route (cache miss); official phone/central enrollment fallback and full tariff checked. Owner teaching-bases page names both real addresses and tariff expressly applies to school teaching. No staff-specific tariffs or branch hours invented; actual classroom assigned by school. Whole10-hour BGN card,5-week validity and90-minute blocks retained."
    },
    {
      "id": "sofia-avo-dondukov",
      "checkedOn": "2026-11-13",
      "website": "https://avo.bg/",
      "bookingEntry": "https://avo.bg/apply_individual?package=mini",
      "reviewedUrls": [
        "https://avo.bg/",
        "https://avo.bg/apply_individual?package=mini",
        "https://avo.bg/kursove-za-vazrastni",
        "https://avo.bg/contacts"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual individual-offer form and full service page inspected, not homepage only. All four named premises are owner-listed teaching branches/base. No particular staff, tariff or hour availability inferred for a branch: classroom/branch and schedule require confirmation. Form time choices not turned into opening hours. No form submitted; no group/exam fee reused as individual tuition.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://avo.bg/apply_individual?package=mini",
        "serviceUrls": [
          "https://avo.bg/kursove-za-vazrastni"
        ],
        "notes": "Actual official individual-training offer form fully inspected, with school-classroom option, course type, level,6/12/18-hour request, frequency and preferred time. Adult-services page and branch contacts read. No numeric price for this bespoke individual inventory; form requests an offer, not a fixed-price enrollment."
      }
    },
    {
      "id": "sofia-avo-graf-ignatiev",
      "checkedOn": "2026-11-13",
      "website": "https://avo.bg/",
      "bookingEntry": "https://avo.bg/apply_individual?package=mini",
      "reviewedUrls": [
        "https://avo.bg/",
        "https://avo.bg/apply_individual?package=mini",
        "https://avo.bg/kursove-za-vazrastni",
        "https://avo.bg/contacts"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual individual-offer form and full service page inspected, not homepage only. All four named premises are owner-listed teaching branches/base. No particular staff, tariff or hour availability inferred for a branch: classroom/branch and schedule require confirmation. Form time choices not turned into opening hours. No form submitted; no group/exam fee reused as individual tuition.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://avo.bg/apply_individual?package=mini",
        "serviceUrls": [
          "https://avo.bg/kursove-za-vazrastni"
        ],
        "notes": "Actual official individual-training offer form fully inspected, with school-classroom option, course type, level,6/12/18-hour request, frequency and preferred time. Adult-services page and branch contacts read. No numeric price for this bespoke individual inventory; form requests an offer, not a fixed-price enrollment."
      }
    },
    {
      "id": "sofia-avo-mladost",
      "checkedOn": "2026-11-13",
      "website": "https://avo.bg/",
      "bookingEntry": "https://avo.bg/apply_individual?package=mini",
      "reviewedUrls": [
        "https://avo.bg/",
        "https://avo.bg/apply_individual?package=mini",
        "https://avo.bg/kursove-za-vazrastni",
        "https://avo.bg/contacts"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual individual-offer form and full service page inspected, not homepage only. All four named premises are owner-listed teaching branches/base. No particular staff, tariff or hour availability inferred for a branch: classroom/branch and schedule require confirmation. Form time choices not turned into opening hours. No form submitted; no group/exam fee reused as individual tuition.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://avo.bg/apply_individual?package=mini",
        "serviceUrls": [
          "https://avo.bg/kursove-za-vazrastni"
        ],
        "notes": "Actual official individual-training offer form fully inspected, with school-classroom option, course type, level,6/12/18-hour request, frequency and preferred time. Adult-services page and branch contacts read. No numeric price for this bespoke individual inventory; form requests an offer, not a fixed-price enrollment."
      }
    },
    {
      "id": "sofia-avo-opalchenska",
      "checkedOn": "2026-11-13",
      "website": "https://avo.bg/",
      "bookingEntry": "https://avo.bg/apply_individual?package=mini",
      "reviewedUrls": [
        "https://avo.bg/",
        "https://avo.bg/apply_individual?package=mini",
        "https://avo.bg/kursove-za-vazrastni",
        "https://avo.bg/contacts"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual individual-offer form and full service page inspected, not homepage only. All four named premises are owner-listed teaching branches/base. No particular staff, tariff or hour availability inferred for a branch: classroom/branch and schedule require confirmation. Form time choices not turned into opening hours. No form submitted; no group/exam fee reused as individual tuition.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://avo.bg/apply_individual?package=mini",
        "serviceUrls": [
          "https://avo.bg/kursove-za-vazrastni"
        ],
        "notes": "Actual official individual-training offer form fully inspected, with school-classroom option, course type, level,6/12/18-hour request, frequency and preferred time. Adult-services page and branch contacts read. No numeric price for this bespoke individual inventory; form requests an offer, not a fixed-price enrollment."
      }
    },
    {
      "id": "sofia-booktree-dragalevtsi",
      "checkedOn": "2026-11-13",
      "website": "https://www.booktree.bg/",
      "bookingEntry": "https://www.booktree.bg/contacts/",
      "reviewedUrls": [
        "https://www.booktree.bg/",
        "https://www.booktree.bg/contacts/",
        "https://www.booktree.bg/individualno-ezikovo-obuchenie-vazratsni/",
        "https://www.booktree.bg/tseni/",
        "https://www.booktree.bg/uslovia-i-politiki/",
        "https://www.booktree.bg/obshti-uslovia-individualno-obuchenie/"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual Book/consultation entry followed to readable owner contact form, then individual-adult programme and current tariff effective01-Aug-2026. Owner homepage explicitly offers in-person individual teaching at both offices; real branch addresses verified.25EUR is per40-minute academic hour, not a package. Direct detailed terms challenged, not bypassed. Root additionally read primary indexed individual-training terms:2-hour initial deposit applied to last lessons, separately paid materials,3-hour cancellation cutoff otherwise charged, agreed teaching times. These conditions are retained. No claim to reading challenged page body or full current legal terms. Admin hours not represented as teaching hours."
    },
    {
      "id": "sofia-booktree-gotse-delchev",
      "checkedOn": "2026-11-13",
      "website": "https://www.booktree.bg/",
      "bookingEntry": "https://www.booktree.bg/contacts/",
      "reviewedUrls": [
        "https://www.booktree.bg/",
        "https://www.booktree.bg/contacts/",
        "https://www.booktree.bg/individualno-ezikovo-obuchenie-vazratsni/",
        "https://www.booktree.bg/tseni/",
        "https://www.booktree.bg/uslovia-i-politiki/",
        "https://www.booktree.bg/obshti-uslovia-individualno-obuchenie/"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "Actual Book/consultation entry followed to readable owner contact form, then individual-adult programme and current tariff effective01-Aug-2026. Owner homepage explicitly offers in-person individual teaching at both offices; real branch addresses verified.25EUR is per40-minute academic hour, not a package. Direct detailed terms challenged, not bypassed. Root additionally read primary indexed individual-training terms:2-hour initial deposit applied to last lessons, separately paid materials,3-hour cancellation cutoff otherwise charged, agreed teaching times. These conditions are retained. No claim to reading challenged page body or full current legal terms. Admin hours not represented as teaching hours."
    }
  ]
}
