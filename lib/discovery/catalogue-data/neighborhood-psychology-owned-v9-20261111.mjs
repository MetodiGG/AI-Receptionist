// Manually reviewed Sofia appointment businesses, 2026-11-11.
// Literal source fees and conditions; no runtime external requests or invented slots.
export default {
  "records": [
    {
      "id": "sofia-vili-dosheva-alabin",
      "name": "Вили Дошева · психолог и психотерапевт",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Алабин 50А",
      "locationKind": "premises",
      "coordinates": null,
      "category": "other",
      "website": "https://www.dosheva.com/",
      "phone": "+359888775649",
      "services": [
        {
          "name": "Индивидуално психологично консултиране",
          "category": "other",
          "description": "Лични трудности, тревожност, загуба, раздяла и подкрепа при осиновяване. След заявката за час кабинетът се свързва по телефон.",
          "price": {
            "amount": 30,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "сесия · 50 мин",
            "sourceUrl": "https://www.dosheva.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "appointment",
          "durationMin": 50,
          "durationSourceUrl": "https://www.dosheva.com/",
          "durationCheckedOn": "2026-11-11"
        },
        {
          "name": "Семейно психологично консултиране",
          "category": "other",
          "description": "Семейни отношения, осиновяване, развод или раздяла на родители. След заявката за час кабинетът се свързва по телефон; условията за участниците се уточняват при записване.",
          "price": {
            "amount": 30,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "сесия · 50 мин",
            "sourceUrl": "https://www.dosheva.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "appointment",
          "durationMin": 50,
          "durationSourceUrl": "https://www.dosheva.com/",
          "durationCheckedOn": "2026-11-11"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://www.dosheva.com/%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B2%D0%B0%D0%BD%D0%B5-%D0%BD%D0%B0-%D1%87%D0%B0%D1%81/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://www.dosheva.com/%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B2%D0%B0%D0%BD%D0%B5-%D0%BD%D0%B0-%D1%87%D0%B0%D1%81/",
          "excerpt": "Own actual reserve page asks for service/date/time and promises callback; public HTML contains Amelia-v2 booking component. Contact form explicitly does NOT reserve a session."
        },
        "contact": "https://www.dosheva.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-vili-dosheva-alabin",
      "website": "https://www.dosheva.com/",
      "inventoryIdentity": "49b26565115e6661c01b2d569b237962c909630146861188ea28dc1f5199ccda",
      "bookingEntry": "https://www.dosheva.com/%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B2%D0%B0%D0%BD%D0%B5-%D0%BD%D0%B0-%D1%87%D0%B0%D1%81/",
      "bookingReview": "owned_booking_reviewed",
      "checkedOn": "2026-11-11",
      "reviewedUrls": [
        "https://www.dosheva.com/",
        "https://www.dosheva.com/%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B2%D0%B0%D0%BD%D0%B5-%D0%BD%D0%B0-%D1%87%D0%B0%D1%81/",
        "https://www.dosheva.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/",
        "https://www.dosheva.com/%D0%BF%D0%BE%D0%B2%D0%B5%D1%80%D0%B8%D1%82%D0%B5%D0%BB%D0%BD%D0%BE%D1%81%D1%82/"
      ],
      "notes": "Own psychology/psychotherapy operator (not generic medical doctor/clinic). Actual own booking reserve page reviewed before detailed tariff audit; current own page explicitly asks service/date/time then callback, public normalHTML has div idamelia-v2-booking-1000 classamelia-v2-booking. NativeJS calendar not rendered/tested here, no offeredslot or confirmedbooking claim, no hiddenAPI accessed. Contactpage explicitly says sendingcontactmessage doesNOTreserve and linksactualbookingpage; therefore never routecontactenquiry as Book. Actual owncurrent literal30EUR individual50min and30EUR family50min onhomepage; no BGN conversion. Familyheadcount notspecified, not invented perperson/fullgroup inclusion. Group30EUR durationbyagreement omitted becauseunit/context insufficient. Own exact Alabin50A and888775649 repeatedheader/contact; no neighborhood inferredfromstreet, no precisegeo/hours/VAT/deposit guessed. Fullpublicprivacy4091visiblechars read: WordPresspersonaldata/cookies/comment/profile/contentembeds and rights; no explicitfactualtariffreuseban found there, not blanketpermission. No photos, creativeprose, patientdata/reviews copied. Robots publicroot allowed. No login/account, form submission, notifications or payment. Root independently read actual reserve page and callback/service/date/time instruction, then explicit CONTACTFORM-DOES-NOT-RESERVE notice and separate literal30EUR/50min individual/family fee rows. Uses actual owned reserve destination, never contact message form. JS Amelia widget evidence is retained, but no renderedslots/availabledates/calendarinteraction or successfulreservation test is claimed. No made-up full-family headcount, group unit or precise neighborhood."
    }
  ]
}
