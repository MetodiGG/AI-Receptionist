// Dated manually reviewed own appointment and literal tariff facts; no runtime external requests.
export default {
  "records": [
    {
      "id": "sofia-master-fade-dragalevtsi",
      "name": "Master Fade Studio",
      "cityCode": "68134",
      "neighborhood": "Драгалевци",
      "address": "София, ул. Витошка Зорница 3",
      "locationKind": "premises",
      "coordinates": null,
      "category": "barber",
      "website": "https://masterfade.studio/",
      "phone": "+359887088888",
      "services": [
        {
          "name": "Мъжко подстригване · Fade",
          "category": "barber",
          "price": {
            "amount": 18,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://masterfade.studio/barber/services",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment",
          "durationMin": 30,
          "durationSourceUrl": "https://masterfade.studio/barber/services",
          "durationCheckedOn": "2026-11-11"
        },
        {
          "name": "Оформяне на брада",
          "category": "barber",
          "price": {
            "amount": 15,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://masterfade.studio/barber/services",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment",
          "durationMin": 30,
          "durationSourceUrl": "https://masterfade.studio/barber/services",
          "durationCheckedOn": "2026-11-11"
        },
        {
          "name": "Къса брада · един номер цялата",
          "category": "barber",
          "price": {
            "amount": 10,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://masterfade.studio/barber/services",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment",
          "durationMin": 20,
          "durationSourceUrl": "https://masterfade.studio/barber/services",
          "durationCheckedOn": "2026-11-11"
        },
        {
          "name": "Само Fade отстрани или един номер с машинка",
          "category": "barber",
          "price": {
            "amount": 15,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://masterfade.studio/barber/services",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment",
          "durationMin": 30,
          "durationSourceUrl": "https://masterfade.studio/barber/services",
          "durationCheckedOn": "2026-11-11"
        },
        {
          "name": "Боядисване в черно · боя, къна или шампоан",
          "category": "barber",
          "price": {
            "amount": 10,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://masterfade.studio/barber/services",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment",
          "durationMin": 45,
          "durationSourceUrl": "https://masterfade.studio/barber/services",
          "durationCheckedOn": "2026-11-11"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359887088888"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://masterfade.studio/barber/contacts",
          "excerpt": "Имате въпроси или искате да резервирате час? Един адрес и екип — изберете удобен за вас телефон. Barbershop +359887088888."
        },
        "contact": "https://masterfade.studio/barber/contacts"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-master-fade-dragalevtsi",
      "website": "https://masterfade.studio/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "checkedOn": "2026-11-11",
      "reviewedUrls": [
        "https://masterfade.studio/",
        "https://masterfade.studio/barber/home",
        "https://masterfade.studio/barber/booking",
        "https://masterfade.studio/barber/services",
        "https://masterfade.studio/barber/contacts",
        "https://masterfade.studio/robots.txt"
      ],
      "notes": "Actual own entry first: rootBarbershop -> BarberHome -> Reservation. After normal load, owner booking page explicitly requires client account/password; login dialog shown with one specialistAhmedMaster. Stopped before login or reservation, no bypass. Then own public Services fully loaded: five clean core EUR services with exact30/30/20/30/45minutes retained. Thread+brow and wax explicitly add-ons in own intro, excluded as standalone. VIP35EUR60min held because exact inclusions not clearly published, no fabricated bundle. Wash2EUR5min omitted to avoid addon-only ambiguity. Contact route explicitly invites appointment phone contact, exact barber phone+359887088888 distinct from nailphone+359887771205; uses legitimate phonefallback. Current owner exact streetVitoshkaZornitsa3. NeighborhoodDragalevtsi corroborated by public owner2025announcement sameaddress/phone, not guessed businesspoint. Current contact says MondaySunday with no exactclockhours, no timesinvented. EmbeddedGooglepoint is viewport2d/3d, NOT exactmarker, so coordinatesnull. No photos/reviews/prose or private data copied, no manual booking or confirmation. Mainrobots route soft404appHTML, no restrictivepolicy; no legalreuse licence claimed."
    }
  ]
}
