// One home-visit identity. The owner's retail shop is not the service worksite
// and must not supply a neighborhood, distance, workshop hours or quota credit.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const site = 'https://mieleservisbg.com/'
const book = `${site}zashto-da-izberete-nas/`, services = `${site}услуги/`
const contact = `${site}kontakti-i-magazin/`

export default {
  records: [{
    id: 'sofia-miele-servisbg-home-diagnostic', name: 'MieleServisBG · СТАНИ 83',
    cityCode: '68134', neighborhood: null, address: null,
    locationKind: 'service_area', coordinates: null,
    category: 'home_services', website: site, phone: '+359888105240',
    services: [{
      name: 'Посещение и диагностика на извънгаранционен уред Miele',
      category: 'home_services', appointmentModel: 'home_visit',
      description: 'Посещение на адрес в София и диагностика на извънгаранционен уред Miele. Цената е за посещение с диагностика, не за цял ремонт или резервни части. Обадете се първо с модела и проблема, за да се уточни посещението.',
      price: { amount: 40, currency: 'EUR', kind: 'fixed', unit: 'посещение с диагностика', sourceUrl: services, checkedOn, validUntil },
    }],
    booking: { kind: 'phone', phone: '+359888105240' },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: book, excerpt: 'За сервизиране на уред Miele собственикът насочва към 0888 105 240 с модел и описание на проблема; посещението се уточнява по телефона.' },
      contact,
    },
  }],
  reviews: [{
    id: 'sofia-miele-servisbg-home-diagnostic', checkedOn, website: site,
    bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [site, book, services, contact, `${site}garantsionen-serviz/`,
      `${site}защита-на-личната-информация/`, `${site}политика-за-поверителност/`, `${site}начини-на-плащане/`],
    notes: 'Root independently read the actual named-service telephone instruction in the current owner About/FAQ FIRST, then the complete live Services and Contact documents, both entire linked privacy texts and robots. FAQ specifically requests calls to888105240 with model/fault for Miele warranty or nonwarranty servicing; Contact labels this and alternate888450493 as SERVICE phones, not the separate retail-order phones. There is no claimed own calendar, selected slot, scheduled technician arrival or automatic confirmation. The literal selected tariff is40EUR for a Sofia address visit PLUS diagnosis of an OUT-OF-WARRANTY appliance, not a complete repair, parts price, free warranty service, retail purchase or currency conversion. Only this one operation is admitted; carrying50/30EUR and installation25/50EUR rows, products, financing, free delivery and warranty guarantees are excluded. No manufacturer authorization or safety/outcome claim copied. Child research-home-005-20261116.json transparently records its preliminary Services read before finding the FAQ instruction and subsequent complete live tariff re-read; root separately performed actual phone-entry-first review before approval. The merchant has a real Nadezhda1 shop/service base, but the selected appointment happens at the customer address: record remains ONE service_area identity with no address, quarter, coordinates, openingHours or duration. No physical neighborhood cell or nearby-distance credit; shop hours are not home-visit availability and the provider is not multiplied across Sofia quarters. All current catalogue and intake host, merchant aliases, both service phones and retail phones checked before owner requests; no existing match. Ordinary public robots allows these pages, while cart action queries/admin/log/upload paths are excluded and untouched; no sitemap crawl. Reader omissions/cache misses and sandbox-only DNS failure were followed by separately approved ordinary public HTTPS GETs, not a challenge, blocked route, account, private API or consent bypass. Both full linked privacy documents concern personal data/e-commerce; no separate Terms link or express minimal-facts automation/database-reuse prohibition surfaced in inspected navigation, not a licence or legal-clearance assertion. Child also read the complete warranty and payment pages for service/retail scope, retaining no bank or financing data. Only minimal independently phrased facts and separately reviewed illustrative artwork are used; no owner photos, prose, ratings, customer reviews or private information copied. No forms, search inputs, consent, cart, payment, call, email, account, customer data, booking, map/geocoder, paid provider or production write. Root owns exact inventory binding, aggregate import, activity-photo association, full acceptance gates and publication.',
  }],
}
