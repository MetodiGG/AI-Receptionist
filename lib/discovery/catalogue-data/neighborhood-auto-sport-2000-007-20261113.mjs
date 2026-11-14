// New owner-reviewed Sofia appointment businesses. Intake only; integration identities are bound after root review.
export default {
  "records": [
    {
      "id": "sofia-redline-speed-prepurchase-mobile",
      "name": "Redline Speed · оглед преди покупка на адрес",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://redline-speed.com/",
      "phone": "+359879000708",
      "services": [
        {
          "name": "Оглед на лек автомобил преди покупка · без присъствие на клиента",
          "category": "auto_repair",
          "appointmentModel": "home_visit",
          "description": "Проверка при продавача с писмен доклад и снимки. 100 EUR с ДДС и транспорт в София и околностите; точният обхват и цена се потвърждават преди огледа. Без разглобяване; външна VIN справка и репатриране се заплащат отделно при уговорка.",
          "price": {
            "amount": 100,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "оглед на един лек автомобил при продавача, без клиента",
            "sourceUrl": "https://redline-speed.com/ogled-predi-pokupka",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://redline-speed.com/ogled-predi-pokupka"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://redline-speed.com/ogled-predi-pokupka",
          "excerpt": "Собствената страница предлага заявка за оглед при продавача и потвърждение на детайлите и часа по телефона; обслужва София и региона."
        },
        "contact": "https://redline-speed.com/ogled-predi-pokupka"
      }
    },
    {
      "id": "sofia-dunev-motor-sport-asen-yordanov4",
      "name": "Дунев Мотор Спорт Р21",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Асен Йорданов 4",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://www.dunevmotorsport-r21.com/",
      "phone": "+359899832121",
      "services": [
        {
          "name": "Машинен хоризонтален тест на ходова част · лек автомобил",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Тест на окачването в хоризонтална посока с машина. 40 EUR за лек автомобил; вертикалният тест е отделна услуга, а за SUV и бус има друга тарифа. Ремонтът и последващият реглаж не са включени.",
          "price": {
            "amount": 40,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "хоризонтален машинен тест за един лек автомобил",
            "sourceUrl": "https://www.dunevmotorsport-r21.com/diagnostika-na-hodovata-chast-na-avtomobila/",
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
        "sourceUrl": "https://www.dunevmotorsport-r21.com/kontakti/",
        "checkedOn": "2026-11-13"
      },
      "booking": {
        "kind": "form",
        "url": "https://www.dunevmotorsport-r21.com/kontakti/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.dunevmotorsport-r21.com/kontakti/",
          "excerpt": "Собствените контакти съдържат форма за час за обслужване; условията изискват предварително уговорени ден и час за приемане на автомобила."
        },
        "contact": "https://www.dunevmotorsport-r21.com/kontakti/"
      }
    },
    {
      "id": "sofia-sheve-dance-albert-long5",
      "name": "Танцова школа Шеве",
      "cityCode": "68134",
      "neighborhood": "Хаджи Димитър",
      "address": "София, ж.к. Хаджи Димитър, ул. Д-р Алберт Лонг 5",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://sheve.bg/",
      "phone": "+359894470145",
      "services": [
        {
          "name": "Народни танци за начинаещи · групов урок",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Група за възрастни и тийнейджъри с предварително записване. 7 EUR за единично посещение; не е необходим партньор. Детската група, която е само анонсирана, не е включена.",
          "durationMin": 60,
          "durationSourceUrl": "https://sheve.bg/zapisvane/",
          "durationCheckedOn": "2026-11-13",
          "price": {
            "amount": 7,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно групово посещение",
            "sourceUrl": "https://sheve.bg/zapisvane/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://sheve.bg/zapisvane/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://sheve.bg/zapisvane/",
          "excerpt": "Собствената страница предлага предварително записване чрез форма или телефон 0894 470 145 за начинаещата група на Д-р Алберт Лонг 5."
        },
        "contact": "https://sheve.bg/zapisvane/"
      }
    },
    {
      "id": "sofia-gaitani-druzhba2-obikolna36",
      "name": "Гайтани · Дружба 2",
      "cityCode": "68134",
      "neighborhood": "Дружба 2",
      "address": "София, ж.к. Дружба 2, ул. Обиколна 36, актова зала на 163 ОУ Черноризец Храбър",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://www.gaitani.com/",
      "phone": "+359897920893",
      "services": [
        {
          "name": "Народни танци за начинаещи · групово посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "7 EUR за едно посещение с плащане на място. Заявката се потвърждава от клуба до 7 дни; тя не гарантира свободно място. Графикът се уточнява при записване.",
          "price": {
            "amount": 7,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно групово посещение",
            "sourceUrl": "https://docs.google.com/forms/d/e/1FAIpQLScdBtt6gjIo8wfcwOQIg2cBF0mvbbjNO5pnT_4DGTET4Jpl3g/viewform?usp=send_form",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://docs.google.com/forms/d/e/1FAIpQLScdBtt6gjIo8wfcwOQIg2cBF0mvbbjNO5pnT_4DGTET4Jpl3g/viewform?usp=send_form"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.gaitani.com/posts/501",
          "excerpt": "Собствената обектова страница изисква предварително записване на 0897 920 893 или чрез конкретната форма за начинаещата група."
        },
        "contact": "https://www.gaitani.com/posts/501"
      }
    },
    {
      "id": "sofia-gaitani-mladost3-bl334",
      "name": "Гайтани · Младост 3",
      "cityCode": "68134",
      "neighborhood": "Младост 3",
      "address": "София, ж.к. Младост 3, танцов център Гайтани до бл. 334, зад 59 ОДЗ Елхица, зала 1",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://www.gaitani.com/",
      "phone": "+359897920893",
      "services": [
        {
          "name": "Народни танци за начинаещи · групово посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "7 EUR за едно посещение с плащане на място. Заявката се потвърждава от клуба до 7 дни; тя не гарантира свободно място. Графикът се уточнява при записване.",
          "price": {
            "amount": 7,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно групово посещение",
            "sourceUrl": "https://docs.google.com/forms/d/e/1FAIpQLSe5N1elLdi8xPD_ynv_kOI5LOzD9JTJvEHqKpBXIKGxkpuGSw/viewform?usp=send_form",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://docs.google.com/forms/d/e/1FAIpQLSe5N1elLdi8xPD_ynv_kOI5LOzD9JTJvEHqKpBXIKGxkpuGSw/viewform?usp=send_form"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.gaitani.com/posts/504",
          "excerpt": "Собствената обектова страница изисква предварително записване на 0897 920 893 или чрез конкретната форма за начинаещата група."
        },
        "contact": "https://www.gaitani.com/posts/504"
      }
    },
    {
      "id": "sofia-gaitani-lyulin-dertliev25",
      "name": "Гайтани · Люлин 10",
      "cityCode": "68134",
      "neighborhood": "Люлин 10",
      "address": "София, ж.к. Люлин 10, бул. Д-р Петър Дертлиев 25, сграда на магазин Лабиринт, ет. 3, зала Хоп-троп",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://www.gaitani.com/",
      "phone": "+359897920893",
      "services": [
        {
          "name": "Народни танци за начинаещи · групово посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "7 EUR за едно посещение с плащане на място. Заявката се потвърждава от клуба до 7 дни; тя не гарантира свободно място. Графикът се уточнява при записване.",
          "price": {
            "amount": 7,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно групово посещение",
            "sourceUrl": "https://docs.google.com/forms/d/e/1FAIpQLSd4_CdXoiZsl3S077b3BwK1DMONsGluePGtx-8vn7LawVyRrg/viewform?usp=send_form",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://docs.google.com/forms/d/e/1FAIpQLSd4_CdXoiZsl3S077b3BwK1DMONsGluePGtx-8vn7LawVyRrg/viewform?usp=send_form"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.gaitani.com/posts/503",
          "excerpt": "Собствената обектова страница изисква предварително записване на 0897 920 893 или чрез конкретната форма за начинаещата група."
        },
        "contact": "https://www.gaitani.com/posts/503"
      }
    },
    {
      "id": "sofia-gaitani-musagenitsa-belkovski1",
      "name": "Гайтани · Мусагеница",
      "cityCode": "68134",
      "neighborhood": "Мусагеница",
      "address": "София, ж.к. Мусагеница, ул. Проф. арх. Станчо Белковски 1, танцова зала към училищен комплекс Азбуки",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://www.gaitani.com/",
      "phone": "+359897920893",
      "services": [
        {
          "name": "Народни танци за начинаещи · групово посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "7 EUR за едно посещение с плащане на място. Заявката се потвърждава от клуба до 7 дни; тя не гарантира свободно място. Графикът се уточнява при записване.",
          "price": {
            "amount": 7,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно групово посещение",
            "sourceUrl": "https://docs.google.com/forms/d/e/1FAIpQLSeacgOb9p-8EuSzdr0Y3J1IB-e06TQJpeYCAPuWeRFhAp0_xw/viewform?usp=send_form",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://docs.google.com/forms/d/e/1FAIpQLSeacgOb9p-8EuSzdr0Y3J1IB-e06TQJpeYCAPuWeRFhAp0_xw/viewform?usp=send_form"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.gaitani.com/posts/484",
          "excerpt": "Собствената обектова страница изисква предварително записване на 0897 920 893 или чрез конкретната форма за начинаещата група."
        },
        "contact": "https://www.gaitani.com/posts/484"
      }
    },
    {
      "id": "sofia-gaitani-studentski-yosifov1",
      "name": "Гайтани · Студентски град",
      "cityCode": "68134",
      "neighborhood": "Студентски град",
      "address": "София, ж.к. Студентски град, ул. Йордан Йосифов 1, ет. 1 над Lidl, зала в Атлетик фитнес",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://www.gaitani.com/",
      "phone": "+359897920893",
      "services": [
        {
          "name": "Народни танци за начинаещи · групово посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "7 EUR за едно посещение с плащане на място. Заявката се потвърждава от клуба до 7 дни; тя не гарантира свободно място. Графикът се уточнява при записване.",
          "price": {
            "amount": 7,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно групово посещение",
            "sourceUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfUdprlIAfom1BFSPgX6SalQRVi8zFMhfd0ngybUADogTIhRA/viewform?usp=send_form",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://docs.google.com/forms/d/e/1FAIpQLSfUdprlIAfom1BFSPgX6SalQRVi8zFMhfd0ngybUADogTIhRA/viewform?usp=send_form"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.gaitani.com/posts/487",
          "excerpt": "Собствената обектова страница изисква предварително записване на 0897 920 893 или чрез конкретната форма за начинаещата група."
        },
        "contact": "https://www.gaitani.com/posts/487"
      }
    },
    {
      "id": "sofia-gaitani-lozenets-139ou",
      "name": "Гайтани · Лозенец",
      "cityCode": "68134",
      "neighborhood": "Лозенец",
      "address": "София, Лозенец, ул. Димитър Хаджикоцев 44, физкултурен салон на 139 ОУ Захарий Круша",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://www.gaitani.com/",
      "phone": "+359897920893",
      "services": [
        {
          "name": "Народни танци за начинаещи · групово посещение",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "7 EUR за едно посещение с плащане на място. Заявката се потвърждава от клуба до 7 дни; тя не гарантира свободно място. Графикът се уточнява при записване.",
          "price": {
            "amount": 7,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно групово посещение",
            "sourceUrl": "https://docs.google.com/forms/d/e/1FAIpQLSdDdkg9EaE675yLCJTZboCuH1Orwzm09Jdh1W0aj9dq58WmEQ/viewform?usp=send_form",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://docs.google.com/forms/d/e/1FAIpQLSdDdkg9EaE675yLCJTZboCuH1Orwzm09Jdh1W0aj9dq58WmEQ/viewform?usp=send_form"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://www.gaitani.com/posts/498",
          "excerpt": "Собствената обектова страница изисква предварително записване на 0897 920 893 или чрез конкретната форма за начинаещата група."
        },
        "contact": "https://www.gaitani.com/posts/498"
      }
    },
    {
      "id": "sofia-baiadery-mladost2-budnina",
      "name": "Клуб Баядери",
      "cityCode": "68134",
      "neighborhood": "Младост 2",
      "address": "София, ж.к. Младост 2, НЧ Бъднина до бл. 220, при метростанция Акад. Александър Теодоров-Балан",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://baiadery.com/",
      "phone": "+359888622909",
      "services": [
        {
          "name": "Народни танци за възрастни начинаещи · групов урок",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Групово обучение по български народни танци за възрастни в НЧ Бъднина, Младост 2. Записването и актуалната цена се уточняват с клуба по телефона.",
          "durationMin": 60,
          "durationSourceUrl": "https://baiadery.com/%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%BA-%D0%BD%D0%B0-%D0%B3%D1%80%D1%83%D0%BF%D0%B8%D1%82%D0%B5/",
          "durationCheckedOn": "2026-11-13"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359888622909"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://baiadery.com/%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%BA-%D0%BD%D0%B0-%D0%B3%D1%80%D1%83%D0%BF%D0%B8%D1%82%D0%B5/",
          "excerpt": "Актуалният собствен график за групите от септември2026 дава телефон 0888 622 909 за информация и записване в залата на НЧ Бъднина."
        },
        "contact": "https://baiadery.com/contact-us/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-redline-speed-prepurchase-mobile",
      "checkedOn": "2026-11-13",
      "website": "https://redline-speed.com/",
      "bookingEntry": "https://redline-speed.com/ogled-predi-pokupka",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://redline-speed.com/",
        "https://redline-speed.com/ogled-predi-pokupka",
        "https://redline-speed.com/services",
        "https://redline-speed.com/contact",
        "https://redline-speed.com/legal"
      ],
      "notes": "ActualownBookFIRSThomepage→contactpublicrequestformread, thenownerselectedprepurchasepageactualon-siterequestform/servicevariants/phone/email/dateoptionalfieldsreadwithoutchoicesorinputs/submission. SSRcurrentordinaryGETofselectedpageconfirms100EURpassengercarWITHOUTclient/115SUV/60motorcycle;90withclient/150inworkshopNOTprojected. Current100feeincludesVATandtransportSofia/surroundings; readerold30kmconditionNOTimportedbecausecurrentGETupdated. OwnserviceexplicitSofiaregionandphysicalsellerinspection, singlemobileoperator record/addressnullnotquarterclones. Currentpageannouncesworkshoprelocation: workshopinspectionstarts16Nov; on-siteinspectionsunchanged. ReaderoldVrazhdebnacontactvsrootAsenYordanov/nearArena8888notresolvedintoaccurateentrance, so no stationarypremise/coords imported; registeredLozenMogila53NOTvenue. Fulllegalterms4Nov2026readordinaryGETincludingtruncatedtailseparatelytoEOF: BOTEVGRUPEOOD204973207; standardcopyrightprotectedtexts/photos/logo/design, notautomatedextraction/datafactbanseen; no expressivecontent/photos/logos/sourceexampleVINreports copied. Requestnotcontract; ownerconfirmsdate/time/scopeprice; dismantlingexcludedunlessagreed, externalVINhistoryandroadtransportadditional. Ownselectedservice/minimalfreshdescriptiononly. No Mapsimage/routes/Google/geocoder/privateGPS/UI/challenge/captcha/consent/customerfields/booking/calls. Durationnotguessed, no guaranteedavailability."
    },
    {
      "id": "sofia-dunev-motor-sport-asen-yordanov4",
      "checkedOn": "2026-11-13",
      "website": "https://www.dunevmotorsport-r21.com/",
      "bookingEntry": "https://www.dunevmotorsport-r21.com/kontakti/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://www.dunevmotorsport-r21.com/",
        "https://www.dunevmotorsport-r21.com/kontakti/",
        "https://www.dunevmotorsport-r21.com/diagnostika-na-hodovata-chast-na-avtomobila/",
        "https://www.dunevmotorsport-r21.com/obshti-usloviya-dunev-motor-sport-r21/"
      ],
      "notes": "ActualownBookFIRSTcurrentcontactform/date/time/type-required/name/contact fields read ordinaryGET after readerTimeout; formrequestscontacttoarrangevisit, noguaranteedinstanttime. No customer/service/date/consent/QRchat/call/submission. FullselectedmachinechassisdiagnosticpagecurrentGET explicitly40EURHORIZONTALtestpassengercar; vertical40EUR separate, SUV/bus50eachnotprojected, not80combinedtestorrepairfee. Originalarticle2014datebut currentbodyliteralEURcheckednow; no conversionfromoldBGN. Mainownsourcecurrentnavstillselectedservice+exactcontactAsenYordanov4/0899832121. Fulllongservicewarranty/repairtermsreadbyordinaryGET withinitialtruncatedmiddle/tailseparatelytoEOF; explicitprearrangedday/timeofvehicleacceptance andphoneorder, prices/servicehourstakespublicinreception notimportedaswebamount. Oldertermslevpaymentsnotusedtocreatenewcurrency/price. Servicecontract/personaldata,nosourceextractionrestrictionseen, nolegalclearanceclaim. Selectedlawfulphysicaltestonly: unrelatedmileage-stopper/emissions/tuning/retailproductsnotselected. Visitorcomments/sourcephotos/ratings/embeddedMaps notcopied/opened. RootruntimeallWIP/native6dedupenooperatoraliasfoundbeforeadmission; finalauditrequired. No duration/guarantee/locationpointinvented."
    },
    {
      "id": "sofia-sheve-dance-albert-long5",
      "checkedOn": "2026-11-13",
      "website": "https://sheve.bg/",
      "bookingEntry": "https://sheve.bg/zapisvane/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://sheve.bg/",
        "https://sheve.bg/zapisvane/",
        "https://sheve.bg/obschi-usloviya/"
      ],
      "notes": "ActualownBookFIRSTselected/zapisvane completepublicname/surname/phone/emailenrolmentformandFAQphonefallbackread, no fields/button/submission. Fullselectedcurrentprogramme28Sep2026MonWed19:30, exactSofiaHadjiDimitarDrAlbertLong5, literal60min,7EURsingle;52EUR8visitsvalid6weekscardnotdivided. FAQexplicitadult+teenagers/nopartner, childgroup'Soon'NOTimported. Ownrootretailcostumerentalstorealsoinspectedforfooterandlinkedterms; costumeprices/deposits/rentalshopKirilDrangov79NOTdancevenueandnotselectedrealservice. Fulltermsall179linesrentalconditions,paymentandplaincopyright,nosourceextractionrestrictionseen; no assumptionallretailrulesareclassconditions,noconsent/licenceclaim. Publicsamephone0894470145andbookpageoffice@sheve.bg bindactualschoolandownerretailbrand; no runtime/WIPphone/domain/addressidentitymatch. SourceembeddedGoogle/FBreviews/photos ignorednotcopied/opened. ClassscheduleNOTopeninghours, no coordinates/availabilityinvented, no accounts/Maps/geocoder/providerexports/UI/booking/calls."
    },
    {
      "id": "sofia-gaitani-druzhba2-obikolna36",
      "checkedOn": "2026-11-13",
      "website": "https://www.gaitani.com/",
      "bookingEntry": "https://docs.google.com/forms/d/e/1FAIpQLScdBtt6gjIo8wfcwOQIg2cBF0mvbbjNO5pnT_4DGTET4Jpl3g/viewform?usp=send_form",
      "bookingReview": "provider_booking_reviewed",
      "reviewedUrls": [
        "https://www.gaitani.com/",
        "https://docs.google.com/forms/d/e/1FAIpQLScdBtt6gjIo8wfcwOQIg2cBF0mvbbjNO5pnT_4DGTET4Jpl3g/viewform?usp=send_form",
        "https://www.gaitani.com/posts/501",
        "https://www.gaitani.com/page/SOFIA/1",
        "https://www.gaitani.com/kontakti",
        "https://www.gaitani.com/uslovia/1",
        "https://www.gaitani.com/uslugi",
        "https://forms.gle/rs6o8iWfGDYGDxV39"
      ],
      "notes": "Currentownformandarticleindependently9Nov2026newbeginnersMonWed19:20,163OUObikolna36assemblyhall. Othergymgroupssame163OU notnewpremises; onlyoneGaitanirecord. ActualownerBookentryFIRSTeachindependentcurrentbrancharticle→observedforms.gle→resolvedpublicGoogleVIEWFORM; readerCachemiss/generic500redirectfollowedordinarypublicGET, no403/challengebypass. Completepublicfields/name/phone/emailandliteralbranch7EURsingle/49EURcalendarmonthread inowner-controlledform. SigninOFFERSdraftsaveonly; noaccountsignin, fields/options/buttons/submissions, noactualreservation. JavaScriptdisabledwarningreportedhonestly, formbodywascompletepublicSSR; noguaranteedinteractivecalendar/availabilityclaimed. Confirmationwithin7days;paymentonsite, monthlytotalnotdivided. FullcurrentownerSofiaprogrammeandfullcontacts/privacyread; privacyregisteredMladost4block420NOTdancevenue; standardcopyright+personaldata,cookiepolicy,noextractionbanseenonreadpolicy. AFTERthese selectedbranchforms/servicefeeswerefullyread,general/uslugireturnedverificationchallenge→STOPfutureallhostrequests; noalternateendpoint/bypassandnootherunpricedbranchesadded. Selectedbookingmenufullyreadbeforechallenge, notclaimwholechainpricecoverage. Centreheldbecausecitypageexplicitrepair/noactivitiesdespitefutureform;Flora65heldactualform410;VasilLevskiholdown'notcurrent'. No room/teacher/levelduplicates, no classageinferencefrom'groupof7years'(grouptenure,NOTchildage). No servicesduration/openinghours/coordsinvented. No merchantphotos/logos/reviews/expressioncopy, Maps/Nominatim/Googleplace/providerbulkexports/consent/calls/bookings."
    },
    {
      "id": "sofia-gaitani-mladost3-bl334",
      "checkedOn": "2026-11-13",
      "website": "https://www.gaitani.com/",
      "bookingEntry": "https://docs.google.com/forms/d/e/1FAIpQLSe5N1elLdi8xPD_ynv_kOI5LOzD9JTJvEHqKpBXIKGxkpuGSw/viewform?usp=send_form",
      "bookingReview": "provider_booking_reviewed",
      "reviewedUrls": [
        "https://www.gaitani.com/",
        "https://docs.google.com/forms/d/e/1FAIpQLSe5N1elLdi8xPD_ynv_kOI5LOzD9JTJvEHqKpBXIKGxkpuGSw/viewform?usp=send_form",
        "https://www.gaitani.com/posts/504",
        "https://www.gaitani.com/page/SOFIA/1",
        "https://www.gaitani.com/kontakti",
        "https://www.gaitani.com/uslovia/1",
        "https://www.gaitani.com/uslugi",
        "https://forms.gle/2Yz2UkmizHPsvepS9"
      ],
      "notes": "Currentownformandarticle9Nov2026beginnersMonWed20:20,ownerprivatebuildingbehind59ODZnextblock334. Hall1vsHall2/levelsNOTseparatebusinesses; onlyonewholephysicalGaitanicenter. ActualownerBookentryFIRSTeachindependentcurrentbrancharticle→observedforms.gle→resolvedpublicGoogleVIEWFORM; readerCachemiss/generic500redirectfollowedordinarypublicGET, no403/challengebypass. Completepublicfields/name/phone/emailandliteralbranch7EURsingle/49EURcalendarmonthread inowner-controlledform. SigninOFFERSdraftsaveonly; noaccountsignin, fields/options/buttons/submissions, noactualreservation. JavaScriptdisabledwarningreportedhonestly, formbodywascompletepublicSSR; noguaranteedinteractivecalendar/availabilityclaimed. Confirmationwithin7days;paymentonsite, monthlytotalnotdivided. FullcurrentownerSofiaprogrammeandfullcontacts/privacyread; privacyregisteredMladost4block420NOTdancevenue; standardcopyright+personaldata,cookiepolicy,noextractionbanseenonreadpolicy. AFTERthese selectedbranchforms/servicefeeswerefullyread,general/uslugireturnedverificationchallenge→STOPfutureallhostrequests; noalternateendpoint/bypassandnootherunpricedbranchesadded. Selectedbookingmenufullyreadbeforechallenge, notclaimwholechainpricecoverage. Centreheldbecausecitypageexplicitrepair/noactivitiesdespitefutureform;Flora65heldactualform410;VasilLevskiholdown'notcurrent'. No room/teacher/levelduplicates, no classageinferencefrom'groupof7years'(grouptenure,NOTchildage). No servicesduration/openinghours/coordsinvented. No merchantphotos/logos/reviews/expressioncopy, Maps/Nominatim/Googleplace/providerbulkexports/consent/calls/bookings."
    },
    {
      "id": "sofia-gaitani-lyulin-dertliev25",
      "checkedOn": "2026-11-13",
      "website": "https://www.gaitani.com/",
      "bookingEntry": "https://docs.google.com/forms/d/e/1FAIpQLSd4_CdXoiZsl3S077b3BwK1DMONsGluePGtx-8vn7LawVyRrg/viewform?usp=send_form",
      "bookingReview": "provider_booking_reviewed",
      "reviewedUrls": [
        "https://www.gaitani.com/",
        "https://docs.google.com/forms/d/e/1FAIpQLSd4_CdXoiZsl3S077b3BwK1DMONsGluePGtx-8vn7LawVyRrg/viewform?usp=send_form",
        "https://www.gaitani.com/posts/503",
        "https://www.gaitani.com/page/SOFIA/1",
        "https://www.gaitani.com/kontakti",
        "https://www.gaitani.com/uslovia/1",
        "https://www.gaitani.com/uslugi",
        "https://forms.gle/to3qwxXHc2jRPUxWA"
      ],
      "notes": "Currentownformandarticle9Nov2026beginnersMonWed19:30,LabirintPeterDertliev25floor3. FullSofiaprogrammeindependentlylabelsHoptropdancehall,samepremisenotnewroomclone. ActualownerBookentryFIRSTeachindependentcurrentbrancharticle→observedforms.gle→resolvedpublicGoogleVIEWFORM; readerCachemiss/generic500redirectfollowedordinarypublicGET, no403/challengebypass. Completepublicfields/name/phone/emailandliteralbranch7EURsingle/49EURcalendarmonthread inowner-controlledform. SigninOFFERSdraftsaveonly; noaccountsignin, fields/options/buttons/submissions, noactualreservation. JavaScriptdisabledwarningreportedhonestly, formbodywascompletepublicSSR; noguaranteedinteractivecalendar/availabilityclaimed. Confirmationwithin7days;paymentonsite, monthlytotalnotdivided. FullcurrentownerSofiaprogrammeandfullcontacts/privacyread; privacyregisteredMladost4block420NOTdancevenue; standardcopyright+personaldata,cookiepolicy,noextractionbanseenonreadpolicy. AFTERthese selectedbranchforms/servicefeeswerefullyread,general/uslugireturnedverificationchallenge→STOPfutureallhostrequests; noalternateendpoint/bypassandnootherunpricedbranchesadded. Selectedbookingmenufullyreadbeforechallenge, notclaimwholechainpricecoverage. Centreheldbecausecitypageexplicitrepair/noactivitiesdespitefutureform;Flora65heldactualform410;VasilLevskiholdown'notcurrent'. No room/teacher/levelduplicates, no classageinferencefrom'groupof7years'(grouptenure,NOTchildage). No servicesduration/openinghours/coordsinvented. No merchantphotos/logos/reviews/expressioncopy, Maps/Nominatim/Googleplace/providerbulkexports/consent/calls/bookings."
    },
    {
      "id": "sofia-gaitani-musagenitsa-belkovski1",
      "checkedOn": "2026-11-13",
      "website": "https://www.gaitani.com/",
      "bookingEntry": "https://docs.google.com/forms/d/e/1FAIpQLSeacgOb9p-8EuSzdr0Y3J1IB-e06TQJpeYCAPuWeRFhAp0_xw/viewform?usp=send_form",
      "bookingReview": "provider_booking_reviewed",
      "reviewedUrls": [
        "https://www.gaitani.com/",
        "https://docs.google.com/forms/d/e/1FAIpQLSeacgOb9p-8EuSzdr0Y3J1IB-e06TQJpeYCAPuWeRFhAp0_xw/viewform?usp=send_form",
        "https://www.gaitani.com/posts/484",
        "https://www.gaitani.com/page/SOFIA/1",
        "https://www.gaitani.com/kontakti",
        "https://www.gaitani.com/uslovia/1",
        "https://www.gaitani.com/uslugi",
        "https://forms.gle/VQSRgRv7Z3vdABZs5"
      ],
      "notes": "Currentownformandarticle13Oct2026beginnersTueThu20:10,whiteAzbukischoolbuildingopposite8thschool. ActualAzbukihostnotGaitanioperatoralias, independentGaitanibrand/phone/form; no schooladmissionimport. ActualownerBookentryFIRSTeachindependentcurrentbrancharticle→observedforms.gle→resolvedpublicGoogleVIEWFORM; readerCachemiss/generic500redirectfollowedordinarypublicGET, no403/challengebypass. Completepublicfields/name/phone/emailandliteralbranch7EURsingle/49EURcalendarmonthread inowner-controlledform. SigninOFFERSdraftsaveonly; noaccountsignin, fields/options/buttons/submissions, noactualreservation. JavaScriptdisabledwarningreportedhonestly, formbodywascompletepublicSSR; noguaranteedinteractivecalendar/availabilityclaimed. Confirmationwithin7days;paymentonsite, monthlytotalnotdivided. FullcurrentownerSofiaprogrammeandfullcontacts/privacyread; privacyregisteredMladost4block420NOTdancevenue; standardcopyright+personaldata,cookiepolicy,noextractionbanseenonreadpolicy. AFTERthese selectedbranchforms/servicefeeswerefullyread,general/uslugireturnedverificationchallenge→STOPfutureallhostrequests; noalternateendpoint/bypassandnootherunpricedbranchesadded. Selectedbookingmenufullyreadbeforechallenge, notclaimwholechainpricecoverage. Centreheldbecausecitypageexplicitrepair/noactivitiesdespitefutureform;Flora65heldactualform410;VasilLevskiholdown'notcurrent'. No room/teacher/levelduplicates, no classageinferencefrom'groupof7years'(grouptenure,NOTchildage). No servicesduration/openinghours/coordsinvented. No merchantphotos/logos/reviews/expressioncopy, Maps/Nominatim/Googleplace/providerbulkexports/consent/calls/bookings."
    },
    {
      "id": "sofia-gaitani-studentski-yosifov1",
      "checkedOn": "2026-11-13",
      "website": "https://www.gaitani.com/",
      "bookingEntry": "https://docs.google.com/forms/d/e/1FAIpQLSfUdprlIAfom1BFSPgX6SalQRVi8zFMhfd0ngybUADogTIhRA/viewform?usp=send_form",
      "bookingReview": "provider_booking_reviewed",
      "reviewedUrls": [
        "https://www.gaitani.com/",
        "https://docs.google.com/forms/d/e/1FAIpQLSfUdprlIAfom1BFSPgX6SalQRVi8zFMhfd0ngybUADogTIhRA/viewform?usp=send_form",
        "https://www.gaitani.com/posts/487",
        "https://www.gaitani.com/page/SOFIA/1",
        "https://www.gaitani.com/kontakti",
        "https://www.gaitani.com/uslovia/1",
        "https://www.gaitani.com/uslugi",
        "https://forms.gle/ZZ5Nf8WmNJJyfUgH8"
      ],
      "notes": "Currentownformandarticle13Oct2026beginnersTueThu19:10,actualnamedYordanYosifov1floor1aboveLidlhostAthletic. FactsONLYfromindependentGaitanisource+ownform, NOAthleticrequests/termsoverride/genericgymadmission. Independentdanceoperatornotfitnessstaffalias. ActualownerBookentryFIRSTeachindependentcurrentbrancharticle→observedforms.gle→resolvedpublicGoogleVIEWFORM; readerCachemiss/generic500redirectfollowedordinarypublicGET, no403/challengebypass. Completepublicfields/name/phone/emailandliteralbranch7EURsingle/49EURcalendarmonthread inowner-controlledform. SigninOFFERSdraftsaveonly; noaccountsignin, fields/options/buttons/submissions, noactualreservation. JavaScriptdisabledwarningreportedhonestly, formbodywascompletepublicSSR; noguaranteedinteractivecalendar/availabilityclaimed. Confirmationwithin7days;paymentonsite, monthlytotalnotdivided. FullcurrentownerSofiaprogrammeandfullcontacts/privacyread; privacyregisteredMladost4block420NOTdancevenue; standardcopyright+personaldata,cookiepolicy,noextractionbanseenonreadpolicy. AFTERthese selectedbranchforms/servicefeeswerefullyread,general/uslugireturnedverificationchallenge→STOPfutureallhostrequests; noalternateendpoint/bypassandnootherunpricedbranchesadded. Selectedbookingmenufullyreadbeforechallenge, notclaimwholechainpricecoverage. Centreheldbecausecitypageexplicitrepair/noactivitiesdespitefutureform;Flora65heldactualform410;VasilLevskiholdown'notcurrent'. No room/teacher/levelduplicates, no classageinferencefrom'groupof7years'(grouptenure,NOTchildage). No servicesduration/openinghours/coordsinvented. No merchantphotos/logos/reviews/expressioncopy, Maps/Nominatim/Googleplace/providerbulkexports/consent/calls/bookings."
    },
    {
      "id": "sofia-gaitani-lozenets-139ou",
      "checkedOn": "2026-11-13",
      "website": "https://www.gaitani.com/",
      "bookingEntry": "https://docs.google.com/forms/d/e/1FAIpQLSdDdkg9EaE675yLCJTZboCuH1Orwzm09Jdh1W0aj9dq58WmEQ/viewform?usp=send_form",
      "bookingReview": "provider_booking_reviewed",
      "reviewedUrls": [
        "https://www.gaitani.com/",
        "https://docs.google.com/forms/d/e/1FAIpQLSdDdkg9EaE675yLCJTZboCuH1Orwzm09Jdh1W0aj9dq58WmEQ/viewform?usp=send_form",
        "https://www.gaitani.com/posts/498",
        "https://www.gaitani.com/page/SOFIA/1",
        "https://www.gaitani.com/kontakti",
        "https://www.gaitani.com/uslovia/1",
        "https://www.gaitani.com/uslugi",
        "https://forms.gle/Yq9NuecfcJPsHm6MA",
        "https://sites.google.com/view/139ou/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8"
      ],
      "notes": "Currentownform10Nov2026specificallynames139OUZahariKrushagym/Arsenalskiboulevard; officialHOSTschoolcontactindependentlyfullpostalDimitarHadzhikotsev44. Sameuniquenamedschool, no geocoding/Mapsderivedaddress. Ownarticle18:30vsactualform19:40startconflict, so publicschedule/time/durationOMITTEDandmustconfirmwithclub. Namedvenue/form7EURfeeunambiguous. ActualownerBookentryFIRSTeachindependentcurrentbrancharticle→observedforms.gle→resolvedpublicGoogleVIEWFORM; readerCachemiss/generic500redirectfollowedordinarypublicGET, no403/challengebypass. Completepublicfields/name/phone/emailandliteralbranch7EURsingle/49EURcalendarmonthread inowner-controlledform. SigninOFFERSdraftsaveonly; noaccountsignin, fields/options/buttons/submissions, noactualreservation. JavaScriptdisabledwarningreportedhonestly, formbodywascompletepublicSSR; noguaranteedinteractivecalendar/availabilityclaimed. Confirmationwithin7days;paymentonsite, monthlytotalnotdivided. FullcurrentownerSofiaprogrammeandfullcontacts/privacyread; privacyregisteredMladost4block420NOTdancevenue; standardcopyright+personaldata,cookiepolicy,noextractionbanseenonreadpolicy. AFTERthese selectedbranchforms/servicefeeswerefullyread,general/uslugireturnedverificationchallenge→STOPfutureallhostrequests; noalternateendpoint/bypassandnootherunpricedbranchesadded. Selectedbookingmenufullyreadbeforechallenge, notclaimwholechainpricecoverage. Centreheldbecausecitypageexplicitrepair/noactivitiesdespitefutureform;Flora65heldactualform410;VasilLevskiholdown'notcurrent'. No room/teacher/levelduplicates, no classageinferencefrom'groupof7years'(grouptenure,NOTchildage). No servicesduration/openinghours/coordsinvented. No merchantphotos/logos/reviews/expressioncopy, Maps/Nominatim/Googleplace/providerbulkexports/consent/calls/bookings."
    },
    {
      "id": "sofia-baiadery-mladost2-budnina",
      "checkedOn": "2026-11-13",
      "website": "https://baiadery.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://baiadery.com/",
        "https://baiadery.com/%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%BA-%D0%BD%D0%B0-%D0%B3%D1%80%D1%83%D0%BF%D0%B8%D1%82%D0%B5/",
        "https://baiadery.com/contact-us/"
      ],
      "notes": "ActualownBookFIRST→currentfullSchedulepublicnewadultgroupSep1_2026/MonWed20:20–21:20explicitinformation+enrolphones0886899705/0888622909. Selectedstable0888622909alsoownroot/contact, notanotherteacher/stafflisting. No instantcalendarpresent: contactformgenericinquiryNOTclaimedbooking, explicitphoneenrolused. FullactualselectedSchedule(currentupdate15Sep2026), fullcontact andcurrentroot/publicnav/footerread through ordinaryGET afterreadertruncatedroot. NO numericfeeontheactualselectedbooking/services/contactpages, no linkedPricesmenu orknowninaccessiblepricemenu; genuineunpublishedselectedadultbeginnerfee only, notclaimallhistoricalnews/priceselsewhereabsent. OldhomepageJan2025announcementnotusedas2026classproof; currentScheduleexplicitSep2026sameactualvenue. Selectedadult60minfromliteralcurrentinterval, child6–10/8–12differentprogrammesNOTprojected. No classscheduleasopeninghours. OwncontactpreciselyNCHBudninaMladost2nextblock220nearAlexTeodorovBalanstation, no street/housenumber/GPSinvented. Samephysicalhallalllevelsonebusiness, no host/staffclones; runtimeWIP/native6domain/phonenoidentitymatch. Visiblefooterordinarycopyright/no distinctsite-use/privacyextractionlinkseen, nolicence/acceptanceclaim. No expressivequote/photos/logos/reviews/Maps/providerexports/geocoder/UI/customerfields/calls/bookings.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://baiadery.com/%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%BA-%D0%BD%D0%B0-%D0%B3%D1%80%D1%83%D0%BF%D0%B8%D1%82%D0%B5/",
        "serviceUrls": [
          "https://baiadery.com/%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%BA-%D0%BD%D0%B0-%D0%B3%D1%80%D1%83%D0%BF%D0%B8%D1%82%D0%B5/"
        ],
        "notes": "ActualownBookFIRST→currentfullSchedulepublicnewadultgroupSep1_2026/MonWed20:20–21:20explicitinformation+enrolphones0886899705/0888622909. Selectedstable0888622909alsoownroot/contact, notanotherteacher/stafflisting. No instantcalendarpresent: contactformgenericinquiryNOTclaimedbooking, explicitphoneenrolused. FullactualselectedSchedule(currentupdate15Sep2026), fullcontact andcurrentroot/publicnav/footerread through ordinaryGET afterreadertruncatedroot. NO numericfeeontheactualselectedbooking/services/contactpages, no linkedPricesmenu orknowninaccessiblepricemenu; genuineunpublishedselectedadultbeginnerfee only, notclaimallhistoricalnews/priceselsewhereabsent. OldhomepageJan2025announcementnotusedas2026classproof; currentScheduleexplicitSep2026sameactualvenue. Selectedadult60minfromliteralcurrentinterval, child6–10/8–12differentprogrammesNOTprojected. No classscheduleasopeninghours. OwncontactpreciselyNCHBudninaMladost2nextblock220nearAlexTeodorovBalanstation, no street/housenumber/GPSinvented. Samephysicalhallalllevelsonebusiness, no host/staffclones; runtimeWIP/native6domain/phonenoidentitymatch. Visiblefooterordinarycopyright/no distinctsite-use/privacyextractionlinkseen, nolicence/acceptanceclaim. No expressivequote/photos/logos/reviews/Maps/providerexports/geocoder/UI/customerfields/calls/bookings."
      }
    }
  ]
};
