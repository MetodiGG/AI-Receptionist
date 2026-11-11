// Two current EUR-tariff Sofia appointment operators, 2026-11-11.
// A historical BGN-only candidate was explicitly withheld, not converted.
export default {
  "records": [
    {
      "id": "sofia-vik-petrov-home-visits",
      "name": "ВиК Петров · водопроводчик",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://vik-petrov.com/",
      "phone": "+359896934144",
      "services": [
        {
          "name": "Монтаж на бойлер",
          "category": "home_services",
          "description": "Ориентировъчна цена за труд и дребни консумативи; уредите и основните материали са отделно. Транспортът в София е включен. Оглед 20 € се приспада при приета оферта; ДДС не е уточнен.",
          "price": {
            "amount": 50,
            "currency": "EUR",
            "kind": "range",
            "maximum": 80,
            "unit": "труд и дребни консумативи",
            "sourceUrl": "https://vik-petrov.com/ceni/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Монтаж на проточен бойлер",
          "category": "home_services",
          "description": "Ориентировъчна цена за труд и дребни консумативи; уредите и основните материали са отделно. Транспортът в София е включен. Оглед 20 € се приспада при приета оферта; ДДС не е уточнен.",
          "price": {
            "amount": 45,
            "currency": "EUR",
            "kind": "range",
            "maximum": 60,
            "unit": "труд и дребни консумативи",
            "sourceUrl": "https://vik-petrov.com/ceni/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Демонтаж и монтаж на смесител в баня",
          "category": "home_services",
          "description": "Ориентировъчна цена за труд и дребни консумативи; уредите и основните материали са отделно. Транспортът в София е включен. Оглед 20 € се приспада при приета оферта; ДДС не е уточнен.",
          "price": {
            "amount": 50,
            "currency": "EUR",
            "kind": "range",
            "maximum": 80,
            "unit": "труд и дребни консумативи",
            "sourceUrl": "https://vik-petrov.com/ceni/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://vik-petrov.com/kontakti/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://vik-petrov.com/ceni/",
          "excerpt": "Собственият ценоразпис приканва клиентите да насрочат удобно посещение; контактната форма заявява оглед с последващо потвърждение."
        },
        "contact": "https://vik-petrov.com/kontakti/"
      }
    },
    {
      "id": "sofia-top-vik-tulang-home-visits",
      "name": "TOP-VIK · ВиК услуги",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://top-vik.com/",
      "phone": "+359875357160",
      "services": [
        {
          "name": "Монтаж на обемен бойлер на готови изводи",
          "category": "home_services",
          "description": "Начална цена; минимум за ремонт/монтаж от 30 €. Транспортът в София е без доплащане, извън града по уговорка. ДДС и материали не са уточнени; окончателните условия се потвърждават при заявка.",
          "price": {
            "amount": 60,
            "currency": "EUR",
            "kind": "from",
            "sourceUrl": "https://top-vik.com/cenorazpis-na-vik-uslugi/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Монтаж на пералня или съдомиялна",
          "category": "home_services",
          "description": "Начална цена; минимум за ремонт/монтаж от 30 €. Транспортът в София е без доплащане, извън града по уговорка. ДДС и материали не са уточнени; окончателните условия се потвърждават при заявка.",
          "price": {
            "amount": 40,
            "currency": "EUR",
            "kind": "from",
            "sourceUrl": "https://top-vik.com/cenorazpis-na-vik-uslugi/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Откриване на теч или влага в самостоятелно жилище",
          "category": "home_services",
          "description": "Начална цена; минимум за ремонт/монтаж от 30 €. Транспортът в София е без доплащане, извън града по уговорка. ДДС и материали не са уточнени; окончателните условия се потвърждават при заявка.",
          "price": {
            "amount": 60,
            "currency": "EUR",
            "kind": "from",
            "sourceUrl": "https://top-vik.com/cenorazpis-na-vik-uslugi/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359875357160"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://top-vik.com/",
          "excerpt": "Началната страница има „Запази час за ВиК специалист“; контактната страница приема заявки за посещение от техник по телефона или чат."
        },
        "contact": "https://top-vik.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-vik-petrov-home-visits",
      "checkedOn": "2026-11-11",
      "website": "https://vik-petrov.com/",
      "bookingEntry": "https://vik-petrov.com/kontakti/",
      "reviewedUrls": [
        "https://vik-petrov.com/",
        "https://vik-petrov.com/kontakti/",
        "https://vik-petrov.com/obshti-uslovia/",
        "https://vik-petrov.com/ceni/"
      ],
      "bookingReview": "owned_booking_reviewed",
      "notes": "First-party actual request-visit form, telephone and own full Terms read before tariff. Named owner Theodor Petrov; form requests service and phone, followed by operator confirmation, not live availability. Three literal EUR ranges for labor only; indicative pending inspection, materials extra, Sofia transport included, 20 EUR inspection credited if work accepted, payable on refusal. VAT unstated, not inferred. Terms dated19May2026 include cancellation>=2hours before agreed visit; no explicit factual/commercial reuse ban encountered in all13 sections, not a licence claim. One Sofiawide home-visit operator, blank legal street omitted; no guessed GPS/quarter, photos/reviews/marketing prose copied. Root read own included/excluded list: small consumables(teflon/seals) ARE included, not all materials excluded. Public description and price.unit preserve that distinction."
    },
    {
      "id": "sofia-top-vik-tulang-home-visits",
      "checkedOn": "2026-11-11",
      "website": "https://top-vik.com/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://top-vik.com/",
        "https://top-vik.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
        "https://top-vik.com/policy/",
        "https://top-vik.com/%D0%B1%D0%B8%D1%81%D0%BA%D0%B2%D0%B8%D1%82%D0%BA%D0%B8/",
        "https://top-vik.com/cenorazpis-na-vik-uslugi/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Owner homepage actual Book CTA and live contact page reviewed; telephone or chat technician visit request, phone used without loading third-party chat or submitting. Live current pages name Tulang EOOD204102710, same phone, Sofia household service; own office address not customer service location. Own privacy and cookies policies dated23Oct2026 fully read; no separate usage Terms link or factual reuse ban encountered, not a permission claim. Three representative literal FROM prices from2026 own EUR tariff, minimum repair/install from30 EUR, transport Sofia free, outside agreed. VAT/material inclusion unstated, not invented. Live owner tariff matches cached table; one operator across multiple cities, only one Sofia record, no duration, marketing/photos/reviews imported."
    }
  ]
}
