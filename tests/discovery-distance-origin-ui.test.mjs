import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as distanceOrigin from '../lib/discovery/distance-origin.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = 'components/discovery-distance-badge.js'
const { code } = await transform(await readFile(new URL(`../${filename}`, import.meta.url), 'utf8'), {
  filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
})
const module = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name === '../lib/discovery/distance-origin.mjs' ? distanceOrigin : name === './icon' ? { Icon: () => null } : require(name), module, module.exports)
const render = props => renderToStaticMarkup(React.createElement(module.exports.DiscoveryDistanceBadge, props))
const point = { latitude: 42.7, longitude: 23.3 }

test('a cached numeric distance is never displayed without its actual known origin', () => {
  for (const fallbackKm of [0, 0.7, 5.4]) {
    const html = render({ destination: point, fallbackKm, business: { locationKind: 'premises' } })
    assert.match(html, /— km/)
    assert.doesNotMatch(html, /(?:0,7|5,4|>0) km/)
  }
})

test('valid distance badges expose their straight-line origin and bad destination points remain unknown', () => {
  const html = render({ origin: { kind: 'device', ...point }, destination: { latitude: 42.7001, longitude: 23.3 }, business: { locationKind: 'premises' } })
  assert.match(html, /&lt;0,1 km/)
  assert.match(html, /aria-label="[^"]*по права линия/)
  const unknown = render({ origin: { kind: 'device', ...point }, destination: { latitude: 0, longitude: 0 }, fallbackKm: 0.7, business: { locationKind: 'premises' } })
  assert.match(unknown, /— km/)
})
