import { BULGARIAN_CITIES } from './bulgarian-cities.mjs'
import { NEIGHBOURHOODS, transliterate } from './business-location.mjs'

export const SOFIA_CITY_CODE = '68134'
const tidy = value => typeof value === 'string' ? value.normalize('NFC').replace(/\s+/gu, ' ').trim() : ''
const labelKey = value => tidy(value).toLocaleLowerCase('bg')
const sofiaNames = new Set(['софия', 'sofia', 'sofiya', 'sofija'])
const otherTowns = new Set(BULGARIAN_CITIES.filter(row => row.code !== SOFIA_CITY_CODE)
  .flatMap(row => [labelKey(row.name), labelKey(row.nameEn)]))
// Separate settlements within Stolichna Municipality are not Sofia city.
// Do not treat unmarked names as villages: a business may use that name in a
// street, neighbourhood or building. Bare tokens are only used for Sofia.
const separateSettlements = new Set([
  'балша','банкя','бистрица','бухово','бусманци','владая','волуяк','войняговци','герман','гниляне',
  'горни богров','доброславци','долни богров','долни пасарел','железница','желява','житен','иваняне',
  'казичене','катина','клисура','кокаляне','кривина','кубратово','локорско','лозен','мало бучино',
  'мърчаево','мировяне','мрамор','негован','нови искър','панчарево','плана','подгумер','световрачане',
  'чепинци','яна',
])
const cityNeighborhoods = new Set(NEIGHBOURHOODS[SOFIA_CITY_CODE].flatMap(name => [labelKey(name), labelKey(transliterate(name))]))

export function coordinatePair(point) {
  return point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180 &&
    (point.latitude !== 0 || point.longitude !== 0)
    ? { latitude: point.latitude, longitude: point.longitude } : null
}

export function coordinatePairFromGeoJson(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null
  const [longitude, latitude] = coordinates
  return coordinatePair({ latitude, longitude })
}

export const businessVisitAddress = value => tidy(value)
export const sameVisitAddress = (left, right) => Boolean(tidy(left) && labelKey(left) === labelKey(right))

function addressLocality(address) {
  let city = false, outside = false
  const clauses = (typeof address === 'string' ? address : '').split(/[,;\n]/u).map(tidy).filter(Boolean)
  const localityClauses = clauses.filter(value => !/^(?:българия|bulgaria)\.?$/iu.test(value))
  for (let i = 0; i < localityClauses.length; i++) {
    let clause = localityClauses[i]
    clause = clause.trim().replace(/^(?:\d{4}\s+|\s)+/u, '')
    const prefix = /^(гр\s*\.\s*|град\s+|с\s*\.\s*|село\s+|city\s+|town\s+|village\s+)/iu.exec(clause)
    const name = labelKey(clause.slice(prefix?.[0].length ?? 0).replace(/\s+\d{4}$/u, '').replace(/\.$/u, ''))
    if (sofiaNames.has(name)) {
      if (prefix && /^(?:с\s*\.|село|village)/iu.test(prefix[0])) outside = true
      else city = true
    } else if (otherTowns.has(name) || separateSettlements.has(name)) {
      if (prefix || ((i === 0 || i === localityClauses.length - 1) && !cityNeighborhoods.has(name))) outside = true
    }
  }
  return { city, outside }
}

export function sofiaBusinessLocality(business) {
  const code = String(business?.cityCode || business?.city_ekatte || '').trim()
  const reported = labelKey(business?.city)
  const country = labelKey(business?.countryCode || business?.country)
  const address = addressLocality(business?.locationAddress || business?.address)
  const declaredOther = otherTowns.has(reported) || separateSettlements.has(reported)
  if (country && !['bg', 'bgr', 'bulgaria', 'българия'].includes(country)) return 'outside'
  if (code && code !== SOFIA_CITY_CODE) return 'outside'
  if (address.outside) return address.city ? 'conflict' : 'outside'
  if (declaredOther) return code === SOFIA_CITY_CODE || address.city ? 'conflict' : 'outside'
  return code === SOFIA_CITY_CODE || address.city || sofiaNames.has(reported) ? 'sofia' : 'unknown'
}

export function isSofiaDiscoveryBusiness(business) {
  return sofiaBusinessLocality(business) === 'sofia'
}

// Geographic exclusions catch swapped, zero or remote points; being inside
// this generous envelope cannot verify an address. A current exact postal
// receipt or first-party branch evidence is required separately.
export function possibleSofiaPoint(point) {
  const pair = coordinatePair(point)
  return Boolean(pair && pair.latitude >= 42.45 && pair.latitude <= 42.9 &&
    pair.longitude >= 23.1 && pair.longitude <= 23.65)
}

const nonVisitKinds = new Set(['service_area', 'mobile', 'online', 'online_only'])
export function nonVisitLocationKind(business) {
  return [business?.locationKind, business?.location_kind, business?.public_profile?.location_kind]
    .find(value => nonVisitKinds.has(value)) || null
}
export function noPublicVisit(business) {
  return business?.locationStatus === 'not_visit_location' || Boolean(nonVisitLocationKind(business))
}
