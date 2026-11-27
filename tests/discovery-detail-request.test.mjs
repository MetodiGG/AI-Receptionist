import assert from 'node:assert/strict'
import test from 'node:test'
import { needsBusinessDetails, startBusinessDetailsRequest } from '../lib/discovery/detail-request.mjs'

const row = { id: 'sofia-example', source: 'catalogue', detailsRef: 'fixture' }
const body = business => Response.json({ business })
const never = () => new Promise(() => {})

test('deliberate details fetch starts at once; the later modal can read the same response without another request', async () => {
  const calls = []
  const fetcher = (path, options) => {
    calls.push({ path, options })
    return Promise.resolve(body(row))
  }
  const request = startBusinessDetailsRequest(row, { fetcher })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].path, '/api/public/discovery/business/sofia-example?photos=1')
  assert.equal(calls[0].options.cache, 'no-store')
  assert.equal(calls[0].options.credentials, 'same-origin')
  assert.deepEqual(await request.result, { status: 'ready', business: row })
  assert.deepEqual(await request.result, { status: 'ready', business: row })
  assert.equal(calls.length, 1)

  const preview = startBusinessDetailsRequest(row, { fetcher, preview: true })
  assert.equal(calls[1].path, '/dev/sofia-catalogue/business/sofia-example?photos=1')
  assert.equal((await preview.result).status, 'ready')
  assert.equal(needsBusinessDetails({ ...row, source: 'gorez' }, true), false)
  assert.equal(needsBusinessDetails(row, true), true)
  assert.equal(needsBusinessDetails(row), true)
})

test('a closed card cancels its read and cannot display a late response', async () => {
  let signal, settle
  const request = startBusinessDetailsRequest(row, {
    fetcher: (_path, options) => { signal = options.signal; return new Promise(resolve => { settle = resolve }) },
  })
  request.cancel()
  assert.equal(signal.aborted, true)
  assert.deepEqual(await request.result, { status: 'aborted' })
  settle(body(row))
  assert.deepEqual(await request.result, { status: 'aborted' })
})

test('a stalled read is retryable; 404 remains missing and a different business/source is rejected', async () => {
  const timeout = startBusinessDetailsRequest(row, { fetcher: never, timeoutMs: 5 })
  assert.deepEqual(await timeout.result, { status: 'error' })
  for (const [reply, status] of [
    [new Response(null, { status: 404 }), 'missing'],
    [new Response(null, { status: 429 }), 'error'],
    [body({ ...row, id: 'wrong-branch' }), 'error'],
    [body({ ...row, source: 'gorez' }), 'error'],
    [new Response('invalid JSON'), 'error'],
  ]) {
    assert.deepEqual(await startBusinessDetailsRequest(row, { fetcher: () => reply }).result, { status })
  }
  const retry = startBusinessDetailsRequest(row, { fetcher: () => body(row) })
  assert.equal((await retry.result).status, 'ready')
})
