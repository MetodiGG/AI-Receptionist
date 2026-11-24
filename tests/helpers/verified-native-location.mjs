export function verifiedNativeFixture(business, { latitude, longitude }) {
  const point = { latitude, longitude }
  return { address: 'София, ул. Примерна 7', ...business, location_revision: 1,
    public_profile: { ...business.public_profile, ...point },
    location_source: { ...point, match_version: 2, location_revision: 1,
      source_url: 'https://www.openstreetmap.org/node/123456', licence: 'ODbL-1.0',
      attribution: '© OpenStreetMap contributors' } }
}
