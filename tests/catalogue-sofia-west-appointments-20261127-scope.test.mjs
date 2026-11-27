import test from 'node:test'
import { publishedBaselineMatches } from './catalogue-only-release-scope.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { priorCatalogue, priorSource } from './catalogue-sofia-west-appointments-20261127-scope.mjs'
import receipt from './fixtures/catalogue-sofia-west-appointments-20261127.json' with { type: 'json' }
import { providerRolePhotosPriorSource } from './provider-role-photo-scope.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digest = value => sha(JSON.stringify(value))
const pairs = [
  ['Борово', 'education', 3, 4],
  ['Горна баня', 'auto_repair', 2, 3],
  ['Модерно предградие', 'auto_repair', 1, 2],
  ['Славия', 'fitness', 0, 1],
  ['Младост 1', 'fitness', 2, 3],
]
test('the exact five new operators leave the entire previous catalogue and unrelated runtime files unchanged', () => {
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    const earlier = priorCatalogue(rows), ids = new Set(earlier.map(row => row.id))
    assert.equal(digest(rows), receipt.catalogue.after)
    assert.equal(digest(earlier), receipt.catalogue.before)
    assert.deepEqual(rows.filter(r => !ids.has(r.id)).map(r => r.id), receipt.records.map(r => r.id))
    for (const {id} of receipt.records) {
      const added = rows.find(row => row.id === id)
      assert.equal(rows.filter(row => row.name === added.name || row.phone === added.phone ||
        new URL(row.website).hostname.replace(/^www\./, '') === new URL(added.website).hostname.replace(/^www\./, '')).length, 1)
    }
  }
  const root = fileURLToPath(new URL('../', import.meta.url))
  const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
  const files = bytes => bytes.toString('utf8').split('\0').filter(path => path && path !== 'node_modules' && !path.startsWith('tests/') && !publishedBaselineMatches(path))
  const changed = new Set([...files(git('diff', '--name-only', '-z', receipt.baseline, '--')), ...files(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...changed].sort(), [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort())
  for (const [path, fingerprint] of Object.entries(receipt.changed)) {
    const current = providerRolePhotosPriorSource(path, readFileSync(new URL('../' + path, import.meta.url)))
    assert.equal(sha(current), fingerprint.after, path)
    assert.equal(sha(priorSource(path, current)), fingerprint.before, path)
  }
  for (const [path, hash] of Object.entries(receipt.added)) {
    assert.equal(sha(readFileSync(new URL('../' + path, import.meta.url))), hash, path)
  }
})

test('five independent neighbourhood cells gain a grounded location without silently increasing other cells', () => {
  const now = Date.parse('2026-11-27T12:00:00Z')
  const [before, after] = [priorCatalogue(SOFIA_CATALOGUE), SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const toCounts = report => new Map([...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area =>
    area.cells.map(cell => [area.name + '/' + cell.categoryId, cell.locatedCount])))
  const beforeCounts = toCounts(before), afterCounts = toCounts(after)
  for (const [area, category, start, end] of pairs) {
    const key = area + '/' + category
    assert.equal(beforeCounts.get(key), start, key)
    assert.equal(afterCounts.get(key), end, key)
    beforeCounts.set(key, end)
  }
  assert.deepEqual(beforeCounts, afterCounts)
  assert.equal(after.counts.approvedBusinesses - before.counts.approvedBusinesses, 5)
  assert.equal(after.counts.premisesWithBoundCoordinates - before.counts.premisesWithBoundCoordinates, 5)
})
