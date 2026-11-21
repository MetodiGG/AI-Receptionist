import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { discoveryConfig } from '../lib/discovery/config.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('the original main search form is preserved byte-for-byte, not redesigned by the guide', async () => {
  const source = await read('components/discovery-search.js')
  const start = source.indexOf('<form className="discovery-form"')
  const end = source.indexOf('</form>', start) + 7
  assert.ok(start >= 0 && end > start)
  // Approved search markup from main at ff7f191c. Includes suggestions,
  // submission, keyboard, filters, location controls and existing text.
  assert.equal(createHash('sha256').update(source.slice(start, end)).digest('hex'), '8ba0c17fc09aede40e70af62f168f90ec900f5f3e08870d4ac0ef22090f6c89a')
})

test('the real-data visual preview remains unavailable in production and Vercel preview', async () => {
  for (const env of [
    { NODE_ENV: 'production' },
    { NODE_ENV: 'development', VERCEL_ENV: 'production' },
    { NODE_ENV: 'development', VERCEL_ENV: 'preview' },
  ]) assert.equal(discoveryConfig({ ...env, DISCOVERY_DEV_MOCK: 'true' }).devMock, false)
  assert.equal(discoveryConfig({ NODE_ENV: 'development', DISCOVERY_DEV_MOCK: 'true' }).devMock, true)
  assert.match(await read('app/dev/guided-discovery/page.js'), /if \(!discoveryConfig\(process.env\).devMock\) notFound\(\)/)
  const route = await read('app/dev/guided-discovery/search/route.js')
  assert.match(route, /if \(!discoveryConfig\(process.env\).devMock\) return new Response\(null, \{ status: 404 \}\)/)
  for (const dependency of ['claimBudget', 'fetcher', 'getBusiness', 'getSlots']) assert.ok(route.includes(`${dependency}: forbidden`))
  assert.match(route, /details: \{ \.\.\.row.details, services: partner.services \}/, 'local partner details keep the full public menu')
  assert.doesNotMatch(route, /return \{ \.\.\.row, services:/, 'preview matching services must not be replaced with the whole menu')
})

test('navigation uses the vector icon system and appropriate inline disclosure semantics', async () => {
  const source = await read('components/guided-service-discovery.js')
  assert.doesNotMatch(source, /\p{Extended_Pictographic}/u)
  assert.match(source, /<Icon name=\{kind === 'reveal' \? 'chevronDown' : 'arrow'\}/)
  assert.doesNotMatch(source, /aria-haspopup/)
  assert.match(source, /aria-expanded=\{false\} aria-controls=\{panelId\}/)
  assert.match(source, /tabIndex=\{-1\}/)
  assert.match(source, /prefers-reduced-motion: reduce/)
})
