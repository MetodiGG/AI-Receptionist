import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Project only this exact receipt when running a historical source/cohort audit.
const changed = {
  'lib/discovery/sofia-catalogue.mjs': [
    'f8521f382b26e8653876d80df9d4d9daa8e931e6145572128e2e2e99b8108547', 'ebc1f872bd450298b79932aa2c9a588885b1f56698c9b96ee279d5b2cd70f387',
    [
      [/^import \{ VERIFIED_INTAKE_20261123_RECORDS \}.*\n/mu, ''],
      [/^import \{ applyVerifiedAddressRecovery20261123 \}.*\n/mu, ''],
      ['  ...VERIFIED_INTAKE_20261123_RECORDS,\n', ''],
      ['validateCatalogue(applyVerifiedAddressRecovery20261123(applyReviewedAutoAreaRecovery20261123(', 'validateCatalogue(applyReviewedAutoAreaRecovery20261123('],
      ['), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true })))))))))\n', '), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true }))))))))\n'],
    ],
  ],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': [
    'b652f056105b0082295567c147e4ff829eaf9ecf15d6d5ad75702fe65ed09374', '4d07a7c0a6b55efbddb06f5a5de6caa0371102504a22701a0fb498a122440a17',
    [[/^import \{ VERIFIED_INTAKE_20261123_REVIEWS \}.*\n/mu, ''], [', ...VERIFIED_INTAKE_20261123_REVIEWS]', ']']],
  ],
  'lib/catalogue-service-photo-keys.mjs': [
    '6d61ac42ec41b50879c34c7bd3588813a5563fff3237f3aee414b2909e46fb25', '67117c1988806640868f43fad1152ebd571d89a6e682e4a771041d4045d01ea0',
    [[/^associations\.set\(key\('sofia-luckydent-dragalevtsi-gluharche10'.*\n/mu, '']],
  ],
  'lib/locale/service-english.json': [
    '034428d6eee9eb267b06f8c9066da9c1d7ff7dc0832b9b63e5ce0de83cfddaa1', '8ef42fad6b2089d15237186663df866fe4b2008b845b06de6c405c8ab239e160',
    [[/,\n      \{\n        "checkedOn": "2026-11-23",\n        "businessId": "sofia-luckydent-dragalevtsi-gluharche10",\n[\s\S]*?\n      \}/u, ''],
      [/^    "Кабинетът моли да носите актуална панорамна снимка, за предпочитане дигитална и направена през последните 6 месеца\.".*\n/mu, '']],
  ],
}
const additions = {
  'lib/discovery/catalogue-data/neighborhood-verified-intake-20261123.mjs': 'bff2cf79402eb39fdc131d48b55b93f50924a7fa163dc31f8bf80be5f0a92194',
  'lib/discovery/catalogue-data/verified-address-recovery-20261123.mjs': '5d679f756da423bb6bde0fb83b3614b42f5b7326509e71bdabcace53e144917b',
  'docs/catalogue-coverage/verified-premises-20261123.json': '3786398742e3cfd46c5eaaf3546f84d03f1bd40b37f10893cc3209a02194414b',
}
export const VERIFIED_INTAKE_ID = 'sofia-luckydent-dragalevtsi-gluharche10'
const admitted = '8ad9de9eeef074a6ddf46dc6616679621dd37e5ecc9875e47f3f73b7993504ee'
const recovered = {
  'sofia-lumiere-beauty-club': ['София, Надежда 2, ул. Света Никола Нови 2А',
    '7ca678739de5118eb66f190030ae1f89649fc8ca817887dab9c9d68dfb4132c4', 'ab86452b46b2680cf5798abc86b855b7fec60b6c1050612c2b28939c3180b29c'],
  'sofia-ariel-beauty-lyulin3': ['София, ж.к. Люлин 3, бул. Добринова скала 370, партер',
    '99b7b979ce001502ac9cfa78d2fcb98fa2f0663a72b866577c31efdd6594597e', '36d947c0ba52671cc0385815ff0430bbf6ee2c34815e41ee9b1fd3d77cbc0e85'],
}
const digest = value => createHash('sha256').update(value).digest('hex')
const fileMatches = (path, hash) => {
  if (!hash) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === hash } catch { return false }
}
export const verifiedAllowsFileChange = path => Object.hasOwn(changed, path) && fileMatches(path, changed[path][1])
export const verifiedAllowsNewFile = path => Object.hasOwn(additions, path) && fileMatches(path, additions[path])

export function verifiedPriorSource(path, current) {
  if (!Object.hasOwn(changed, path) ||
      !/VERIFIED_INTAKE_20261123|applyVerifiedAddressRecovery20261123|sofia-luckydent-dragalevtsi-gluharche10/u.test(current)) return current
  const [priorHash, currentHash, reverse] = changed[path]
  if (digest(current) !== currentHash) throw Error('Unreviewed 23 Nov verified-premises source delta: ' + path)
  const prior = reverse.reduce((source, [after, before]) => source.replace(after, before), current)
  if (digest(prior) !== priorHash) throw Error('Verified-premises replay must restore every prior source byte: ' + path)
  return prior
}

export function verifiedPriorCatalogue(rows) {
  const seen = new Set()
  return rows.flatMap(row => {
    const intake = row?.id === VERIFIED_INTAKE_ID
    if (!intake && !Object.hasOwn(recovered, row?.id)) return [row]
    if (seen.has(row.id)) throw Error('Duplicate 23 Nov verified premises: ' + row.id)
    seen.add(row.id)
    const hash = digest(JSON.stringify(row))
    if (intake) {
      if (hash !== admitted) throw Error('Unreviewed 23 Nov verified intake record: ' + row.id)
      return []
    }
    const [address, priorHash, currentHash] = recovered[row.id]
    if (hash === priorHash) return [row]
    if (hash !== currentHash) throw Error('Unreviewed 23 Nov verified address delta: ' + row.id)
    const prior = { ...row, address, coordinates: null }
    if (digest(JSON.stringify(prior)) !== priorHash) throw Error('Verified-premises replay must restore every prior row field: ' + row.id)
    return [prior]
  })
}
