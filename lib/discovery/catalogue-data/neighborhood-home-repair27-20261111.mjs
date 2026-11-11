// Own-source appointment and fee review: 2026-11-11. No provider inventory or invented availability.
export default {
  "records": [
    {
      "id": "sofia-djotex-home-appliance-service",
      "name": "Джотекс · ремонт на битова техника по домовете",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://djotex.com/",
      "phone": "+359895629381",
      "services": [
        {
          "name": "Стандартен ремонт на битов електроуред",
          "category": "home_services",
          "description": "Стандартна цена за София в рамките на Околовръстното шосе: посещение, диагностика и труд; повторно посещение не се заплаща. Резервните части са отделно. Лагери и казан на пералня са изключения с отделна тарифа; извън този район цената се уточнява.",
          "price": {
            "amount": 55,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "посещение, диагностика и труд; части отделно",
            "sourceUrl": "https://djotex.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Ремонт на лагери или казан на пералня",
          "category": "home_services",
          "description": "Изключение от стандартната тарифа: диапазонът зависи от модела и сложността. Сервизът посочва демонтаж, транспорт и монтаж; частите се плащат допълнително. Работата обичайно е за 3–5 работни дни, а не една сесия с фиксирана продължителност.",
          "price": {
            "amount": 100,
            "currency": "EUR",
            "kind": "range",
            "maximum": 110,
            "unit": "ремонт според модела; части допълнително",
            "sourceUrl": "https://djotex.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        },
        {
          "name": "Монтаж на пералня или съдомиялна",
          "category": "home_services",
          "description": "Монтаж на нова вградена или свободностояща пералня или съдомиялна. Собственият сайт включва безплатен демонтаж на стария уред. Условията за адреса, необходимите материали и извозването се съгласуват при заявка; ДДС не е уточнен в тарифата.",
          "price": {
            "amount": 55,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "монтаж; демонтажът на стария уред е безплатен",
            "sourceUrl": "https://djotex.com/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://djotex.com/about-pages/%D0%BF%D0%BE%D1%80%D1%8A%D1%87%D0%B0%D0%B9-%D0%BE%D0%BD%D0%BB%D0%B0%D0%B9%D0%BD"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://djotex.com/about-pages/%D0%BF%D0%BE%D1%80%D1%8A%D1%87%D0%B0%D0%B9-%D0%BE%D0%BD%D0%BB%D0%B0%D0%B9%D0%BD",
          "excerpt": "Собствената форма за ремонт съдържа вид уред, дата, тричасов интервал и адрес за посещение; за източните райони се изисква заявка поне ден предварително."
        },
        "contact": "https://djotex.com/"
      }
    },
    {
      "id": "sofia-sosuslugite-home-appliance-diagnostic",
      "name": "SOSuslugite · сервиз на битова техника",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "home_services",
      "website": "https://sosuslugite.bg/",
      "phone": "+359877055427",
      "services": [
        {
          "name": "Посещение и диагностика на битов електроуред",
          "category": "home_services",
          "description": "Ориентировъчна такса за посещение и диагностика на адрес в София; приспада се от цената при извършен ремонт. Окончателната цена за ремонта се съобщава след диагностика според дефекта, модела, частите и сложността; ДДС не е уточнен.",
          "price": {
            "amount": 25,
            "currency": "EUR",
            "kind": "fixed",
            "unit": "ориентировъчна такса; приспада се при ремонт",
            "sourceUrl": "https://sosuslugite.bg/ceni-uslugi-sofia/",
            "checkedOn": "2026-11-11"
          },
          "appointmentModel": "home_visit"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359877055427"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-11",
        "validUntil": "2027-02-09",
        "booking": {
          "url": "https://sosuslugite.bg/",
          "excerpt": "Собствените Запази час за посещение и Резервирай своя час са tel:0877055427; за уикенд и извънработно време е изрична предварителна уговорка."
        },
        "contact": "https://sosuslugite.bg/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-djotex-home-appliance-service",
      "checkedOn": "2026-11-11",
      "website": "https://djotex.com/",
      "bookingEntry": "https://djotex.com/about-pages/%D0%BF%D0%BE%D1%80%D1%8A%D1%87%D0%B0%D0%B9-%D0%BE%D0%BD%D0%BB%D0%B0%D0%B9%D0%BD",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://djotex.com/",
        "https://djotex.com/about-pages/%D0%BF%D0%BE%D1%80%D1%8A%D1%87%D0%B0%D0%B9-%D0%BE%D0%BD%D0%BB%D0%B0%D0%B9%D0%BD",
        "https://djotex.com/about-pages/privacy-policy"
      ],
      "notes": "Actual root Поръчай Онлайн followed before fee section. Public own HTML form read: name/email/phone/defect, appliance/service selector, brand, actualdate field, seven3hourarrivalwindow choices09–12 through15–18, clientaddress andsubmit; not submitted or tested actualacceptance/availability. Threehourwindow is arrival range NOT service duration. Root explicit future appointment/comfortable time and at least1day advance for east/south districts; native form works as request not instant guaranteed slot. Then actual Book's Цени link points root#68e52e64fe54e092f36fe610; live root55EURstandard visit+diagnostic+labor, secondvisit nofee, parts extra, bearings/drum100–110exception;55EURinstallation separate. No repair guarantee/licensing/safety claims or freeretirement guarantee imported. No inferredVAT, durations, formula or oldBGNconvertedprices. Exactknownmobile+359895629381; actualdisplaylandline029284374 andone malformedhref0292843743 notchosen. CurrentSofiaObelyaVasilLevski154 vs oldOvcha748no1 explicitlydistinguished; legalregistrationNikolaevo from templatedprivacy is NOT a Sofia venue/address. One mobileoperator, coords/address/neighborhoodnull not warehousekm. Linkedpublicprivacy dated22Mar2024 namesETIvanGenchevDjotex/BG123742773 but contains genericplatform boilerplate and different legalcontact; operatingidentity matchesbrand/sitephone/email. No separate ownTerms href encountered (formunderlinedусловия plaintext); not claiming blanket reuse licence. Robots public pagesallowed, admin/orders/accountblocked and untouched; no API/llms/bundles/provider extraction. Limited3 factual prices/source URLs, no prose/photos/reviews copied. Currentallrecords plus pending ownerhost/phonealiases compared; human root import required. Root read complete visible root tariff and actual own date/arrival-window/appliance/address form.55EUR includes visit/diagnosis/labor, parts extra;100–110 bearings exception and55 installation are separate. Three-hour arrival windows and3–5 workday turnaround are NOT service durations. One mobile operator; no depot/legal address masquerading as customer premises.",
      "inventoryIdentity": "4e4be8064b1cd4d043d52c0649136abfe589d2f0a991969e3ff94bb6e40e6dd2"
    },
    {
      "id": "sofia-sosuslugite-home-appliance-diagnostic",
      "checkedOn": "2026-11-11",
      "website": "https://sosuslugite.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://sosuslugite.bg/",
        "https://sosuslugite.bg/ceni-uslugi-sofia/"
      ],
      "notes": "ActualownBookfirst native rootCTA Запазичасзапосещение/Резервирайсвоячастук exactlytel:0877055427, samevisiblecontact andbo-klima@abv.bg. Explicit futurehours/phonearrangement forweekend/afterhours, no genericemergencyinference or claim same-day guaranteed. Current own tariff25EURvisitdiagnostic creditedonrepair consistentroot+allappliancefee sections. Onlythat1representativepricedservice included: rootmaintenance39vs40 andwashingpump35vs40service snippets are held, neverattributed as exactfees. Heading saysindicative prices; keptvisibleunit+description, no guessedparts/VATinclusion, paidrepairtotal/duration. RootactualObelya1bl103A contactnotclientlocation/venue; oneSofiawidehomevisitoperator address/coords/neighborhoodnull. Specificownnamedbrand/uniquephone/email, not anonymousSEOcitypage orSOSServiz/SOSBoileri alias byname. Robots normalwpadminonlyrestricted, native root/priceanchors noownTerms/Privacylinkfound; noexpress reuse restriction encountered, not a legallicence assurance. SavedlimitedHTMLsource receipts; noform/call/payment/production action, photos/reviews/prose copied, geocoder/API/providerinventory ordeniedroute bypass. Allcurrent+pendinghost/phones compared andhumanrootapproval required. Root read own tariff; only common25EUR indicative diagnostic visit imported with repair-credit qualification. Conflicting39/40 maintenance and35/40 pump fees omitted, no invented complete repair quote. Actual explicit phone appointment retained; mobile not Obelya venue.",
      "inventoryIdentity": "355f8d4419e6e7add03731f58ff27d838ba1c327fcce97411109c9e45f8aa30f"
    }
  ]
}
