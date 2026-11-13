// Manual primary-source Sofia appointment-business intake; researched 2026-11-13.
// Frozen primary-source intake: 20 businesses / 23 services. Root owns integration and fingerprints.
export default {
  "records": [
    {
      "id": "sofia-abc-fight-club-vasil-levski",
      "name": "ABC Fight Club · Национален стадион Васил Левски",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Евлоги и Христо Георгиеви 38, Национален стадион Васил Левски, сектор Г, вход 26, зала 6Г",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://www.abcfight.com/",
      "phone": "+359879636314",
      "services": [
        {
          "name": "Групов кикбокс за деца 10–16 г. с Калин Мирчев",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Групова тренировка за деца 10–16 г., начинаещи или напреднали. Необходима е обявената от клуба защитна екипировка; записването е през графика на клуба.",
          "price": {
            "amount": 15,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "една групова тренировка за дете 10–16 г.",
            "sourceUrl": "https://abc-fight-club.portal.1club.ai/classes/kikboks-2026-11-16-0800",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          },
          "durationMin": 60,
          "durationSourceUrl": "https://abc-fight-club.portal.1club.ai/classes/kikboks-2026-11-16-0800",
          "durationCheckedOn": "2026-11-13"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://abc-fight-club.portal.1club.ai/classes"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.abcfight.com/",
          "excerpt": "Собственият „Запиши час“ води към клубния портал с групови тренировки и реални предстоящи класове по кикбокс."
        },
        "contact": "https://www.abcfight.com/trenirovki/kikboks/zali-kikboks/kikboks-na-stadion-vasil-levski/grupa-po-kikboks-za-deca-s-kalin-mirchev"
      }
    },
    {
      "id": "sofia-pri-dancho-sinanishko22",
      "name": "Автосервиз при Данчо",
      "cityCode": "68134",
      "neighborhood": "Манастирски ливади",
      "address": "София, Манастирски ливади, ул. Синанишко езеро 22",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://autoservizdancho.com/",
      "phone": "+359884224882",
      "services": [
        {
          "name": "Диагностика на автомобил",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Диагностиката и посещението се уговарят предварително със сервиза."
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359884224882"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://autoservizdancho.com/services/",
          "excerpt": "Страницата с услуги кани да се свържете за телефонна консултация или запазване на час; публикуван е телефонът на обекта."
        },
        "contact": "https://autoservizdancho.com/contact/"
      }
    },
    {
      "id": "sofia-auto-atelier-simeonovsko95",
      "name": "Ауто Ателие",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Симеоновско шосе 95",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://auto-atelier.bg/",
      "phone": "+359889852448",
      "services": [
        {
          "name": "Компютърна диагностика на автомобилни електронни системи",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Диагностиката и необходимият ремонт се уточняват с екипа след заявка за посещение."
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
                "open": "10:00",
                "close": "14:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://auto-atelier.bg/contact/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://auto-atelier.bg/contact/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://auto-atelier.bg/contact/",
          "excerpt": "„Запишете час“ води до контактната страница, която изрично предлага уговаряне на преглед или ремонт и форма за заявка."
        },
        "contact": "https://auto-atelier.bg/contact/"
      }
    },
    {
      "id": "sofia-climbnsa-private-studentski-grad",
      "name": "Клуб по катерене и алпинизъм НСА",
      "cityCode": "68134",
      "neighborhood": "Студентски град",
      "address": "София, Студентски град, Спортен комплекс на НСА Васил Левски, зала Спортно катерене",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://climbnsa.com/",
      "phone": "+359887780007",
      "services": [
        {
          "name": "Индивидуална тренировка по катерене с инструктор",
          "category": "fitness",
          "appointmentModel": "individual_training",
          "description": "23 EUR включва инструктор, екипировка и такса за залата. Застраховката не е включена. Часът се уговаря предварително.",
          "price": {
            "amount": 23,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "една индивидуална тренировка",
            "sourceUrl": "https://climbnsa.com/%D1%86%D0%B5%D0%BD%D0%B8-%D0%B8-%D0%B0%D0%B4%D1%80%D0%B5%D1%81/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://climbnsa.com/%D1%82%D0%B5%D1%81%D1%82/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://climbnsa.com/%D0%BA%D1%83%D1%80%D1%81%D0%BE%D0%B2%D0%B5-%D0%BF%D0%BE-%D0%BA%D0%B0%D1%82%D0%B5%D1%80%D0%B5%D0%BD%D0%B5/kidsclimb/",
          "excerpt": "Собственият „Запиши се на тренировка“ отваря публична форма; индивидуалните занимания изискват предварително уточняване на часа."
        },
        "contact": "https://climbnsa.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82/"
      }
    },
    {
      "id": "sofia-ananda-yoga-yoan-ekzarh10",
      "name": "Център Ананда · йога",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Йоан Екзарх 10, партер и ет. 1",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://ananda-bg.com/",
      "phone": "+359896820769",
      "services": [
        {
          "name": "Йога практика — единично групово посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "price": {
            "amount": 13,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно посещение",
            "sourceUrl": "https://ananda-bg.com/%D0%B9%D0%BE%D0%B3%D0%B0/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        },
        {
          "name": "Индивидуално обучение по йога",
          "category": "fitness",
          "appointmentModel": "individual_training",
          "description": "Публикуваната тарифа е 35 EUR за час индивидуално обучение, не месечен абонамент.",
          "price": {
            "amount": 35,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "за час индивидуално обучение",
            "sourceUrl": "https://ananda-bg.com/%D0%B9%D0%BE%D0%B3%D0%B0/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359896820769"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://ananda-bg.com/",
          "excerpt": "Всички занимания са с предварително записване; собственият сайт публикува телефоните на центъра за уговаряне."
        },
        "contact": "https://ananda-bg.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/"
      }
    },
    {
      "id": "sofia-swami-dev-murti-pobeda1",
      "name": "Йога център Свами Дев Мурти",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Победа 1, партер, Victory Apartments",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://swamidevmurti.com/",
      "phone": "+359896608607",
      "services": [
        {
          "name": "Йога за начинаещи — есен 2026, едно посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Едно посещение от курса 25.09–18.12.2026: 10 EUR при плащане на всяко занятие. За пенсионери има отделна тарифа 5 EUR; целият курс не е единично посещение.",
          "price": {
            "amount": 10,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "за посещение, обща тарифа",
            "sourceUrl": "https://swamidevmurti.com/2026/09/07/%D0%B9%D0%BE%D0%B3%D0%B0-%D0%BA%D1%83%D1%80%D1%81-%D0%B7%D0%B0-%D0%BD%D0%B0%D1%87%D0%B8%D0%BD%D0%B0%D0%B5%D1%89%D0%B8-%D0%B2-%D0%BA%D0%BB%D1%83%D0%B1-%D1%81%D0%B2%D0%B0%D0%BC%D0%B8-%D0%B4/",
            "checkedOn": "2026-11-13",
            "validUntil": "2026-12-18"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359896608607"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2026-12-18",
        "booking": {
          "url": "https://swamidevmurti.com/2026/09/07/%D0%B9%D0%BE%D0%B3%D0%B0-%D0%BA%D1%83%D1%80%D1%81-%D0%B7%D0%B0-%D0%BD%D0%B0%D1%87%D0%B8%D0%BD%D0%B0%D0%B5%D1%89%D0%B8-%D0%B2-%D0%BA%D0%BB%D1%83%D0%B1-%D1%81%D0%B2%D0%B0%D0%BC%D0%B8-%D0%B4/",
          "excerpt": "Секцията „Как да се запиша?“ предлага официалната форма или телефон на Фидана Странска за записване за курса."
        },
        "contact": "https://swamidevmurti.com/2026/09/07/%D0%B9%D0%BE%D0%B3%D0%B0-%D0%BA%D1%83%D1%80%D1%81-%D0%B7%D0%B0-%D0%BD%D0%B0%D1%87%D0%B8%D0%BD%D0%B0%D0%B5%D1%89%D0%B8-%D0%B2-%D0%BA%D0%BB%D1%83%D0%B1-%D1%81%D0%B2%D0%B0%D0%BC%D0%B8-%D0%B4/"
      }
    },
    {
      "id": "sofia-ddauto-lyulin-dertliev57",
      "name": "D&D Auto Service · Люлин",
      "cityCode": "68134",
      "neighborhood": "Люлин",
      "address": "София, Люлин, бул. Д-р Петър Дертлиев 57",
      "locationKind": "premises",
      "coordinates": null,
      "category": "detailing",
      "website": "https://ddauto.bg/",
      "phone": "+359884884004",
      "services": [
        {
          "name": "Полиране и лакиране NORM FIX — един фар",
          "category": "detailing",
          "appointmentModel": "appointment",
          "description": "35 EUR за един фар по варианта NORM FIX с ДДС. Според размера, състоянието и трудността цената може да се промени след предварителен оглед; не е окончателна оферта.",
          "price": {
            "amount": 35,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "за един фар, NORM FIX",
            "sourceUrl": "https://ddauto.bg/services/polirane-na-farove-pastirane-lakirane/",
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
                "open": "08:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:00",
                "close": "18:00"
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
        "sourceUrl": "https://ddauto.bg/contact-us/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://ddauto.bg/contact-us/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://ddauto.bg/contact-us/",
          "excerpt": "Собствената контактна форма има „Искам да запазя час“, дата, час, услуга и задължителен избор на сервиз D&D Люлин."
        },
        "contact": "https://ddauto.bg/contact-us/"
      }
    },
    {
      "id": "sofia-kamen-auto77-tsarigradsko387",
      "name": "Камен Ауто 77",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Цариградско шосе 387, Стопански двор Врана",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://www.avtoservizbg.com/",
      "phone": "+359899356683",
      "services": [
        {
          "name": "Ремонт на автомобилна спирачна система",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Ремонтът се планира след телефонна уговорка и съгласувана оферта; услугата за вземане и връщане се уточнява отделно."
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359899356683"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.avtoservizbg.com/vzima_popravia_vryshta_kolata.html",
          "excerpt": "Собственият описан ред е предварително уговаряне и записване на час по телефона, диагностика и ремонт след съгласувана оферта."
        },
        "contact": "https://www.avtoservizbg.com/"
      }
    },
    {
      "id": "sofia-studio7-dobrudzha1-group",
      "name": "Studio 7 · Добруджа 1",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Добруджа 1",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://studio7.bg/",
      "phone": "+359878840369",
      "services": [
        {
          "name": "Пакет 7 групови тренировки — пилатес мат, люлка или функционална",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Карта за общо 7 групови тренировки в рамките на 2 месеца, в група до 4 души, само на ул. Добруджа 1. Публикуваните 140 EUR са цялата сума за пакета, платима при стартиране, не цена за едно посещение. Часовете се уговарят предварително; отменянето е според условията на студиото.",
          "price": {
            "amount": 140,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "пакет 7 групови тренировки за 2 месеца",
            "sourceUrl": "https://studio7.bg/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359878840369"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://studio7.bg/",
          "excerpt": "Груповите занимания са само в Studio 7 на ул. Добруджа 1, с предварително записване; обадете се за уговаряне."
        },
        "contact": "https://studio7.bg/contact-us/"
      }
    },
    {
      "id": "sofia-vaklinov-sin-orlandovtsi",
      "name": "Ваклинов & Син · ГТП",
      "cityCode": "68134",
      "neighborhood": "Орландовци",
      "address": "София, Орландовци, ул. Първа Българска армия 107",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://vaklinovsin.com/",
      "phone": "+359893741055",
      "services": [
        {
          "name": "Годишен технически преглед — лек автомобил",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "ГТП за лек автомобил с предварителна онлайн заявка. Публикуваната цена е базова и ориентировъчна, от 51 EUR с включен ДДС; точната сума се уточнява с пункта. Не е цената от 46 EUR за ремарке.",
          "price": {
            "amount": 51,
            "currency": "EUR",
            "kind": "from",
            "unit": "ГТП на лек автомобил, с ДДС",
            "sourceUrl": "https://vaklinovsin.com/tseni/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://vaklinovsin.com/zapazvane/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://vaklinovsin.com/",
          "excerpt": "ГТП страницата приканва към онлайн записване; действителната форма за ГТП на същия пункт е /zapazvane/."
        },
        "contact": "https://vaklinovsin.com/zapazvane/"
      }
    },
    {
      "id": "sofia-calma-azul-tintyava84",
      "name": "Calma Yoga Studio · Azul",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Тинтява 84",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://calmayogastudio.net/",
      "phone": "+359888948743",
      "services": [
        {
          "name": "Групов пилатес — еднократно посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "durationMin": 60,
          "description": "Групов пилатес с предварително запазване на място в графика на конкретното студио. Посочена е редовната цена за едно посещение без карта; намаленията за деца и пенсионери не са приложени. Графикът и свободните места се проверяват при записване.",
          "price": {
            "amount": 11.8,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно редовно посещение без карта",
            "sourceUrl": "https://calmayogastudio.net/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          },
          "durationSourceUrl": "https://book.calmayogastudio.net/calendar/public?site_id=1",
          "durationCheckedOn": "2026-11-13"
        }
      ],
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "08:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:00",
                "close": "21:00"
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
        "sourceUrl": "https://calmayogastudio.net/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://book.calmayogastudio.net/calendar/public?site_id=1"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://calmayogastudio.net/",
          "excerpt": "Официалният линк ГРАФИК AZUL води към отделния календар на това студио с реални класове и Запази място."
        },
        "contact": "https://calmayogastudio.net/"
      }
    },
    {
      "id": "sofia-calma-verde-yana-yazova16",
      "name": "Calma Yoga Studio · Verde",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Яна Язова 16",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://calmayogastudio.net/",
      "phone": "+359888948743",
      "services": [
        {
          "name": "Групов пилатес — еднократно посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "durationMin": 60,
          "description": "Групов пилатес с предварително запазване на място в графика на конкретното студио. Посочена е редовната цена за едно посещение без карта; намаленията за деца и пенсионери не са приложени. Графикът и свободните места се проверяват при записване.",
          "price": {
            "amount": 11.8,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно редовно посещение без карта",
            "sourceUrl": "https://calmayogastudio.net/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          },
          "durationSourceUrl": "https://book.calmayogastudio.net/calendar/public?site_id=2",
          "durationCheckedOn": "2026-11-13"
        }
      ],
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "08:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:00",
                "close": "21:00"
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
        "sourceUrl": "https://calmayogastudio.net/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://book.calmayogastudio.net/calendar/public?site_id=2"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://calmayogastudio.net/",
          "excerpt": "Официалният линк ГРАФИК VERDE води към отделния календар на това студио с реални класове и Запази място."
        },
        "contact": "https://calmayogastudio.net/"
      }
    },
    {
      "id": "sofia-carve-indoor-ski-kosta-lulchev52",
      "name": "CARVE · ски и сноуборд на закрито",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Коста Лулчев 52",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://carve.bg/",
      "phone": "+359894881664",
      "services": [
        {
          "name": "Ски на закрито — групова тренировка за възрастен след първо посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "durationMin": 60,
          "durationSourceUrl": "https://carve.bg/ceni/",
          "durationCheckedOn": "2026-11-13",
          "description": "За възрастен в група до трима на близко ниво, след първото посещение. Един час включва 30 минути каране с почивки; екипировката и инструкторът са включени. Не е първа пробна тренировка. При късна отмяна/неявяване се прилага правилникът.",
          "price": {
            "amount": 32,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "1 час групова ски тренировка, възрастен след първо посещение",
            "sourceUrl": "https://carve.bg/ceni/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        },
        {
          "name": "Ски на закрито — индивидуална тренировка за възрастен",
          "category": "fitness",
          "appointmentModel": "individual_training",
          "durationMin": 60,
          "durationSourceUrl": "https://carve.bg/ceni/",
          "durationCheckedOn": "2026-11-13",
          "description": "За възрастен, самостоятелно на пистата с инструктор по избор. Часът включва 30 минути каране с почивки, екипировка и инструктор. При отмяна под 24 часа или неявяване се начислява отделна такса съгласно правилника.",
          "price": {
            "amount": 49.15,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "1 час индивидуална ски тренировка за възрастен",
            "sourceUrl": "https://carve.bg/ceni/",
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
                "open": "08:00",
                "close": "22:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:00",
                "close": "22:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:00",
                "close": "22:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:00",
                "close": "22:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:00",
                "close": "22:00"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": [
              {
                "open": "09:00",
                "close": "22:00"
              }
            ]
          },
          {
            "weekday": 7,
            "periods": [
              {
                "open": "09:00",
                "close": "22:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://carve.bg/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://carve.bg/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://carve.bg/",
          "excerpt": "Публичната собствена форма „Запази час“ предлага вид спорт, групова/индивидуална тренировка, възраст, ден, час и контакт; екипът потвърждава заявката."
        },
        "contact": "https://carve.bg/"
      }
    },
    {
      "id": "sofia-nikal-kondakov5",
      "name": "Автосервиз НикАл",
      "cityCode": "68134",
      "neighborhood": "Дружба 2",
      "address": "София, Дружба 2, ул. Капитан Любен Кондаков 5",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://nikal-autoservice.bg/",
      "phone": "+359889893635",
      "services": [
        {
          "name": "Сезонна смяна и баланс на автомобилни гуми",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Смяна на летни или зимни гуми и баланс след предварително записване. Конкретният обхват и оферта се уточняват със сервиза."
        }
      ],
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "08:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:00",
                "close": "18:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://nikal-autoservice.bg/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "phone",
        "phone": "+359889893635"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://nikal-autoservice.bg/%D1%81%D0%BC%D1%8F%D0%BD%D0%B0-%D0%BD%D0%B0-%D0%B3%D1%83%D0%BC%D0%B8/",
          "excerpt": "Собствената страница за гуми изрично посочва телефона и контактната форма за записване на час за смяна на гуми и получаване на оферта."
        },
        "contact": "https://nikal-autoservice.bg/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/"
      }
    },
    {
      "id": "sofia-automechanicgroup-gtp-slivnitsa102",
      "name": "Auto Mechanic Group · ГТП Сливница 102",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Сливница 102",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://gtp.automechanicgroup.bg/",
      "phone": "+359888143222",
      "services": [
        {
          "name": "Годишен технически преглед — лек автомобил",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "ГТП на лек автомобил след онлайн заявка за ден и час. Заявката подлежи на потвърждение от администратор; цената се уточнява с пункта."
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
          }
        ],
        "sourceUrl": "https://gtp.automechanicgroup.bg/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://gtp.automechanicgroup.bg/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://gtp.automechanicgroup.bg/",
          "excerpt": "От собствения основен сайт ГТП води към отделната публична страница на пункт Сливница 102 с календар и форма за заявка, потвърждавана от администратор."
        },
        "contact": "https://gtp.automechanicgroup.bg/"
      }
    },
    {
      "id": "sofia-the-pilates-space-cherkovna3",
      "name": "The Pilates Space",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Черковна 3",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://thepilatesspace.bg/",
      "phone": "+359887601167",
      "services": [
        {
          "name": "Групов пилатес реформър — еднократно посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Редовна цена за едно посещение с предварителна резервация. Плаща се преди тренировката; отказ до 12 часа предварително, иначе се начислява пълната такса. Първото посещение на нов клиент има отделно намаление, което тук не е приложено.",
          "price": {
            "amount": 20,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно редовно посещение",
            "sourceUrl": "https://thepilatesspace.bg/tsenorazpis/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          },
          "durationMin": 50,
          "durationSourceUrl": "https://book.thepilatesspace.bg/calendar/public",
          "durationCheckedOn": "2026-11-13"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://book.thepilatesspace.bg/calendar/public"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://thepilatesspace.bg/",
          "excerpt": "Официалният Запази час води към реалния публичен календар The Pilates Space с потвърдени класове реформър на същия адрес."
        },
        "contact": "https://thepilatesspace.bg/kontakti/"
      }
    },
    {
      "id": "sofia-meguin-obikolna34",
      "name": "Автосервиз Мегуин",
      "cityCode": "68134",
      "neighborhood": "Дружба 2",
      "address": "София, Дружба 2, ул. Обиколна 34",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://meguin.bg/",
      "phone": "+359888215100",
      "services": [
        {
          "name": "Смяна на двигателно масло и маслен филтър с консумативи на клиента",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Клиентът предоставя маслото и масления филтър. Посочена е публикуваната тарифа за смяната при този вариант, не цена за закупуване на масло или филтър.",
          "price": {
            "amount": 40,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "смяна на масло и маслен филтър, консумативи на клиента",
            "sourceUrl": "https://meguin.bg/auto-service",
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
          }
        ],
        "sourceUrl": "https://meguin.bg/auto-service",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "phone",
        "phone": "+359888215100"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://meguin.bg/auto-service",
          "excerpt": "Собствената сервизна страница има „ЗАПИШЕТЕ ЧАС“, а пълният footer изрично обозначава телефона за записване за смяна на масло."
        },
        "contact": "https://meguin.bg/auto-service"
      }
    },
    {
      "id": "sofia-sk-studio-banishora-gymnastics",
      "name": "SK Studio · художествена гимнастика",
      "cityCode": "68134",
      "neighborhood": "Банишора",
      "address": "София, Банишора, ул. Иван Тургенев 6",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://skstudio.bg/",
      "phone": "+359898586528",
      "services": [
        {
          "name": "Групова художествена гимнастика за деца",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "durationMin": 60,
          "durationSourceUrl": "https://skstudio.bg/uslugi/hudojestvena-gimnastika",
          "durationCheckedOn": "2026-11-13",
          "description": "Детска художествена гимнастика в малка група. Участието се уговаря предварително и се потвърждава от студиото; таксата и подходящият час се уточняват при записване. Не е медицинска или рехабилитационна услуга."
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359898586528"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://skstudio.bg/kontakt",
          "excerpt": "Контактната страница изисква предварително уговаряне и предлага телефон за първо посещение; услугата насочва към същото записване и адрес."
        },
        "contact": "https://skstudio.bg/kontakt"
      }
    },
    {
      "id": "sofia-the-core-reformer-terter24",
      "name": "The Core Reformer Studio",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Светослав Тертер 24",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://thecorereformer.com/",
      "phone": "+359889596555",
      "services": [
        {
          "name": "Групов пилатес реформър — еднократно посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "durationMin": 50,
          "durationSourceUrl": "https://book.thecorereformer.com/calendar/public",
          "durationCheckedOn": "2026-11-13",
          "description": "Групова тренировка с предварително запазване на място. Посочена е цената за едно посещение, не стойност, изчислена от карта. Графикът и свободните места се проверяват при записване.",
          "price": {
            "amount": 20,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно групово посещение",
            "sourceUrl": "https://thecorereformer.com/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        },
        {
          "name": "Индивидуален пилатес реформър — еднократно посещение",
          "category": "fitness",
          "appointmentModel": "individual_training",
          "durationMin": 50,
          "durationSourceUrl": "https://book.thecorereformer.com/calendar/public",
          "durationCheckedOn": "2026-11-13",
          "description": "Индивидуална тренировка по пилатес реформър с предварително записване. Цената е за едно посещение; не се отнася за отделните xBody EMS тренировки.",
          "price": {
            "amount": 40,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно индивидуално посещение",
            "sourceUrl": "https://thecorereformer.com/",
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
                "open": "08:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": [
              {
                "open": "09:00",
                "close": "18:00"
              }
            ]
          },
          {
            "weekday": 7,
            "periods": [
              {
                "open": "09:00",
                "close": "18:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://thecorereformer.com/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://book.thecorereformer.com/calendar/public"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://thecorereformer.com/",
          "excerpt": "Собственият линк График води към реалния публичен календар The Core Reformer Studio с групови и индивидуални реформър класове и запазване."
        },
        "contact": "https://thecorereformer.com/"
      }
    },
    {
      "id": "sofia-sba-mladost3-gtp",
      "name": "СБА · ГТП Младост",
      "cityCode": "68134",
      "neighborhood": "Младост 3",
      "address": "София, Младост 3, срещу блок 353",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://www.sba.bg/%D1%81%D0%B1%D0%B0-%D1%81%D0%BE%D1%84%D0%B8%D1%8F-%D0%BC%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82",
      "phone": "+359895558762",
      "services": [
        {
          "name": "Годишен технически преглед — лек автомобил без АГУ",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Редовна тарифа с ДДС за лек автомобил без АГУ, без отстъпка от членска или абонаментна карта. Цената и часът се потвърждават по телефона; плащането е на място. Противоречивият онлайн етикет „Безплатно“ не се използва като цена.",
          "price": {
            "amount": 60,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "ГТП на лек автомобил без АГУ, редовна тарифа с ДДС",
            "sourceUrl": "https://www.sba.bg/%D1%81%D0%B1%D0%B0-%D1%81%D0%BE%D1%84%D0%B8%D1%8F-%D0%BC%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82",
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
                "close": "17:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:30",
                "close": "17:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:30",
                "close": "17:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:30",
                "close": "17:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:30",
                "close": "17:00"
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
        "sourceUrl": "https://www.sba.bg/%D1%81%D0%B1%D0%B0-%D1%81%D0%BE%D1%84%D0%B8%D1%8F-%D0%BC%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "phone",
        "phone": "+359895558762"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.sba.bg/%D1%81%D0%B1%D0%B0-%D1%81%D0%BE%D1%84%D0%B8%D1%8F-%D0%BC%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82",
          "excerpt": "Страницата на точния пункт „Запази час за годишен преглед в СБА Младост“ посочва отделен ГТП телефон 0895558762."
        },
        "contact": "https://www.sba.bg/%D1%81%D0%B1%D0%B0-%D1%81%D0%BE%D1%84%D0%B8%D1%8F-%D0%BC%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-abc-fight-club-vasil-levski",
      "checkedOn": "2026-11-13",
      "website": "https://www.abcfight.com/",
      "bookingEntry": "https://abc-fight-club.portal.1club.ai/classes",
      "bookingReview": "provider_booking_reviewed",
      "reviewedUrls": [
        "https://www.abcfight.com/",
        "https://abc-fight-club.portal.1club.ai/calendar",
        "https://www.abcfight.com/trenirovki/tabata/zali-tabata/tabata-na-stadion-vasil-levski",
        "https://www.abcfight.com/trenirovki/tabata",
        "https://1club.me/clubs/abc-fight-club",
        "https://www.abcfight.com/kontakti",
        "https://abc-fight-club.portal.1club.ai/classes",
        "https://www.abcfight.com/trenirovki/kikboks/zali-kikboks/kikboks-na-stadion-vasil-levski/grupa-po-kikboks-za-deca-s-kalin-mirchev",
        "https://abc-fight-club.portal.1club.ai/classes/kikboks-2026-11-16-0800"
      ],
      "notes": "Followed owner's actual Book CTA into its branded1club portal. Rechecked generic public Classes list by ordinary owner-linked HTTP on13Nov: current13–20Nov list includes future16/18/20Nov KalinM kickboxing. Opened actual16Nov class, not merely elapsed13Nov: explicit child ages10–16, beginners/advanced,15EUR,10:00–11:00, exact stadium sectorG/entrance26/hall6G and Reserve action; future18Nov–2Dec repetitions also visible. No event/Reserve clicked and no slot/customer entry or booking. Owner's separate regular programme independently identifies KalinMirchev kickboxing and same venue; this is selected explicit group discipline, replacing generic50EUR private training rather than inferring private discipline from coach affiliation. Generic current Classes URL is the booking destination, dated class is fee/duration evidence only. Mandatory protective equipment retained; retail equipment, other coaches/packages, Google data and bank-account details excluded. No general opening hours or coordinates inferred."
    },
    {
      "id": "sofia-pri-dancho-sinanishko22",
      "checkedOn": "2026-11-13",
      "website": "https://autoservizdancho.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://autoservizdancho.com/",
        "https://autoservizdancho.com/services/",
        "https://autoservizdancho.com/contact/"
      ],
      "notes": "Read actual owner Services page appointment invitation and call/contact path first, then its complete repair/maintenance list and full Contacts/footer. Selected actual car diagnosis, not parts sales or tyre-storage contracts. No numeric diagnostic fee, service price list or priced booking menu is published on these accessible pages. A homepage promotional paragraph mentions online convenience, but no actual online scheduling form was configured in reviewed navigation, so only the explicit owner phone-reservation path is used. Exact SinanishkoEzero22 and phone agree on home, Services and Contact. No opening hours, duration, coordinates or available slots guessed; no third-party review data used.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://autoservizdancho.com/services/",
        "serviceUrls": [
          "https://autoservizdancho.com/services/"
        ],
        "notes": "Read actual owner Services page appointment invitation and call/contact path first, then its complete repair/maintenance list and full Contacts/footer. Selected actual car diagnosis, not parts sales or tyre-storage contracts. No numeric diagnostic fee, service price list or priced booking menu is published on these accessible pages. A homepage promotional paragraph mentions online convenience, but no actual online scheduling form was configured in reviewed navigation, so only the explicit owner phone-reservation path is used. Exact SinanishkoEzero22 and phone agree on home, Services and Contact. No opening hours, duration, coordinates or available slots guessed; no third-party review data used."
      }
    },
    {
      "id": "sofia-auto-atelier-simeonovsko95",
      "checkedOn": "2026-11-13",
      "website": "https://auto-atelier.bg/",
      "bookingEntry": "https://auto-atelier.bg/contact/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://auto-atelier.bg/",
        "https://auto-atelier.bg/contact/",
        "https://auto-atelier.bg/service/elektricheska-sistema/",
        "https://auto-atelier.bg/obshti-usloviya-za-izvarshvane-na-remont-n/"
      ],
      "notes": "Followed actual homepage Book-appointment CTA to owner Contact with explicit inspection/repair appointment instruction and public name/phone/email enquiry form; no form sent. Read selected Electrical-system service list, full homepage service navigation and precise contact/hours section. No numerical diagnosis-visit fee or linked public diagnostic tariff appears in these reviewed booking/services pages. Repair terms describe quote/parts/labour calculation after inspection; their1500BGN threshold and advance-part-payment rule are not visit prices. Exact Simeonovsko95 and phone agree on owner pages. Sunday schedule, geographic quarter, diagnostic duration and coordinates are not inferred.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://auto-atelier.bg/contact/",
        "serviceUrls": [
          "https://auto-atelier.bg/service/elektricheska-sistema/",
          "https://auto-atelier.bg/"
        ],
        "notes": "Followed actual homepage Book-appointment CTA to owner Contact with explicit inspection/repair appointment instruction and public name/phone/email enquiry form; no form sent. Read selected Electrical-system service list, full homepage service navigation and precise contact/hours section. No numerical diagnosis-visit fee or linked public diagnostic tariff appears in these reviewed booking/services pages. Repair terms describe quote/parts/labour calculation after inspection; their1500BGN threshold and advance-part-payment rule are not visit prices. Exact Simeonovsko95 and phone agree on owner pages. Sunday schedule, geographic quarter, diagnostic duration and coordinates are not inferred."
      }
    },
    {
      "id": "sofia-climbnsa-private-studentski-grad",
      "checkedOn": "2026-11-13",
      "website": "https://climbnsa.com/",
      "bookingEntry": "https://climbnsa.com/%D1%82%D0%B5%D1%81%D1%82/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://climbnsa.com/",
        "https://climbnsa.com/%D1%82%D0%B5%D1%81%D1%82/",
        "https://climbnsa.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82/",
        "https://climbnsa.com/%D0%BA%D1%83%D1%80%D1%81%D0%BE%D0%B2%D0%B5-%D0%BF%D0%BE-%D0%BA%D0%B0%D1%82%D0%B5%D1%80%D0%B5%D0%BD%D0%B5/kidsclimb/",
        "https://climbnsa.com/%D1%86%D0%B5%D0%BD%D0%B8-%D0%B8-%D0%B0%D0%B4%D1%80%D0%B5%D1%81/"
      ],
      "notes": "Followed actual owner homepage Book-training/course entry to the published enrolment form with activity, contact and consent fields, then read actual selected training and full tariff/address/contact pages. Selected23EUR individual instructor session including equipment and hall fee, explicitly excluding insurance; did not copy cheaper uncoached wall admission, packages, retail or group-per-person assumptions. Owner identifies precise NSAStudentTown SportClimbing hall; no street number or coordinates invented. Public signup page path contains test but is the actual owner-linked booking entry, with genuine club activities; old September timetable is not current availability. Its card lookup and signup were never submitted. Hours omitted because instructor sessions are arranged against the hall schedule."
    },
    {
      "id": "sofia-ananda-yoga-yoan-ekzarh10",
      "checkedOn": "2026-11-13",
      "website": "https://ananda-bg.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://ananda-bg.com/",
        "https://ananda-bg.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
        "https://ananda-bg.com/%D0%B9%D0%BE%D0%B3%D0%B0/"
      ],
      "notes": "Read actual owner's explicit prior-booking instruction and published phone contact path, then complete yoga service/calendar and tariff sections plus exact Contacts. Tariff distinguishes a single group visit13EUR, individual instruction35EURperhour, and unrelated35/55EUR monthly plans; selected only the two actual session types, not a monthly total as one visit. No fixed private-session duration inferred from the hourly unit or variable group calendar. Recorded precise YoanEkzarh10ground/firstfloor venue and one of two published general phones. Excluded holotropic processes, acupuncture, treatment claims, massage, retail and children's development courses. Public calendar dates are not a claim of live openings; no reservation or personal data submitted."
    },
    {
      "id": "sofia-swami-dev-murti-pobeda1",
      "checkedOn": "2026-11-13",
      "website": "https://swamidevmurti.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://swamidevmurti.com/",
        "https://swamidevmurti.com/2026/09/07/%D0%B9%D0%BE%D0%B3%D0%B0-%D0%BA%D1%83%D1%80%D1%81-%D0%B7%D0%B0-%D0%BD%D0%B0%D1%87%D0%B8%D0%BD%D0%B0%D0%B5%D1%89%D0%B8-%D0%B2-%D0%BA%D0%BB%D1%83%D0%B1-%D1%81%D0%B2%D0%B0%D0%BC%D0%B8-%D0%B4/",
        "https://forms.gle/K76TUR8xfLP6AXnC6"
      ],
      "notes": "Followed actual owner current autumn-course How-to-enrol GoogleForms entry first; the reader returned cache-miss, so no online form or availability is claimed reviewed. The same complete owner page explicitly provides telephone enrolment with named instructor, exact Pobeda1groundfloor venue and unconditional pay-each-visit10EUR; separate pensioner5EUR and full-course prices were not mistaken for the standard visit. Phone fallback is genuine and independently priced, not a bypass of an unread price-only menu. Course runs25September–18December2026, so verification and price expire18December rather than a fabricated permanent offer. No health/nutrition or treatment claims imported, no date/customer entry or submission performed."
    },
    {
      "id": "sofia-ddauto-lyulin-dertliev57",
      "checkedOn": "2026-11-13",
      "website": "https://ddauto.bg/",
      "bookingEntry": "https://ddauto.bg/contact-us/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://ddauto.bg/",
        "https://ddauto.bg/contact-us/",
        "https://ddauto.bg/services/polirane-na-farove-pastirane-lakirane/",
        "https://ddauto.bg/prices-uslugi-ceni-dd-auto-trade-service/"
      ],
      "notes": "Followed actual owner Contact/Book form and inspected real request-type, date/time, service and mandatory workshop-selection controls; both actual Sofia venues are selectable, but only distinct LyulinDertliev57 is new. Read full Prices navigation and selected headlight-restoration page. Selected unpromoted NORMFIX35EUR for one headlight, inclusiveVAT, with owner size/condition/difficulty variation explicitly retained. Excluded ambiguous FastFix sale price, PRO variant, tail-light add-ons, emissions defeat, client-parts oil fee ambiguity and all copied Google review content. Owner form requires team handling; no slot/customer data entered. MladostMalinov36 explicitly formerVIP was NOT added because baseline already contains VIP at that premises; root informed for identity review."
    },
    {
      "id": "sofia-kamen-auto77-tsarigradsko387",
      "checkedOn": "2026-11-13",
      "website": "https://www.avtoservizbg.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://www.avtoservizbg.com/",
        "https://www.avtoservizbg.com/vzima_popravia_vryshta_kolata.html",
        "https://www.avtoservizbg.com/smiana_na_spirachki.html"
      ],
      "notes": "Read actual owner Take-repair-return appointment workflow first, with explicit advance telephone scheduling, diagnostic inspection and repair only after customer approves scope/quote; then complete owner brake-service page and contact/footer. Exact Tsarigradsko387VranaFarmyard and phone agree throughout. No numeric fee is published for selected brake repair in accessible booking/service pages. Separate20BGN collection fee and30BGN diagnostic charge conditional on declining repair are not a regular brake-visit price and were not imported. Other tyre prices are not evidence of brake labour fees. One actual workshop only, no quarter/service-area clones, invented times, coordinates or reviews.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://www.avtoservizbg.com/vzima_popravia_vryshta_kolata.html",
        "serviceUrls": [
          "https://www.avtoservizbg.com/smiana_na_spirachki.html",
          "https://www.avtoservizbg.com/"
        ],
        "notes": "Read actual owner Take-repair-return appointment workflow first, with explicit advance telephone scheduling, diagnostic inspection and repair only after customer approves scope/quote; then complete owner brake-service page and contact/footer. Exact Tsarigradsko387VranaFarmyard and phone agree throughout. No numeric fee is published for selected brake repair in accessible booking/service pages. Separate20BGN collection fee and30BGN diagnostic charge conditional on declining repair are not a regular brake-visit price and were not imported. Other tyre prices are not evidence of brake labour fees. One actual workshop only, no quarter/service-area clones, invented times, coordinates or reviews."
      }
    },
    {
      "id": "sofia-studio7-dobrudzha1-group",
      "checkedOn": "2026-11-13",
      "website": "https://studio7.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://studio7.bg/",
        "https://studio7.bg/contact-us/",
        "https://studio7.bg/grupovi-trenirovki/"
      ],
      "notes": "Followed the owner's appointment entry and read its explicit telephone instruction, reservation/cancellation rules, exact group-only branch limitation and complete public tariff. The seven-session card is imported as a package total with the two-month validity and full upfront-payment condition, never as a single-visit fee. The separately published SENSE Hotel aqua venue is not admitted because its own aqua page says training is temporarily suspended for repairs. No map facts, live availability, customer data or booking submission were used."
    },
    {
      "id": "sofia-vaklinov-sin-orlandovtsi",
      "checkedOn": "2026-11-13",
      "website": "https://vaklinovsin.com/",
      "bookingEntry": "https://vaklinovsin.com/zapazvane/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://vaklinovsin.com/",
        "https://vaklinovsin.com/zapazvane/",
        "https://vaklinovsin.com/gtp/",
        "https://vaklinovsin.com/tseni/"
      ],
      "notes": "Followed the owner's GTP Book entry first. Root independently rendered the actual three-step date/time, customer-details and completion booking interface without choosing a slot, entering data or submitting. Read the GTP service page, full tariff and owner footer for the exact Orlandovtsi venue and GTP-specific phone. The passenger-car tariff starts at 51 EUR including VAT, is explicitly basic/indicative, and is not the homepage's cheaper trailer amount. Contact-page protection was not bypassed; the complete address and correct phone are independently published in the accessible booking/service/footer pages. No duration is inferred from calendar spacing."
    },
    {
      "id": "sofia-calma-azul-tintyava84",
      "checkedOn": "2026-11-13",
      "website": "https://calmayogastudio.net/",
      "bookingEntry": "https://book.calmayogastudio.net/calendar/public?site_id=1",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://calmayogastudio.net/",
        "https://book.calmayogastudio.net/calendar/public?site_id=1"
      ],
      "notes": "Root independently read the entire rendered owner one-page website: the two exact studios, common phone, regular single-visit 11.80 EUR fee without a card and stated common opening hours. Root followed this specific studio's official schedule link and rendered its separately named public weekly calendar; this branch's actual Pilates class lasts 60 minutes. No reservation action, customer entry, slot selection or availability promise was made. Reduced youth/senior rates, medical therapies, astrology and unpriced private instruction are not selected. No owner terms/footer link was visible; no unshown terms are claimed reviewed or accepted."
    },
    {
      "id": "sofia-calma-verde-yana-yazova16",
      "checkedOn": "2026-11-13",
      "website": "https://calmayogastudio.net/",
      "bookingEntry": "https://book.calmayogastudio.net/calendar/public?site_id=2",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://calmayogastudio.net/",
        "https://book.calmayogastudio.net/calendar/public?site_id=2"
      ],
      "notes": "Root independently read the entire rendered owner one-page website: the two exact studios, common phone, regular single-visit 11.80 EUR fee without a card and stated common opening hours. Root followed this specific studio's official schedule link and rendered its separately named public weekly calendar; this branch's actual Pilates class lasts 60 minutes. No reservation action, customer entry, slot selection or availability promise was made. Reduced youth/senior rates, medical therapies, astrology and unpriced private instruction are not selected. No owner terms/footer link was visible; no unshown terms are claimed reviewed or accepted."
    },
    {
      "id": "sofia-carve-indoor-ski-kosta-lulchev52",
      "checkedOn": "2026-11-13",
      "website": "https://carve.bg/",
      "bookingEntry": "https://carve.bg/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://carve.bg/",
        "https://carve.bg/ceni/",
        "https://carve.bg/pravilnik/"
      ],
      "notes": "Followed the owner's actual Book entry and read the complete public request form in the page, then the detailed price table, inclusion notes, track-specific contact/hours and rules. Only the clearly separate adult ski regular group and individual rows are selected; the group row explicitly excludes the first visit. The one-hour session includes intervals and 30 minutes riding, not an invented hour of continuous exercise. Equipment and instructor are included. Beginner/advanced instruction differs as explained by the owner; no general ski-lift admission, bar booking, first-visit promotion, membership discount or package-derived fee is imported. No form data were entered or submitted and no current availability is asserted."
    },
    {
      "id": "sofia-nikal-kondakov5",
      "checkedOn": "2026-11-13",
      "website": "https://nikal-autoservice.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://nikal-autoservice.bg/",
        "https://nikal-autoservice.bg/%D1%81%D0%BC%D1%8F%D0%BD%D0%B0-%D0%BD%D0%B0-%D0%B3%D1%83%D0%BC%D0%B8/",
        "https://nikal-autoservice.bg/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/"
      ],
      "notes": "Read the owner homepage, actual complete tyre service page and contact page using ordinary public HTTP after web-reader timeouts. The selected service page explicitly instructs customers to call the published phone or use contact to arrange a tyre-change appointment and obtain an offer. Its full visible service text and accessible website menus do not publish a numeric tariff for this selected service; there is no separate real Prices link, while placeholder footer labels are not treated as a tariff. The exact Druzhba2 street address and weekday hours are published by the owner. No duration, per-wheel unit, amount, coordinates or Sunday closure is invented. No booking request was submitted.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://nikal-autoservice.bg/%D1%81%D0%BC%D1%8F%D0%BD%D0%B0-%D0%BD%D0%B0-%D0%B3%D1%83%D0%BC%D0%B8/",
        "serviceUrls": [
          "https://nikal-autoservice.bg/%D1%81%D0%BC%D1%8F%D0%BD%D0%B0-%D0%BD%D0%B0-%D0%B3%D1%83%D0%BC%D0%B8/"
        ],
        "notes": "Read the owner homepage, actual complete tyre service page and contact page using ordinary public HTTP after web-reader timeouts. The selected service page explicitly instructs customers to call the published phone or use contact to arrange a tyre-change appointment and obtain an offer. Its full visible service text and accessible website menus do not publish a numeric tariff for this selected service; there is no separate real Prices link, while placeholder footer labels are not treated as a tariff. The exact Druzhba2 street address and weekday hours are published by the owner. No duration, per-wheel unit, amount, coordinates or Sunday closure is invented. No booking request was submitted."
      }
    },
    {
      "id": "sofia-automechanicgroup-gtp-slivnitsa102",
      "checkedOn": "2026-11-13",
      "website": "https://gtp.automechanicgroup.bg/",
      "bookingEntry": "https://gtp.automechanicgroup.bg/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://gtp.automechanicgroup.bg/",
        "https://automechanicgroup.bg/",
        "https://automechanicgroup.bg/contact-us/"
      ],
      "notes": "Followed the actual owner-linked GTP entry from the main owner website and read the entire public appointment/service/contact page using ordinary HTTP. It names the exact Slivnitsa102 inspection premises and GTP-specific phone, explains administrator confirmation and shows calendar, vehicle type, phone and optional email/registration fields. The whole visible GTP page and accessible main owner/contact menus contain no numeric GTP tariff or separate GTP Prices link; missing fees remain absent. No hidden API, bundle, map coordinates, customer input, date/time selection or submission was used. No live calendar availability or duration is claimed. The other YanakiMollov workshop is not cloned into another appointment listing without independent appointment proof.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://gtp.automechanicgroup.bg/",
        "serviceUrls": [
          "https://gtp.automechanicgroup.bg/"
        ],
        "notes": "Followed the actual owner-linked GTP entry from the main owner website and read the entire public appointment/service/contact page using ordinary HTTP. It names the exact Slivnitsa102 inspection premises and GTP-specific phone, explains administrator confirmation and shows calendar, vehicle type, phone and optional email/registration fields. The whole visible GTP page and accessible main owner/contact menus contain no numeric GTP tariff or separate GTP Prices link; missing fees remain absent. No hidden API, bundle, map coordinates, customer input, date/time selection or submission was used. No live calendar availability or duration is claimed. The other YanakiMollov workshop is not cloned into another appointment listing without independent appointment proof."
      }
    },
    {
      "id": "sofia-the-pilates-space-cherkovna3",
      "checkedOn": "2026-11-13",
      "website": "https://thepilatesspace.bg/",
      "bookingEntry": "https://book.thepilatesspace.bg/calendar/public",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://thepilatesspace.bg/",
        "https://thepilatesspace.bg/pravila/",
        "https://thepilatesspace.bg/kontakti/",
        "https://thepilatesspace.bg/tsenorazpis/",
        "https://book.thepilatesspace.bg/calendar/public"
      ],
      "notes": "Followed the actual owner Book link first; root independently rendered the named ThePilatesSpace public calendar with exact Cherkovna3 contact, regular 50-minute Reformer classes and actual reserve/waitlist actions. Read separate complete owner Rules, tariff and exact contact page. The displayed booking Terms view says terms have not been defined; no terms were accepted and the owner's /pravila/ remains the actual reviewed studio rules. Selected the regular20EUR single visit, not the first-customer reduction or a package-derived rate. Advance payment and12-hour cancellation rules remain qualified in the service description. No reservation action, customer entry, live-availability claim or map facts were used."
    },
    {
      "id": "sofia-meguin-obikolna34",
      "checkedOn": "2026-11-13",
      "website": "https://meguin.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://meguin.bg/",
        "https://meguin.bg/auto-service",
        "https://meguin.bg/privacy-policy"
      ],
      "notes": "Read the actual owner service appointment entry, complete separate service tariff and exact workshop contact/hours. Selected only the explicitly priced client-supplied oil/filter replacement option; retail oil products, material-inclusion assumptions, free interval reset and package totals are excluded. Read the complete published terms: ordinary text/image copyright restrictions are respected by recording minimal public facts with original labels/qualifications only, not copying descriptions, media, logos or designs. No source-specific extraction, database-export or hyperlink restriction was identified; this is not a legal-clearance claim. No customer request or booking was made."
    },
    {
      "id": "sofia-sk-studio-banishora-gymnastics",
      "checkedOn": "2026-11-13",
      "website": "https://skstudio.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://skstudio.bg/",
        "https://skstudio.bg/kontakt",
        "https://skstudio.bg/uslugi/hudojestvena-gimnastika",
        "https://skstudio.bg/grafik",
        "https://skstudio.bg/obshti-usloviya"
      ],
      "notes": "Followed the actual schedule request entry first and read its request-first process, public form fields, full selected gymnastics service, exact studio contact and complete terms. The week grid is JavaScript-dependent and no live slots are claimed; the owner separately explicitly permits calling to arrange the visit, so the selected phone fallback is honest. The complete visible service, booking/contact pages and accessible menus contain no numeric fee or separate Prices menu for this selected gymnastics class, not a blocked known tariff. Only nonmedical rhythmic gymnastics is imported; posture/scoliosis/flatfoot/recovery offerings are excluded. Minimal public facts and original concise wording only; ordinary copyright notice is not represented as owner permission or legal clearance. No booking data entered or submitted.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://skstudio.bg/kontakt",
        "serviceUrls": [
          "https://skstudio.bg/uslugi/hudojestvena-gimnastika",
          "https://skstudio.bg/grafik"
        ],
        "notes": "Followed the actual schedule request entry first and read its request-first process, public form fields, full selected gymnastics service, exact studio contact and complete terms. The week grid is JavaScript-dependent and no live slots are claimed; the owner separately explicitly permits calling to arrange the visit, so the selected phone fallback is honest. The complete visible service, booking/contact pages and accessible menus contain no numeric fee or separate Prices menu for this selected gymnastics class, not a blocked known tariff. Only nonmedical rhythmic gymnastics is imported; posture/scoliosis/flatfoot/recovery offerings are excluded. Minimal public facts and original concise wording only; ordinary copyright notice is not represented as owner permission or legal clearance. No booking data entered or submitted."
      }
    },
    {
      "id": "sofia-the-core-reformer-terter24",
      "checkedOn": "2026-11-13",
      "website": "https://thecorereformer.com/",
      "bookingEntry": "https://book.thecorereformer.com/calendar/public",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://thecorereformer.com/",
        "https://book.thecorereformer.com/calendar/public"
      ],
      "notes": "Followed the official owner Schedule link, read the complete separate owner homepage service/price/contact sections and root independently rendered the actual named public booking calendar. Both selected reformer class types are published as 50-minute sessions with real reservation actions; no action was clicked or customer information entered. Imported only the owner's literal single group/private fees; packages, duet totals, separate xBody EMS fees and health-effect claims are not projected into reformer services. Exact street and common hours are from the owner's contact section. No guessed coordinates, availability guarantees or copied media/design."
    },
    {
      "id": "sofia-sba-mladost3-gtp",
      "checkedOn": "2026-11-13",
      "website": "https://www.sba.bg/%D1%81%D0%B1%D0%B0-%D1%81%D0%BE%D1%84%D0%B8%D1%8F-%D0%BC%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://www.sba.bg/%D1%81%D0%B1%D0%B0-%D1%81%D0%BE%D1%84%D0%B8%D1%8F-%D0%BC%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82",
        "https://d577.setmore.com/",
        "https://cdn.uab.org/files/terms/general_terms.pdf"
      ],
      "notes": "Followed the exact branch's actual Setmore booking entry first; it is brandedSBA Mladost and shows an inspection reservation, but its free label is not imported as a zero service fee or projected into online prices. The separate first-party branch page gives the published GTP telephone and full fee table, and owner terms5.3 state that the actual GTP service is paid on site. Root approved the explicit telephone path with the independent complete branch tariff. Direct live owner HTTP on2026-11-13 confirms60EUR ordinary passenger-car/noLPG fee; the web reader's two-week cached lower tariff is recorded as stale, not silently copied. Membership/free-card conditions are not applied. The exact owner landmark address is retained without inventing a street number or pin. No customer entry, request, duration assumption or reservation was made. The Setmore zero/free fee is explicitly conflicting or unreliable for the actual inspection, not proven to mean only a reservation fee; the online route is held, not declared fully price-consistent. The public owner phone/independent current tariff path alone is selected."
    }
  ]
}
