// New owner-reviewed Sofia appointment businesses. Intake only; integration identities are bound after root review.
export default {
  "records": [
    {
      "id": "sofia-velikan-studentski-ivan-stranski1",
      "name": "Великан · Студентски град",
      "cityCode": "68134",
      "neighborhood": "Студентски град",
      "address": "София, Студентски град, ул. Иван Странски 1, ъгъла с бул. Симеоновско шосе",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://velikan-ltd.com/",
      "phone": "+359899396628",
      "services": [
        {
          "name": "Монтаж, демонтаж и баланс на автомобилни гуми",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Обслужване на гуми в сервиза след предварително уговаряне по телефона. Конкретният размер, работа и цена се уточняват при записване."
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359899396628"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://velikan-ltd.com/",
          "excerpt": "Собственият сайт описва процес след записване на час и публикува телефон за сервизите в Студентски град и Младост."
        },
        "contact": "https://velikan-ltd.com/"
      }
    },
    {
      "id": "sofia-velikan-mladost3-gyumyushev265",
      "name": "Великан · Младост 3",
      "cityCode": "68134",
      "neighborhood": "Младост 3",
      "address": "София, Младост 3, ул. Жечо Гюмюшев 265",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://velikan-ltd.com/",
      "phone": "+359899396628",
      "services": [
        {
          "name": "Монтаж, демонтаж и баланс на автомобилни гуми",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Обслужване на гуми в сервиза след предварително уговаряне по телефона. Конкретният размер, работа и цена се уточняват при записване."
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359899396628"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://velikan-ltd.com/",
          "excerpt": "Собственият сайт описва процес след записване на час и публикува телефон за сервизите в Студентски град и Младост."
        },
        "contact": "https://velikan-ltd.com/"
      }
    },
    {
      "id": "sofia-autoklima-evropa80",
      "name": "AutoKlima.bg",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Европа 80",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://www.autoclima.bg/",
      "phone": "+359888404677",
      "services": [
        {
          "name": "Компютърна диагностика на автомобилна климатична система",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Диагностика на електронните компоненти на автомобилния климатик в сервиза. Публикувана цена само за тази проверка, без ремонт или зареждане с хладилен агент.",
          "price": {
            "amount": 50,
            "currency": "BGN",
            "kind": "fixed",
            "unit": "проверка на електронните компоненти на климатичната система",
            "sourceUrl": "https://www.autoclima.bg/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359888404677"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.autoclima.bg/",
          "excerpt": "Действителният бутон „Запази час“ води към телефоните в контактната секция на същия собствен сайт."
        },
        "contact": "https://www.autoclima.bg/"
      },
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
            "periods": [
              {
                "open": "09:00",
                "close": "14:00"
              }
            ]
          },
          {
            "weekday": 7,
            "periods": []
          }
        ],
        "sourceUrl": "https://www.autoclima.bg/",
        "checkedOn": "2026-11-13"
      }
    },
    {
      "id": "sofia-happy-win-slavia-child-tennis",
      "name": "Happy Win · Славия",
      "cityCode": "68134",
      "neighborhood": "Овча купел",
      "address": "София, Овча купел, ул. Коломан 1, стадион Славия",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://happywin.bg/",
      "phone": "+359890552252",
      "services": [
        {
          "name": "Групова тренировка по тенис за деца · единично посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Детски групи за начинаещи и напреднали след записване. Публикувана цена за еднократна тренировка; MultiSport не покрива групата. Не е наем на корт.",
          "price": {
            "amount": 18,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "еднократна групова тренировка за дете",
            "sourceUrl": "https://happywin.bg/about/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359890552252"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://happywin.bg/about/",
          "excerpt": "Хепи Уин София /Славия/: за записване и информация се обадете на 0890552252."
        },
        "contact": "https://happywin.bg/"
      }
    },
    {
      "id": "sofia-vk-tennis-academy-kliment4",
      "name": "VK Tennis Academy",
      "cityCode": "68134",
      "neighborhood": "Студентски град",
      "address": "София, Студентски комплекс, бул. Климент Охридски 4",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://vktennisacademy.com/bg",
      "phone": "+359876202118",
      "services": [
        {
          "name": "Индивидуална тренировка по тенис · редовна цена",
          "category": "fitness",
          "appointmentModel": "individual_training",
          "description": "Един участник с треньор, корт и инвентар. 55 мин активна тренировка и 5 мин подготовка/обратна връзка. Редовна цена за делник 08–10/16–21 ч. и уикенд; Happy Hours е отделна тарифа.",
          "price": {
            "amount": 65,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "една индивидуална тренировка извън Happy Hours",
            "sourceUrl": "https://vktennisacademy.com/bg/plans",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://vktennisacademy.com/bg/calendar"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://vktennisacademy.com/bg/calendar",
          "excerpt": "Запази тренировка с треньор; всяко посещение се записва предварително през календара на академията."
        },
        "contact": "https://vktennisacademy.com/bg/contact"
      }
    },
    {
      "id": "sofia-360tennis-borisova-child-school",
      "name": "Софийски тенис клуб 360 · детска школа",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, Борисова градина, ул. Драган Цанков 3",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://360tennis.bg/",
      "phone": "+359887905777",
      "services": [
        {
          "name": "Детска групова тренировка по тенис · единично посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Единична или допълнителна групова тренировка извън абонамента в детската школа Smile Tennis. Ракета е включена при липса на лична. Записване предварително по телефона.",
          "price": {
            "amount": 12,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "единична или допълнителна тренировка извън абонамента",
            "sourceUrl": "https://360tennis.bg/%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8/%D0%B4%D0%B5%D1%82%D1%81%D0%BA%D0%B0-%D1%82%D0%B5%D0%BD%D0%B8%D1%81-%D1%88%D0%BA%D0%BE%D0%BB%D0%B0/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359887905777"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://360tennis.bg/%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8/%D0%B4%D0%B5%D1%82%D1%81%D0%BA%D0%B0-%D1%82%D0%B5%D0%BD%D0%B8%D1%81-%D1%88%D0%BA%D0%BE%D0%BB%D0%B0/",
          "excerpt": "За контакти и записвания: +359 887 905 777."
        },
        "contact": "https://360tennis.bg/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/"
      }
    },
    {
      "id": "sofia-pro-sport-nsa-kliment22",
      "name": "Тенис клуб Про Спорт · НСА",
      "cityCode": "68134",
      "neighborhood": "Студентски град",
      "address": "София, бул. Климент Охридски 22",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://tcprosport-bg.com/",
      "phone": "+359897558080",
      "services": [
        {
          "name": "Индивидуална тренировка по тенис · треньорска такса",
          "category": "fitness",
          "appointmentModel": "individual_training",
          "description": "Записване в администрацията по телефона. Сумата е само целогодишната треньорска такса; към общата цена се добавя наем на корт според сезона. Не е крайна цена на посещението.",
          "price": {
            "amount": 19.43,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "треньорска такса; наемът на корт е допълнително",
            "sourceUrl": "https://tcprosport-bg.com/amateurs/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359897558080"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://tcprosport-bg.com/amateurs/",
          "excerpt": "Ако желаете да си запазите индивидуална тренировка с треньор позвънете в администрацията на клуба."
        },
        "contact": "https://tcprosport-bg.com/contacts/"
      }
    },
    {
      "id": "sofia-mega-spin-petar-mutafchiev13",
      "name": "Mega Spin Sofia",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Проф. Петър Мутафчиев 13",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://megaspin-bg.com/",
      "phone": "+359894485131",
      "services": [
        {
          "name": "Индивидуална тренировка по тенис на маса с треньор",
          "category": "fitness",
          "appointmentModel": "individual_training",
          "description": "Урок с треньор след телефонно записване. Общата цена се уточнява: публикуваните 10 € са само наем на маса, а треньорската такса е допълнителна и зависи от треньора.",
          "durationSourceUrl": "https://megaspin-bg.com/",
          "durationCheckedOn": "2026-11-13",
          "durationMin": 60
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359894485131"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://megaspin-bg.com/",
          "excerpt": "Как мога да резервирам тренировка с треньор? Обади ни се на +359 894 485 131."
        },
        "contact": "https://megaspin-bg.com/"
      },
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "16:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "16:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "16:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "16:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "16:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": [
              {
                "open": "10:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 7,
            "periods": [
              {
                "open": "10:00",
                "close": "20:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://megaspin-bg.com/",
        "checkedOn": "2026-11-13"
      }
    },
    {
      "id": "sofia-fireball-tsarigradsko133",
      "name": "Fireball · тенис на маса с треньор",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, Цариградско шосе 133, БИЦ-ИЗОТ, корпус 4",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://www.fireball.bg/",
      "phone": "+359878811222",
      "services": [
        {
          "name": "Индивидуална тренировка по тенис на маса за възрастен · Цветомир Цонев",
          "category": "fitness",
          "appointmentModel": "individual_training",
          "description": "Публикувана тарифа за индивидуална подготовка на възрастен при посочения треньор. Записване предварително; условията за ползване и наем на маса се уточняват със залата.",
          "price": {
            "amount": 25,
            "currency": "BGN",
            "kind": "fixed",
            "unit": "час индивидуална подготовка за възрастен",
            "sourceUrl": "https://www.fireball.bg/product-detail/%D1%86%D0%B2%D0%B5%D1%82%D0%BE%D0%BC%D0%B8%D1%80-%D1%86%D0%BE%D0%BD%D0%B5%D0%B2/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359878811222"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.fireball.bg/%D0%BF%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%BD%D0%B8%D0%BA-%D0%B7%D0%B0-%D0%B2%D1%8A%D1%82%D1%80%D0%B5%D1%88%D0%BD%D0%B8%D1%8F-%D1%80%D0%B5%D0%B4/",
          "excerpt": "Резервациите се приемат през системата на сайта, по телефона или лично на рецепцията."
        },
        "contact": "https://www.fireball.bg/contact-us-2/"
      }
    },
    {
      "id": "sofia-nuage-pilates-teofil-ganev5a",
      "name": "NUAGE Pilates House",
      "cityCode": "68134",
      "neighborhood": "Хаджи Димитър",
      "address": "София, Хаджи Димитър, ул. Теофил Ганев 5А",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://nuagepilateshouse.bg/",
      "phone": "+359899929690",
      "services": [
        {
          "name": "Групова тренировка по пилатес реформър · единично посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Водена от инструктор тренировка на реформър в група до шестима. Единично посещение; отмяна по-късно от 12 часа преди часа се отчита като използвано посещение.",
          "durationMin": 50,
          "durationSourceUrl": "https://nuagepilateshouse.bg/trenirovki",
          "durationCheckedOn": "2026-11-13",
          "price": {
            "amount": 20,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "единично посещение в група до 6 души",
            "sourceUrl": "https://nuagepilateshouse.bg/ceni",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://nuagepilateshouse.bg/grafik"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://nuagepilateshouse.bg/grafik",
          "excerpt": "Седмичен график на предстоящите часове; резервирай чрез докосване на час, изисква акаунт."
        },
        "contact": "https://nuagepilateshouse.bg/kontakti"
      },
      "openingHours": {
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "07:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "07:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "07:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "07:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "07:00",
                "close": "21:00"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": [
              {
                "open": "08:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 7,
            "periods": [
              {
                "open": "08:00",
                "close": "20:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://nuagepilateshouse.bg/kontakti",
        "checkedOn": "2026-11-13"
      }
    },
    {
      "id": "sofia-pilates54-mladost1-block54a",
      "name": "Pilates Reformer 54",
      "cityCode": "68134",
      "neighborhood": "Младост 1",
      "address": "София, Младост 1, бл. 54А",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://pilates54.bg/",
      "phone": "+359885454544",
      "services": [
        {
          "name": "Групова тренировка по пилатес реформър · единично посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Водена тренировка на реформър в група до четирима в помещение. Единично посещение с ДДС и предварително плащане. Безплатна отмяна до 4 часа преди началото; след това посещението се отчита като използвано.",
          "durationMin": 50,
          "durationSourceUrl": "https://pilates54.bg/",
          "durationCheckedOn": "2026-11-13",
          "price": {
            "amount": 20,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "единична групова тренировка с ДДС",
            "sourceUrl": "https://pilates54.bg/pricing/",
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
                "close": "13:00"
              },
              {
                "open": "14:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "08:00",
                "close": "13:00"
              },
              {
                "open": "14:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "08:00",
                "close": "13:00"
              },
              {
                "open": "14:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "08:00",
                "close": "13:00"
              },
              {
                "open": "14:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "08:00",
                "close": "13:00"
              },
              {
                "open": "14:00",
                "close": "20:00"
              }
            ]
          },
          {
            "weekday": 6,
            "periods": [
              {
                "open": "10:00",
                "close": "16:00"
              }
            ]
          },
          {
            "weekday": 7,
            "periods": [
              {
                "open": "10:00",
                "close": "16:00"
              }
            ]
          }
        ],
        "sourceUrl": "https://pilates54.bg/contact/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "phone",
        "phone": "+359885454544"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://pilates54.bg/terms/",
          "excerpt": "Предварителното записване е задължително за всички тренировки; възможно е онлайн или по телефона."
        },
        "contact": "https://pilates54.bg/contact/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-velikan-studentski-ivan-stranski1",
      "checkedOn": "2026-11-13",
      "website": "https://velikan-ltd.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://velikan-ltd.com/",
        "https://velikan-ltd.com/smqna-na-maslo-serviz-za-gumi/"
      ],
      "notes": "Actual owner appointment entry reviewed FIRST on full homepage: 'След записване на час' process and nearby call CTA point to literal +359899396628. Visible tel links and footer inspected, same current shared owner service phone for both real distinct named bases, not guessed per-branch number. Exact own address София, Студентски град, ул. Иван Странски 1, ъгъла с бул. Симеоновско шосе appears on same page and full service footer; no Maps link followed, no coordinate guessed. Homepage explicitly offers montage/demontage/balance and identifies both real premises. Full linked service page reviewed including all mechanical-service sections and footer; no current numeric owner tariff/Prices link for selected tyre labour was published on reviewed full pages. Old customer-review amounts40BGN/10BGN are THIRD-PARTY testimonials, not owner price list and NOT imported; no ratings/reviews/photos copied into catalogue. Real tyres service only: self-service carwash expressly excluded. No separate terms/privacy link visible across reviewed navigation/footer; not claiming unshown terms read or licensed. Generic24/7 footer/hours omitted rather than assuming each department always available. No call/form/customer details, booking, slot or consent action; phone appointment requires staff confirmation.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://velikan-ltd.com/",
        "serviceUrls": [
          "https://velikan-ltd.com/",
          "https://velikan-ltd.com/smqna-na-maslo-serviz-za-gumi/"
        ],
        "notes": "Actual owner appointment entry reviewed FIRST on full homepage: 'След записване на час' process and nearby call CTA point to literal +359899396628. Visible tel links and footer inspected, same current shared owner service phone for both real distinct named bases, not guessed per-branch number. Exact own address София, Студентски град, ул. Иван Странски 1, ъгъла с бул. Симеоновско шосе appears on same page and full service footer; no Maps link followed, no coordinate guessed. Homepage explicitly offers montage/demontage/balance and identifies both real premises. Full linked service page reviewed including all mechanical-service sections and footer; no current numeric owner tariff/Prices link for selected tyre labour was published on reviewed full pages. Old customer-review amounts40BGN/10BGN are THIRD-PARTY testimonials, not owner price list and NOT imported; no ratings/reviews/photos copied into catalogue. Real tyres service only: self-service carwash expressly excluded. No separate terms/privacy link visible across reviewed navigation/footer; not claiming unshown terms read or licensed. Generic24/7 footer/hours omitted rather than assuming each department always available. No call/form/customer details, booking, slot or consent action; phone appointment requires staff confirmation."
      }
    },
    {
      "id": "sofia-velikan-mladost3-gyumyushev265",
      "checkedOn": "2026-11-13",
      "website": "https://velikan-ltd.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://velikan-ltd.com/",
        "https://velikan-ltd.com/smqna-na-maslo-serviz-za-gumi/"
      ],
      "notes": "Actual owner appointment entry reviewed FIRST on full homepage: 'След записване на час' process and nearby call CTA point to literal +359899396628. Visible tel links and footer inspected, same current shared owner service phone for both real distinct named bases, not guessed per-branch number. Exact own address София, Младост 3, ул. Жечо Гюмюшев 265 appears on same page and full service footer; no Maps link followed, no coordinate guessed. Homepage explicitly offers montage/demontage/balance and identifies both real premises. Full linked service page reviewed including all mechanical-service sections and footer; no current numeric owner tariff/Prices link for selected tyre labour was published on reviewed full pages. Old customer-review amounts40BGN/10BGN are THIRD-PARTY testimonials, not owner price list and NOT imported; no ratings/reviews/photos copied into catalogue. Real tyres service only: self-service carwash expressly excluded. No separate terms/privacy link visible across reviewed navigation/footer; not claiming unshown terms read or licensed. Generic24/7 footer/hours omitted rather than assuming each department always available. No call/form/customer details, booking, slot or consent action; phone appointment requires staff confirmation.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://velikan-ltd.com/",
        "serviceUrls": [
          "https://velikan-ltd.com/",
          "https://velikan-ltd.com/smqna-na-maslo-serviz-za-gumi/"
        ],
        "notes": "Actual owner appointment entry reviewed FIRST on full homepage: 'След записване на час' process and nearby call CTA point to literal +359899396628. Visible tel links and footer inspected, same current shared owner service phone for both real distinct named bases, not guessed per-branch number. Exact own address София, Младост 3, ул. Жечо Гюмюшев 265 appears on same page and full service footer; no Maps link followed, no coordinate guessed. Homepage explicitly offers montage/demontage/balance and identifies both real premises. Full linked service page reviewed including all mechanical-service sections and footer; no current numeric owner tariff/Prices link for selected tyre labour was published on reviewed full pages. Old customer-review amounts40BGN/10BGN are THIRD-PARTY testimonials, not owner price list and NOT imported; no ratings/reviews/photos copied into catalogue. Real tyres service only: self-service carwash expressly excluded. No separate terms/privacy link visible across reviewed navigation/footer; not claiming unshown terms read or licensed. Generic24/7 footer/hours omitted rather than assuming each department always available. No call/form/customer details, booking, slot or consent action; phone appointment requires staff confirmation."
      }
    },
    {
      "id": "sofia-autoklima-evropa80",
      "checkedOn": "2026-11-13",
      "website": "https://www.autoclima.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://www.autoclima.bg/"
      ],
      "notes": "Actual owner Book CTA followed FIRST: four visible 'Запази час' anchors lead to #контакти on full one-page owner site, no separate form/calendar configured. Current ordinary public GET verified exact tel+359888404677 and other literal service phones, address SofiaEvropa80 and complete published tariff/contact/footer; not inferred phone booking from generic contact alone. Import ONLY literal50BGN computer diagnostic of electronic climate-system components from additional services row; not generalizedvehiclecomputerdiagnostic, not80BGNelectric-compressorstandtest, not50BGNfrom-refrigerantcharge. No EUR conversion or VAT claim; no duration inferred. Actual linked individual diagnostic path returns ordinary404 after readercachemiss; its missing content is NOT treated as unpublishedtariff and NOT price source, because selected diagnostic is independentlyfullypriced/described on completecurrentonepage. Other malformed refrigerantquantity'0.100гр' rows, retail refrigerants, undefinedrefilltotals omitted. All public onepage service/pricing/about/contact/footer sections read; no Terms/privacy link visible, not claiming nonexistenttermspermission. Shop actual name AutoKlima.bg, no independentextraoperator inferred from external photo attribution. Exact domain/phones/address new againstcurrentcatalogue/intakes/nativefixtures bylocaltextsearch; neutralquarter andcoordsnull, noMap/image/providercontentaccess. No calls, forms, customerinput, bookings or consentactions."
    },
    {
      "id": "sofia-happy-win-slavia-child-tennis",
      "checkedOn": "2026-11-13",
      "website": "https://happywin.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://happywin.bg/",
        "https://happywin.bg/about/",
        "https://happywin.bg/contact/"
      ],
      "notes": "Actual selected child-training enrollment entry reviewed FIRST on owner /about/: Sofia/Slavia groups current from03.10.2026 explicitly telephone0890552252 or owneremail. Separate nav online reservation links are court-rental routes, NOT falsely represented as coached-class booking; no court platform, account or booking accessed. Full current child-group section and heading hierarchy read: both named bases, then common child-group fee18EUR for single/trial training,60/120EUR monthly totals. Import only literal single18EUR, not free trial, no divided monthly fee. The section describes children beginning/advanced; introductory club focus6–8 does not constrain every class to that exact age, so no invented ageband/duration. MultiSport exclusion retained. Full owner homepage contacts identify HappyWin1AND2 together at Koloman1Slavia with separate receptionphones; this is ONE operator/premises record, not two same-address clones. Use actual Sofia child-enrollment phone0890552252, not Bankya0885778151. Bankya separatecity excluded. Owner public contact page ordinaryGET inspected after reader502: court links/no additional literal tariff or Terms link; /about/currenthome fullfooter no Terms/privacy link found, not claiming unshown terms acceptance/licence. Current daily8–21 genericclubhours omitted rather than asserting childlesson availability. Coordinates null; noMaps, customerreviews/photos or provider data copied; no call/form/customerinput/reservation/consent action."
    },
    {
      "id": "sofia-vk-tennis-academy-kliment4",
      "checkedOn": "2026-11-13",
      "website": "https://vktennisacademy.com/bg",
      "bookingEntry": "https://vktennisacademy.com/bg/calendar",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://vktennisacademy.com/bg",
        "https://vktennisacademy.com/bg/calendar",
        "https://vktennisacademy.com/bg/contact",
        "https://vktennisacademy.com/bg/private",
        "https://vktennisacademy.com/bg/plans",
        "https://vktennisacademy.com/bg/documents/obshti-usloviya"
      ],
      "notes": "Actual owner Book entry followed FIRST to own /bg/calendar. Reader cache displayed September45EUR/olderUSDpackage menu; NOT imported. Ordinary public current GET of actual calendar independently read current13–19November named-coach training calendar and65EUR entries; current /private repeats same actual selected calendar. No slot selected, future availability not asserted: public HTML contains both unavailable messages and numeric fee cells, not proof of a particular slot. Complete CURRENT owner /plans read by ordinaryGET,65EUR regular single individual versus60EUR weekday10–16HappyHours; only65 standard tariff with exact applicable hours retained, not slashed/trial30EUR or divided packages. Current full Terms4.1effective05.11.2026 independently read including initially output-truncated middle7–10; operator changed to sports association03.11, no extra staff/business aliases. Exact training premise KlimentOhridski4 explicitly in CURRENTterms2/4.2 and fullcontact/footer; StoyanMihaylovski6 is registered correspondence office, NOT extra trainingvenue. Single participant coached service includescourt/balls/racket/equipment;55active+5preparation differs from inferred calendar slot spacing. Advancepayment/accountneeded to reserve,24h cancellation rules; no claim we accepted terms, registered, paid or submitted. Terms no explicit automation/database restriction found; minimal service/contact/fee facts only, no provider bulk inventory, testimonials, images, materials or prose. Same technical1club host operates ownermarketing/booking perterms, not a separate business. Hours omitted as trainingavailability not generalopeninghours; coordsnull/noMaps."
    },
    {
      "id": "sofia-360tennis-borisova-child-school",
      "checkedOn": "2026-11-13",
      "website": "https://360tennis.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://360tennis.bg/",
        "https://360tennis.bg/%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8/%D0%B4%D0%B5%D1%82%D1%81%D0%BA%D0%B0-%D1%82%D0%B5%D0%BD%D0%B8%D1%81-%D1%88%D0%BA%D0%BE%D0%BB%D0%B0/",
        "https://360tennis.bg/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
        "https://360tennis.bg/%D1%86%D0%B5%D0%BD%D0%B8/",
        "https://360tennis.bg/%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F-%D0%B7%D0%B0-%D0%BF%D0%BE%D0%BB%D0%B7%D0%B2%D0%B0%D0%BD%D0%B5/",
        "https://360tennis.bg/%D1%87%D0%B5%D1%81%D1%82%D0%BE-%D0%B7%D0%B0%D0%B4%D0%B0%D0%B2%D0%B0%D0%BD%D0%B8-%D0%B2%D1%8A%D0%BF%D1%80%D0%BE%D1%81%D0%B8/"
      ],
      "notes": "Actual selected child-school booking entry read FIRST: complete ownservicepage explicitly contactsandenrollment+359887905777. SeparatetopBookcourt is court-rentalonly, NOT represented as selectedcoachedchildbooking; noCourtproviderrequest. Fullschooltable single/additionaloutside-subscription12EUR withracketincluded whenneeded. Malformedmonthly labels4/8trainingsWEEKLYunderMONTHLYsubscription are ambiguous; NOT imported/divided, nofreefirstpromotion. Fullcurrentwinter2026/27mainPrices inspected too:40EURup-to-twoindividualcoachingdifferentservice,27/33courtrentaldifferentinventory; neitherprojectedontochildschool, no all-price-unpublished claim. FullownFAQexplicitphonebook,currentcontactpagefullform/footer/hours,fullTermsordinaryGET afterreadercachemiss. Terms2explicitexerciseaddressDraganTsankov3, ownerFAQpreciselyBorisovaGardennearstoneelephant/parallelSummerTheatre/ArmyStadium; no inventedstreetfrommap. Terms8 ordinaryintellectual-property clause overtexts/photos/audio/video withlegalexceptions, no explicitautomated/database/commercial-all-datarestriction found; minimalpublicfactualname/service/phone/address/literalfeeonly, independentlywrittenlabel, noexpressivematerials/images/reviews/copy. No legalpermissionclaim. SingleoperatorSmileTennisprogrammeNOTseparatebusinessfrom360. Generic07–23seasonhours omittedbecauseweekdaylessonavailabilityunproven. Childageover3mentionedbut3–99marketingnotpreciseagepolicy, noageband/durationinvented. Allcoordsnull/noMaps. No input, account, consent, call, booking or payment."
    },
    {
      "id": "sofia-pro-sport-nsa-kliment22",
      "checkedOn": "2026-11-13",
      "website": "https://tcprosport-bg.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://tcprosport-bg.com/",
        "https://tcprosport-bg.com/amateurs/",
        "https://tcprosport-bg.com/contacts/",
        "https://tcprosport-bg.com/tennis-school/"
      ],
      "notes": "Actual selected coachedservice appointment instruction followed FIRST on fullowner/amateurs: explicitlyphoneadministrationto reserveindividualtraining. ToponlineBookTennisBookingisCOURTRENTALonly, not falsely selectedcoachingcalendar,no platformrequest/account. Fullselectedservice/currentordinaryGET exactliteral38BGN/19.43EURyear-roundCOACHFEE, court rent separatelyseason-dependent. Import only explicitlylabelledcoachcomponent, repeatedinpublicname/description/unit, neverpresent19.43asallinclusivevisit or inventsum/rent. WinterTryTennis6x2h173.85EUR/personingroup4also publishedbutnotselected/trialpromo/derivedprice; no missingpriceclaim. ExactSofiaKlimentOhridski22+currentphone0897558080 agreehome/service/fullcontact; no fakebranchorstaffaliases/retailproducts. Fullschoolprogramme3–5/5–8/8–9/9–10readbutnotselectedchildactivity; personalamateurtrainingnotgenericcourtadmission. Ownerhome/service/contactnavigationandfullfooterexamined,noseparateTerms/pricelistlinkvisible, notclaimunshownlegaltermsread or permission. No openinghoursorindividualdurationpublishedonselectedfullpages, omittednotinferredfromgroup2h. Coordsnull; noMaps/reviews/photos/providerbulk data. No call, enquiry, consent, customerinput, account, payment orbooking action."
    },
    {
      "id": "sofia-mega-spin-petar-mutafchiev13",
      "checkedOn": "2026-11-13",
      "website": "https://megaspin-bg.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://megaspin-bg.com/",
        "https://megaspin-bg.com/rezervacii",
        "https://megaspin-bg.com/poveritelnost"
      ],
      "notes": "Actual headerBook followed FIRST to own/rezervacii publictable-rentalcalendar. It is expressly table-only, not coachedlesson; onlypublicpage inspected, no administrator/login/blocking/privateAPI/control interaction. Selectedlesson actualphonefallback independentlyexplicitinfullownFAQ: reservecoachbycalling0894485131 orowneremail. COMPLETEonepage actualservices/pricesection/FAQ/contacts/footer reviewed: separatetable-rental10EURperhour andlesson10EURPLUSvariablecoachfee. Numeric10isNOTall-inlesson andnotrecordedprice; totalcoachtrainingfee genuinelynotpublished, quoteexplicitlydependscoachqualification/type. This no-price receipt applies onlyselectedTOTALcoachedlesson, not falseclaimnoownerpricesanywhere. No price0/from10invented, publicdescription explainsrentalcomponent+unknowncoachfee. OrdinaryGET fullprivacy25.10.2026read aftercachemiss confirmsactualhallPetarMutafchiev13 andsamephone; Lyulin1block026registeredofficeNOTnewpremise. Explicitstandardtraining60minFAQ, notcalendarspacing; no agebandinferred, nochildclassselected. NootherTermslinkvisible, ordinarycopyrightonly, nolegalpermissionclaim. Currentweekday16–20/weekend10–20hours literalowncontact, noavailabilitypromise. No externaltennismasa tournamentproviderfetched/copied, no Mapsratings/images/reviews. Coordsnull, no providerbulkexport, customerinput, calls, account, consent, booking orpayment.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://megaspin-bg.com/",
        "serviceUrls": [
          "https://megaspin-bg.com/"
        ],
        "notes": "Actual headerBook followed FIRST to own/rezervacii publictable-rentalcalendar. It is expressly table-only, not coachedlesson; onlypublicpage inspected, no administrator/login/blocking/privateAPI/control interaction. Selectedlesson actualphonefallback independentlyexplicitinfullownFAQ: reservecoachbycalling0894485131 orowneremail. COMPLETEonepage actualservices/pricesection/FAQ/contacts/footer reviewed: separatetable-rental10EURperhour andlesson10EURPLUSvariablecoachfee. Numeric10isNOTall-inlesson andnotrecordedprice; totalcoachtrainingfee genuinelynotpublished, quoteexplicitlydependscoachqualification/type. This no-price receipt applies onlyselectedTOTALcoachedlesson, not falseclaimnoownerpricesanywhere. No price0/from10invented, publicdescription explainsrentalcomponent+unknowncoachfee. OrdinaryGET fullprivacy25.10.2026read aftercachemiss confirmsactualhallPetarMutafchiev13 andsamephone; Lyulin1block026registeredofficeNOTnewpremise. Explicitstandardtraining60minFAQ, notcalendarspacing; no agebandinferred, nochildclassselected. NootherTermslinkvisible, ordinarycopyrightonly, nolegalpermissionclaim. Currentweekday16–20/weekend10–20hours literalowncontact, noavailabilitypromise. No externaltennismasa tournamentproviderfetched/copied, no Mapsratings/images/reviews. Coordsnull, no providerbulkexport, customerinput, calls, account, consent, booking orpayment."
      }
    },
    {
      "id": "sofia-fireball-tsarigradsko133",
      "checkedOn": "2026-11-13",
      "website": "https://www.fireball.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://www.fireball.bg/",
        "https://www.fireball.bg/%D0%BF%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%BD%D0%B8%D0%BA-%D0%B7%D0%B0-%D0%B2%D1%8A%D1%82%D1%80%D0%B5%D1%88%D0%BD%D0%B8%D1%8F-%D1%80%D0%B5%D0%B4/",
        "https://www.fireball.bg/contact-us-2/",
        "https://www.fireball.bg/product-detail/%D1%86%D0%B2%D0%B5%D1%82%D0%BE%D0%BC%D0%B8%D1%80-%D1%86%D0%BE%D0%BD%D0%B5%D0%B2/",
        "https://www.fireball.bg/table-tennis/academy/",
        "https://www.fireball.bg/table-tennis/prices/",
        "https://www.fireball.bg/table-tennis/%20%D1%82%D1%80%D0%B5%D0%BD%D1%8C%D0%BE%D1%80%D0%B8-%D1%82%D0%B5%D0%BD%D0%B8%D1%81-%D0%BD%D0%B0-%D0%BC%D0%B0%D1%81%D0%B0%20/",
        "https://www.fireball.bg/table-tennis/book-table-tennis/"
      ],
      "notes": "Actual owner Book followed FIRST to /table-tennis/book-table-tennis/: expressly table rental, embedded BookingGood calendar not selected as coach booking. Selected coach roster explicitly says reserveindividualtraining; full internalrules4.1–4.2 independently allowphone reservations for all venue sports, actual receptionphone0878811222 fromfull contact. Contactenquiryform explicitly NOT forreservations/cancellations, therefore PHONEonly, no formmislabel. Full chosen coachprofile currentordinaryGET verified literal25BGN/houradult versus20BGN/non-schoolchild; onlyadult25 included,no conversiontoEUR,nochildfeealias. Full schoolservice+separateprices read: genericfrom20sparring/coach variesbyperson, doesnot contradict25namedcoach; table12/hour androbot32/hour aredifferentservice inventories. No inventedall-inclusivecourtfee,total,durationfromslotspacing or claimfreshcurrencyconversion. Publicdescription doesnotasserttablerentalincluded. Exactowncontact133Tsarigradsko,BIC-IZOTcorpus4, not YanaYazova14A registeredprivateapartment inrules; one realpremise, nostaffaliasbusiness. Whole94lineownrules read includingreservation/prepay/24hcancel, no automated/database restriction found; no separateTermslinkinreviewedfooter. Copyright only, minimal facts/freshlabel not copybiography/qualifications/images/reviews. Generalvenuehours7–22/weekend8–22notcoachingavailability, omitted. NoMaps/providerplatformfetch, accounts, consent, calls, forms/customerinput, reservation, payment orproductionchange."
    },
    {
      "id": "sofia-nuage-pilates-teofil-ganev5a",
      "checkedOn": "2026-11-13",
      "website": "https://nuagepilateshouse.bg/",
      "bookingEntry": "https://nuagepilateshouse.bg/grafik",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://nuagepilateshouse.bg/",
        "https://nuagepilateshouse.bg/grafik",
        "https://nuagepilateshouse.bg/kontakti",
        "https://nuagepilateshouse.bg/trenirovki",
        "https://nuagepilateshouse.bg/ceni"
      ],
      "notes": "Actual own Book entry followed FIRST to complete public/grafik: namedweekly9–15November2026 ReformerGroup/Private classes, namedinstructor, actuallinkedfuture14/15November entries inspected aspubliccalendar only. No class/slot selected, account registered, termsaccepted orreservationcreated; no availabilityclaim. GenericcalendarURLretained notstaleevent/cart. Fullownservice/ceni/contact/footer read: selectedgroup20EURsingle,50minmax6coachedCosmosReformers. Individual34EUR and75/140/180EURgroupTOTALpackages separatelypublished notmixed/divided. No trial/deposit/retailActivewear asservicefee. Public12hcancelqualification retained; packages4/8one-month/12two-month notprojectedsingle. ActualTeofilGanev5A/HadzhiDimitar andsame0899929690 consistentallfourfullpages, notregisteredofficeorstaffalias. Literalopeninghours07–21weekdays08–20weekends fromexactcontact, notcalendaravailability. Fullnav/footer onlycopyrightno separateTerms/privacylinkvisible, notclaimunshowncontractread/licence. Ownercalendarneedsaccountforactualreservation aspublicinstructionsstate; we stoppedbeforeanyentry. Phone/Viber/WhatsApp aresecondarycontacts, actualwebsitebooking keptpriority. Minimalfactualrates/freshlabel only,no copieddescriptions/photos/reviews/Mapdata/providerbulkexport. Coordsnull,no externalmapfollowed."
    },
    {
      "id": "sofia-pilates54-mladost1-block54a",
      "checkedOn": "2026-11-13",
      "website": "https://pilates54.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://pilates54.bg/",
        "https://pilates54.bg/terms/",
        "https://pilates54.bg/contact/",
        "https://pilates54.bg/pricing/",
        "https://book.pilates54.bg/"
      ],
      "notes": "Actual owner Book entry followed FIRST from homepage to https://book.pilates54.bg/: public JS shell only, no service menu rendered in reader or ordinary public GET. No guessed /calendar path, login, account, slot, customer input or booking submitted. Selected PHONE fallback independently explicit in full own /terms section II.8: advance reservation mandatory for all group/individual classes, online system OR phone. Actual branch contact 0885454544 and Mladost1 block54A verified on full /contact and homepage/footer. Registered company address block54B/ap40 in terms is explicitly legal company address, not a second exercise venue; no duplicated branch or fabricated street. Full owner /pricing tariff: group20EUR single,4/64 and10/150 TOTAL packages,duo36 andprivate30 separate; selected only group20EUR with VAT as terms III.10. Homepage explicitly 50min and4 participants per room; trainer-led Reformer selected, not generic gym, medical rehabilitation, Cadillac therapy or chair-service assumption. Literal contact opening periods include13–14 weekday break and10–16 weekends, not calendar availability. Full133-line terms read including cancellation4h/prepayment/ordinary intellectual-property clause25; no explicit automated-extraction/database prohibition found, not a licence conclusion. Public description retains4h late-cancel use condition; packages not divided, trial/deposits/retail omitted. Online menu is honestly unread JS, not priced-reviewed or unavailable forever; no online-only price projected onto phone tariff. Only minimal owner facts and fresh service wording retained, no photos/reviews/Maps harvesting. Coords null."
    }
  ]
};

