import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { posterGlassPriorSource } from './poster-glass-20261126-scope.mjs'
import { catalogueExpiryPriorSource } from './catalogue-expiry-20261126-scope.mjs'
import { posterPolishPriorSource } from './poster-polish-20261126-scope.mjs'

const baseline = '2d1977afdb2357d8f8620f44b691d4c3156d9842'
const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()
// Permit only the exact reviewed presentation hotfix when comparing earlier
// releases with their original bytes. No database/API paths are exempted.
const changed = {
  "app/premium-discovery-cards.css": [
    "de94a8d96d413fce2966dd17f2cae3c695499a01706825f2cf6a258bc0d988fc",
    "2168d84e0babdd8889737d803edc9b5f135539f229205e65ab23b9c62cf88da3"
  ],
  "components/business-cover-photo.js": [
    "19508531dd733473fdf0e766b06cb876ebda576b9987254a9ea67fc366d9c3b2",
    "d9ff04e1458b47fe346e3a6245bde0d4118843a970cfee264851b7f4ccaa1b07"
  ],
  "components/discovery-business-card.js": [
    "591d94afd7cc51fca5de38900178df026ecf26a8ecd69d1be64c923cb9c72cf7",
    "c40282e90612bba20d15d24fba5dfd7f7351925a3a4b49c6e44adb0da498d60f"
  ],
  "components/discovery-business-details.js": [
    "db2bd89ab0ed9fa3d740993ce97f0e7134ec11d6ab6cc2b17fbd8ad6193be011",
    "b01cd6415cbe1d636febf411be3f009641faccecc3c3f2c9c6e2b9a1d966380b"
  ],
  "lib/discovery-photo-presentation.mjs": [
    "cacf0ae20a6de45affee98b4eaa9b7526ab87e22215675310208dc4b1e43c43a",
    "07cfea897e142e39e32c43d983f92221cf3b400b9f982488a86fc1d5d1ce7ffa"
  ]
}
const added = {
  "public/business-cover-photos/go-nosia-todor-alexandrov-20261125-v1.webp": "ab79938cf823074ac4ec7d7af32520a6e23ce9df2e45924d3ddcd3be7c98da56",
  "public/business-cover-photos/go-latin-force-centre-20261125-v1.webp": "f16d83622fe22beb0f8ed4216545ed2081a8323f278230fa5e848b1d9cbe9f2d",
  "public/service-photos/go-nosia-folk-dance-beginners-20261125-v1.webp": "83bd32aee18077ef1b8cfa002dda7f9b46cb72c18fdc05f0c7a413d2d98ee863",
  "public/service-photos/go-latin-force-individual-dance-20261125-v1.webp": "f99fbe096e8a9f118ff2d7766e71fc9bff78b94971eb50602ea570509c0bb092",
  "docs/discovery-incident-artwork-20261125.md": "b2f747ee645ef6e1abc1b8d537b7e5fe3bba6d7cdd806d8222af879dd5d6eb59"
}

export function mobileCatalogueAllowsNewFile(path) {
  if (!Object.hasOwn(added, path)) return false
  try { return sha(readFileSync(new URL('../' + path, import.meta.url))) === added[path] }
  catch { return false }
}

export function mobileCatalogueAllowsFileChange(path) {
  if (!Object.hasOwn(changed, path)) return false
  try { return sha(posterGlassPriorSource(path, posterPolishPriorSource(path, readFileSync(new URL('../' + path, import.meta.url))))) === changed[path][1] }
  catch { return false }
}

export function mobileCataloguePriorSource(path, source) {
  source = posterGlassPriorSource(path, catalogueExpiryPriorSource(path, posterPolishPriorSource(path, source)))
  if (!Object.hasOwn(changed, path)) return source
  const [before, after] = changed[path], hash = sha(source)
  if (hash === before) return source
  if (hash !== after) throw Error('Unreviewed 25 Nov mobile catalogue delta: ' + path)
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', baseline + ':' + path], { cwd: root, maxBuffer: 8 * 1024 * 1024 })
    if (sha(original) !== before) throw Error('Mobile catalogue baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  return typeof source === 'string' ? prior.get(path).toString('utf8') : Buffer.from(prior.get(path))
}
