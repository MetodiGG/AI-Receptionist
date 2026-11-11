// Own-source appointment and fee review: 2026-11-11. No provider inventory or invented availability.
export default {
  "records": [
    {
      "id": "sofia-domserviz-home-appliance-diagnostic",
      "name": "ДомСервиз · ремонт на битови електроуреди",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://www.domserviz.com/",
      "phone": "+359878585423",
      "services": [
        {
          "name": "Диагностика и изготвяне на оферта за ремонт на електроуред",
          "category": "home_services",
          "description": "Диагностика и изготвяне на оферта за ремонт на битов електроуред на адрес в София, с предварителна уговорка за удобно време. Цената е за диагностиката и офертата, не за целия ремонт; включване на ДДС, части и приспадане при ремонт не са уточнени в тарифата.",
          "price": {
            "amount": 35,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "диагностика и оферта; ремонтът се уточнява отделно",
            "sourceUrl": "https://www.domserviz.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359878585423"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://www.domserviz.com/contacts.html",
          "excerpt": "Телефони за заявки са посочени за двамата техници; собствената страница предлага посещение на адрес в удобно за клиента време в София."
        },
        "contact": "https://www.domserviz.com/contacts.html"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-domserviz-home-appliance-diagnostic",
      "checkedOn": "2026-11-11",
      "website": "https://www.domserviz.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://www.domserviz.com/",
        "https://www.domserviz.com/contacts.html",
        "https://www.domserviz.com/about.html"
      ],
      "notes": "Actual own root Contacts entry followed first: phones for requests and inquiries name Georgi Matenicharov +359878585423 and Robert Iliev +359878678370; all services performed at client address in Sofia. Root and actual About page both explicitly offer a visit at a convenient client time and literal35EUR diagnosis plus repair quotation. One operator, not two independent listings for its named technicians. Published Nadежda NikolaZhekov22 base is not the customer's home or verified walk-in venue, so mobile service_area/address/neighborhood/coordinates null. No slots, duration, warranty, licensing or manufacturer partnership claims imported.35EUR is diagnosis+quotation only, not total repair; no inventedVAT/parts inclusion or credit. Public root/about/contacts fully read in live HTML, robots ordinarypages allowed; no Terms/Privacy link encountered in actual visible menu/footer, copyright footer is not a blanket reuse licence. Small factual fee/source link only; no copied prose, reviews or photos. Compared current plus pending canonical host and both phones. No call, form, payment, production action, geocoder or provider inventory. Human root source approval required. Root read actual request phone contacts and About35EUR diagnosis+quote with explicit convenient-time home visits. Two named technicians remain one operator; no total-repair or walk-in premises inference.",
      "inventoryIdentity": "e1a9cee6819c7e13dc5c1ba7ffe057a520a8e4dbde13b4d33933fc6cb7f3b1b3"
    }
  ]
}
