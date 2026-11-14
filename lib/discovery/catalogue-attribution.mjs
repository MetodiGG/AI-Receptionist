// Licence notice only; contains no geocoder or runtime provider requests.
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors'
export const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright'

// Small public notices only: importing these into the shared footer must not
// pull the municipal source archive, address index or catalogue into clients.
export { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_LICENSE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from './official-sofia-address-source.mjs'
export const OFFICIAL_SOFIA_PROCESSED_DATA_URL = '/catalogue-official-address-points-2000-20261113.json'
