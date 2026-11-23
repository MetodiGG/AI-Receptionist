import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import neksas from '../docs/catalogue-coverage/neksas-intake-20261123.json' with { type: 'json' }
import pakosti from '../docs/catalogue-coverage/pakosti-intake-20261123.json' with { type: 'json' }
import acpower from '../docs/catalogue-coverage/acpower-intake-20261123.json' with { type: 'json' }
import { lateNovemberGapAllowsFileChange, lateNovemberGapAllowsNewFile, lateNovemberGapPriorCatalogue, lateNovemberGapPriorSource } from './catalogue-late-november-gaps-20261123-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const beforeSources = new Map()
const admitted = new Map([
  [neksas.id, neksas.normalizedRowSha256],
  [pakosti.newBusiness.id, pakosti.newBusiness.normalizedRecordSha256],
  [acpower.business.id, acpower.business.normalizedRecordSha256],
])
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['6d1e5c95939af8408a81a3f8cccd9cf5cd5b431225db58dc44d55fab95197303', '2635c097bd63a9818e14ae502e30eb800f670fbda8e5715f847e73b60875b6d6'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['567693a8674f4b22204ca5f36aa79d52257f94b37b255e1fbb522cad1bc8c34d', '02f7243364fc9bb9acbc077341516509c279b4a3380ffd55a34b2208c04a9c20'],
  'lib/catalogue-service-photo-keys.mjs': ['c57ce2b99bc37a45424af5c96ea09410732c77c8dbb596380c5d89ca0880c1dc', 'd1c76b63365656b63c459a004b3cc90e454c2267fd0e284a47aaa3ce0144be4e'],
  'lib/locale/service-english.json': ['35e8dd7513b2922f4001a2ff29bb36597accbb4957139643c23c376211bd2d57', 'dec71d18ffe82077d88ce29b7be12d79b52958fe6a45d6b6ce19f3c2650037e1'],
  'lib/specific-service-photo-ids.mjs': ['3613fab6a61c67c7a2a0c4ccf64917b1f531f01a2dd30d89511d61651bce994a', 'ebe029a49701b6d85fb2ae1b2a2eafc46b1a26a6fcd8c67907b67ed54bcd6e2f'],
  'docs/specific-service-photo-generation-2026-11-12.json': ['dc217d27f84743393acae80d16de204ae9c753f315d6cac0dce1f45f718909fa', '6b4ad83125cc098a50ca48cd331838947835808d9252d89630894024af0961d9'],
}
const newFiles = {
  'docs/catalogue-coverage/low-coverage-intake-20261123.json': 'c07710b2a45e5cc2d59190689396ddf6e7c54ded94716ddf2531c2198d6bc49e',
  'docs/catalogue-coverage/neksas-intake-20261123.json': 'bc08a88a42ff89f9d99e037763d273ae453f5aafc803484a0c45d698d4d396df',
  'docs/catalogue-coverage/pakosti-intake-20261123.json': 'e79a957130aaff82207e7617effd50604653c5adeec5cde00c65e3f4711d5272',
  'docs/catalogue-coverage/acpower-intake-20261123.json': 'b40cc93f16faf27eddfb10445431c6b4bd9740cc35d776709f177e15806ad22a',
  'lib/discovery/catalogue-data/neighborhood-neksas-20261123.mjs': '8511420ef673edbc9dad88b0413dd753868fe0631bf026fa87f86397a67c0fb2',
  'lib/discovery/catalogue-data/neighborhood-pakosti-20261123.mjs': 'dce5ae5bf4248a81a313d5ec18314615763d9ea47eace0a99fc2e96b859c393d',
  'lib/discovery/catalogue-data/neighborhood-acpower-20261123.mjs': '06921b892856a7721d518d233843a6af3fd9ef98d81fc2fe0dc7b9b048448374',
  'public/service-photos/sx-in-person-welding-course-v1.webp': 'e6b61a5c131d10cf23d989d70e4585a37ec3212d1db640245d014779bae4f21a',
  'public/service-photos/sx-outdoor-birthday-venue-v1.webp': '4e584a00886329ba630e169e5e6d4ed0dc424fd029c0cd2da21a59863c31a8bf',
}
function fileMatches(path, sha) {
  if (!sha) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const lowCoverageAllowsFileChange = path => lateNovemberGapAllowsFileChange(path) || Object.hasOwn(changed, path) && fileMatches(path, changed[path][1])
export const lowCoverageAllowsNewFile = path => lateNovemberGapAllowsNewFile(path) || Object.hasOwn(newFiles, path) && fileMatches(path, newFiles[path])

export function lowCoveragePriorSource(path, source) {
  source = lateNovemberGapPriorSource(path, source)
  if (!Object.hasOwn(changed, path) ||
      !/NEKSAS_INTAKE_20261123|sofia-neksas-academy-chelopechene-yane28|sx-in-person-welding-course/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov low-coverage intake source delta: ' + path)
  if (!beforeSources.has(path)) {
    const prior = execFileSync('git', ['show', neksas.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(prior) !== before) throw Error('Low-coverage replay did not verify the prior source: ' + path)
    beforeSources.set(path, prior)
  }
  return beforeSources.get(path)
}

export function lowCoveragePriorCatalogue(rows) {
  const seen = new Set()
  return lateNovemberGapPriorCatalogue(rows).filter(row => {
    const exact = admitted.get(row.id)
    if (!exact) return true
    if (seen.has(row.id) || digest(JSON.stringify(row)) !== exact) throw Error('Unreviewed or duplicate low-coverage intake: ' + row.id)
    seen.add(row.id)
    return false
  })
}
