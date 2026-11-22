import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// A new, separately reviewed stage. Never widen historical media/data/UI or
// dependency allowlists, and never replace their original baseline commits.
export const STATIONARY_DISCOVERY_BASE = '68d98458c842f4c9e801b087f7dda01f41493b05'
export const STATIONARY_DISCOVERY_HASHES = Object.freeze({
  'app/inline-discovery.css': 'e05645c9899792da6de60fcdb0d19601cb5fca869d77c5e810e6c5643180ab38',
  'components/discovery-subcategories.js': '7216f83934b19a7be08a7441a2cc47d91934e99f3e312a19c85353921a3d9086',
  'components/inline-discovery-summary.js': '02a15bd73dec0f252897e8b29d9755665061c17f1e07caf4b02e8e907606afad',
  'lib/discovery/home.mjs': 'ee05d99899aa5ac6d190791ca32bbb06db5cababa99b9b28eca9d9ab4c448a8f',
  'lib/discovery/inline-copy.mjs': '097d61903c672cc7fbfd06f8dbbe0d1641e84f0baa187bc4035171b2a9233760',
  'app/api/public/discovery/route.js': '8b9304b57b29a9d030906fb4df226a04bccbca9a37c24045ec48565f978da2a8',
  'lib/discovery/catalogue-pagination.mjs': 'cc70d8709603244a52247daf1e5f74d0f6271c03fea8cd396af7787a157e58ff',
  'lib/discovery/catalogue-search.mjs': '3675230cedeb289619075a1702626eae84e80aaec85f08a9e65cef582832f6a3',
  'lib/discovery/internal-search.mjs': 'c5cd20e1a7bbca07cd0daf753d13dd86bd9269a1d06829b5cd681476dbb9e1ab',
  'lib/discovery/public-search-inventory.mjs': 'c9fac75cffca62e3ec81c0235318c79e637191777d239a34c184700923e1447e',
})
export const STATIONARY_DISCOVERY_NEW_HASHES = Object.freeze({
  'scripts/inventory-public-english.mjs': 'a7ef99d68c669b5be0d30fa2303d387d71e562061aa968b22ff31291afed9eed',
})
function reviewedFile(path, hashes) {
  if (!Object.hasOwn(hashes, path)) return false
  try {
    return createHash('sha256').update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex') === hashes[path]
  } catch { return false }
}
// Historical freeze checks exclude only an exact reviewed path AND bytes.
// A later edit automatically loses its exception instead of silently passing.
export const stationaryDiscoveryAllowsFileChange = path => reviewedFile(path, STATIONARY_DISCOVERY_HASHES)
export const stationaryDiscoveryAllowsNewFile = path => reviewedFile(path, STATIONARY_DISCOVERY_NEW_HASHES)
