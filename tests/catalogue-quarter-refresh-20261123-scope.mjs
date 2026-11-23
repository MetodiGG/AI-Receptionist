import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import des from '../docs/catalogue-coverage/des-georgieva-refresh-20261123.json' with { type: 'json' }
import auto from '../docs/catalogue-coverage/autotest-republica-verified-location-20261123.json' with { type: 'json' }
import horo from '../docs/catalogue-coverage/horo-intake-20261123.json' with { type: 'json' }
import sharen from '../docs/catalogue-coverage/sharen-svyat-intake-20261123.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const restored = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['0768e8cb524e4944eab1ae58d1cc5f86f92c96239e50669d3d8c0df92c4aa236', 'ee244887dabfed17c406a0b192b9a8d865d1047295c7f6f548d82d3d5a3f9a6a'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['1ba9549ddd7a8dab107898fec70c3cb43431c6f31fd19fb0cd87ab9748cb6d13', 'bfc57b692bfcb9436eba8bbe0e7be515ec0152ead6fc3f117796da3e252c9546'],
  'lib/locale/service-english.json': ['2843d2ea4896d1cc63f9f1d37b47d4bc7844e8d375152b7e3d404838a1c6effc', '379ea24c27f8a40a0f770d411c0cff028ef59fe88ad29eebfc42d240e562111f'],
  'lib/catalogue-service-photo-keys.mjs': ['ebd09ca46c45b57c4cfaa0b259d6fab9f36fbfb8a1156eff214521b24fa4615f', 'c4f2b227501c52a29c7ed25be77072e4df1cfef69b46e273f34ad8a0f18fba85'],
  'lib/specific-service-photo-ids.mjs': ['63284323877ef39abe8d1541ffff3df8f83f836f0264419f7560d09fb0e866eb', 'b9f70334f7ba16a7958607c13c04650e5963b298a5a713c92c00e5d2ba7c8550'],
  'docs/specific-service-photo-generation-2026-11-12.json': ['9ac9d660e4ab022e3527a8272119de18a058dddb758eb330121e6e7bc7476f18', '3af2058a4c58ce4810dc0c4ea70c7aacf2a65d78345ddb84a99f1b698c8f6a74'],
}
const added = {
  'docs/catalogue-coverage/des-georgieva-refresh-20261123.json': '2870501a28897e73bc40a3454010c415e166ee200779fe410364e7aac683a9c5',
  'docs/catalogue-coverage/autotest-republica-verified-location-20261123.json': 'd27257cb5fb6c1e72913516871635d33de6937ea2dd6e7d95b5d6fd63405a5da',
  'lib/discovery/catalogue-data/des-georgieva-refresh-20261123.mjs': '62418da62005aafda454e9b354057514d46d02a19eea8748a52eec5e4081d550',
  'lib/discovery/catalogue-data/autotest-republica-verified-location-20261123.mjs': 'f613bba74bc6825605df30142ac18f966ae98f0214cfd4a5a7bbd2978aa6d563',
  'docs/catalogue-coverage/quarter-refresh-priority-20261123.json': 'e0732f899e888db3b90a3d58058ee91cdd147e7a95387aefcf6dc390a492b244',
  'docs/catalogue-coverage/horo-intake-20261123.json': '0427186c3ce9b6b962ae924d2212cc74d8891935b468116cec4594eaa99dd175',
  'docs/catalogue-coverage/sharen-svyat-intake-20261123.json': '7c975d6636771ea75ebd95ed33ff936fbbb0864fbced245b6f32623abd9405a8',
  'lib/discovery/catalogue-data/neighborhood-horo-intake-20261123.mjs': 'e9732b44971f6134d26c0d096a752ea6b193f264a9de370f8e0bf41ee0b55ba5',
  'lib/discovery/catalogue-data/neighborhood-sharen-svyat-intake-20261123.mjs': '970c4675eeb0deba62f3d9721ec8df7a4cd6b0070b20dca0cd2770f1f9d63fd5',
  'public/service-photos/sx-indoor-childrens-birthday-party-v1.webp': '03e6d5809c32b56f4f07c348b2e1c5eaba2c54c593435f06983a4294487f29a0',
}
const newRows = new Map([[horo.business.id, horo.identities.normalizedRecordSha256], [sharen.newBusiness.id, sharen.newBusiness.normalizedRecordSha256]])
const oldTariffCheck = '2026-11-10'
const oldTariffExpiry = '2027-02-08'
const oldDescription = 'Потвърждението е допълнително от студиото. Преди 09:00 и след 19:00 се добавят 50% към цената.'

function matchesFile(path, sha) {
  if (!sha) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const quarterRefreshAllowsFileChange = path => Object.hasOwn(changed, path) && matchesFile(path, changed[path][1])
export const quarterRefreshAllowsNewFile = path => Object.hasOwn(added, path) && matchesFile(path, added[path])

export function quarterRefreshPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) || !/applyDesGeorgievaRefresh20261123|DES_GEORGIEVA_REFRESH_20261123|f79576363c2ca586aa8935ac89431f17b8bca9009c0beda91e2fb6161e16a3d1|sx-indoor-childrens-birthday-party/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov quarter-refresh priority source delta: ' + path)
  if (!restored.has(path)) {
    const prior = execFileSync('git', ['show', des.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(prior) !== before) throw Error('Quarter-refresh priority could not restore the exact prior source: ' + path)
    restored.set(path, prior)
  }
  return restored.get(path)
}

export function quarterRefreshPriorCatalogue(rows) {
  const seen = new Set()
  return rows.flatMap(row => {
    const studio = row.id === des.id, inspection = row.id === auto.id
    const newHash = studio ? des.reviewedRowSha256 : inspection ? auto.reviewedRowSha256 : newRows.get(row.id)
    if (!newHash) return [row]
    if (seen.has(row.id)) throw Error('Duplicate quarter-refresh priority record: ' + row.id)
    seen.add(row.id)
    const oldHash = studio ? des.priorRowSha256 : inspection ? auto.previousRowSha256 : null
    const actual = digest(JSON.stringify(row))
    if (actual === oldHash) return [row]
    if (actual !== newHash) throw Error('Unreviewed quarter-refresh priority location delta: ' + row.id)
    if (!oldHash) return []
    const prior = studio ? { ...row, address: des.priorAddress, coordinates: null,
      verification: { ...row.verification, checkedOn: oldTariffCheck },
      services: des.tariff.services.map(item => ({
        name: item.name, category: des.category, description: oldDescription,
        price: { amount: item.oldAmount, currency: 'EUR', kind: 'fixed', sourceUrl: des.ownerBooking, checkedOn: oldTariffCheck, validUntil: oldTariffExpiry },
        appointmentModel: 'appointment', durationMin: item.oldMinutes, durationSourceUrl: des.ownerBooking, durationCheckedOn: oldTariffCheck,
      })) } : { ...row, neighborhood: null, coordinates: { ...row.coordinates, sourceNeighborhood: null } }
    if (digest(JSON.stringify(prior)) !== oldHash) throw Error('Quarter-refresh priority replay changed other fields: ' + row.id)
    return [prior]
  })
}
