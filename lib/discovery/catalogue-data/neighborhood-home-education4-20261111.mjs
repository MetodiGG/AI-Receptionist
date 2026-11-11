// Dated manually reviewed own appointment and literal tariff facts; no runtime external requests.
// Music Box evidence matched two existing canonical IDs; those duplicates are NOT new listings.
export default {
  "records": [
    {
      "id": "sofia-vn-serviz-home-repair",
      "name": "ВН Сервиз · ремонт на уреди на адрес",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://www.vn-serviz.com/",
      "phone": "+359893589636",
      "services": [
        {
          "name": "Посещение и диагностика на бойлер",
          "category": "home_services",
          "description": "Такса за посещение и диагностика. Окончателният ремонт се оферира отделно след оглед и съгласие.",
          "price": {
            "amount": 20,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.vn-serviz.com/serviz-remont-na-boileri-sofiq/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Ремонт на бойлер, който не загрява",
          "category": "home_services",
          "description": "Начална цена. Посещение и диагностика: 20 €; крайният ремонт и необходимите части се уточняват след оглед.",
          "price": {
            "amount": 45,
            "currency": "EUR",
            "kind": "from",
            "sourceUrl": "https://www.vn-serviz.com/serviz-remont-na-boileri-sofiq/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Ремонт на течащ бойлер",
          "category": "home_services",
          "description": "Начална цена. Посещение и диагностика: 20 €; крайният ремонт и необходимите части се уточняват след оглед.",
          "price": {
            "amount": 25,
            "currency": "EUR",
            "kind": "from",
            "sourceUrl": "https://www.vn-serviz.com/serviz-remont-na-boileri-sofiq/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Ремонт на прегряващ бойлер",
          "category": "home_services",
          "description": "Начална цена. Посещение и диагностика: 20 €; крайният ремонт и необходимите части се уточняват след оглед.",
          "price": {
            "amount": 40,
            "currency": "EUR",
            "kind": "from",
            "sourceUrl": "https://www.vn-serviz.com/serviz-remont-na-boileri-sofiq/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Посещение и диагностика на пералня",
          "category": "home_services",
          "description": "Такса за посещение и диагностика на пералня; цена за ремонта се дава след пълен оглед, преди изпълнението.",
          "price": {
            "amount": 20.45,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.vn-serviz.com/ремонт-на-перални-софия/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359893589636"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://www.vn-serviz.com/ремонт-на-перални-софия/",
          "excerpt": "Сервизната страница изрично изисква да се позвъни и запази час; посещението е на адрес в удобно време, с напомняне предния ден."
        },
        "contact": "https://www.vn-serviz.com/kontakti/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-vn-serviz-home-repair",
      "checkedOn": "2026-11-11",
      "website": "https://www.vn-serviz.com/",
      "bookingEntry": "phone",
      "reviewedUrls": [
        "https://www.vn-serviz.com/",
        "https://www.vn-serviz.com/serviz-remont-na-boileri-sofiq/",
        "https://www.vn-serviz.com/ремонт-на-перални-софия/",
        "https://www.vn-serviz.com/kontakti/"
      ],
      "bookingReview": "phone_booking_reviewed",
      "notes": "Owner phone appointment invitation and day-before reminder reviewed. One mobile Sofia operator, not one row per SEO district; business office not represented as customer's visit location. Boiler diagnosis20EUR and three exact from prices; washing-machine diagnosis20.45EUR is a different literal tariff, not rounded or merged. Final repair/parts require quote and consent; source does not specify whether diagnosis is deducted. Owner homepage, service and contact pages exposed no separate reuse terms link; no blanket licence claimed. Five concise factual services only, no photos/reviews/prose or bulk inventory."
    }
  ]
}
