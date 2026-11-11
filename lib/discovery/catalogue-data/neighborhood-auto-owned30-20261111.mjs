// Own-source appointment and fee review: 2026-11-11. No provider inventory or invented availability.
export default {
  "records": [
    {
      "id": "sofia-topdiagnostika-mobile",
      "name": "Топ Диагностика · автодиагностика на адрес",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://topdiagnostika.com/",
      "phone": "+359876095652",
      "services": [
        {
          "name": "Компютърна диагностика на лек автомобил",
          "category": "auto_repair",
          "description": "Прочитане на модулите, анализ на данните и тестове. Към публикуваните 60 € се добавят още 20 € за посещение на адрес в София. Това е диагностика, не ремонт; мястото, часът и приложимите компоненти се уточняват предварително. ДДС не е уточнен в тарифата.",
          "price": {
            "amount": 60,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "диагностика + задължителни 20 € посещение на адрес",
            "sourceUrl": "https://topdiagnostika.com/ceni/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Оглед на лек автомобил преди покупка",
          "category": "auto_repair",
          "description": "Публикуваният диапазон е за оглед на лек автомобил преди покупка. Посещението на адрес в София се заплаща допълнително — 20 €. Джип, миниван, бус и баничарка имат друга тарифа; обхватът и часът се съгласуват предварително, без обещание за гарантиран резултат.",
          "price": {
            "amount": 100,
            "currency": "EUR",
            "kind": "range",
            "maximum": 120,
            "unit": "оглед на лек автомобил + 20 € посещение на адрес",
            "sourceUrl": "https://topdiagnostika.com/ceni/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359876095652"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://topdiagnostika.com/",
          "excerpt": "Заяви диагностика води към tel:+359876095652; собствените указания са да се уговорят адрес и час в София преди посещението."
        },
        "contact": "https://topdiagnostika.com/kontakti/"
      }
    },
    {
      "id": "sofia-autokings-ekaterina-nencheva",
      "name": "AutoKings · София",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, ул. Екатерина Ненчева 1а",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://autokings.online/",
      "phone": "+359883355541",
      "services": [
        {
          "name": "Проверка на автомобил преди покупка",
          "category": "auto_repair",
          "description": "Оглед и проверка на основните системи преди покупка на автомобил в сервиза в София. Публикуваната цена е за проверката; ремонт, части и допълнителни дейности се договарят с оферта преди работа. Не е обещание за бездефектен автомобил.",
          "price": {
            "amount": 80,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "проверка; допълнителни дейности по оферта",
            "sourceUrl": "https://autokings.online/ceni/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "appointment"
        },
        {
          "name": "Стенд — реглаж на сходимост",
          "category": "auto_repair",
          "description": "Проверка и настройка на геометрията на ходовата част за конкретния автомобил в сервиза на ул. Екатерина Ненчева 1а. Цената е за реглажа, не за смяна на части или ремонт на окачването; допълнителната работа и окончателният обхват се одобряват предварително.",
          "price": {
            "amount": 50,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "реглаж на сходимост; допълнителен ремонт отделно",
            "sourceUrl": "https://autokings.online/ceni/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "appointment"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359883355541"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://autokings.online/",
          "excerpt": "Собствената стъпка Запазете час изисква първо записване по телефона; автомобилът се докарва в сервиза в уговорения час."
        },
        "contact": "https://autokings.online/kontakti/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-topdiagnostika-mobile",
      "checkedOn": "2026-11-11",
      "website": "https://topdiagnostika.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://topdiagnostika.com/",
        "https://topdiagnostika.com/kontakti/",
        "https://topdiagnostika.com/ceni/",
        "https://topdiagnostika.com/privacy-policy/"
      ],
      "notes": "Actual root Заяви диагностика href exactlytel:+359876095652 inspected before tariff, not genericcontact alone. Own root explicitly instructs agree addressandhour inSofia; live contact updated3Nov2026 independently says visit arranged beforehand andsamephone. Readeroldcontact block183/877197958 superseded by liveblock181/current876095652 concordantroot+fees; bothphonesdeduped, no oldphone used. Own tariff updated3Nov2026 literal60EURcarcomputerdiagnostics and100–120EURcarprepurchaseinspection; separate20EURvisit ADDED to BOTH preserved inpublicunit+description, not fabricatedall-in60 orarithmeticprice80. Othervehicleclasses/consultation/packages/DPF/EGR/AdBlue/tuning/odometeralteration notimported. OperatornamedTeodorIvanov onownsource, no copiedqualifications/accuracy/guarantees/reviews/photos orsimulationreport. OneSofiawide mobileoperator, baseKrasnoSelo notcustomerplace/venue, noaddress/neighborhood/coords andno guessedslots/duration. Ownroot/contact/fees liveHTML read, linkedGDPRprivacy fullmainBG+EN template reviewed; noexpressfactualcommercialreuseban encountered, notblanketlicenceassurance. Robotsdisallows td-chat.js/wpadmin; NEVER fetchedchatJS/privateAPI oractivatedchat. Limited2factswithsourceURLs. Noforms/calls/booking/payment/providerinventory/geocoder/productionwrite. Human root sourceapproval required. Root read raw own current fee/contact pages:60EUR diagnosis and100–120EUR inspection PLUS mandatory20EUR visit, preserved prominently in both unit and description. One mobile provider with actual phone time/address arrangement; no emissions/odometer-alteration service, guarantee or fake all-in price.",
      "inventoryIdentity": "ac8e9fa8440a97f43347a3186ff7157876ed404c0750d2aa7d8be9fb14d9a862"
    },
    {
      "id": "sofia-autokings-ekaterina-nencheva",
      "checkedOn": "2026-11-11",
      "website": "https://autokings.online/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://autokings.online/",
        "https://autokings.online/kontakti/",
        "https://autokings.online/obshti-usloviya/",
        "https://autokings.online/ceni/",
        "https://autokings.online/%d1%83%d1%81%d0%bb%d1%83%d0%b3%d0%b8-%d0%b0%d0%b2%d1%82%d0%be-%d1%81%d0%be%d1%84%d0%b8%d1%8f/pokupka-na-avtomobil-sofia/",
        "https://autokings.online/%d1%83%d1%81%d0%bb%d1%83%d0%b3%d0%b8-%d0%b0%d0%b2%d1%82%d0%be-%d1%81%d0%be%d1%84%d0%b8%d1%8f/stend-za-reglaj-sofia/"
      ],
      "notes": "Actual root ЗАПАЗЕТЕЧАС tel0883355541 andbookworkflow first: 'първотрябвадазапазитечас...потелефона', thenbringcaratagreеdhour. ActualContacts separatelynamesSofiaEkaterinaNencheva1A ANDPlovdivKuklensko52, sameoperatingphone; legalregistrationNaychoTsanov7Plovdiv NOTSofiavenue. OnlyONEverifiedSofiarecord. Currentown tariff80EURprepurchase+50EURalignment independentlyBOUND toexplicitSofia-specificservice pages whichrepeat literal80/50andSofiavenue. Nochainwideinference,Plovdivlisting, inventedneighborhood/GPS/duration. Sofia alignmentbodyusesalternate883355456 whilemaincontact+root+footer+inspectionexplicitBook883355541 concordant; bothaliasesdeduped, mainofficialrequestphonechosen, no separateoperator. No40EURPROMOdiagnostic, retailparts, oilconsumableprice, deposits, guarantee/certification/accuracyclaims or thirdpartyreviews/photos imported. OwnTerms all17sections fullyread live; §3 explainsapprovedquote/extra-work approval and§10–12rescheduling/depositrules; noexpressfactualreuseban encountered, notblanketlicenceassurance. TariffdoesnotexplicitlystateVAT, so notclaimedincluded; final applicablecomponentsagreedwithowner. Robotsallow ordinarypublicpages; noform/call/order/slot/payment/privateAPI/geocoder/productionwrite. Limited2factualfees/sourceURLs only, humanroot sourceapproval required. Root read exact Sofia-specific service pages binding80EUR inspection and50EUR alignment to Sofia venue, and actual explicit advance phone-booking workflow. Plovdiv branch/legal address and alternate published phone do not create separate operators; no temporary promo or parts inventory.",
      "inventoryIdentity": "667be8a1412fcb0d5ba2e75af3be66b34bd0263a46d9612c37e9e723b79963dd"
    }
  ]
}
