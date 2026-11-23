import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/workshop-lessons-priority-20261123.json' with { type: 'json' }
import koba from '../docs/catalogue-coverage/koba-intake-20261123.json' with { type: 'json' }
import ucha from '../docs/catalogue-coverage/courses-recreation-intake-20261123.json' with { type: 'json' }
import infinity from '../docs/catalogue-coverage/infinity-intake-20261123.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const restored = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['9ec824bae1f067a47448a0c4fa76ce8f3a9b57c6e364865f28384f4dfd655a44', '0768e8cb524e4944eab1ae58d1cc5f86f92c96239e50669d3d8c0df92c4aa236'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['dd6aea4f8ba1ac6e0f1eabfde7747ca3838b295bb3ec5960453dfea1fefb35c2', '1ba9549ddd7a8dab107898fec70c3cb43431c6f31fd19fb0cd87ab9748cb6d13'],
  'lib/catalogue-service-photo-keys.mjs': ['140dce7e95c6ef4d7c8fea3ebe3d2c1d310037bf328f68f50cb4473bda25d674', 'ebd09ca46c45b57c4cfaa0b259d6fab9f36fbfb8a1156eff214521b24fa4615f'],
  'lib/locale/service-english.json': ['cfec15392f28e015bc4e788650237b3eb5ed1f2e20beeba9dd30df7ef8b126e5', '2843d2ea4896d1cc63f9f1d37b47d4bc7844e8d375152b7e3d404838a1c6effc'],
  'lib/specific-service-photo-ids.mjs': ['931bed3bd8c154cf878c19285013b4301240baeee0456f7efb6a4a7efbaacfbf', '63284323877ef39abe8d1541ffff3df8f83f836f0264419f7560d09fb0e866eb'],
  'docs/specific-service-photo-generation-2026-11-12.json': ['5975edb2f1bd4bdd98ad3a2fbd291052cee3433ffc634eef4f4713fc00803242', '9ac9d660e4ab022e3527a8272119de18a058dddb758eb330121e6e7bc7476f18'],
}
const added = {
  'docs/catalogue-coverage/workshop-lessons-priority-20261123.json': 'b410ae3eddb6288854cb564f95a08739c465a4e8ea8d50442c9dbe2ddf9b8098',
  'docs/catalogue-coverage/courses-recreation-intake-20261123.json': '86af6604ac59e78591443c82d61866add7165f71b56790880b77cae3b1bb1ccc',
  'docs/catalogue-coverage/koba-intake-20261123.json': '1bda45cdb4600b83aa441e39d6416cd22583133f318fea87ed7f007c5f7b042d',
  'docs/catalogue-coverage/infinity-intake-20261123.json': '8d840f699479009861fa4209a20d71e838e6329636995150f3ab2ad01f6ba9fb',
  'lib/discovery/catalogue-data/neighborhood-courses-recreation-20261123.mjs': 'ed7a463bf866b606c5a052d54ccd3f615fa76fe8ecb92d79d7bf474a3977a820',
  'lib/discovery/catalogue-data/neighborhood-koba-intake-20261123.mjs': 'e7c36b853c98c69eed891ce0aa02843068d175805861becf5b554dd6fb35b062',
  'lib/discovery/catalogue-data/neighborhood-infinity-intake-20261123.mjs': 'aafad0768e45840ee7cbdc62a22b2713d806a381f1a71781da48e4584ff3c283',
  'public/service-photos/sx-child-chess-group-v1.webp': '40ce290cb7be5c9fbbbfc799d2b661de609b8694b23f8498ec591c94cad688d3',
}
const newRows = new Map([koba.business, ucha.newBusiness, infinity.newBusiness].map(row => [row.id, row.normalizedRecordSha256]))

function matchesFile(path, sha) {
  if (!sha) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const workshopLessonsAllowsFileChange = path => Object.hasOwn(changed, path) && matchesFile(path, changed[path][1])
export const workshopLessonsAllowsNewFile = path => Object.hasOwn(added, path) && matchesFile(path, added[path])

export function workshopLessonsPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) || !/KOBA_INTAKE_20261123|COURSES_RECREATION_INTAKE_20261123|INFINITY_INTAKE_20261123|sofia-koba-auto-bosch-rodopi27|sofia-ucha-land-dianabad-novachnitsa3|sofia-infinity-team-strelbishte-bulgaria43|sx-child-chess-group/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov workshop-lessons priority source delta: ' + path)
  if (!restored.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(prior) !== before) throw Error('Workshop-lessons priority could not restore the exact prior source: ' + path)
    restored.set(path, prior)
  }
  return restored.get(path)
}

export function workshopLessonsPriorCatalogue(rows) {
  const seen = new Set()
  return rows.filter(row => {
    const hash = newRows.get(row.id)
    if (!hash) return true
    if (seen.has(row.id)) throw Error('Duplicate workshop-lessons priority record: ' + row.id)
    seen.add(row.id)
    if (digest(JSON.stringify(row)) !== hash) throw Error('Unreviewed workshop-lessons priority intake: ' + row.id)
    return false
  })
}
