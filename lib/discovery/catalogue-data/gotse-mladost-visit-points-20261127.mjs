import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const updates = new Map([
  ['sofia-21-cutz-gotse-delchev', {
    name: '21 Cutz', category: 'barber', neighborhood: 'Гоце Делчев',
    address: 'София, ж.к. Гоце Делчев, бл. 52Е', website: 'https://www.21cutz.com/', phone: '+359877310884',
    booking: { kind: 'form', url: 'https://book.21cutz.com/' },
    verificationContact: 'https://www.21cutz.com/', verificationBooking: 'https://book.21cutz.com/',
    point: [42.6674572, 23.2917974], source: 'https://www.21cutz.com/',
  }],
  ['sofia-dirty-garage-mladost2-block272b', {
    name: 'Dirty Garage', category: 'detailing', neighborhood: 'Младост 2',
    address: 'София, Младост 2, Марбъл Резиденс, бл. 272Б', website: 'https://dirtygarage.bg/', phone: '+359898443755',
    booking: { kind: 'phone', phone: '+359898443755' },
    verificationContact: 'https://dirtygarage.bg/policies/contact-information',
    verificationBooking: 'https://dirtygarage.bg/products/polirane-na-farove-sofia',
    point: [42.6475816, 23.3680674], source: 'https://dirtygarage.bg/products/polirane-na-farove-sofia',
  }],
])

const mallId = 'sofia-thai-spa-the-mall', mallWebsite = 'https://thaispa.bg/'
const mallBooking = 'https://www.fresha.com/bg/a/the-mall-tay-spa-sofia-boulevard-tsarigradsko-shose-115-4g6mhoep?pId=113178'
const previousMallAddress = 'София, бул. Цариградско шосе 115, ет. -2, The Mall'
const mallAddress = 'София, кв. Полигона, бул. Цариградско шосе 115З, The Mall, ет. -2, ляв вход'
const oldMallPin = Object.freeze({ latitude: 42.663956435978896, longitude: 23.37883487997901 })

function isOldMallPoint(row) {
  const point = row.coordinates
  return row.id === mallId && Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude) &&
    Math.abs(point.latitude - oldMallPin.latitude) < .00001 &&
    Math.abs(point.longitude - oldMallPin.longitude) < .00001
}

// Each coordinate is the exact owner-linked destination (a named storefront
// or the actual building); neither establishes an independently labelled door.
// Don't replace a newer point or transfer a pin to a different tenant.
export function applyGotseMladostVisitPoints20261127(rows) {
  return rows.map(row => {
    // The shopping centre's official contact and Sofia's civic entry name
    // 115З. The previous plain-115 point is a different site ~520 m away.
    // Visitor arrival is at the mall address, not a marked underground door.
    if (row.id === mallId && row.name === 'THAI SPA · The Mall' && row.cityCode === '68134' &&
        row.neighborhood === null && row.category === 'health' && row.locationKind === 'premises' &&
        row.address === previousMallAddress && row.website === mallWebsite && row.phone === '+35992919222' &&
        row.booking?.kind === 'form' && row.booking.url === mallBooking &&
        row.verification?.status === 'approved' && row.verification.contact === mallWebsite + 'pages/contact' &&
        row.verification.booking?.url === mallWebsite + 'pages/contact' &&
        row.coordinates?.method === 'verified_official_address' && row.coordinates.source === OFFICIAL_SOFIA_SOURCE_URL &&
        row.coordinates.addressId === '125239' && row.coordinates.sourceAddress === previousMallAddress &&
        row.coordinates.latitude === oldMallPin.latitude && row.coordinates.longitude === oldMallPin.longitude) {
      const neighborhood = 'Полигона'
      return { ...row, neighborhood, address: mallAddress, coordinates: {
        latitude: 42.660230, longitude: 23.382686, method: 'verified_official_address',
        source: OFFICIAL_SOFIA_SOURCE_URL, sourceAddress: mallAddress, sourceCityCode: row.cityCode,
        sourceNeighborhood: neighborhood, sourceWebsite: mallWebsite, addressId: '100187',
        checkedOn: '2026-11-27', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
      } }
    }
    // A source update with changed business metadata must not reuse the old
    // plain-number pin. Drop it before publication; leave unrelated rows and
    // historical raw snapshots alone, including any independently new pin.
    if (isOldMallPoint(row)) return { ...row, coordinates: null }
    const fix = updates.get(row.id)
    if (!fix || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.coordinates !== null ||
        !['name','category','neighborhood','address','website','phone'].every(key => row[key] === fix[key]) ||
        row.verification?.status !== 'approved' || row.verification.contact !== fix.verificationContact ||
        row.verification.booking?.url !== fix.verificationBooking ||
        !Object.entries(fix.booking).every(([key,value]) => row.booking?.[key] === value)) return row
    return { ...row, coordinates: {
      latitude: fix.point[0], longitude: fix.point[1], source: fix.source,
      method: 'first_party_coordinates', sourceAddress: row.address,
    } }
  })
}
