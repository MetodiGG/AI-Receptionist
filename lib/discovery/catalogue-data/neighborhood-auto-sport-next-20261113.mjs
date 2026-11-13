// Manual primary-source appointment-business intake, 2026-11-13.
// Isolated draft: root reviewer assigns inventory identities and explicit integration.
export default {
  "records": [
    {
      "id": "sofia-lux-tint-shine-lavski-rid7",
      "name": "Lux Tint&Shine",
      "cityCode": "68134",
      "neighborhood": "Манастирски ливади",
      "address": "София, Манастирски ливади, ул. Лъвски рид 7",
      "locationKind": "premises",
      "coordinates": null,
      "category": "car_wash",
      "website": "https://luxtintshine.setmore.com/",
      "phone": "+359895010347",
      "services": [
        {
          "name": "Външно почистване на автомобил",
          "category": "car_wash",
          "appointmentModel": "appointment",
          "durationMin": 60,
          "durationSourceUrl": "https://luxtintshine.setmore.com/",
          "durationCheckedOn": "2026-11-13",
          "price": {
            "amount": 80,
            "currency": "BGN",
            "kind": "fixed",
            "sourceUrl": "https://luxtintshine.setmore.com/",
            "checkedOn": "2026-11-13"
          }
        },
        {
          "name": "Вътрешно почистване на автомобил",
          "category": "car_wash",
          "appointmentModel": "appointment",
          "durationMin": 120,
          "durationSourceUrl": "https://luxtintshine.setmore.com/",
          "durationCheckedOn": "2026-11-13",
          "price": {
            "amount": 180,
            "currency": "BGN",
            "kind": "fixed",
            "sourceUrl": "https://luxtintshine.setmore.com/",
            "checkedOn": "2026-11-13"
          }
        }
      ],
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "10:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "10:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "10:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "10:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "10:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": [
              {
                "open": "12:00",
                "close": "17:00"
              }
            ]
          },
          {
            "weekday": 7,
            "periods": []
          }
        ],
        "sourceUrl": "https://luxtintshine.setmore.com/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://luxtintshine.setmore.com/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://luxtintshine.setmore.com/",
          "excerpt": "Публичната страница за записване показва отделни Book услуги за външно и вътрешно почистване на автомобил."
        },
        "contact": "https://luxtintshine.setmore.com/"
      }
    },
    {
      "id": "sofia-revzone-farmapark21",
      "name": "Rev Zone Auto Moto Service",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Фармапарк 21",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://www.revzonebg.com/",
      "phone": "+359887717595",
      "services": [
        {
          "name": "Първоначална диагностика на автомобилна климатична система",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "price": {
            "amount": 35,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.revzonebg.com/services",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "08:30",
                "close": "18:30"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:30",
                "close": "18:30"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:30",
                "close": "18:30"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:30",
                "close": "18:30"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:30",
                "close": "18:30"
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
            "periods": []
          }
        ],
        "sourceUrl": "https://www.revzonebg.com/contact",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "phone",
        "phone": "+359887717595"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.revzonebg.com/contact",
          "excerpt": "Началната страница кани да се запази час по публикувания телефон; „запишете час“ води до контактната страница."
        },
        "contact": "https://www.revzonebg.com/contact"
      }
    },
    {
      "id": "sofia-ps-tuning-ovcha-kupel42",
      "name": "PS Tuning",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Овча купел 42",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://www.pstuning.net/",
      "phone": "+359886990810",
      "services": [
        {
          "name": "Машинно почистване на DPF/FAP филтър или катализатор — лек автомобил, без AdBlue",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "100 EUR за брой за обикновен DPF/FAP филтър или катализатор. Не включва DPF с AdBlue, за който има отделна тарифа. Демонтажът, монтажът и софтуерните настройки се определят отделно според сложността.",
          "price": {
            "amount": 100,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "за брой, лек автомобил",
            "sourceUrl": "https://www.pstuning.net/dpf-cleaning.html",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "10:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "10:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "10:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "10:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "10:00",
                "close": "18:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://www.pstuning.net/kontakti",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "phone",
        "phone": "+359886990810"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.pstuning.net/kontakti",
          "excerpt": "Работим само с предварително уговорен час; контактната страница публикува телефоните за уговаряне."
        },
        "contact": "https://www.pstuning.net/kontakti"
      }
    },
    {
      "id": "sofia-cars-done-gorublyane-vitosha54",
      "name": "Cars-Done",
      "cityCode": "68134",
      "neighborhood": "Горубляне",
      "address": "София, Горубляне, ул. Витоша 54",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://cars-done.com/",
      "phone": "+359895653175",
      "services": [
        {
          "name": "Ремонт на автомобилен аудио или навигационен модул",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Ремонтът на конкретния аудио/навигационен модул и цената се уточняват предварително."
        }
      ],
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "10:00",
                "close": "19:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "10:00",
                "close": "19:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "10:00",
                "close": "19:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "10:00",
                "close": "19:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "10:00",
                "close": "19:00"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": []
          },
          {
            "weekday": 7,
            "periods": []
          }
        ],
        "sourceUrl": "https://cars-done.com/contacts/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "phone",
        "phone": "+359895653175"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://cars-done.com/contacts/",
          "excerpt": "Страницата „Ремонт на модули“ изрично предлага запазване на час; контактите изискват предварително записване."
        },
        "contact": "https://cars-done.com/contacts/"
      }
    },
    {
      "id": "sofia-bultraco-honda-iztok326",
      "name": "Бултрако Honda · София Изток",
      "address": "София, бул. Ботевградско шосе 326",
      "neighborhood": null,
      "cityCode": "68134",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://www.bultraco-sofia.bg/",
      "phone": null,
      "services": [
        {
          "name": "Сервизно обслужване на автомобил Honda",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Заявката за сервизно посещение, конкретният обект и необходимото обслужване се уточняват с приемчика."
        }
      ],
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "08:30",
                "close": "17:30"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:30",
                "close": "17:30"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:30",
                "close": "17:30"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:30",
                "close": "17:30"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:30",
                "close": "17:30"
              }
            ]
          }
        ],
        "sourceUrl": "https://www.bultraco-sofia.bg/kontakti",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://www.bultraco-sofia.bg/serviz"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.bultraco-sofia.bg/serviz",
          "excerpt": "Публичната форма „Резервирай час в сервиза“ е публикувана под двата действителни софийски сервизни адреса."
        },
        "contact": "https://www.bultraco-sofia.bg/kontakti"
      }
    },
    {
      "id": "sofia-bultraco-honda-astreco40",
      "name": "Бултрако Honda · Астреко център",
      "address": "София, Нова Враждебна, ул. Челопешко шосе 40",
      "neighborhood": "Нова Враждебна",
      "cityCode": "68134",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://www.bultraco-sofia.bg/",
      "phone": null,
      "services": [
        {
          "name": "Сервизно обслужване на автомобил Honda",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Заявката за сервизно посещение, конкретният обект и необходимото обслужване се уточняват с приемчика."
        }
      ],
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "08:30",
                "close": "17:30"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:30",
                "close": "17:30"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:30",
                "close": "17:30"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:30",
                "close": "17:30"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:30",
                "close": "17:30"
              }
            ]
          }
        ],
        "sourceUrl": "https://www.bultraco-sofia.bg/kontakti",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://www.bultraco-sofia.bg/serviz"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.bultraco-sofia.bg/serviz",
          "excerpt": "Публичната форма „Резервирай час в сервиза“ е публикувана под двата действителни софийски сервизни адреса."
        },
        "contact": "https://www.bultraco-sofia.bg/kontakti"
      }
    },
    {
      "id": "sofia-vip-service-mladost1-malinov36",
      "name": "VIP Service",
      "cityCode": "68134",
      "neighborhood": "Младост 1",
      "address": "София, Младост 1, бул. Александър Малинов 36",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://vipservice-bg.com/",
      "phone": "+359885348093",
      "services": [
        {
          "name": "Годишен технически преглед на лек автомобил",
          "category": "auto_repair",
          "appointmentModel": "appointment"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://vipservice-bg.com/%d0%b7%d0%b0-%d0%ba%d0%be%d0%bd%d1%82%d0%b0%d0%ba%d1%82%d0%b8/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://vipservice-bg.com/",
          "excerpt": "За годишни технически прегледи е желателно предварително записване; формата съдържа желана дата и час за ГТП."
        },
        "contact": "https://vipservice-bg.com/%d0%b7%d0%b0-%d0%ba%d0%be%d0%bd%d1%82%d0%b0%d0%ba%d1%82%d0%b8/"
      }
    },
    {
      "id": "sofia-golden-fitbody-ar-studio",
      "name": "Golden FitBody · AR Studio",
      "cityCode": "68134",
      "neighborhood": "Манастирски ливади",
      "address": "София, Манастирски ливади — изток, бл. 178, вх. А",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://goldenfitbody.bg/ar-studio",
      "phone": "+359899768499",
      "services": [
        {
          "name": "EMS тренировка DUO — единично посещение за един човек",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "DUO е тренировка за двама; 29,10 EUR е за един човек. При приложим PRO костюм цената се увеличава с 10%. Денят и часът се уговарят с треньор.",
          "price": {
            "amount": 29.1,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "за един човек при DUO за двама",
            "sourceUrl": "https://goldenfitbody.bg/pricing",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359899768499"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://goldenfitbody.bg/ar-studio",
          "excerpt": "Обектът изисква предварително записване и публикува собствен телефон за уговаряне; онлайн пътят е само за пакети."
        },
        "contact": "https://goldenfitbody.bg/ar-studio"
      }
    },
    {
      "id": "sofia-dobsikauto-aleksandar-ekzarh11",
      "name": "Добсик Ауто",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Александър Екзарх 11",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://dobsikauto.bg/",
      "phone": "+359899999340",
      "services": [
        {
          "name": "Компютърна диагностика на автомобилен двигател",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Прочитане на грешки и анализ на живите данни; посещението се потвърждава от сервиза след заявката."
        }
      ],
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
            "periods": [
              {
                "open": "09:00",
                "close": "14:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://dobsikauto.bg/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://dobsikauto.bg/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://dobsikauto.bg/",
          "excerpt": "За запазване на час се обадете или попълнете формата; сервизът се свързва за потвърждение."
        },
        "contact": "https://dobsikauto.bg/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-lux-tint-shine-lavski-rid7",
      "checkedOn": "2026-11-13",
      "website": "https://luxtintshine.setmore.com/",
      "bookingEntry": "https://luxtintshine.setmore.com/",
      "bookingReview": "provider_booking_reviewed",
      "reviewedUrls": [
        "https://luxtintshine.setmore.com/"
      ],
      "notes": "Read the merchant-owned public Setmore booking menu, exact service names, literal BGN amounts and durations, full venue address/contact and seven-day opening schedule. Selected staffed exterior/interior cleaning only, not self-service washing, promotions or retail. Service Book links were followed but the web reader returned cache-miss for the deeper staff/date chooser; the public priced service menu itself was readable and no availability, slot or successful booking is claimed. Booking-policy link returned this same public page. No photos, reviews, coordinates, account data or reservation actions used."
    },
    {
      "id": "sofia-revzone-farmapark21",
      "checkedOn": "2026-11-13",
      "website": "https://www.revzonebg.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://www.revzonebg.com/",
        "https://www.revzonebg.com/contact",
        "https://www.revzonebg.com/services"
      ],
      "notes": "Followed the owner's actual book-appointment link from the services page to Contact, then reviewed the complete service/tariff and contact pages. Initial air-conditioning-system diagnosis is explicitly 35 EUR; refrigerant quantities, vehicle rental and retail were not imported. Owner contact supplies Farmapark21, phone, weekday hours, Saturday only by arrangement and Sunday closed. No geographic quarter or coordinate was inferred."
    },
    {
      "id": "sofia-ps-tuning-ovcha-kupel42",
      "checkedOn": "2026-11-13",
      "website": "https://www.pstuning.net/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://www.pstuning.net/",
        "https://www.pstuning.net/kontakti",
        "https://www.pstuning.net/dpf-cleaning.html"
      ],
      "notes": "Read the actual owner booking instruction in Contacts, followed Services to the separate machine-cleaning page and inspected its complete tariff by vehicle/type. Selected legal physical DPF/FAP/catalyst cleaning for one passenger-car component at100EUR; dismantling, fitting and software settings are separately assessed by complexity and stated publicly in the description. Excluded emission-system removal, defeat services, tuning and national mobile-station cloning. Owner publishes exact OvchaKupel42 venue, phone and weekday hours."
    },
    {
      "id": "sofia-cars-done-gorublyane-vitosha54",
      "checkedOn": "2026-11-13",
      "website": "https://cars-done.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://cars-done.com/",
        "https://cars-done.com/contacts/",
        "https://cars-done.com/%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8/",
        "https://cars-done.com/%D1%80%D0%B5%D0%BC%D0%BE%D0%BD%D1%82-%D0%BD%D0%B0-%D0%BC%D0%BE%D0%B4%D1%83%D0%BB%D0%B8/"
      ],
      "notes": "Followed the module-repair page's actual Reserve-appointment entry to the owner Contact page, also read the complete Services and module list. The selected audio/navigation-module repair has no numeric service tariff in those reviewed booking/service pages; the separate shop contains retail products, not a repair-visit tariff. Exact present GorublyaneVitosha54 address and Ivo's contact phone were read in Contacts, with working hours. Generic retail terms also list an older registered address, not imported as a branch. Excluded anti-theft bypass, emissions defeat and unrelated software services.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://cars-done.com/contacts/",
        "serviceUrls": [
          "https://cars-done.com/%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8/",
          "https://cars-done.com/%D1%80%D0%B5%D0%BC%D0%BE%D0%BD%D1%82-%D0%BD%D0%B0-%D0%BC%D0%BE%D0%B4%D1%83%D0%BB%D0%B8/"
        ],
        "notes": "Followed the module-repair page's actual Reserve-appointment entry to the owner Contact page, also read the complete Services and module list. The selected audio/navigation-module repair has no numeric service tariff in those reviewed booking/service pages; the separate shop contains retail products, not a repair-visit tariff. Exact present GorublyaneVitosha54 address and Ivo's contact phone were read in Contacts, with working hours. Generic retail terms also list an older registered address, not imported as a branch. Excluded anti-theft bypass, emissions defeat and unrelated software services."
      }
    },
    {
      "id": "sofia-bultraco-honda-iztok326",
      "checkedOn": "2026-11-13",
      "website": "https://www.bultraco-sofia.bg/",
      "bookingEntry": "https://www.bultraco-sofia.bg/serviz",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://www.bultraco-sofia.bg/",
        "https://www.bultraco-sofia.bg/serviz",
        "https://www.bultraco-sofia.bg/kontakti"
      ],
      "notes": "Followed and read the owner's actual Reserve-service-appointment form (name, phone, email, Honda model and vehicle details), then the full service-programme and exact branch Contacts sections. This is a request for an arranged workshop visit, not a confirmed slot; branch and scope must be agreed with the dealer. No numeric maintenance-visit tariff is published in those inspected booking/services/contact pages. The numeric extended-warranty table is a different product and was not copied as a workshop fee. This exact branch is explicitly identified as a car service, not only a showroom. Service hours are Mon–Fri08:30–17:30; showroom Saturday hours were excluded. Only short service dial codes were published, so no fabricated international phone is supplied.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://www.bultraco-sofia.bg/serviz",
        "serviceUrls": [
          "https://www.bultraco-sofia.bg/serviz"
        ],
        "notes": "Followed and read the owner's actual Reserve-service-appointment form (name, phone, email, Honda model and vehicle details), then the full service-programme and exact branch Contacts sections. This is a request for an arranged workshop visit, not a confirmed slot; branch and scope must be agreed with the dealer. No numeric maintenance-visit tariff is published in those inspected booking/services/contact pages. The numeric extended-warranty table is a different product and was not copied as a workshop fee. This exact branch is explicitly identified as a car service, not only a showroom. Service hours are Mon–Fri08:30–17:30; showroom Saturday hours were excluded. Only short service dial codes were published, so no fabricated international phone is supplied."
      }
    },
    {
      "id": "sofia-bultraco-honda-astreco40",
      "checkedOn": "2026-11-13",
      "website": "https://www.bultraco-sofia.bg/",
      "bookingEntry": "https://www.bultraco-sofia.bg/serviz",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://www.bultraco-sofia.bg/",
        "https://www.bultraco-sofia.bg/serviz",
        "https://www.bultraco-sofia.bg/kontakti"
      ],
      "notes": "Followed and read the owner's actual Reserve-service-appointment form (name, phone, email, Honda model and vehicle details), then the full service-programme and exact branch Contacts sections. This is a request for an arranged workshop visit, not a confirmed slot; branch and scope must be agreed with the dealer. No numeric maintenance-visit tariff is published in those inspected booking/services/contact pages. The numeric extended-warranty table is a different product and was not copied as a workshop fee. This exact branch is explicitly identified as a car service, not only a showroom. Service hours are Mon–Fri08:30–17:30; showroom Saturday hours were excluded. Only short service dial codes were published, so no fabricated international phone is supplied.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://www.bultraco-sofia.bg/serviz",
        "serviceUrls": [
          "https://www.bultraco-sofia.bg/serviz"
        ],
        "notes": "Followed and read the owner's actual Reserve-service-appointment form (name, phone, email, Honda model and vehicle details), then the full service-programme and exact branch Contacts sections. This is a request for an arranged workshop visit, not a confirmed slot; branch and scope must be agreed with the dealer. No numeric maintenance-visit tariff is published in those inspected booking/services/contact pages. The numeric extended-warranty table is a different product and was not copied as a workshop fee. This exact branch is explicitly identified as a car service, not only a showroom. Service hours are Mon–Fri08:30–17:30; showroom Saturday hours were excluded. Only short service dial codes were published, so no fabricated international phone is supplied."
      }
    },
    {
      "id": "sofia-vip-service-mladost1-malinov36",
      "checkedOn": "2026-11-13",
      "website": "https://vipservice-bg.com/",
      "bookingEntry": "https://vipservice-bg.com/%d0%b7%d0%b0-%d0%ba%d0%be%d0%bd%d1%82%d0%b0%d0%ba%d1%82%d0%b8/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://vipservice-bg.com/",
        "https://vipservice-bg.com/%d0%b7%d0%b0-%d0%ba%d0%be%d0%bd%d1%82%d0%b0%d0%ba%d1%82%d0%b8/",
        "https://vipservice-bg.com/%d1%83%d1%81%d0%bb%d1%83%d0%b3%d0%b8/"
      ],
      "notes": "Read the homepage's explicit advance-appointment FAQ, followed the actual Request-an-offer/contact form and inspected its service selection, vehicle fields and GTP desired date/time fields; read the complete Services and Contacts pages by ordinary public GET after the web reader timed out. Selected GTP only. No numeric GTP fee was published in those reviewed pages, and no separate Prices menu was offered. This is a staffed real Mladost1 workshop and GTP venue with published phones/address, not a self-service wash. Opening hours are omitted because general contact hours and the FAQ's last bookable GTP times are different concepts. No request, personal data or reservation was submitted.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://vipservice-bg.com/%d0%b7%d0%b0-%d0%ba%d0%be%d0%bd%d1%82%d0%b0%d0%ba%d1%82%d0%b8/",
        "serviceUrls": [
          "https://vipservice-bg.com/%d1%83%d1%81%d0%bb%d1%83%d0%b3%d0%b8/"
        ],
        "notes": "Read the homepage's explicit advance-appointment FAQ, followed the actual Request-an-offer/contact form and inspected its service selection, vehicle fields and GTP desired date/time fields; read the complete Services and Contacts pages by ordinary public GET after the web reader timed out. Selected GTP only. No numeric GTP fee was published in those reviewed pages, and no separate Prices menu was offered. This is a staffed real Mladost1 workshop and GTP venue with published phones/address, not a self-service wash. Opening hours are omitted because general contact hours and the FAQ's last bookable GTP times are different concepts. No request, personal data or reservation was submitted."
      }
    },
    {
      "id": "sofia-golden-fitbody-ar-studio",
      "checkedOn": "2026-11-13",
      "website": "https://goldenfitbody.bg/ar-studio",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://goldenfitbody.bg/ar-studio",
        "https://goldenfitbody.bg/locations",
        "https://goldenfitbody.bg/promo",
        "https://goldenfitbody.bg/4",
        "https://goldenfitbody.bg/pricing"
      ],
      "notes": "Owner public JavaScript pages were independently rendered by root's browser reviewer: exact AR Studio venue and phone, EMS service and FAQ requiring advance booking were read. Actual Book CTA led through /promo to /4 public checkout; it explicitly says the trainer calls to arrange the chosen studio, day and time, and no submission was made. The pricing page explicitly selects Sofia city, not one branch, and the displayed DUO single EMS visit is29.10EUR per person for two clients. SOLO control did not change the displayed DUO tariff, so no SOLO fee is claimed. Package and promotional totals were excluded. Public pricing FAQ adds10percent where PRO suit applies, stated in public description. Hours omitted because branch detail and generic locations hours conflict. No coordinate, Google content, availability or booking action used. Regular single-visit DUO has no independently configured direct online form: the reviewed /promo→/4 path sells packages, so the listing honestly uses AR Studio's published contact phone to arrange advance-booked training instead of misdirecting a single-visit customer to a package purchase. Appointment requirement and contact are a contextual summary, not a verbatim telephone CTA."
    },
    {
      "id": "sofia-dobsikauto-aleksandar-ekzarh11",
      "checkedOn": "2026-11-13",
      "website": "https://dobsikauto.bg/",
      "bookingEntry": "https://dobsikauto.bg/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://dobsikauto.bg/",
        "https://dobsikauto.bg/?page_id=4562"
      ],
      "notes": "Followed the owner's actual Book-entry to the on-page appointment enquiry form with customer, vehicle, preferred date and time fields; it states the workshop will call to confirm. Read full home/contact/footer and selected engine-computer-diagnosis page by ordinary public GET after a web-reader timeout. No numeric diagnostic tariff is published on those accessible public booking and service pages, and the navigation has no separate service-price page; retail tyre/oil products were not treated as repair fees. Selected only fault diagnosis/live-data inspection, excluding the page's unrelated safety-system deactivation offers. Exact AleksandarEkzarh11 address, phone and weekday/Saturday hours read; quarter left null because owner alternates Slatina/SuhataReka. No coordinates, fixed duration or slot inferred.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://dobsikauto.bg/",
        "serviceUrls": [
          "https://dobsikauto.bg/?page_id=4562"
        ],
        "notes": "Followed the owner's actual Book-entry to the on-page appointment enquiry form with customer, vehicle, preferred date and time fields; it states the workshop will call to confirm. Read full home/contact/footer and selected engine-computer-diagnosis page by ordinary public GET after a web-reader timeout. No numeric diagnostic tariff is published on those accessible public booking and service pages, and the navigation has no separate service-price page; retail tyre/oil products were not treated as repair fees. Selected only fault diagnosis/live-data inspection, excluding the page's unrelated safety-system deactivation offers. Exact AleksandarEkzarh11 address, phone and weekday/Saturday hours read; quarter left null because owner alternates Slatina/SuhataReka. No coordinates, fixed duration or slot inferred."
      }
    }
  ]
}
