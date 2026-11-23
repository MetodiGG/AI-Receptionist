import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const reviewed = new Map([
  ['sofia-reformer-club-swan', {
    name: 'Reformer Club Swan', category: 'fitness', neighborhood: 'Студентски комплекс',
    address: 'София, Студентски комплекс, ул. Проф. Арх. Петър Ташев 1А', website: 'https://reformerclubswan.com/',
    phone: '+359887616504', contact: 'https://reformerclubswan.com/kontakti/', evidence: 'https://reformerclubswan.com/',
    booking: { kind: 'form', url: 'https://book.reformerclubswan.com/calendar/public' },
    postal: ['104694', 42.656389, 23.348965],
  }],
  ['sofia-sundance-mladost1a-rakovski12', {
    name: 'SUNDANCE · школа за народни танци', category: 'fitness', neighborhood: 'Младост 1А',
    address: 'София, ж.к. Младост 1А, ул. Кръстю Раковски 12', website: 'https://sundance-bg.com/',
    phone: '+359878491118', contact: 'https://sundance-bg.com/', evidence: 'https://sundance-bg.com/novi-grupi',
    booking: { kind: 'phone', phone: '+359878491118' },
    postal: ['96556', 42.651794, 23.380805],
  }],
  ['sofia-stephan-iztok', {
    name: 'Stephan · Изток', category: 'hair', neighborhood: 'Изток',
    address: 'София, ул. Антон Чехов 69', website: 'https://www.stephan.bg/',
    phone: '+359888456047', contact: 'https://www.stephan.bg/saloni/iztok', evidence: 'https://www.stephan.bg/',
    booking: { kind: 'phone', phone: '+359888456047' },
    postal: ['35482', 42.670865, 23.363502],
  }],
])

// One manually reviewed postcode feature per existing premises. Do not feed
// these aliases into the generic matcher or replace owner-facing addresses.
export function applyNamedRoadAliasRecovery20261123(records) {
  return records.map(row => {
    const review = reviewed.get(row.id)
    if (!review || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.coordinates !== null) return row
    const { contact, evidence, booking, postal, ...identity } = review
    if (!Object.entries(identity).every(([key, value]) => row[key] === value) ||
        !row.booking || Object.keys(row.booking).length !== Object.keys(booking).length ||
        !Object.entries(booking).every(([key, value]) => row.booking[key] === value) ||
        row.verification?.status !== 'approved' || row.verification.contact !== contact || row.verification.booking?.url !== evidence) return row

    const [addressId, latitude, longitude] = postal
    return { ...row, coordinates: {
      latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: row.address, sourceCityCode: row.cityCode, sourceNeighborhood: row.neighborhood, sourceWebsite: row.website,
      checkedOn: '2026-11-23', addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
