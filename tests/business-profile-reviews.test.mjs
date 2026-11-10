import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { REVIEW_DIMENSIONS } from '../lib/reviews.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const source = await readFile(new URL('../components/business-reviews.js', import.meta.url), 'utf8')
const { code } = await transform(source, {
  filename: 'business-reviews.js',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
const componentModule = { exports: {} }
new Function('require', 'module', 'exports', code)(name => {
  if (name === '../lib/reviews.mjs') return { REVIEW_DIMENSIONS }
  if (name === './partner-google-rating') return { PartnerGoogleRating: () => null }
  return require(name)
}, componentModule, componentModule.exports)
const { BusinessReviews, ReviewSummary, PartnerReviewSummary } = componentModule.exports
const reviews = patch => ({ status: 'ready', data: { summary: { count: 0 }, items: [], next: null }, loadMore() {}, loadingMore: false, pageError: false, ...patch })
const render = (state, locale = 'bg') => renderToStaticMarkup(createElement(BusinessReviews, { reviews: state, locale }))
const visibleText = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

test('ready-empty business reviews contain only the localized heading, five outlined stars and one exact sentence', () => {
  for (const [locale, heading, message] of [
    ['bg', 'Отзиви и оценки', 'Все още няма отзиви и оценки за този бизнес.'],
    ['en', 'Reviews &amp; ratings', 'There are no reviews or ratings for this business yet.'],
  ]) {
    const html = render(reviews(), locale)
    assert.equal(visibleText(html).replace(/\s+/g, ' '), `${heading} ${message}`)
    assert.equal((html.match(/<svg\b/g) || []).length, 5)
    assert.equal((html.match(/fill="none" stroke="currentColor"/g) || []).length, 5)
    assert.match(html, /class="business-reviews-empty-stars" aria-hidden="true"/)
    assert.doesNotMatch(html, /GoRez|review-star-fill|<rect|5\.0|review-summary|business-review-list|<button|<time|booking-eyebrow|business-section-note/)
  }
})

test('loading and failed reviews do not masquerade as a ready empty state', () => {
  for (const [status, message] of [['loading', 'Зареждане на отзиви…'], ['error', 'Отзивите временно не са достъпни']]) {
    const html = render(reviews({ status, data: null }))
    assert.match(html, new RegExp(message))
    assert.doesNotMatch(html, /business-reviews-empty|Все още няма отзиви и оценки/)
  }
})

test('real averages, counts, dimensions, published comments and pagination remain visible', () => {
  const data = { summary: { count: 12, average: 4.3, quality: 4.5 }, items: [{ id: 'review-1', display_name: 'QA Client', rating: 4, comment: 'A real <visit>', created_at: '2026-11-01T12:00:00Z' }], next: { before: '2026-11-01T12:00:00Z', id: 'review-1' } }
  const html = render(reviews({ data, pageError: true }))
  for (const content of ['4.3', '12 отзива', REVIEW_DIMENSIONS.quality.bg, '4.5', 'QA Client', 'A real &lt;visit&gt;', 'Потвърдено посещение', 'Още отзиви', 'Останалите отзиви не се заредиха. Опитай отново.']) assert.ok(html.includes(content), content)
  assert.match(html, /<time dateTime="2026-11-01T12:00:00Z">/)
  assert.doesNotMatch(html, /business-reviews-empty|От реални посещения|покана по имейл/)
  assert.match(render(reviews({ data, loadingMore: true }), 'en'), /<button[^>]*disabled=""[^>]*>Loading…<\/button>/)
})

test('homepage/shared summary empty and compact behavior remains unchanged', () => {
  assert.equal(visibleText(renderToStaticMarkup(createElement(ReviewSummary, { status: 'ready', summary: { count: 0 } }))), 'Все още няма отзиви')
  const state = reviews()
  const expanded = renderToStaticMarkup(createElement(PartnerReviewSummary, { slug: 'qa', reviews: state, includeGoogle: false }))
  assert.match(expanded, /translate="no">GoRez/)
  assert.match(expanded, /Все още няма отзиви/)
  const compact = renderToStaticMarkup(createElement(PartnerReviewSummary, { slug: 'qa', reviews: state, includeGoogle: false, compact: true }))
  assert.doesNotMatch(compact, /GoRez|Все още няма отзиви/)
})
