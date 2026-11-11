// Representative own-source Sofia appointment facts reviewed 2026-11-11.
// No copied provider inventory, invented availability or district clones.
export default {
  "records": [
    {
      "id": "sofia-sofia-dog-walks-training",
      "name": "Sofia Dog Walks · индивидуално обучение на кучета",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "other",
      "website": "https://www.sofiadogwalks.com/",
      "phone": "+359878836930",
      "services": [
        {
          "name": "Индивидуално обучение на куче",
          "category": "other",
          "description": "Индивидуална тренировка с позитивни методи за дисциплина и поведение в София. Заявеният час се потвърждава по телефона; мястото се уточнява с изпълнителя.",
          "price": {
            "amount": 30,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.sofiadogwalks.com/",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "individual_training",
          "durationMin": 60,
          "durationSourceUrl": "https://www.sofiadogwalks.com/",
          "durationCheckedOn": "2026-11-11"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://www.sofiadogwalks.com/book-online"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://www.sofiadogwalks.com/booking-calendar/%D0%BE%D0%B1%D1%83%D1%87%D0%B5%D0%BD%D0%B8%D0%B5-%D0%BD%D0%B0-%D0%BA%D1%83%D1%87%D0%B5%D1%82%D0%B0",
          "excerpt": "Собствената страница за обучение предлага избор на ден и час и попълване на данни за кучето; потвърждение по телефона."
        },
        "contact": "https://www.sofiadogwalks.com/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-sofia-dog-walks-training",
      "website": "https://www.sofiadogwalks.com/",
      "inventoryIdentity": "59405cdd27f2b5e80ef282e6017910a1d088dbe3ea85cb057d2463757b8902d4",
      "bookingEntry": "https://www.sofiadogwalks.com/book-online",
      "bookingReview": "owned_booking_reviewed",
      "checkedOn": "2026-11-11",
      "reviewedUrls": [
        "https://www.sofiadogwalks.com/",
        "https://www.sofiadogwalks.com/book-online",
        "https://www.sofiadogwalks.com/booking-calendar/%D0%BE%D0%B1%D1%83%D1%87%D0%B5%D0%BD%D0%B8%D0%B5-%D0%BD%D0%B0-%D0%BA%D1%83%D1%87%D0%B5%D1%82%D0%B0"
      ],
      "notes": "Actual owner Book first: root→book-online→service-specific owned booking-calendar route for dog training. Its visible landing explicitly asks for day/time and pet details, confirms by telephone. Public landing reviewed, NOT rendered available slots or a successful form submission; no invented availability/customer data. Own root explicitly publishes individual positive-method training30 EUR/60min; actual own Book service menu separately corroborates30 EUR. One real mobile/service-area owner with ownphone0878836930, not a staff clone or physical salon. No business premises/point claimed; Sofia service area explicit, specific meeting place agreed with operator. Do NOT categorize as grooming/pets. Omit dog transport25 because homepage says individually negotiated vs Book25; omit overnighthomecare because not this training lane and no duration inventing. Owner footer/visible anchors expose no legal terms/policy route beyond generic copyright; not blanket permission. Own root live2026-11-11T05:42:41.383Z,2108003chars,SHA2565418140c50b6f6df5cd7b6cbb7488f0b6ab945fb40b4a77fe5e6158cec97dc45. No third-party prices/reviews/media, noGooglefetch, real call or booking."
    }
  ]
}
