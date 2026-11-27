import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  approvedCatalogueMatches, approvedCatalogueRuntime, publishedBaseline,
  publishedBaselineMatches, publishedRuntime, releaseRuleMatches,
} from './catalogue-only-release-scope.mjs'

const git = (...args) => execFileSync('git', args, {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  encoding: 'utf8',
}).split('\0').filter(Boolean)

// Run explicitly for this release; later releases have different reviewed inputs.
test('catalogue release keeps the published site and includes only the verified catalogue and release rule', () => {
  assert.ok(approvedCatalogueRuntime.size > 0)
  assert.ok(publishedRuntime.size > 0)
  assert.deepEqual([...approvedCatalogueRuntime.keys()].filter(path => publishedRuntime.has(path)), [])
  assert.deepEqual([...publishedRuntime.keys()].filter(path => !publishedBaselineMatches(path)), [])
  assert.deepEqual([...approvedCatalogueRuntime.keys()].filter(path => !approvedCatalogueMatches(path)), [])
  assert.ok(releaseRuleMatches('AGENTS.md'))
  const changes = new Set([
    ...git('diff', '--name-only', '--no-renames', '-z', publishedBaseline, '--'),
    ...git('ls-files', '--others', '--exclude-standard', '-z'),
  ].filter(path => !path.startsWith('tests/')))
  assert.deepEqual([...changes].sort(), [...approvedCatalogueRuntime.keys(), 'AGENTS.md'].sort())
  assert.deepEqual([...changes].filter(path => /^(app\/|components\/|supabase\/|next\.config\.|vercel\.json$|package\.json$|pnpm-lock\.yaml$)/.test(path)), [])
})
