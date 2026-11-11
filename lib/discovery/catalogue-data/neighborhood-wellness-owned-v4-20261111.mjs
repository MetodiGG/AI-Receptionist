// Own-source appointment and fee review: 2026-11-11. No provider inventory or invented availability.
export default {
  "records": [
    {
      "id": "sofia-massage-corner-srebarna",
      "name": "Massage Corner Sofia",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Сребърна 15",
      "locationKind": "premises",
      "coordinates": null,
      "category": "health",
      "website": "https://www.bgmassagecorner.com/",
      "phone": "+359876047743",
      "services": [
        {
          "name": "Традиционен тайландски масаж",
          "category": "health",
          "description": "Заявка през собствения сайт; студиото потвърждава резервацията. Посочената цена е за това времетраене.",
          "price": {
            "amount": 55,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.bgmassagecorner.com/",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment",
          "durationMin": 60,
          "durationSourceUrl": "https://www.bgmassagecorner.com/",
          "durationCheckedOn": "2026-11-11"
        },
        {
          "name": "Аромамасаж с масла",
          "category": "health",
          "description": "Заявка през собствения сайт; студиото потвърждава резервацията. Посочената цена е за това времетраене.",
          "price": {
            "amount": 65,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.bgmassagecorner.com/",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment",
          "durationMin": 60,
          "durationSourceUrl": "https://www.bgmassagecorner.com/",
          "durationCheckedOn": "2026-11-11"
        },
        {
          "name": "Масаж на ходила",
          "category": "health",
          "description": "Заявка през собствения сайт; студиото потвърждава резервацията. Посочената цена е за това времетраене.",
          "price": {
            "amount": 40,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.bgmassagecorner.com/",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment",
          "durationMin": 30,
          "durationSourceUrl": "https://www.bgmassagecorner.com/",
          "durationCheckedOn": "2026-11-11"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://www.bgmassagecorner.com/booking"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://www.bgmassagecorner.com/booking",
          "excerpt": "Choose a service, date and time, then fill in your contact details. Our team will confirm your booking."
        },
        "contact": "https://www.bgmassagecorner.com/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-massage-corner-srebarna",
      "website": "https://www.bgmassagecorner.com/",
      "inventoryIdentity": "10a35d5e0a82a3ec2b6428a6cb9e1e8722d2d06799a466d934b6bcf42df7c1f4",
      "bookingEntry": "https://www.bgmassagecorner.com/booking",
      "bookingReview": "owned_booking_reviewed",
      "checkedOn": "2026-11-11",
      "reviewedUrls": [
        "https://www.bgmassagecorner.com/",
        "https://www.bgmassagecorner.com/booking"
      ],
      "notes": "Actual primary Book /booking followed FIRST; ordinary GET renders real service select, duration select with55/65/95EUR for first Thai service, dateinput, initiallydisabledtime select, name/phone/notes and ConfirmBooking. No date/time/customerdata selected, no availability API, submission or payments; authoritative slots NOT tested. Owner says team confirmation (rootwithin24h), so no instant booking guarantee. Own root tariff separately gives actual3 selected duration-specific fixedEURvalues (Thai60/55, aromaoil60/65, feet30/40); don't mislabel as generic from or use60minfeetpreview for30minvalue. 08 7604 7743 normalized0876047743. ActualSrebarna15/Sofia1407, no explicit district so neighborhoodnull; no geocoding/Maps fetch. robots ordinary404, root has genericcopyright and no linkedprivacy/generalterms; does NOT establish image/text license. Three ordinary nonmedical wellness massages only; no health/healing/certification claims, staffclone, images/reviews/providerdata imported. Root read literal owner table and actual native request-form control receipts: Thai60/55EUR, aroma60/65,feet30/40. Correct duration-price pairing and owner confirmation retained, no invented Srebarna district or authoritative availability."
    }
  ]
}
