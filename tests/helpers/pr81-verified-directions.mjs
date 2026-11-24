import { publicBusinessLocation } from '../../lib/business-directions.mjs'

// Fixture proof represents the verified branch adapter, not a real venue.
export function withVerifiedDirections(business, point = { latitude: 42.665, longitude: 23.282 }) {
  const row = {city:'София',cityCode:'68134',...business}
  return {...row,navigationLocation:publicBusinessLocation(row,point)}
}
