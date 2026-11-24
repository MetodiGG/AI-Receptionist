import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import receipt from './fixtures/sofia-location-image-integrity-20261124-approval.json' with { type: 'json' }
import { sofiaIntegrityAllowsFileChange, sofiaIntegrityAllowsNewFile, sofiaIntegrityPriorSource } from './sofia-location-image-integrity-20261124-scope.mjs'

test('the 24 Nov scope seals only explicitly reviewed Sofia and image files with their prior bytes', async () => {
  const hash = value => createHash('sha256').update(value).digest('hex')
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const current = await readFile(new URL('../' + path, import.meta.url))
    assert.equal(hash(current), after, path)
    assert.equal(sofiaIntegrityAllowsFileChange(path), true, path)
    assert.equal(hash(sofiaIntegrityPriorSource(path, current)), before, path)
    assert.throws(() => sofiaIntegrityPriorSource(path, Buffer.concat([current, Buffer.from('\n')])), /Unreviewed 24 Nov/u)
  }
  for (const path of Object.keys(receipt.added)) assert.equal(sofiaIntegrityAllowsNewFile(path), true, path)
  for (const path of ['package.json', 'next.config.mjs', 'pnpm-lock.yaml', 'lib/booking-engine.mjs', 'lib/discovery/sofia-catalogue.mjs']) {
    assert.equal(sofiaIntegrityAllowsFileChange(path), false, path)
    assert.equal(sofiaIntegrityAllowsNewFile(path), false, path)
  }
})
