// Own-source appointment and fee review: 2026-11-11. No provider inventory or invented availability.
export default {
  "records": [
    {
      "id": "sofia-studio617-vrabnitsa-zlatenklas27",
      "name": "Студио 617",
      "cityCode": "68134",
      "neighborhood": "Връбница 2",
      "address": "София, ж.к. Връбница 2, ул. Златен клас 27",
      "locationKind": "premises",
      "coordinates": null,
      "category": "hair",
      "website": "https://www.617.studio/",
      "phone": "+359887495574",
      "services": [
        {
          "name": "Дамско подстригване · къса коса",
          "category": "hair",
          "description": "Самостоятелно дамско подстригване на къса коса. По условието на салона цената може да е различна според гъстотата на косата и използваните продукти; уточнява се при записване.",
          "price": {
            "amount": 12.78,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "по ценоразпис · според косата и продуктите",
            "sourceUrl": "https://www.617.studio/prices.html",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        },
        {
          "name": "Дамско подстригване · дълга коса",
          "category": "hair",
          "description": "Самостоятелно дамско подстригване на дълга коса. По условието на салона цената може да е различна според гъстотата на косата и използваните продукти; уточнява се при записване.",
          "price": {
            "amount": 17.9,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "по ценоразпис · според косата и продуктите",
            "sourceUrl": "https://www.617.studio/prices.html",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        },
        {
          "name": "Дамско подстригване с измиване · къса коса",
          "category": "hair",
          "description": "Дамско подстригване с измиване на къса коса. По условието на салона цената може да е различна според гъстотата на косата и използваните продукти; уточнява се при записване.",
          "price": {
            "amount": 23.01,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "по ценоразпис · според косата и продуктите",
            "sourceUrl": "https://www.617.studio/prices.html",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        },
        {
          "name": "Мъжко подстригване · стандартно",
          "category": "hair",
          "description": "Стандартно мъжко подстригване от фризьорския ценоразпис. По условието на салона цената може да е различна според гъстотата на косата и използваните продукти; уточнява се при записване.",
          "price": {
            "amount": 12.78,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "по ценоразпис · според косата и продуктите",
            "sourceUrl": "https://www.617.studio/prices.html",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359887495574"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://www.617.studio/contact.html",
          "excerpt": "За записване на час и всякакви въпроси за нашите услуги може да ни се обадите на телефон +359 887495574."
        },
        "contact": "https://www.617.studio/contact.html"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-studio617-vrabnitsa-zlatenklas27",
      "website": "https://www.617.studio/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "checkedOn": "2026-11-11",
      "reviewedUrls": [
        "https://www.617.studio/robots.txt",
        "https://www.617.studio/",
        "https://www.617.studio/contact.html",
        "https://www.617.studio/prices.html"
      ],
      "notes": "One actual hair salon in owner-stated Vrabnitsa2, exact ZlatенKlas27 and explicit appointment phone invitation. Root/contact/prices all verified live via ordinary HTTP200 after reader price cache miss; robots resource returns ordinary404 not a challenge. Current own tariff actually publishes both BGN and literal EUR amounts: female short25BGN/12.78EUR,long35/17.90,wash+cut short45/23.01,male standard25/12.78. EUR numbers are copied literally, not assistant conversions. Representative four factual fee rows only; no invented duration. Source qualification says price for each hair may differ by density/products; repeated in every public description and price.unit, not marketed as an unconditional final quote. No colour, bleach or balayage fee without its qualifications; official hairstyle duplicate/tier ranges and25.56EUR deposit not imported. Footer copyright begins2022 but tariff does not identify itself as expired or a dated promotion; no date/current-year inferred from footer. Embedded English USD/LoremIpsum demo panels are ignored, no fake Skin&Body menu imported. Navigation only Home/Prices/Contacts with social/page-top; no distinct linked Terms/privacy observed, ordinary copyright not licence permission. No third-party menu, photo, review or marketing prose copied. Current official and pending ownerhost/phone/address dedup no collision. GPS not owner-confirmed, null. Receipts studio617-root.html, studio617-prices.html, studio617-contact.html. Four offline gates only. Root read raw owner tariff and explicit appointment contact: female short12.78/long17.90/wash-cut short23.01/male standard12.78 literal EUR; density/products qualification retained for every fee. Exact owner Vrabnitsa2/ZlatenKlas27. No deposit, demo USD menu or guessed duration.",
      "inventoryIdentity": "7ba7d343a5b0feb9932b379661a5d6c7690759d8f9cb3b7e37eaaf4a673f7212"
    }
  ]
}
