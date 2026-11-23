import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/three-priority-areas-20261123.json' with { type: 'json' }
import sm from '../docs/catalogue-coverage/sm-group-intake-20261123.json' with { type: 'json' }
import mushmula from '../docs/catalogue-coverage/specialist-intake-20261123.json' with { type: 'json' }
import paint from '../docs/catalogue-coverage/paintkillers-verified-location-20261123.json' with { type: 'json' }
import { workshopLessonsAllowsFileChange, workshopLessonsAllowsNewFile, workshopLessonsPriorSource, workshopLessonsPriorCatalogue } from './catalogue-workshop-lessons-20261123-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const restored = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['595dd514f82ca92c7db4f11ee988cee8abd9e1ba43ae6d27546818e2ee7e405f', '9ec824bae1f067a47448a0c4fa76ce8f3a9b57c6e364865f28384f4dfd655a44'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['2f233329e6d20ec0d93a37bc3e76097cdc002b9be0e9154eb21aac240ce9160d', 'dd6aea4f8ba1ac6e0f1eabfde7747ca3838b295bb3ec5960453dfea1fefb35c2'],
  'lib/catalogue-service-photo-keys.mjs': ['c0a9f3e228063535cf98203bc71969e6903c5ddcf702b83dc63a83776cc04cd4', '140dce7e95c6ef4d7c8fea3ebe3d2c1d310037bf328f68f50cb4473bda25d674'],
  'lib/locale/service-english.json': ['991d1ee386d0472f8c57a0c00b437663ed4827e1643d39e247f2bc03c2d91279', 'cfec15392f28e015bc4e788650237b3eb5ed1f2e20beeba9dd30df7ef8b126e5'],
}
const added = {
  'docs/catalogue-coverage/three-priority-areas-20261123.json': '2f0ab7377cd1fbf1a7b2da0668fb58cebefaac049ec96c2cb17e792c1dd8cc1e',
  'docs/catalogue-coverage/sm-group-intake-20261123.json': '1277da72fa6e0e9df92d28fb363974419e03855ccb28cdcf0c9065544cbbccc9',
  'docs/catalogue-coverage/specialist-intake-20261123.json': '73061cd7dc974ead9a5d644b8ddf7ec3d4e08cf5abb30f11db92fd3fb497d6f6',
  'docs/catalogue-coverage/paintkillers-verified-location-20261123.json': '63030fcfae5c37a961bafc603e697323928e3c55d05c59f6072ae05438e285b8',
  'lib/discovery/catalogue-data/neighborhood-sm-group-20261123.mjs': '3821f5626749abdcc733415c3920a4a62047afb263e0e5071a588f1648ba0b47',
  'lib/discovery/catalogue-data/neighborhood-specialist-intake-20261123.mjs': '60854b3f3814af34d5c71b637ed8784def53c34ddac36618270b6ffe715f1ed3',
  'lib/discovery/catalogue-data/paintkillers-verified-location-20261123.mjs': '95e8bcfaf182124ad40502ba9a3c33eb6e03cbeb5755326ba4112b9b4856f519',
}
const newRows = new Map([sm.business, mushmula.newBusiness].map(row => [row.id, row.normalizedRecordSha256]))

function matchesFile(path, sha) {
  if (!sha) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const threeAreasAllowsFileChange = path => workshopLessonsAllowsFileChange(path) || Object.hasOwn(changed, path) && matchesFile(path, changed[path][1])
export const threeAreasAllowsNewFile = path => workshopLessonsAllowsNewFile(path) || Object.hasOwn(added, path) && matchesFile(path, added[path])

export function threeAreasPriorSource(path, source) {
  source = workshopLessonsPriorSource(path, source)
  if (!Object.hasOwn(changed, path) || !/SM_GROUP_INTAKE_20261123|SPECIALIST_INTAKE_20261123|sofia-sm-group-korekt-druzhba1-block182|sofia-mushmula-poligona-tsarigradsko111v/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov three-area priority source delta: ' + path)
  if (!restored.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(prior) !== before) throw Error('Three-area priority could not restore the exact prior source: ' + path)
    restored.set(path, prior)
  }
  return restored.get(path)
}

export function threeAreasPriorCatalogue(rows) {
  const seen = new Set()
  return workshopLessonsPriorCatalogue(rows).flatMap(row => {
    const addedHash = newRows.get(row.id), locationRepair = row.id === paint.id
    if (!addedHash && !locationRepair) return [row]
    if (seen.has(row.id)) throw Error('Duplicate three-area priority record: ' + row.id)
    seen.add(row.id)
    const hash = digest(JSON.stringify(row))
    if (addedHash) {
      if (hash !== addedHash) throw Error('Unreviewed three-area priority intake: ' + row.id)
      return []
    }
    if (hash === paint.previousRowSha256) return [row]
    if (hash !== paint.reviewedRowSha256) throw Error('Unreviewed three-area priority location delta: ' + row.id)
    const prior = { ...row, coordinates: null }
    if (digest(JSON.stringify(prior)) !== paint.previousRowSha256) throw Error('Three-area priority location replay changed other fields: ' + row.id)
    return [prior]
  })
}
