import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/priority-next-20261123.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = input => createHash('sha256').update(input).digest('hex')
const frozenSources = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['2a63ac14e88e1c2a82fb72a4c510bd05b29b8b2d2d08a38dda77e5c9e39e9232', '6a9ae2ec543b26fb409ff034c90e1661ce98066c7bea5211a7dddea8f9cf9dfc'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['873da8176e483a68d84101b989d1d33e1a47596fb4dfb0cad2ee976ec7b57067', 'e2d2fa737f3e7f4ace1c67f11ec7fb6c00483949c271168a6a6e400c4ce45c13'],
  'lib/catalogue-service-photo-keys.mjs': ['b21e881a8f4fc81887187e4aef5483ababffbc94d012257c7bcc791e1969aad6', '51d4e83a6a613700642c4a8bd2d5cd883ebef51b9f5ecb2084e3716727ff9dd6'],
  'lib/locale/service-english.json': ['c79b33790af42041c24b4bc16dcc86b97f5267a6cb16842196784462d7ac1d3d', '2ec763c93a6f3877a0543d7dddb9cbb3bb4dbf867c5e74dcd458f61c8384df12'],
  'lib/specific-service-photo-ids.mjs': ['f8d976e3b150a8ce924a3f6642741c0c2b32cb6d5ed45eabe2bbe9adec447a64', '259e8f53157bbe5ee1bffee17291ca81dfe1f71f6435dedde6dd03596926809a'],
  'lib/business-activity-cover-assets.mjs': ['2805c24ce08248a64598648f2254c681e4636f55dc5921e4c87c647700e05175', '2f528ea18bc0729a8199d9197aafc1cc262e139ff0fbacaf69389eee6b3d9e42'],
  'docs/specific-service-photo-generation-2026-11-12.json': ['180cee972a999e4dd812b8ef324b136c86ec49bb73e1e298bc130d237b79f450', '95cc67933baf7e8f786d0214a4a450ef09b7200f98e3e5714a858091db110d77'],
  'docs/business-activity-cover-sources-2026-11-15.json': ['669100ec898b3e106d5345c2ba62a6e29d559fd6d59890af13639e5ec4397d53', 'b6d04b2b19798365b5bf010db0eace883230c1c0fbc483853aead9573dd12dd7'],
}
const added = {
  'docs/catalogue-coverage/priority-next-20261123.json': '30d3e6a91ac37162a85ce7b5c2cfae12c54ae53883333bcee7b065cef5e4f677',
  'docs/catalogue-coverage/priority-next-east-20261123.json': '72a5e1a259c251e9c69860106815a73d9e794811ba387b19676bd9023bcb0f55',
  'docs/catalogue-coverage/priority-next-north-20261123.json': 'f1f26c8e4141e2a45d6b6ad4b2e06944bf64d6984db3dc28f84759e5eed99f67',
  'docs/catalogue-coverage/priority-next-south-20261123.json': 'c753ab4fa028364459e8b5e530973e54bfc5f44e3637eb560c245c443d452fac',
  'lib/discovery/catalogue-data/neighborhood-priority-next-east-20261123.mjs': '2b94d0122b9a0b60f9cb9419c984d172eddf3753a5de830998652b345ec88d59',
  'lib/discovery/catalogue-data/neighborhood-priority-next-north-20261123.mjs': '1611a73607d42f7a67f2c1bcff3ab509c774a511cc254134faa90ba1da70bce9',
  'lib/discovery/catalogue-data/neighborhood-priority-next-south-20261123.mjs': 'a24586993341615deb2822fe1c05e7e66f400a8467f5eae1884c6ec859b3f8d3',
  'public/service-photos/sx-outdoor-turf-tennis-court-v1.webp': '12137ba319161d9bf47fa27c68478341d787da3ef2543d81ee35a31a6a501b19',
  'public/business-cover-photos/activity-sx-outdoor-turf-tennis-court-v1.webp': 'fd64ffbfeb5a36c598642ffdb667491e8c90b82974ae7951e008436cbee02e8f',
}
const additions = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
const evidence = /PRIORITY_NEXT_(?:EAST|SOUTH|NORTH)_20261123_|sofia-active-dental-mladost2-block295|sofia-drive-school-knyazhevo-tsar-boris365|Стандартен шофьорски курс · категория B|sx-outdoor-turf-tennis-court/u

const fileMatches = (path, digest) => !!digest && sha(readFileSync(new URL('../' + path, import.meta.url))) === digest
export const priorityNextAllowsFileChange = path => Object.hasOwn(changed, path) && fileMatches(path, changed[path][1])
export const priorityNextAllowsNewFile = path => Object.hasOwn(added, path) && fileMatches(path, added[path])

export function priorityNextPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) || !evidence.test(source)) return source
  const [before, after] = changed[path]
  if (sha(source) !== after) throw Error('Unreviewed 23 Nov next priority source delta: ' + path)
  if (!frozenSources.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (sha(prior) !== before) throw Error('Next priority could not restore source: ' + path)
    frozenSources.set(path, prior)
  }
  return frozenSources.get(path)
}

export function priorityNextPriorCatalogue(rows) {
  const seen = new Set()
  return rows.filter(row => {
    const expected = additions.get(row.id)
    if (!expected) return true
    if (seen.has(row.id)) throw Error('Duplicate next priority row: ' + row.id)
    seen.add(row.id)
    if (sha(JSON.stringify(row)) !== expected) throw Error('Unreviewed next priority row: ' + row.id)
    return false
  })
}
