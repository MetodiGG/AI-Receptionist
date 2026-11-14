// New owner-reviewed Sofia appointment businesses. Intake only; integration identities are bound after root review.
export default {
  "records": [
    {
      "id": "sofia-malketov-asen-yordanov11",
      "name": "Автосервиз Малкетов",
      "cityCode": "68134",
      "neighborhood": "Слатина",
      "address": "София, СПЗ Слатина, бул. Асен Йорданов 11",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://malketov.com/",
      "phone": "+359876876369",
      "services": [
        {
          "name": "Смяна на двигателно масло и филтри",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Сервизно обслужване след уговорка по телефона. Подходящите консумативи и крайната оферта се уточняват според автомобила."
        }
      ],
      "openingHours": {
        "sourceUrl": "https://malketov.com/",
        "checkedOn": "2026-11-14",
        "days": [
          {
            "weekday": 1,
            "periods": [
              {
                "open": "09:00",
                "close": "19:00"
              }
            ]
          },
          {
            "weekday": 2,
            "periods": [
              {
                "open": "09:00",
                "close": "19:00"
              }
            ]
          },
          {
            "weekday": 3,
            "periods": [
              {
                "open": "09:00",
                "close": "19:00"
              }
            ]
          },
          {
            "weekday": 4,
            "periods": [
              {
                "open": "09:00",
                "close": "19:00"
              }
            ]
          },
          {
            "weekday": 5,
            "periods": [
              {
                "open": "09:00",
                "close": "19:00"
              }
            ]
          }
        ]
      },
      "booking": {
        "kind": "phone",
        "phone": "+359876876369"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-14",
        "validUntil": "2027-02-12",
        "booking": {
          "url": "https://malketov.com/",
          "excerpt": "Обади ни се, изпрати имейл или запитване през контактната форма, за да запазим удобен ден и час за преглед."
        },
        "contact": "https://malketov.com/"
      }
    },
    {
      "id": "sofia-mobilix-mobile-vacuum-oil",
      "name": "Mobilix Auto Care · мобилен автосервиз",
      "cityCode": "68134",
      "neighborhood": null,
      "address": null,
      "locationKind": "service_area",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://mobilixautocare.bg/",
      "phone": "+359882742755",
      "services": [
        {
          "name": "Мобилна смяна на двигателно масло и филтри с вакуум",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Само на безопасен частен терен: гараж, двор или частен паркинг, не пред блока. Източване с вакуумна система. Крайната оферта и консумативите се уточняват според автомобила.",
          "price": {
            "kind": "from",
            "amount": 75,
            "currency": "EUR",
            "unit": "за обслужване; според автомобила и уговорените консумативи",
            "sourceUrl": "https://mobilixautocare.bg/smyana-na-dvigatelno-maslo/",
            "checkedOn": "2026-11-14",
            "validUntil": "2027-02-12"
          }
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359882742755"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-14",
        "validUntil": "2027-02-12",
        "booking": {
          "url": "https://mobilixautocare.bg/",
          "excerpt": "Запазваш час. Свързваш се с нас по телефон или чрез формата за записване."
        },
        "contact": "https://mobilixautocare.bg/"
      }
    },
    {
      "id": "sofia-nvs-workshop-tsarigradsko391",
      "name": "NVS · автосервиз",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Цариградско шосе 391, Парк музей Враня",
      "locationKind": "premises",
      "coordinates": null,
      "category": "auto_repair",
      "website": "https://nvs.bg/",
      "phone": "+359988730020",
      "services": [
        {
          "name": "Компютърна диагностика на автомобил",
          "category": "auto_repair",
          "appointmentModel": "appointment",
          "description": "Диагностика в сервиза след заявка. Предпочитаната дата и услугата се описват във формата; часът и офертата се потвърждават от екипа."
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://nvs.bg/workshop/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-14",
        "validUntil": "2027-02-12",
        "booking": {
          "url": "https://nvs.bg/workshop/",
          "excerpt": "Запишете си час. След изпращане на online заявка, наш представител ще се свърже с Вас за потвърждаване на часа."
        },
        "contact": "https://nvs.bg/contact-us/"
      }
    },
    {
      "id": "sofia-simda-slivnitsa178-dance",
      "name": "SIMDA · Sofia International Music & Dance Academy",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Сливница 178",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://simda.bg/",
      "phone": "+359888706645",
      "services": [
        {
          "name": "Групови модерни танци и хип-хоп за деца 7–12 г.",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Детска група с предварително записване чрез SIMDA. Текущият график и участието се потвърждават с екипа; двете учебни зали са в един обект.",
          "durationMin": 60,
          "durationSourceUrl": "https://simda.bg/events/модерни-танци-и-хип-хоп-с-катрин-7-12-г/",
          "durationCheckedOn": "2026-11-14"
        }
      ],
      "booking": {
        "kind": "phone",
        "phone": "+359888706645"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-14",
        "validUntil": "2027-02-12",
        "booking": {
          "url": "https://simda.bg/",
          "excerpt": "Запишете се"
        },
        "contact": "https://simda.bg/контакти/"
      }
    },
    {
      "id": "sofia-ax-horca-bio-dragan-tsankov8",
      "name": "Ах Хорца · Биологически факултет",
      "cityCode": "68134",
      "neighborhood": null,
      "address": "София, бул. Драган Цанков 8, Биологически факултет",
      "locationKind": "premises",
      "coordinates": null,
      "category": "fitness",
      "website": "https://ax-horca.com/",
      "phone": "+359888391240",
      "services": [
        {
          "name": "Групови народни танци за средно напреднали",
          "category": "fitness",
          "appointmentModel": "group_reservation",
          "description": "Еднократно участие в групата при Биологическия факултет след записване. Графикът и приемът в групата се потвърждават с клуба.",
          "durationMin": 60,
          "durationSourceUrl": "https://ax-horca.com/",
          "durationCheckedOn": "2026-11-14",
          "price": {
            "kind": "fixed",
            "amount": 10,
            "currency": "EUR",
            "unit": "за един човек; едно посещение в група",
            "sourceUrl": "https://ax-horca.com/",
            "checkedOn": "2026-11-14",
            "validUntil": "2027-02-12"
          }
        }
      ],
      "booking": {
        "kind": "form",
        "url": "https://ax-horca.com/"
      },
      "verification": {
        "status": "approved",
        "checkedOn": "2026-11-14",
        "validUntil": "2027-02-12",
        "booking": {
          "url": "https://ax-horca.com/",
          "excerpt": "Попълнете формата за записване. Биологически факултет – вт. и чет. 18:30 до 19:30ч."
        },
        "contact": "https://ax-horca.com/"
      }
    }
  ],
  "reviews": [
    {
      "id": "sofia-malketov-asen-yordanov11",
      "checkedOn": "2026-11-14",
      "website": "https://malketov.com/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://malketov.com/",
        "https://malketov.com/uslugi",
        "https://malketov.com/za-nas"
      ],
      "notes": "ActualownBookFIRSTrootexplicitcall/email/callbackrequesttoagreeconvenientdayandtime; independentpublished0876876369phonepathselectedratherthangenericcallbackform. Actual Services readercachemiss thencompleteordinaryGETvisiblemenuall9repaircategoriesandfooterreviewed; selectedengineoil/filterserviceexplicitlylisted. FullRoot/About plusvisibleBook/services/contact/nav containno numericselectedfee, Prices/tariffPDF/image/menuanchoror knownblockedpricemenu; selectedservicegenuinelynotpubliclylisted/service_reviewed only. RootcontactpublishesexactSofiaSPZSlatinaAsenYordanov11andMonFri09–19; partialdaysonly,weekendnotassumedclosed. AboutidentifiesDimitarMalketovownerwithindependentbranding/phone; runtime+ALLintakes/native6domain/phone/address0. BothPrivacyandTermsanchoractually#andreturnroot, noavailablepolicytext/notclaimtermsaccepted/readorlegalclearance. Displayedcustomerreviewsignored/notcopied; noMapsreviewsorownerMapslinkopened, no coordinateinferred,coordsnull. No providerbulk/scripts/API/photos/logo/copiedprose/customerinput/callback/call/booking.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://malketov.com/",
        "serviceUrls": [
          "https://malketov.com/uslugi"
        ],
        "notes": "ActualownBookFIRSTrootexplicitcall/email/callbackrequesttoagreeconvenientdayandtime; independentpublished0876876369phonepathselectedratherthangenericcallbackform. Actual Services readercachemiss thencompleteordinaryGETvisiblemenuall9repaircategoriesandfooterreviewed; selectedengineoil/filterserviceexplicitlylisted. FullRoot/About plusvisibleBook/services/contact/nav containno numericselectedfee, Prices/tariffPDF/image/menuanchoror knownblockedpricemenu; selectedservicegenuinelynotpubliclylisted/service_reviewed only. RootcontactpublishesexactSofiaSPZSlatinaAsenYordanov11andMonFri09–19; partialdaysonly,weekendnotassumedclosed. AboutidentifiesDimitarMalketovownerwithindependentbranding/phone; runtime+ALLintakes/native6domain/phone/address0. BothPrivacyandTermsanchoractually#andreturnroot, noavailablepolicytext/notclaimtermsaccepted/readorlegalclearance. Displayedcustomerreviewsignored/notcopied; noMapsreviewsorownerMapslinkopened, no coordinateinferred,coordsnull. No providerbulk/scripts/API/photos/logo/copiedprose/customerinput/callback/call/booking."
      }
    },
    {
      "id": "sofia-mobilix-mobile-vacuum-oil",
      "checkedOn": "2026-11-14",
      "website": "https://mobilixautocare.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://mobilixautocare.bg/",
        "https://mobilixautocare.bg/smyana-na-dvigatelno-maslo/",
        "https://mobilixautocare.bg/elementor-3726/"
      ],
      "notes": "ActualownBookFIRSTrootCTAreadcurrentordinaryGETafterreaderTimeout; explicitphoneorformreservationthenstaffconfirmation, independent0882742755phonepathselectedbecauseJSbuttons notactualreadcalendar. FullselectedoilserviceandcurrentrootmenuFROM75EURconsistent, privategarage/yard/privateparkingREQUIRED/notpublicstreet, vacuumextractionapparatusliteral; oils/filters andfinalscopequotedbyVIN, no claimedfixedall-inpartsamountorcomputedconversion. Publishedwholemenuselectedfivefromfeesread, no retail/deposit/freepromotion chosen. Full8-clauseTermsordinaryGETafterreaderunavailable: mobileaccess/safety/confirmation/appointmentsadjustable, no explicitsourceextraction/commercial-datarestriction found(notlegalclearance/acceptedterms). ExactownerbodySofiamobileattendance, oneoperatorservice_area/addressnull/coordsnull,noregionclones. Generalhourssourcesconflictroot09–20daily/servicefooterweekday09–19Saturday09–15/terms09–19daily,allhoursomitted; generic40–120durationnotassignedselectedservice. Runtime+ALLintakes/native6domain/phone0. No Maps/scriptsAPI/providerexport/photos/logos/reviews/copiedprose/consent/customerinput/booking."
    },
    {
      "id": "sofia-nvs-workshop-tsarigradsko391",
      "checkedOn": "2026-11-14",
      "website": "https://nvs.bg/",
      "bookingEntry": "https://nvs.bg/workshop/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://nvs.bg/",
        "https://nvs.bg/workshop/",
        "https://nvs.bg/contact-us/",
        "https://nvs.bg/about-us/",
        "https://nvs.bg/carwash/"
      ],
      "notes": "ActualownBookFIRSTrootworkshopCTA→completeconfiguredownedrequestformwithvehicle/service/preferreddate/contactfields; readonlynoneentered/submitted,nodatepickeroraccount/livechatcalled. Actualselectedcomputerdiagnostic listedfullWorkshop, with entireRoot/About/Contacts/menu/footer reviewed. Workshopdiagnostics numericfeeabsent, no linkedworkshopPricesPDF/image/menuor blockedselectedtariff known; service_reviewed selecteddiagnostic only. SeparateownCarwashpage DOESpublisholdBGNfeesandObikolna4address, so NOTimported/unpublished/carwashbookingclaim, no crossbranchfees projected. Selectedworkshop addressTsarigradsko391 consistentRoot/Workshop/Contact/About andownrepairphone0988730020; onephysicalbusiness/notautohouse/rental/locksmith/carwashaliases. Servicehourstable09:30–18:30MonSat conflictsfooterworkshop09–18MonFri/weekendclosed,allhoursomittedhonestly. Fullobservednavigation/footer no separateownerTerms/Privacyanchorvisible, ordinarytrademarknoticeonly/notlegalpermissionclaim. Runtime+ALLintakes/native6domain/phone/address0; no fakequarter/point fromMuseum/campus,coordsnull. NoDpfdefeat/retail/rental/deposits imported. NoGoogleiframe/maps/providerbulk/photos/logo/reviews/copiedprose/customerinput/bookings.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://nvs.bg/workshop/",
        "serviceUrls": [
          "https://nvs.bg/workshop/"
        ],
        "notes": "ActualownBookFIRSTrootworkshopCTA→completeconfiguredownedrequestformwithvehicle/service/preferreddate/contactfields; readonlynoneentered/submitted,nodatepickeroraccount/livechatcalled. Actualselectedcomputerdiagnostic listedfullWorkshop, with entireRoot/About/Contacts/menu/footer reviewed. Workshopdiagnostics numericfeeabsent, no linkedworkshopPricesPDF/image/menuor blockedselectedtariff known; service_reviewed selecteddiagnostic only. SeparateownCarwashpage DOESpublisholdBGNfeesandObikolna4address, so NOTimported/unpublished/carwashbookingclaim, no crossbranchfees projected. Selectedworkshop addressTsarigradsko391 consistentRoot/Workshop/Contact/About andownrepairphone0988730020; onephysicalbusiness/notautohouse/rental/locksmith/carwashaliases. Servicehourstable09:30–18:30MonSat conflictsfooterworkshop09–18MonFri/weekendclosed,allhoursomittedhonestly. Fullobservednavigation/footer no separateownerTerms/Privacyanchorvisible, ordinarytrademarknoticeonly/notlegalpermissionclaim. Runtime+ALLintakes/native6domain/phone/address0; no fakequarter/point fromMuseum/campus,coordsnull. NoDpfdefeat/retail/rental/deposits imported. NoGoogleiframe/maps/providerbulk/photos/logo/reviews/copiedprose/customerinput/bookings."
      }
    },
    {
      "id": "sofia-simda-slivnitsa178-dance",
      "checkedOn": "2026-11-14",
      "website": "https://simda.bg/",
      "bookingEntry": "phone",
      "bookingReview": "phone_booking_reviewed",
      "reviewedUrls": [
        "https://simda.bg/",
        "https://simda.bg/контакти/",
        "https://simda.bg/events/модерни-танци-и-хип-хоп-с-катрин-7-12-г/",
        "https://simda.bg/график/",
        "https://simda.bg/цени/",
        "https://simda.bg/политика-за-поверителност/",
        "https://ax-horca.com/"
      ],
      "notes": "ActualownBookFIRSTrootexplicitEnrolCTA→ownContactpage withcurrent0888706645/genericenquiry. Parentapprovesindependentphonepath basedonthatlinkage pluscurrentselectedcourse; NOTfabricatedverbatimclassphoneCTA/instantcalendar. CurrentownedCourseeventordinaryGETaftercachemiss explicitly7–12children/12Oct2026ongoingMonWed18–19, exactSlivnitsa178; fullSchedule current2026classes/rulesread. FullPricespage357lineshasadultHipHop/Kpop5.11EUR butNOselected7–12childcoursefee; adult/otherdisciplinefees nottransferred, no knownblockedchildtariff, genuinelyunpublishedselectedservice/service_reviewed only. Emptyold2018weddingprojectandKpopabsentcurrentprogrammeNOTselected/notclaimedbookable. CurrentContactphone0888706645chosen, notold2024socialaggregator888887224. FullPrivacyordinaryGET states controllerSIMDAOOD/GDPR,noexpresscommercial/extractionrestrictionfound; nolegalclearance/consentclaim. Runtime+ALLWIPdomain/canonical/phone0; sharedbuildingexistingAxHorca0888391240: independentlyreadownerrootAxSportbrand/phone/Sitnyakovooffice, noSIMDAcrossbrand/phone/aliasfound; SIMDAownlegaloperatorSIMDAOOD. Keepmanualrootidentitycomparison, notassumeseparatejustdifferentprogramme. Onepremise/noroom/instructor/music aliases. Allcoordsnull,nocampuspoint/maps/reviews/photos/logo/prosecopied orcustomerfields/bookings.",
      "pricingDecision": "not_publicly_listed",
      "priceSearch": {
        "outcome": "not_published",
        "bookingUrl": "https://simda.bg/",
        "serviceUrls": [
          "https://simda.bg/events/модерни-танци-и-хип-хоп-с-катрин-7-12-г/",
          "https://simda.bg/график/",
          "https://simda.bg/цени/"
        ],
        "notes": "ActualownBookFIRSTrootexplicitEnrolCTA→ownContactpage withcurrent0888706645/genericenquiry. Parentapprovesindependentphonepath basedonthatlinkage pluscurrentselectedcourse; NOTfabricatedverbatimclassphoneCTA/instantcalendar. CurrentownedCourseeventordinaryGETaftercachemiss explicitly7–12children/12Oct2026ongoingMonWed18–19, exactSlivnitsa178; fullSchedule current2026classes/rulesread. FullPricespage357lineshasadultHipHop/Kpop5.11EUR butNOselected7–12childcoursefee; adult/otherdisciplinefees nottransferred, no knownblockedchildtariff, genuinelyunpublishedselectedservice/service_reviewed only. Emptyold2018weddingprojectandKpopabsentcurrentprogrammeNOTselected/notclaimedbookable. CurrentContactphone0888706645chosen, notold2024socialaggregator888887224. FullPrivacyordinaryGET states controllerSIMDAOOD/GDPR,noexpresscommercial/extractionrestrictionfound; nolegalclearance/consentclaim. Runtime+ALLWIPdomain/canonical/phone0; sharedbuildingexistingAxHorca0888391240: independentlyreadownerrootAxSportbrand/phone/Sitnyakovooffice, noSIMDAcrossbrand/phone/aliasfound; SIMDAownlegaloperatorSIMDAOOD. Keepmanualrootidentitycomparison, notassumeseparatejustdifferentprogramme. Onepremise/noroom/instructor/music aliases. Allcoordsnull,nocampuspoint/maps/reviews/photos/logo/prosecopied orcustomerfields/bookings."
      }
    },
    {
      "id": "sofia-ax-horca-bio-dragan-tsankov8",
      "checkedOn": "2026-11-14",
      "website": "https://ax-horca.com/",
      "bookingEntry": "https://ax-horca.com/",
      "bookingReview": "owned_booking_reviewed",
      "reviewedUrls": [
        "https://ax-horca.com/"
      ],
      "notes": "FreshactualownBookFIRSTenrolmentformthenentireone-pagevenueprogramme/sharedtariff/contact/footerreviewed; currentordinaryGETvisibleHTMLdropdown explicitlyBioFacultyTueThu18:30–19:30 WITHOUTstartTBC, matchingbodyintermediategroupstarted6Oct2026. Previously008held18:30TBCnowresolvedbycurrentownedconfiguredoption; TBCremainsONLYdifferent19:30beginners, notimported. No optionclicked/selected,noform/customerinput/submit. ExactphysicalDraganTsankov8/BioFaculty distinctfrom2existingchainvenuesSlivnitsa178andVeda25A; shared10EURsinglevisitunder4-venueprogramme/directactualbranchBook sufficientlyboundnotseparatenetworkcampaign. Priceunitonepersononeclass, notmonthly45EURdivided/freecard. Actualweeklyclassspan60min(notgeneralduration). Airportoldterminal/museumstillheldnoexactstreet/entranceproof, noMapsrequest; noquarterorcampuscoordsinvented. OwnerAxSportbranding/0888391240andSitnyakovo41AOFFICEnotteachingaddress; no staff/level/roomclone. Runtime+ALLWIPsharedchaindomain/phone reviewedagainstactualdistinctnewpremise. Fullvisiblemenu/footer no separateownerTerms/Privacylinkshown, nolegalpermissionclaim. Minimalfreshfacts only,noimages/logos/reviews/social/expressiveprose/API/booking."
    }
  ]
};
