// First-party public appointment/service/contact pages reviewed on 2026-11-16.
// Intake only: shared integration, identity binding and photo review stay separate.
export default {
  records: [
    {
      id: 'sofia-north-dog-grooming-vrabnitsa637',
      name: 'North Dog Grooming',
      cityCode: '68134',
      neighborhood: 'Връбница 2',
      address: 'София, ж.к. Връбница 2, бл. 637, до паркинга на Северен парк',
      locationKind: 'premises',
      coordinates: null,
      category: 'pets',
      website: 'https://sites.google.com/view/northdoggrooming',
      phone: '+359898776598',
      services: [
        { name: 'Къпане и сушене на куче', category: 'pets', appointmentModel: 'appointment' },
        { name: 'Подстригване и оформяне на куче', category: 'pets', appointmentModel: 'appointment' },
        { name: 'Разресване на куче и премахване на заплитания', category: 'pets', appointmentModel: 'appointment' },
      ],
      openingHours: {
        days: [
          { weekday: 1, periods: [] },
          { weekday: 2, periods: [{ open: '10:00', close: '18:00' }] },
          { weekday: 3, periods: [{ open: '10:00', close: '18:00' }] },
          { weekday: 4, periods: [{ open: '10:00', close: '18:00' }] },
          { weekday: 5, periods: [{ open: '10:00', close: '18:00' }] },
          { weekday: 6, periods: [{ open: '10:00', close: '18:00' }] },
          { weekday: 7, periods: [] },
        ],
        sourceUrl: 'https://sites.google.com/view/northdoggrooming/контакти',
        checkedOn: '2026-11-16',
      },
      booking: { kind: 'phone', phone: '+359898776598' },
      verification: {
        status: 'approved',
        checkedOn: '2026-11-16',
        validUntil: '2027-02-14',
        booking: {
          url: 'https://sites.google.com/view/northdoggrooming',
          excerpt: 'Запазете своя час на телефон: 0898 77 65 98',
        },
        contact: 'https://sites.google.com/view/northdoggrooming/контакти',
      },
    },
  ],
  reviews: [
    {
      id: 'sofia-north-dog-grooming-vrabnitsa637',
      checkedOn: '2026-11-16',
      website: 'https://sites.google.com/view/northdoggrooming',
      bookingEntry: 'phone',
      reviewedUrls: [
        'https://sites.google.com/view/northdoggrooming',
        'https://sites.google.com/view/northdoggrooming/услуги',
        'https://sites.google.com/view/northdoggrooming/контакти',
      ],
      bookingReview: 'phone_booking_reviewed',
      pricingDecision: 'not_publicly_listed',
      notes: 'Reviewed the actual telephone-booking invitation first, then the complete linked Services and Contacts pages. The first-party site confirms a dog-grooming salon at Vrabnitsa 2 block 637 near the North Park car park, with Tuesday–Saturday 10:00–18:00 and Monday/Sunday closed. Listed bathing/drying, haircut/styling and brushing/detangling are included without invented duration or prices. No online calendar or separate price-list link is published. Coordinates remain null; the neighborhood is the owner-published premises neighborhood, not a serving-area claim.',
      priceSearch: {
        outcome: 'not_published',
        bookingUrl: 'https://sites.google.com/view/northdoggrooming',
        serviceUrls: ['https://sites.google.com/view/northdoggrooming/услуги'],
        notes: 'Actual booking is by the displayed phone, without an embedded booking menu. The complete linked service list describes grooming procedures but publishes no monetary amounts and no separate tariff link. Contacts confirms the same booking phone, premises and hours. This is a service-only review; missing prices stay absent.',
      },
    },
  ],
}
