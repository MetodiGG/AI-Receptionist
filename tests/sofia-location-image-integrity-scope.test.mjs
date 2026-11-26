import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import receipt from './fixtures/sofia-location-image-integrity-20261124-approval.json' with { type: 'json' }
import { sofiaIntegrityAllowsFileChange, sofiaIntegrityAllowsNewFile, sofiaIntegrityPriorSource } from './sofia-location-image-integrity-20261124-scope.mjs'
import { sofiaRpcPriorSource } from './sofia-location-rpc-isolation-20261125-scope.mjs'
import { posterGlassAllowsFileChange } from './poster-glass-20261126-scope.mjs'
import { catalogueExpiryAllowsFileChange } from './catalogue-expiry-20261126-scope.mjs'
import { posterPolishAllowsFileChange } from './poster-polish-20261126-scope.mjs'

test('the 24 Nov scope seals only explicitly reviewed Sofia and image files with their prior bytes', async () => {
  const hash = value => createHash('sha256').update(value).digest('hex')
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const current = await readFile(new URL('../' + path, import.meta.url))
    assert.equal(hash(sofiaRpcPriorSource(path, current)), after, path)
    assert.equal(sofiaIntegrityAllowsFileChange(path), true, path)
    assert.equal(hash(sofiaIntegrityPriorSource(path, current)), before, path)
    const expected = posterPolishAllowsFileChange(path) ? /Unreviewed 26 Nov poster polish/u : catalogueExpiryAllowsFileChange(path) ? /Unreviewed 26 Nov catalogue expiry/u
      : posterGlassAllowsFileChange(path) ? /Unreviewed 26 Nov poster\/glass/u : /Unreviewed (?:24|25) Nov/u
    assert.throws(() => sofiaIntegrityPriorSource(path, Buffer.concat([current, Buffer.from('\n')])), expected)
  }
  for (const path of Object.keys(receipt.added)) assert.equal(sofiaIntegrityAllowsNewFile(path), true, path)
  for (const path of ['package.json', 'next.config.mjs', 'pnpm-lock.yaml', 'lib/booking-engine.mjs', 'lib/discovery/sofia-catalogue.mjs']) {
    assert.equal(sofiaIntegrityAllowsFileChange(path), false, path)
    assert.equal(sofiaIntegrityAllowsNewFile(path), false, path)
  }
})
