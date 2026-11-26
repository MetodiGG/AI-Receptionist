import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const file = new URL('../components/business-cover-photo.js', import.meta.url)
const { code } = await transform(await readFile(file, 'utf8'), {
  filename: file.pathname,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
const module = { exports: {} }
new Function('require', 'module', 'exports', code)(require, module, module.exports)
const { BusinessCoverPhoto } = module.exports
const business = { id: 'sofia-photo-studio-margo-svoboda', category: 'other', illustrativeCoverPhotoKey: 'sx-outdoor-family-photoshoot' }
const render = props => renderToStaticMarkup(createElement(BusinessCoverPhoto, props))

test('compact AI business cover keeps the original source and exposes a localized non-duplicated disclosure', () => {
  for (const [locale, label] of [['bg', 'AI илюстрация'], ['en', 'AI illustration']]) {
    const compact = render({ business, locale, showPreviewBadge: true })
    const ordinary = render({ business, locale })
    const image = html => html.match(/<img\b[^>]*\bsrc="([^"]+)"/u)?.[1]
    assert.match(image(compact), /activity-sx-outdoor-family-photoshoot-v1\.webp$/u)
    assert.equal(image(compact), image(ordinary))
    assert.match(compact, /data-image-kind="ai-illustration"/u)
    assert.match(compact, new RegExp('alt="' + label + '\\. ', 'u'))
    assert.match(compact, /class="business-category-cover-label" data-compact-disclosure="true" aria-hidden="true">AI<\/span>/u)
    assert.equal(compact.match(new RegExp(label, 'gu'))?.length, 1)
    assert.match(ordinary, new RegExp('alt="' + label + '\\. ', 'u'))
    assert.doesNotMatch(ordinary, /business-category-cover-label|data-compact-disclosure/u)
  }
})

test('requesting a compact disclosure does not label unavailable cover artwork as AI', () => {
  const unavailable = { id: 'unmapped-poster-fixture', category: 'fitness' }
  const placeholder = render({ business: unavailable, locale: 'en', showPreviewBadge: true })
  assert.match(placeholder, /Photo unavailable/u)
  assert.doesNotMatch(placeholder, /<img|data-image-kind|data-compact-disclosure|AI illustration/u)
  assert.equal(render({ business: unavailable, showPreviewBadge: true, omitIfUnavailable: true }), '')
})
