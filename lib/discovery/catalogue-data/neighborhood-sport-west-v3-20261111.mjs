// Manually reviewed own appointment and literal tariff facts, 2026-11-11.
export default {
  "records": [
    {
      "id": "sofia-stretching-school-borovo",
      "name": "Stretching School · Борово",
      "cityCode": "68134",
      "neighborhood": "Борово",
      "address": "София, Борово, ул. Подуево 10",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://www.stretchingschool.com/",
      "phone": "+359877955716",
      "services": [
        {
          "name": "Стречинг · групова тренировка",
          "category": "fitness",
          "description": "Едно занимание с предварително записване. Студиото не приема карти MultiSport; промени и отказ са според правилата му.",
          "price": {
            "amount": 9,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно групово посещение",
            "sourceUrl": "https://www.stretchingschool.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "group_reservation",
          "durationMin": 60,
          "durationSourceUrl": "https://www.stretchingschool.com/faq/",
          "durationCheckedOn": "2026-11-11"
        },
        {
          "name": "Индивидуален стречинг",
          "category": "fitness",
          "description": "Индивидуална тренировка с предварителна уговорка. Отмяна е възможна до 24 часа преди началото според публикуваните правила.",
          "price": {
            "amount": 25,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "едно индивидуално занимание",
            "sourceUrl": "https://www.stretchingschool.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "individual_training"
        },
        {
          "name": "Стречинг · пакет 4 групови занимания",
          "category": "fitness",
          "description": "Обща цена за 4 занимания; валидност 30 дни от първото занятие. Не е цена за единично посещение.",
          "price": {
            "amount": 34,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "целият пакет от 4 групови занимания",
            "sourceUrl": "https://www.stretchingschool.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "group_reservation"
        },
        {
          "name": "Стречинг · пакет 8 групови занимания",
          "category": "fitness",
          "description": "Обща цена за 8 занимания; валидност 30 дни от първото занятие. Не е цена за единично посещение.",
          "price": {
            "amount": 64,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "целият пакет от 8 групови занимания",
            "sourceUrl": "https://www.stretchingschool.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "group_reservation"
        },
        {
          "name": "Индивидуален стречинг · пакет 4 тренировки",
          "category": "fitness",
          "description": "Обща цена за 4 индивидуални тренировки; валидност 30 дни от първото занятие. Не е цена за единично посещение.",
          "price": {
            "amount": 92,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "целият пакет от 4 индивидуални тренировки",
            "sourceUrl": "https://www.stretchingschool.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "individual_training"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359877955716"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://www.stretchingschool.com/faq/",
          "excerpt": "Да, за всички тренировки по стречинг в нашето студио в София е необходимо предварително записване."
        },
        "contact": "https://www.stretchingschool.com/faq/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-stretching-school-borovo",
      "checkedOn": "2026-11-11",
      "website": "https://www.stretchingschool.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://www.stretchingschool.com/",
        "https://www.stretchingschool.com/faq/"
      ],
      "notes": "Booking-first: followed actual Запиши се на урок buttons; public owner redirect cache miss. Then read owner FAQ actual reservation instructions and explicit real phone fallback0877955716; chosen booking is PHONE, not a falsely rendered online calendar. Owner FAQ says advance signup required for all sessions and confirms actualBorovoPoduevo10 branch. Then read current owner tariff9group/25private/34whole4group/64whole8group/92whole4private,30days fromfirst. Groupduration60min onFAQ. No generic gym access, online prerecorded course, oldMarch2026promotion, other-branch clone, photos/reviews or availability copied. Two-person42EUR unit not imported because pair/per-person scope not explicit."
    }
  ]
}
