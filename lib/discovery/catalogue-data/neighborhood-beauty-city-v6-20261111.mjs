// Own-source appointment and fee review: 2026-11-11. No provider inventory or invented availability.
export default {
  "records": [
    {
      "id": "sofia-naura-beauty-dragalevtsi",
      "name": "Naura Beauty Studio",
      "cityCode": "68134",
      "neighborhood": "Драгалевци",
      "address": "София, кв. Драгалевци, ул. Витошка зорница 3",
      "locationKind": "premises",
      "coordinates": null,
      "category": "beauty",
      "website": "https://www.naura.bg/",
      "phone": "+359877277279",
      "services": [
        {
          "name": "Ламиниране и боядисване на вежди",
          "category": "beauty",
          "description": "Една процедура в студиото; стандартна цена. Денят и часът се уточняват след заявка.",
          "price": {
            "amount": 36,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.naura.bg/laminirane-vezhdi",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        },
        {
          "name": "Ламиниране на вежди",
          "category": "beauty",
          "description": "Само ламиниране, без боядисване; стандартна цена за една процедура. Денят и часът се уточняват след заявка.",
          "price": {
            "amount": 31,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.naura.bg/laminirane-vezhdi",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        },
        {
          "name": "Боядисване и оформяне на вежди",
          "category": "beauty",
          "description": "Боядисване и оформяне без ламиниране; една процедура в студиото. Денят и часът се уточняват след заявка.",
          "price": {
            "amount": 25,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.naura.bg/laminirane-vezhdi",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        },
        {
          "name": "Ламиниране и боядисване на мигли",
          "category": "beauty",
          "description": "Една процедура върху естествените мигли, не поставяне на удължения; стандартна цена. Денят и часът се уточняват след заявка.",
          "price": {
            "amount": 35,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.naura.bg/laminirane-migli",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        },
        {
          "name": "Ламиниране на мигли",
          "category": "beauty",
          "description": "Само ламиниране на естествените мигли, без боядисване; стандартна цена. Денят и часът се уточняват след заявка.",
          "price": {
            "amount": 29,
            "currency": "EUR",
            "kind": "fixed",
            "sourceUrl": "https://www.naura.bg/laminirane-migli",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "appointment"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://www.naura.bg/chasove"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://www.naura.bg/chasove",
          "excerpt": "Оставете име, имейл и телефон и изберете услугата. Ще се свържем с вас, за да уточним удобен ден и час."
        },
        "contact": "https://www.naura.bg/chasove"
      }
    },
    {
      "id": "sofia-grimior-mobile-makeup",
      "name": "GRIMIOR.BG · грим на адрес",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "beauty",
      "website": "https://grimior.bg/",
      "phone": "+359898760356",
      "services": [
        {
          "name": "Професионален грим на клиентски адрес",
          "category": "beauty",
          "description": "Посещение на адрес в София след предварително записване по телефон. Преди 09:00 и след 19:00 се добавят 50%. Дългосрочните записвания се потвърждават по телефон 2–3 дни преди датата; точният адрес и условията се уточняват при записване.",
          "price": {
            "amount": 200,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "посещение на адрес в София · извън 09–19 ч. +50%",
            "sourceUrl": "https://grimior.bg/",
            "checkedOn": "2026-11-11",
            "validUntil": "2027-02-09"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359898760356"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://grimior.bg/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8-%D0%B3%D1%80%D0%B8%D0%BC/",
          "excerpt": "Записвания за час чрез контактната форма, по имейл или телефон: 0898760356. Услуги на територията на София."
        },
        "contact": "https://grimior.bg/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8-%D0%B3%D1%80%D0%B8%D0%BC/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-naura-beauty-dragalevtsi",
      "website": "https://www.naura.bg/",
      "bookingEntry": "https://www.naura.bg/chasove",
      "bookingReview": "owned_booking_reviewed",
      "checkedOn": "2026-11-11",
      "reviewedUrls": [
        "https://www.naura.bg/robots.txt",
        "https://www.naura.bg/",
        "https://www.naura.bg/chasove",
        "https://www.naura.bg/laminirane-vezhdi",
        "https://www.naura.bg/laminirane-migli",
        "https://www.naura.bg/politika/obshti-usloviya",
        "https://www.naura.bg/chasove?usluga=laminirane-boyadisvane-vezhdi&procedura=%D0%9B%D0%B0%D0%BC%D0%B8%D0%BD%D0%B8%D1%80%D0%B0%D0%BD%D0%B5+%D0%B8+%D0%B1%D0%BE%D1%8F%D0%B4%D0%B8%D1%81%D0%B2%D0%B0%D0%BD%D0%B5+%D0%BD%D0%B0+%D0%B2%D0%B5%D0%B6%D0%B4%D0%B8"
      ],
      "notes": "Own root actual Book→/chasove followed beforefees; current live publicGET ofexact ownerpublished serviceURL also read. Actual own form explicitly asks name/email/phone/service and promises subsequent day/time arrangement, NOTinstantconfirmedavailability; no form/Turnstile interaction or submission. CAPTCHAinside normalpublicform is not a hostaccesschallenge, neverbypassed. Generic/chasove retained asrealownerbookingURL, no inventedserviceparameters. Five bounded visible current standard fees36/31/25EURbrows and35/29EURlashes fromownservicepriceHTML, not scriptdata or providerinventory. The linked current terms (naura-terms.html) distinguish future Nov13–30BF59EURcombinedpackage and annualcards/vouchers; none imported asordinaryprices, no futurepromotionclaimedactive. No guessed duration from45–60range/individualsteps. Robots explicitsearch=yes/ai-input=yes/ai-train=no, allowed ordinarypaths; disallowedadmin/kiosk/purchase/voucher/API nevervisited, no training/media collection. General terms contain ownappointmentrules, privacy/consumer/IPliability but no explicit publicfee-reuseban observed; not blanketpermission. Exactactivityaddressownerterms/Book, notregisteredLyubenRusev6residence. SamebuildingasexistingMasterFadebarber, distinctbrand,domain,phone andactualservicecontext, notclone/staffcount. HistoricalfallbackStudio24ButterflyBeautySpa link notvisitedbecauseknownaccessrestrictions, nottreatedasnewbranch or providerreview. No current/pending ownhost/phone duplicate. Raw receipts naura-booking.html,naura-brows.html,naura-lashes.html,naura-terms.html. No photos/reviews/medicalguarantees copied;GPSunverifiednull. Parentreviewpending. Root read actual name/email/phone/service callback booking form and visible current brow36/31/25 and lash35/29EUR standard fee rows. No future Black Friday bundle, simulated slots, added service URL parameters, source medical guarantees or restricted provider content.",
      "inventoryIdentity": "896d65beb1551d6d66dd5727c619a6d0a4096ecec069e8c68ff688b729390bb6"
    },
    {
      "id": "sofia-grimior-mobile-makeup",
      "website": "https://grimior.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "checkedOn": "2026-11-11",
      "reviewedUrls": [
        "https://grimior.bg/robots.txt",
        "https://grimior.bg/",
        "https://grimior.bg/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8-%D0%B3%D1%80%D0%B8%D0%BC/"
      ],
      "notes": "Parent permits one mobilecandidate onlywithownSofiavisit+realphonearrangement+literalpriceandtravelconditions. Own actualContacts beforefeesexplicitly invitesphoneappointment0898760356 andSofiaservice;currentliverootownpublished200EURrow Грим на ваш адрес plusexplicitSofianeighborhoodservicearea. Preserved+50%before09/after19 and2–3dayadvanceappointmentreconfirmation, no promisedinstantbooking. One service-area entity, noinventedstudio,address,neighborhood,GPSor km. ListedfeesforATELIERnotimportedwithoutrealpremises; futuretypes/individualartistsnotcloned. Rootoldblogcopyright2013–2017andoutdatedcoursepages notclaimedrecentlyupdated; liveEURtariffreadnow, noconversionofoldBGN. Fee200notweddingfee110nortrialambiguous100/110, no inventedtypeinclusions/duration. KikaMakeup/shopaliases observedordinaryoutboundlinks butnotqueriedasadditionalvenues; officialandpendinghostname+phonecheckclear. Allvisibleordinaryroot/Contactslinkedlegalnotpresent; noexplicitfee-reusebanobserved, notlicensepermission. Noimages/reviews/prose or aggregatorfees used. Rawgrimior-root.html andgrimior-booking.html. Parentreviewpending. Root read actual own Contacts phone appointment invitation and current literal200EUR client-address row with explicit Sofia service area,+50% outside09–19 and2–3day reconfirmation. Unknown atelier address does not become a fake studio or km marker. One genuine mobile option, no city/staff clones.",
      "inventoryIdentity": "3936859d90bac389c396e4399e2b61b159e92ff3aa7c34dfe1d0ed06fe7c11ed"
    }
  ]
}
