// Future catalogue intake only. Historical Nominatim fixture resolution is
// deliberately kept separate and must never certify a new point.
import { registrationAddressQuery, matchRegistrationAddress, SOFIA_CITY_CODE } from '../registration-address-match.mjs'

const officialCandidate = row => row?.cityCode===SOFIA_CITY_CODE && row.locationKind==='premises' && !row.coordinates
  ? { city_ekatte: SOFIA_CITY_CODE, city: row.city || 'София', neighborhood: row.neighborhood, address: row.address }
  : null

export function catalogueGeocodeIntakeRequest(row) {
  const request = registrationAddressQuery(officialCandidate(row))
  // A missing road type or an entrance/floor-qualified premise is held for
  // exact municipal/branch evidence, never promoted by a building centroid.
  return request?.streetType && !request.unitSpecified ? request : null
}

export function matchCatalogueGeocodeIntake(row, candidates, checkedOn) {
  if (!catalogueGeocodeIntakeRequest(row) || typeof checkedOn!=='string' ||
    !/^\d{4}-\d{2}-\d{2}$/u.test(checkedOn) || !Number.isFinite(Date.parse(checkedOn))) return null
  const point=matchRegistrationAddress(officialCandidate(row),candidates)
  return point ? { id:row.id, coordinates: { latitude:point.latitude,longitude:point.longitude,source:point.source_url,
    method:'verified_address_geocode',sourceAddress:row.address,checkedOn,licence:point.licence,attribution:point.attribution } } : null
}
