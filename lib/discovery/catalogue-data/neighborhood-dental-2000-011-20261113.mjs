// Single Sofia dental premise; the operator's Burgas venue and non-dental services are excluded.
const checkedOn = '2026-11-14';
const validUntil = '2027-02-12';
const website = 'https://mh-dentalcenter.com/';

export default {
  records: [{
    id: 'sofia-mh-dental-center-lagera59',
    name: 'M&H Dental Center · София',
    cityCode: '68134', neighborhood: 'Лагера',
    address: 'София, ж.к. Лагера, бл. 59, партер',
    locationKind: 'premises', coordinates: null, category: 'other',
    website, phone: '+359886320669',
    booking: { kind: 'form', url: website },
    services: [{
      name: 'Безплатна дентална консултация',
      category: 'other', appointmentModel: 'appointment',
      description: 'Първоначална дентална консултация след предварителна заявка за кабинета в София. Безплатна е консултацията, не изработката на конструкции, протезирането, имплантите или последващото лечение.',
      price: { amount: 0, currency: 'EUR', kind: 'fixed', unit: 'само дентална консултация', sourceUrl: website, checkedOn, validUntil }
    }],
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: website, excerpt: 'Собственият сайт съдържа Запитване за час с предварителни дата и час и избор на град София или Бургас. Предлага и изрично телефонно уговаряне на среща със софийските зъболекари.' },
      contact: `${website}contacts/`
    }
  }],
  reviews: [{
    id: 'sofia-mh-dental-center-lagera59', website, checkedOn,
    bookingEntry: website, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [`${website}robots.txt`, website, `${website}contacts/`],
    notes: 'Actual owner root freeconsultation/Contact entry inspected first, then full own Contacts by fresh normalHTTP after reader400timeout (not a403/challenge), and entire root native service/About/team/footer plus actual requestform. Native ZapitvaneZaChas form has name/email/phone/preferreddate/time/message and EXACTcityselectorSofia/Burgas; no input/city/date/time/service/consent/submit selected. Independent root Appointments explicitly invites calling for meeting with Sofia dentistsMagdalenaKovacheva886320669/DilyanaBankova887703517. Configured real root appointmentrequestform, not generic Contact correspondenceform or claimed instantcalendar/confirmation. Root independently publishes Bulgarian freeconsultation CTA and detailed dentalServices freeinitialexam context; ONLYminimal free dentalconsultation fact imported, not free waxup/constructions/implants/prostheses/entirecourse. No fixedminutespublished, no refund/NHSdiscount/deposit/promo computed. Own About establishes primaryDENTALcentre with dentists and technician; source fillers/botox/cosmetic services excluded entirely from selected inventory, no safety/outcome/clinicalcase claims copied. Same operator sharedSofiaLagera59groundfloor not one business per dentist/technician; actualContacts clearly separate BurgasOborishte56 excludedoutsideSofia. Full actual root/Contact navigation/footers and native form inspected, no Terms/Privacy/tariff/calendar link observed; not claim policies absent or sourceuse permission/legal clearance. Onlyminimal independently phrased public facts, no proprietary prose/photos/reviews/ratings/clinicalcase media reused. RootbodySofiaMonFri08–18 conflicts header/footer/Contact09–19, so ALL weeklyhours omitted rather than choosing; Saturdaypriorbooking not converted to ordinaryopeninghours. Location explicitblock59/quarterLagera, no street/entrance/coordinate guessed, no Maps/provider/geocoding/Nominatim/GPS/privateAPI/customer/account/payment/call/upload/form/consent/productionwrites. BothSofiaphones/operator/domain/blockpreflight0 across currentruntime+all2000intakes; final validated inventory review identity in memory only, root assigns static bindings/photos.'
  }]
};
