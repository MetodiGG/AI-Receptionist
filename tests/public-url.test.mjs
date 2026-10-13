import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPublicBookingUrl, resolvePublicOrigin } from '../lib/public-url.mjs'

test('prefers the configured public origin over a protected preview origin', () => {
  assert.equal(
    resolvePublicOrigin('https://booking.example.bg/path/', 'https://protected-preview.vercel.app'),
    'https://booking.example.bg',
  )
})

test('falls back to the runtime origin when configuration is missing or invalid', () => {
  assert.equal(resolvePublicOrigin('', 'https://public-preview.vercel.app/path'), 'https://public-preview.vercel.app')
  assert.equal(resolvePublicOrigin('not-a-url', 'http://127.0.0.1:3000'), 'http://127.0.0.1:3000')
})

test('builds an encoded booking URL with no duplicate slash', () => {
  assert.equal(buildPublicBookingUrl('https://booking.example.bg/', 'mg-barbershop'), 'https://booking.example.bg/book/mg-barbershop')
})
