// Dated manually reviewed own appointment and literal tariff facts; no runtime external requests.
export default {
  "records": [
    {
      "id": "sofia-petar-nikolov-law-alabin",
      "name": "Петър Николов · адвокатска кантора София",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Алабин 36, ет. 2",
      "locationKind": "premises",
      "coordinates": {
        "latitude": 42.6936,
        "longitude": 23.3219,
        "source": "https://advokatnikolov.com/",
        "method": "first_party_coordinates"
      },
      "category": "consulting",
      "website": "https://advokatnikolov.com/",
      "phone": "+359882744951",
      "services": [
        {
          "name": "Първоначална правна консултация",
          "category": "consulting",
          "description": "Обсъждане на случая и възможностите за правна защита. Хонорарът за последващата работа се определя отделно след запознаване с детайлите. Часът се потвърждава от кантората.",
          "price": {
            "amount": 130,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://advokatnikolov.com/",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://advokatnikolov.com/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://advokatnikolov.com/",
          "excerpt": "Собственият бутон „ЗАЯВИ КОНСУЛТАЦИЯ“ води към #contact с формуляр за име, имейл, телефон и казус; офис София е Алабин 36, ет. 2."
        },
        "contact": "https://advokatnikolov.com/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-petar-nikolov-law-alabin",
      "website": "https://advokatnikolov.com/",
      "bookingEntry": "https://advokatnikolov.com/",
      "bookingReview": "owned_booking_reviewed",
      "checkedOn": "2026-11-11",
      "reviewedUrls": [
        "https://advokatnikolov.com/",
        "https://advokatnikolov.com/privacy-policy"
      ],
      "notes": "Actual own Book CTA first: native anchor ЗАЯВИ КОНСУЛТАЦИЯ points to #contact; inspected empty form name/email/phone/message, no submission, payment or availability claim. FAQ explicitly states initial consultation130EUR; the subsequent honorarium is separately determined after details, not a claim that130 covers litigation. Own contact section distinguishes Varna TsarOsvoboditel44 from actual Sofia Alabin36floor2; ONE Sofia venue only, no copied Varna branch. No duration, neighborhood, coordinates, portrait, reviews, stars or hours invented. Own privacy page dated22Apr2026 read via ordinary public HTTP because research web fetch timed out; public homepage footer and targeted own-site terms/copying search reviewed. No separate reuse restriction found in inspected material, not a license/legal assurance. Only concise factual paraphrase retained, not protected prose. Dedupe checked against stage778 by domain/phone/name."
    }
  ]
}
