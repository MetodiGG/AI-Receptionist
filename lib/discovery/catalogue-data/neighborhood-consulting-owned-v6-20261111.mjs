// Dated manually reviewed own appointment and literal tariff facts; no runtime external requests.
export default {
  "records": [
    {
      "id": "sofia-toni-chakarov-law",
      "name": "Тони Чакъров · адвокатска кантора",
      "cityCode": "68134",
      "neighborhood": "Център",
      "address": "София, ул. Алабин 29, ет. 6",
      "locationKind": "premises",
      "coordinates": null,
      "category": "consulting",
      "website": "https://lawyer-chakarov.com/",
      "phone": "+359888788847",
      "services": [
        {
          "name": "Правна консултация с адвокат",
          "category": "consulting",
          "description": "Публикуваното възнаграждение е за консултация до един астрономически час. Датата и часът се уговарят предварително; кантората изпраща потвърждение с адреса.",
          "price": {
            "amount": 100,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "до 60 минути",
            "sourceUrl": "https://lawyer-chakarov.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://lawyer-chakarov.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://lawyer-chakarov.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
          "excerpt": "Собственият FAQ указва записване след обаждане или писмено запитване във формуляра и СМС с адрес, дата и час след уговорката."
        },
        "contact": "https://lawyer-chakarov.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-toni-chakarov-law",
      "website": "https://lawyer-chakarov.com/",
      "bookingEntry": "https://lawyer-chakarov.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
      "bookingReview": "owned_booking_reviewed",
      "checkedOn": "2026-11-11",
      "reviewedUrls": [
        "https://lawyer-chakarov.com/",
        "https://lawyer-chakarov.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/"
      ],
      "notes": "Actual firstparty appointmentcontact page first: own FAQ explicitly howtobook(phone or owncontactform), rescheduling andSMSconfirmationwithaddress/date/time. Emptyname/email/phone/messageform inspected, no submission. Sameactualprimarypage explicitly prices this namedlawyer consultation100EURup-tooneastronomicalhour; no exactduration inferred from cap. SofiaCenterAlabin29floor6 andphone+359888788847 literallysameactualsource. No generic statutoryfee, freeprobonoeligibility, litigation or documentproduct imported. Publicheader/footer actualanchors and targeted own terms/copying/privacysearch reviewed; only educationalcopyrightarticles located, no specificsite-reuseclause; notlicenseapproval. Concisefactualparaphraseonly, no photos/ratings/reviews. Coordinatesunknown. Dedupe againststage781domain/phone/name:0. Zod+assessPricingReview with exactinventoryidentity tested."
    }
  ]
}
