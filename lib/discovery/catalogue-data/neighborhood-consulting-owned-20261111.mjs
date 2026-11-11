// Dated manually reviewed own appointment and literal tariff facts; no runtime external requests.
export default {
  "records": [
    {
      "id": "sofia-rositsa-astakova-law",
      "name": "Росица Астакова · семейно и имотно право",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Царибродска 99",
      "locationKind": "premises",
      "coordinates": {
        "latitude": 42.7008746107042,
        "longitude": 23.299644140473884,
        "source": "https://astakova.com/contacts/",
        "method": "first_party_coordinates"
      },
      "category": "consulting",
      "website": "https://astakova.com/",
      "phone": "+359879319933",
      "services": [
        {
          "name": "Устна правна консултация",
          "category": "consulting",
          "description": "Публикуваната цена е за консултация до 60 минути; окончателният обхват се уточнява с кантората.",
          "price": {
            "amount": 60,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "до 60 минути",
            "sourceUrl": "https://astakova.com/advokatski-honorari-tarifi/",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        },
        {
          "name": "Правна консултация за сделка с имот",
          "category": "consulting",
          "description": "Консултацията за сделка се записва предварително; отделният преглед на договор за покупка не е включен в този ред.",
          "price": {
            "amount": 70,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://astakova.com/advokatski-honorari-tarifi/",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        },
        {
          "name": "Семейна медиация",
          "category": "consulting",
          "price": {
            "amount": 60,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://astakova.com/advokatski-honorari-tarifi/",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment",
          "durationMin": 60,
          "durationSourceUrl": "https://astakova.com/advokatski-honorari-tarifi/",
          "durationCheckedOn": "2026-11-11"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359879319933"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://astakova.com/contacts/",
          "excerpt": "Контактната страница изрично обозначава записване за консултация на 0879319933 и същия адрес на кантората."
        },
        "contact": "https://astakova.com/contacts/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-rositsa-astakova-law",
      "website": "https://astakova.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "checkedOn": "2026-11-11",
      "reviewedUrls": [
        "https://astakova.com/",
        "https://astakova.com/contacts/",
        "https://astakova.com/advokatski-honorari-tarifi/",
        "https://advokatsofia.com/",
        "https://advokatsofia.com/vaznagrazhdeniya/"
      ],
      "notes": "Actual first-party Book/contacts first: explicit appointment line +359879319933, Tsaribrodska99. Own current2026 practice tariff is explicitly titled RositsaAstakova fees and contains concrete own additional services; not a copied statutory schedule or generic market averages. Kept only3 actual consultation/mediation rows; did not import litigation, document-production or monthly subscription packages as appointments. up-to60min oral consultation remains unit, not invented exact duration; familymediation explicitly60min. Corroborating own second domain advokatsofia.com has same phone/person/address; ONE business, no crossdomain clone. No courtfees added. Reviewed public page footer/anchors and targeted own terms search; only unrelated legal articles about shopterms located, no explicit commercial extraction clause on reviewed pages. Not a license/legal assurance. No prose/portrait/Google reviews copied. No inferred district or geocode. Root actually re-read owned homepage, explicit consultation invitation, contacts and current tariff before import."
    }
  ]
}
