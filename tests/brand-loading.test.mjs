import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BrandLoading } from './helpers/brand-loading.mjs'
import { BRAND_MARK_SRC, BRAND_MARK_SRC_SET } from '../lib/brand-assets.mjs'

test('loading uses the current whole owner logo with localized screen-reader-only status', () => {
  for (const [locale, text] of [['bg', 'Зареждане…'], ['en', 'Loading…']]) {
    const html = renderToStaticMarkup(createElement(BrandLoading, { locale }))
    assert.ok(html.includes(BRAND_MARK_SRC)); assert.ok(html.includes(BRAND_MARK_SRC_SET))
    assert.match(html, /role="status"/); assert.ok(html.includes(`<span class="sr-only">${text}</span>`))
    assert.match(html, /loading="eager"/); assert.match(html, /width="32" height="32"/)
    assert.match(html, /alt="" aria-hidden="true"/)
    assert.doesNotMatch(html, /button-spinner|<svg|canvas|iframe/)
  }
})
test('button and existing live-region variants do not add duplicate announcements or change their labels', () => {
  const decorative = renderToStaticMarkup(createElement(BrandLoading, { decorative: true, size: 20 }))
  assert.match(decorative, /aria-hidden="true"/); assert.doesNotMatch(decorative, /role="status"|sr-only/)
  const nested = renderToStaticMarkup(createElement(BrandLoading, { announce: false, label: 'Проверяваме наличността…' }))
  assert.doesNotMatch(nested, /role="status"/); assert.match(nested, /sr-only">Проверяваме наличността…/)
})
test('CSS makes a restrained repeating 180-degree turn and fully disables it for reduced motion', async () => {
  const css = await readFile(new URL('../app/brand.css', import.meta.url), 'utf8')
  assert.match(css, /gorez-loading-half-turn 1s ease-in-out infinite alternate/)
  assert.match(css, /rotate\(0deg\)/); assert.match(css, /rotate\(180deg\)/)
  assert.match(css, /prefers-reduced-motion:reduce[^]*?gorez-loading-mark[^]*?animation:none; transform:none/)
  const source = await readFile(new URL('../components/brand-loading.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /useEffect|setInterval|setTimeout|fetch\(|next\/image|use client/)
})
