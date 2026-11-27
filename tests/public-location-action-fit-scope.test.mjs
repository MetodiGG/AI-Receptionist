import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { locationActionFitAllowsFileChange, locationActionFitBaseline, locationActionFitPath, locationActionFitPriorSource } from './public-location-action-fit-scope.mjs'
import { approvedCatalogueMatches } from './catalogue-only-release-scope.mjs'

test('the location-action hotfix changes only the public action CSS', () => {
  const cwd = fileURLToPath(new URL('../', import.meta.url))
  const git = (...args) => execFileSync('git', args, { cwd })
  const paths = bytes => bytes.toString('utf8').split('\0').filter(path => path && path !== 'node_modules' && !path.startsWith('tests/'))
  const changed = new Set([...paths(git('diff', '--name-only', '--no-renames', '-z', locationActionFitBaseline, '--')),
    ...paths(git('ls-files', '--others', '--exclude-standard', '-z'))])
  const livePaths = [...changed].filter(path => path === locationActionFitPath || !approvedCatalogueMatches(path))
  assert.deepEqual(livePaths, [locationActionFitPath])
  const bytes = readFileSync(new URL('../' + locationActionFitPath, import.meta.url))
  assert.equal(locationActionFitAllowsFileChange(locationActionFitPath), true)
  assert.deepEqual(locationActionFitPriorSource(locationActionFitPath, bytes), git('show', locationActionFitBaseline + ':' + locationActionFitPath))
  const tampered = Buffer.concat([bytes, Buffer.from('\n')])
  assert.equal(locationActionFitPriorSource(locationActionFitPath, tampered), tampered)
})
