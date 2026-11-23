import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/quarter-next-priority-20261123.json' with { type: 'json' }
import locations from '../docs/catalogue-coverage/priority-address-recovery-20261123.json' with { type: 'json' }
import north from '../docs/catalogue-coverage/north-next-intake-20261123.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const cache = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['a4a47ab5de9e8b086297dfb0b13291a629b86fda3bc0261b977155661579ce7d', '509f775a2115876c9a245b02498ebc393f0c2c49f75df67aa74d79157f698791'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['3499db105dc5ccec9ace4879ce7899646cca6e6d6d21d73e08aedae479278925', '6c141c5930a06c760cf6f96c662a944f48cb9490d5ea38a2c0b0097a67c9f097'],
  'lib/catalogue-service-photo-keys.mjs': ['d89a9d1a69f1d9d5e95f888c4ce983f08acfc461f409d27d21f3bcc73a2c4b5a', '129ea7a5feea794cd05a6b1c78d3dab7313a614d78af771b6405f4b4e788ecdc'],
  'lib/locale/service-english.json': ['5f2a46ef911923092b9902614cc84078437f23674d37a026f1a8dadb4df593bd', '95d82879a85cecfb7a9ac5bfffe721d58bce78bb3bbf42ff90c7eec7f1866e66'],
}
const added = {
  'docs/catalogue-coverage/quarter-next-priority-20261123.json': '7e77bc7103fb3c8da28182bff992d5168c5dbf7a90c364954c04c12be3155aac',
  'docs/catalogue-coverage/priority-address-recovery-20261123.json': 'e50e6be3fd848676d0084e64abedf449b65cf5c49c181c3e802525e22b976092',
  'docs/catalogue-coverage/south-next-intake-20261123.json': '5a38df9ea7232987c3a5fa1ee3412290c384800fc4e2f56561116aad72d097a2',
  'docs/catalogue-coverage/north-next-intake-20261123.json': '0954d493f1df58fea96d7070e76774f37c18ca3fc397796ac83c915c5d90e7fb',
  'docs/catalogue-coverage/east-next-intake-20261123.json': 'c240dbe3b957b4c54f257573c8cfda45a5f4d7b45ff7dd75de442e4268f46d1a',
  'lib/discovery/catalogue-data/priority-address-recovery-20261123.mjs': '61d230324ba89d6d7587a4db1776da689ca9e769c5bb052332c3a44775e7bf68',
  'lib/discovery/catalogue-data/neighborhood-verified-south-next-20261123.mjs': 'b5e8803e999c476693fbb4141bb1a643e16d717a198b528fb8b9298239dca59d',
  'lib/discovery/catalogue-data/neighborhood-verified-north-next-20261123.mjs': '768b765ec1bfa2889ee15a91238856abc9d3ae58eb83a30d3c20527acf4f7012',
  'lib/discovery/catalogue-data/neighborhood-verified-east-next-20261123.mjs': '7d831deeb617f691be36a8fa5e7a8d43f322de1032604104c27647d1954f4246',
}
const existing = new Map([
  ...locations.recoveries.map(row => [row.id, row]),
  ...north.existingBindings.map(row => [row.id, {
    previousRowSha256: row.normalizedRecordBeforeSha256, reviewedRowSha256: row.normalizedRecordAfterSha256,
  }]),
])
const introduced = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
function hasHash(path, sha) {
  try { return Boolean(sha) && digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const quarterNextAllowsFileChange = path => Object.hasOwn(changed, path) && hasHash(path, changed[path][1])
export const quarterNextAllowsNewFile = path => Object.hasOwn(added, path) && hasHash(path, added[path])

export function quarterNextPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) || !/applyPriorityAddressRecovery20261123|VERIFIED_SOUTH_NEXT_20261123_REVIEWS|sofia-elizabet-ritmika-dragalevtsi-bela-dona1|Запишете първа тренировка по телефон\./u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov quarter-next priority source delta: ' + path)
  if (!cache.has(path)) {
    const previous = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(previous) !== before) throw Error('Quarter-next priority could not restore exact source: ' + path)
    cache.set(path, previous)
  }
  return cache.get(path)
}

export function quarterNextPriorCatalogue(rows) {
  const seen = new Set()
  return rows.flatMap(row => {
    const recovery = existing.get(row.id), next = introduced.get(row.id)
    if (!recovery && !next) return [row]
    if (seen.has(row.id)) throw Error('Duplicate quarter-next priority row: ' + row.id)
    seen.add(row.id)
    const hash = digest(JSON.stringify(row))
    if (recovery && hash === recovery.previousRowSha256) return [row]
    if (hash !== (recovery?.reviewedRowSha256 ?? next)) throw Error('Unreviewed quarter-next priority row: ' + row.id)
    if (!recovery) return []
    const previous = { ...row, coordinates: null }
    if (digest(JSON.stringify(previous)) !== recovery.previousRowSha256) throw Error('Quarter-next recovery mutated other facts: ' + row.id)
    return [previous]
  })
}
