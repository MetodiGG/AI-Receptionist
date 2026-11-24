import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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
    "38d4f9ad67b456e743bc020855e9f249b70e043593201ff57d705537867eef0c"
  ],
  "components/discovery-business-card.js": [
    "591d94afd7cc51fca5de38900178df026ecf26a8ecd69d1be64c923cb9c72cf7",
    "ca89b271cd55973890f36fb84b0b31373cbe3b4c14f63de53a7d63a760d88730"
  ],
  "components/discovery-business-details.js": [
    "db2bd89ab0ed9fa3d740993ce97f0e7134ec11d6ab6cc2b17fbd8ad6193be011",
    "b01cd6415cbe1d636febf411be3f009641faccecc3c3f2c9c6e2b9a1d966380b"
  ],
  "components/service-thumbnail.js": [
    "f5f1cec2c118cf47c62f14d587b22ab5699c349f07722079356a334322f701d5",
    "e98225759a6edb33c233d9b14e23cb45e5db637af1833b3efd4756c5503a4e95"
  ],
  "lib/discovery-photo-presentation.mjs": [
    "cacf0ae20a6de45affee98b4eaa9b7526ab87e22215675310208dc4b1e43c43a",
    "323839339978d7cc1bcc388642a648a43867d1b4e6ba1f26ff97d03ad6369393"
  ],
  "lib/discovery/service-description-disclosure.mjs": [
    "58b664cc5a444fc875ff50799903c1c1f0a5ac8a578936a2748d97e13ad3822c",
    "e2f67f3982211f84acf1f0fe2c2040420efcd60fcfaa6d47bc7465f521e7410e"
  ]
}

export function mobileCatalogueAllowsFileChange(path) {
  if (!Object.hasOwn(changed, path)) return false
  try { return sha(readFileSync(new URL('../' + path, import.meta.url))) === changed[path][1] }
  catch { return false }
}

export function mobileCataloguePriorSource(path, source) {
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
