// Owned home-visit tariffs reviewed 2026-11-11; no district or premises clones.
export default {
  "records": [
    {
      "id": "sofia-bg-kanali-group",
      "name": "БГ Канали Груп ЕООД",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://bgkanaligroup.com/",
      "phone": "+359877754245",
      "services": [
        {
          "name": "Отпушване на канал в баня или кухня",
          "category": "home_services",
          "description": "Начална тарифа. Точната стойност се потвърждава след оглед; посещението се уговаря предварително по телефона.",
          "price": {
            "amount": 130,
            "currency": "EUR",
            "kind": "from",
            "unit": "услуга",
            "sourceUrl": "https://bgkanaligroup.com/vik-uslugi/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Машинно отпушване на канал / щранг",
          "category": "home_services",
          "description": "Начална тарифа за машинно отпушване. Обхватът и крайната цена се уточняват след оглед.",
          "price": {
            "amount": 180,
            "currency": "EUR",
            "kind": "from",
            "unit": "услуга",
            "sourceUrl": "https://bgkanaligroup.com/vik-uslugi/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Видеодиагностика на канализация",
          "category": "home_services",
          "description": "Начална тарифа; запис на носител е посочен като опция. Крайна оферта след оценка на място.",
          "price": {
            "amount": 70,
            "currency": "EUR",
            "kind": "from",
            "unit": "услуга",
            "sourceUrl": "https://bgkanaligroup.com/vik-uslugi/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Смяна на смесител",
          "category": "home_services",
          "description": "Начална тарифа. Частите, условията на достъп и крайната оферта се уточняват с изпълнителя преди работа.",
          "price": {
            "amount": 45,
            "currency": "EUR",
            "kind": "from",
            "unit": "услуга",
            "sourceUrl": "https://bgkanaligroup.com/vik-uslugi/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Ремонт на тоалетно казанче",
          "category": "home_services",
          "description": "Начална тарифа за ремонт на обикновено казанче, не на вградено. Крайната цена е след оглед.",
          "price": {
            "amount": 35,
            "currency": "EUR",
            "kind": "from",
            "unit": "услуга",
            "sourceUrl": "https://bgkanaligroup.com/vik-uslugi/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Посещение и диагностика на ВиК проблем",
          "category": "home_services",
          "description": "Публикувана тарифа за посещение и диагностика. Аварийните и нощните посещения са с отделни цени.",
          "price": {
            "amount": 30,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "услуга",
            "sourceUrl": "https://bgkanaligroup.com/vik-uslugi/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359877754245"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://bgkanaligroup.com/",
          "excerpt": "ние ще обсъдим вашия проблем и ще насрочим удобен час за посещение"
        },
        "contact": "https://bgkanaligroup.com/kontakti/"
      }
    },
    {
      "id": "sofia-cleaning-sofia",
      "name": "Cleaning Sofia",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://www.cleaningsofia.com/",
      "phone": "+359888990348",
      "services": [
        {
          "name": "Основно почистване на жилище",
          "category": "home_services",
          "description": "Минимална поръчка 80 €. Тарифата е за кв.м; точната сума се определя след оглед според замърсяване и достъп.",
          "price": {
            "amount": 3,
            "currency": "EUR",
            "kind": "from",
            "unit": "кв.м; минимална поръчка 80 €",
            "sourceUrl": "https://www.cleaningsofia.com/ceni",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Почистване след ремонт",
          "category": "home_services",
          "description": "Минимална поръчка 80 €. Начална ставка на кв.м; по-висока цена е възможна при силно замърсяване. Окончателна оферта след оглед.",
          "price": {
            "amount": 3.5,
            "currency": "EUR",
            "kind": "from",
            "unit": "кв.м; минимална поръчка 80 €",
            "sourceUrl": "https://www.cleaningsofia.com/ceni",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на диван · от 2 до 4 места",
          "category": "home_services",
          "description": "Публикуван диапазон за двуместен до четириместен диван. Минималната обща поръчка е 80 €, дори отделният артикул да е по-евтин.",
          "price": {
            "amount": 35,
            "currency": "EUR",
            "kind": "range",
            "maximum": 49,
            "unit": "диван; минимална поръчка 80 €",
            "sourceUrl": "https://www.cleaningsofia.com/ceni",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на фотьойл",
          "category": "home_services",
          "description": "Цена за един фотьойл на адрес. Минималната обща поръчка е 80 €, дори отделният артикул да е по-евтин.",
          "price": {
            "amount": 20,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "брой; минимална поръчка 80 €",
            "sourceUrl": "https://www.cleaningsofia.com/ceni",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на мокети и килими",
          "category": "home_services",
          "description": "Цена на кв.м на адрес. Минимална обща поръчка 80 €. Изпълнението и денят се уговарят с фирмата.",
          "price": {
            "amount": 2.5,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "кв.м; минимална поръчка 80 €",
            "sourceUrl": "https://www.cleaningsofia.com/ceni",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Почистване на прозорци и дограма · двустранно",
          "category": "home_services",
          "description": "Ставка на кв.м за двустранно почистване. Минимална поръчка 80 €; следремонтните прозорци са с друга тарифа.",
          "price": {
            "amount": 5,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "кв.м; минимална поръчка 80 €",
            "sourceUrl": "https://www.cleaningsofia.com/ceni",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359888990348"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://www.cleaningsofia.com/",
          "excerpt": "Ще ви се обадим, за да уговорим удобен ден."
        },
        "contact": "https://www.cleaningsofia.com/kontakti"
      }
    },
    {
      "id": "sofia-vasilevi-clean",
      "name": "Почистване Василеви · Vasilevi Clean",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://vasilevi-clean.com/",
      "phone": "+359877311581",
      "services": [
        {
          "name": "Пране на мека мебел",
          "category": "home_services",
          "description": "Тарифа за едно седящо място, не за цял диван. Минималната поръчка за София е 46,02 €. Денят и крайният обхват се уговарят предварително.",
          "price": {
            "amount": 6.14,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "седящо място; минимална поръчка 46,02 €",
            "sourceUrl": "https://vasilevi-clean.com/%D1%86%D0%B5%D0%BD%D0%B8/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на стол",
          "category": "home_services",
          "description": "Цена за един стол. Минималната обща поръчка в София е 46,02 €. Изпълнение на адрес след уговорка.",
          "price": {
            "amount": 5.11,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "брой; минимална поръчка 46,02 €",
            "sourceUrl": "https://vasilevi-clean.com/%D1%86%D0%B5%D0%BD%D0%B8/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на фотьойл",
          "category": "home_services",
          "description": "Цена за един фотьойл. Минималната обща поръчка в София е 46,02 €. Изпълнение на адрес след уговорка.",
          "price": {
            "amount": 9.2,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "брой; минимална поръчка 46,02 €",
            "sourceUrl": "https://vasilevi-clean.com/%D1%86%D0%B5%D0%BD%D0%B8/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на единичен матрак",
          "category": "home_services",
          "description": "Цена за единичен матрак. Размерът и дали се обработва едната или и двете страни се уточняват с фирмата. Минимална обща поръчка за София 46,02 €.",
          "price": {
            "amount": 17.9,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "матрак; минимална поръчка 46,02 €",
            "sourceUrl": "https://vasilevi-clean.com/%D1%86%D0%B5%D0%BD%D0%B8/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на двоен матрак",
          "category": "home_services",
          "description": "Цена за двоен матрак. Страните и точният размер се уточняват с фирмата. Минимална обща поръчка за София 46,02 €.",
          "price": {
            "amount": 35.79,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "матрак; минимална поръчка 46,02 €",
            "sourceUrl": "https://vasilevi-clean.com/%D1%86%D0%B5%D0%BD%D0%B8/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Абонаментно почистване на офис 15–50 кв.м",
          "category": "home_services",
          "description": "Начална цена за едно посещение при абонамент веднъж седмично, не за еднократно основно почистване. Точна оферта след безплатен оглед.",
          "price": {
            "amount": 9.2,
            "currency": "EUR",
            "kind": "from",
            "unit": "посещение при седмичен абонамент",
            "sourceUrl": "https://vasilevi-clean.com/%D1%86%D0%B5%D0%BD%D0%B8/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359877311581"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://vasilevi-clean.com/",
          "excerpt": "Нашият екип пристига в уговорения ден и час"
        },
        "contact": "https://vasilevi-clean.com/contact/"
      }
    },
    {
      "id": "sofia-besnite-chistachi",
      "name": "Бесните Чистачи",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://besnitechistachi.bg/",
      "phone": "+359897511455",
      "services": [
        {
          "name": "Еднократно основно почистване",
          "category": "home_services",
          "description": "Тарифа без ДДС за кв.м, минимум 180 € без ДДС на обект. Над 600 кв.м е след оглед. Крайната сума и денят се потвърждават предварително.",
          "price": {
            "amount": 2.21,
            "currency": "EUR",
            "kind": "range",
            "maximum": 2.73,
            "unit": "кв.м без ДДС; минимум 180 € без ДДС",
            "sourceUrl": "https://besnitechistachi.bg/uslugi/osnovno-pochistvane",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на мокет или килим на място",
          "category": "home_services",
          "description": "Тарифа без ДДС на кв.м за пране на адрес, без демонтаж. Общата поръчка, достъпът и възможният минимален разход за екип се уточняват по телефона.",
          "price": {
            "amount": 1.47,
            "currency": "EUR",
            "kind": "range",
            "maximum": 2.8,
            "unit": "кв.м без ДДС",
            "sourceUrl": "https://besnitechistachi.bg/uslugi/prane-na-moketi-i-mebeli",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на работен стол",
          "category": "home_services",
          "description": "Диапазон за един работен стол, без ДДС. Поръчката и условията за излизане на екип се уточняват преди уговорката.",
          "price": {
            "amount": 5,
            "currency": "EUR",
            "kind": "range",
            "maximum": 8,
            "unit": "брой без ДДС",
            "sourceUrl": "https://besnitechistachi.bg/uslugi/prane-na-moketi-i-mebeli",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на двуместен диван",
          "category": "home_services",
          "description": "Публикувана цена за двуместен диван без ДДС. Посещение и обща оферта се уговарят с фирмата.",
          "price": {
            "amount": 31,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "диван без ДДС",
            "sourceUrl": "https://besnitechistachi.bg/uslugi/prane-na-moketi-i-mebeli",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Пране на триместен диван",
          "category": "home_services",
          "description": "Публикувана цена за триместен диван без ДДС. Посещение и обща оферта се уговарят с фирмата.",
          "price": {
            "amount": 41,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "диван без ДДС",
            "sourceUrl": "https://besnitechistachi.bg/uslugi/prane-na-moketi-i-mebeli",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359897511455"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://besnitechistachi.bg/ogled",
          "excerpt": "Обадете се и ще уговорим часа за секунди."
        },
        "contact": "https://besnitechistachi.bg/"
      }
    },
    {
      "id": "sofia-aledora-cleaning",
      "name": "ALEDORA · Професионално почистване",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://aledorabg.com/",
      "phone": "+359899879754",
      "services": [
        {
          "name": "Основно почистване на гарсониера",
          "category": "home_services",
          "description": "Начална цена; минимална поръчка 100 €. След безплатен оглед фирмата изготвя индивидуална оферта и се уточнява изпълнението.",
          "price": {
            "amount": 100,
            "currency": "EUR",
            "kind": "from",
            "unit": "жилище; минимална поръчка 100 €",
            "sourceUrl": "https://aledorabg.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Основно почистване на двустаен апартамент",
          "category": "home_services",
          "description": "Начална цена за двустаен апартамент. Обхватът и окончателната оферта се потвърждават след безплатен оглед.",
          "price": {
            "amount": 140,
            "currency": "EUR",
            "kind": "from",
            "unit": "жилище",
            "sourceUrl": "https://aledorabg.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Основно почистване на тристаен апартамент",
          "category": "home_services",
          "description": "Начална цена за тристаен апартамент. Обхватът, денят и окончателната оферта се уточняват с фирмата.",
          "price": {
            "amount": 190,
            "currency": "EUR",
            "kind": "from",
            "unit": "жилище",
            "sourceUrl": "https://aledorabg.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Основно почистване на къща до 100 кв.м",
          "category": "home_services",
          "description": "Начална цена за къща до 100 кв.м, не на квадратен метър. Индивидуална окончателна оферта след оглед.",
          "price": {
            "amount": 250,
            "currency": "EUR",
            "kind": "from",
            "unit": "къща до 100 кв.м",
            "sourceUrl": "https://aledorabg.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359899879754"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://aledorabg.com/",
          "excerpt": "Редовно почистване по график — седмично, двуседмично или месечно."
        },
        "contact": "https://aledorabg.com/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-bg-kanali-group",
      "checkedOn": "2026-11-11",
      "website": "https://bgkanaligroup.com/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://bgkanaligroup.com/",
        "https://bgkanaligroup.com/kontakti/",
        "https://bgkanaligroup.com/vik-uslugi/",
        "https://bgkanaligroup.com/vik-remonti-vodoprovodni/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Booking-first: homepage public workflow explicitly schedules a convenient home visit after phone/enquiry. Followed actual Заяви услуга to own plumbing detail, then reviewed current own service tariff and contact. Identified legal company БГ Канали Груп ЕООД and phone. One Sofia-wide mobile operator, not one per district; no premises distance or guessed coordinates. Retained from130/from180/from70/from45/from35 and30 diagnostic as printed; subscriptions, night/emergency callout prices and free inspection are not represented as standard repair prices. Final amount is confirmed after inspection; material inclusion is not assumed. No ratings, copied photos or booking submission."
    },
    {
      "id": "sofia-cleaning-sofia",
      "checkedOn": "2026-11-11",
      "website": "https://www.cleaningsofia.com/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://www.cleaningsofia.com/",
        "https://www.cleaningsofia.com/kontakti",
        "https://www.cleaningsofia.com/ceni"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Booking-first: actual Получи оферта targets /kontakti. Normal preview cache missed, read-only public GET succeeded; source saved cleaningsofia-booking-source.html. Its visible enquiry opens the client's email rather than a true instant-book calendar, so retained real phone booking, with agreed day/inspection. Followed current homepage tariff link to /ceni; older /prices has conflicting stale values and is NOT used. Current /ceni lists minimum80EUR, exact quote after inspection, sofa35–49 and final consumer prices. Minimum80 repeated publicly for every service. Single Sofia-wide home-visit operator with null coordinates; no misleading district premises. No form submitted or availability claimed."
    },
    {
      "id": "sofia-vasilevi-clean",
      "checkedOn": "2026-11-11",
      "website": "https://vasilevi-clean.com/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://vasilevi-clean.com/",
        "https://vasilevi-clean.com/contact/",
        "https://vasilevi-clean.com/%D1%86%D0%B5%D0%BD%D0%B8/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Booking-first: inspected own Заяви оглед/contact route, phone and visible request form, followed exact Prices link. Web preview timed out; live read-only owner HTML GETs succeeded and saved vasilevi-owner, vasilevi-booking and vasilevi-tariff source HTML. Current tariff EUR values retained literally, not converted from older same-phone pochistvane-vasilevi.com BGN tariff, which is the same provider and must not become another listing. Minimum46.02 applies furniture order and is visible per applicable service. Office9.20 is per visit only with weekly subscription; not a one-off price. Excluded ambiguous carpet split and window minimums, plus cleaning rates whose contamination/night qualifications need fuller service review. No guessed duration, calendar availability, VAT or branch."
    },
    {
      "id": "sofia-besnite-chistachi",
      "checkedOn": "2026-11-11",
      "website": "https://besnitechistachi.bg/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://besnitechistachi.bg/",
        "https://besnitechistachi.bg/ogled",
        "https://besnitechistachi.bg/uslugi/osnovno-pochistvane",
        "https://besnitechistachi.bg/uslugi/prane-na-moketi-i-mebeli"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Booking-first: inspected own /ogled appointment wrapper and explicit telephone hour-arrangement fallback; public GET HTMLs saved after preview cache misses. Google calendar is lazy loaded; did not click into or claim verified live availability, retained real phone route. Followed own detailed service pages after homepage calculator; literal basic2.21–2.73EUR per sqm minimum180 BEFORE VAT and upholstery1.47–2.80/5–8/31/41 BEFORE VAT retained. Every public item explicitly says без ДДС. No invented 20% gross conversion. Did not mislabel free10–15min inspection as free cleaning. Homepage mentions35–40 minimum only for less-frequent office subscriptions; not silently imposed on different upholstery. Operator covers Sofia mobile; no invented premises or cloned districts."
    },
    {
      "id": "sofia-aledora-cleaning",
      "checkedOn": "2026-11-11",
      "website": "https://aledorabg.com/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://aledorabg.com/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Booking-first: inspected actual Заяви безплатна оферта anchor leading to phone/Viber/Facebook contact on same official page, with free inspection and individual offer, and scheduled regular home-cleaning service. Phone is real own-page contact, not invented calendar integration. Retained only clear EUR from100/140/190/250 house types, minimum100 and inspection conditions. Excluded ambiguous wording от250–500 after repair and от6–10 window ranges rather than pretending fixed or verified capped prices. No live slot promise, invented duration/VAT, copied reviews/photos, or district branch cloning. Single mobile Sofia operator; exact appointment and quote remain owner-confirmed."
    }
  ]
}
