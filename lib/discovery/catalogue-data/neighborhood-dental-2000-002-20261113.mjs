// Minimal owner-source facts; real phone booking, no copied prose or source media.
export default {
  "records": [
    {
      "id": "sofia-violina-damyanova-ovcha-kupel418",
      "name": "Д-р Виолина Дамянова · стоматологичен кабинет",
      "cityCode": "68134",
      "neighborhood": "Овча купел 1",
      "address": "София, ж.к. Овча купел 1, бл. 418, вх. И, ет. 1",
      "locationKind": "premises",
      "coordinates": null,
      "category": "other",
      "website": "https://viodent.wixsite.com/viodent",
      "phone": "+359886532246",
      "booking": {
        "kind": "phone",
        "phone": "+359886532246"
      },
      "services": [
        {
          "name": "Стоматологичен преглед · редовно работно време",
          "category": "other",
          "appointmentModel": "appointment",
          "description": "Публикуваната тарифа е за редовно работно време. След 20 ч. и в почивните дни се прилага коефициент 1,5; актуалните условия и часът се потвърждават от кабинета.",
          "price": {
            "amount": 10,
            "currency": "BGN",
            "kind": "fixed",
            "sourceUrl": "https://viodent.wixsite.com/viodent/services",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        },
        {
          "name": "Полиране на зъбите с AirFlow · редовно работно време",
          "category": "other",
          "appointmentModel": "appointment",
          "description": "Самостоятелно публикувана тарифа за полиране с AirFlow в редовно работно време. След 20 ч. и в почивните дни се прилага коефициент 1,5; не е обещание за включено отделно почистване на зъбен камък.",
          "price": {
            "amount": 60,
            "currency": "BGN",
            "kind": "fixed",
            "sourceUrl": "https://viodent.wixsite.com/viodent/services",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://viodent.wixsite.com/viodent/contact",
          "excerpt": "Запишете час сега на тел. 0886 532 246; кабинет в Овча купел 1, бл. 418, вх. И, ет. 1."
        },
        "contact": "https://viodent.wixsite.com/viodent/contact"
      }
    },
    {
      "id": "sofia-emdent-sarafov6",
      "name": "Емдент · стоматологичен център",
      "cityCode": "68134",
      "neighborhood": "Сухата река",
      "address": "София, ж.к. Сухата река, ул. Михаил Сарафов 6",
      "locationKind": "premises",
      "coordinates": null,
      "category": "other",
      "website": "https://speshen-zabolekar.com/",
      "phone": "+359882306084",
      "booking": {
        "kind": "phone",
        "phone": "+359882306084"
      },
      "services": [
        {
          "name": "Обстоен стоматологичен преглед",
          "category": "other",
          "appointmentModel": "appointment",
          "description": "Публикувана ориентировъчна тарифа с включено ДДС. Крайната цена зависи от конкретния случай и се уточнява с кабинета; часът е след предварителна уговорка.",
          "price": {
            "amount": 20,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://speshen-zabolekar.com/cenorazpis/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        },
        {
          "name": "Почистване на зъбен камък",
          "category": "other",
          "appointmentModel": "appointment",
          "description": "Ориентировъчна публикувана тарифа с включено ДДС. Полирането с AirFlow е отделно тарифирано и не е включено автоматично в тази сума.",
          "price": {
            "amount": 60,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://speshen-zabolekar.com/cenorazpis/",
            "checkedOn": "2026-11-13",
            "validUntil": "2027-02-11"
          }
        }
      ],
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-13",
        "validUntil": "2027-02-11",
        "booking": {
          "url": "https://speshen-zabolekar.com/make-appointment/",
          "excerpt": "Запиши час: +359 882 306 084. Собствената страница за записване и контактите приемат предварителни телефонни уговорки."
        },
        "contact": "https://speshen-zabolekar.com/contacts/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-violina-damyanova-ovcha-kupel418",
      "website": "https://viodent.wixsite.com/viodent",
      "checkedOn": "2026-11-13",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://viodent.wixsite.com/viodent",
        "https://viodent.wixsite.com/viodent/contact",
        "https://viodent.wixsite.com/viodent/services",
        "https://viodent.wixsite.com/viodent/about"
      ],
      "notes": "Actual owner Book entry first opens own contact page; explicit phone reservation instruction and exact OvchaKupel1/block418/entranceИ/floor1 confirmed with same mobile in all pages. Entire native Services tariff read, including after20/off-day coefficient1.5 and technician/material inclusions. Only plain examination10BGN and standalone AirFlow60BGN selected; no anesthesia/addon/material fee or combined tartar-cleaning total invented. Currency is literal published BGN, not a claimed current EUR tariff; existing UI converts presentation. Source has no embedded tariff effective date; checkedOn records observation only, not owner confirmation. Copyright2013 is not treated as a new update date. Working hours conflict between contact body and repeated footer, so omitted. No other price/booking navigation or external engine on fully read home/service/contact pages. Current public HTTPS200 Services tariff and About subsequently read after cache miss and repairing the local text parser; exact named private dental practice confirmed. No qualifications imported. Public Wix robots allows these pages; no terms/fee licence asserted. No source photos, ratings, qualifications, reviews, coordinates, customer data or form submission imported."
    },
    {
      "id": "sofia-emdent-sarafov6",
      "website": "https://speshen-zabolekar.com/",
      "checkedOn": "2026-11-13",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://speshen-zabolekar.com/",
        "https://speshen-zabolekar.com/make-appointment/",
        "https://speshen-zabolekar.com/cenorazpis/",
        "https://speshen-zabolekar.com/contacts/",
        "https://speshen-zabolekar.com/uslugi/parodontologiq/",
        "https://speshen-zabolekar.com/obshti-usloviq-za-izpolzvane/"
      ],
      "notes": "Actual owner Book linked HTTP path followed normally to HTTPS appointment page; it offers explicit telephone reservations, not a rendered live calendar. Same actual phone882306084/address repeated on selected booking, dedicated contact, tariff and footer. Entire native fee menu read before selecting only examination20EUR and tartar-cleaning60EUR, not separate AirFlow30, child35cleaning/polish, insured copayments, materials or complex procedural totals. All amounts includeVAT and FAQ qualifies as indicative; public descriptions preserve both, no fabricated lower-bound/from or duration. Current contact hoursMonSat08–20/Sun10–18 conflict with repeated footerMonFri and generic booking24/7, therefore omitted pending clarification. One service-page CTA has obvious placeholder888123456; NOT used in listing or booking, primary dedicated contacts are consistent. Full public terms read: general IP/within-law conditions, not an automation access or database-extraction ban; only minimal independently phrased factual reference, no prose/media/table reproduction or licence claim. About timeout not completed, not claimed. General emergency marketing does not turn a dental centre into another excluded doctor clinic; selected dental services only. No map links, Google/Nominatim, customer data, forms, account, calls, notifications or production writes."
    }
  ]
}
