import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PreparedServiceThumbnail, isPreparedThumbnailFailure } from '../components/prepared-service-thumbnail.js'

const illustration = {
  src: '/service-photos/fixture-detail-v1.webp', srcSet: '/service-photos/fixture-detail-v1.webp 256w',
  type: 'photo', kind: 'manicure', photoMatch: 'exact', illustration: true,
  alt: { bg: 'Лакиране на нокти', en: 'Applying nail polish' },
}
const authentic = {
  ...illustration, src: '/businesses/fixture-salon/distinct-photo.webp', srcSet: null, illustration: false,
  alt: { bg: 'Кадър от салона', en: 'A photograph from the salon' },
}
const render = props => renderToStaticMarkup(createElement(PreparedServiceThumbnail, props))

test('the prepared renderer requests only the first candidate and preserves the lazy detail image markup', () => {
  const html = render({ candidates: [illustration, authentic], className: 'menu-photo' })
  assert.match(html, /class="service-thumbnail service-thumbnail--photo menu-photo"/u)
  assert.match(html, /data-service-kind="manicure" data-thumbnail-kind="photo" data-photo-match="exact"/u)
  assert.match(html, /--service-thumbnail-size:128px/u)
  assert.match(html, /srcSet="\/service-photos\/fixture-detail-v1\.webp 256w"/iu)
  assert.match(html, /sizes="128px" width="128" height="128"/u)
  assert.match(html, /loading="lazy" decoding="async"/u)
  assert.doesNotMatch(html, /distinct-photo|rel="preload"/u)
})

test('illustrations keep a localized alt disclosure but have no visible AI badge, and authentic photos stay unmarked', () => {
  const bg = render({ candidates: [illustration] })
  const en = render({ candidates: [illustration], locale: 'en' })
  assert.match(bg, /alt="AI илюстрация · Лакиране на нокти"/u)
  assert.match(en, /alt="AI illustration · Applying nail polish"/u)
  for (const markup of [bg, en]) {
    assert.match(markup, /data-image-kind="ai-illustration"/u)
    assert.doesNotMatch(markup, /service-thumbnail-ai-label|title="AI|>AI(?: илюстрация| illustration)?</u)
  }
  const real = render({ candidates: [authentic], locale: 'en' })
  assert.match(real, /alt="A photograph from the salon"/u)
  assert.doesNotMatch(real, /AI illustration|data-image-kind|srcSet=/iu)
})

test('missing candidates preserve the existing localized assistive message without borrowing a photo', () => {
  for (const [locale, message] of [['bg', 'Няма отделна снимка за услугата'], ['en', 'No distinct service photo']]) {
    const html = render({ candidates: [null, { src: '' }], locale })
    assert.match(html, /class="sr-only" data-service-photo-unavailable="true"/u)
    assert.ok(html.includes(message))
    assert.doesNotMatch(html, /<img/u)
  }
})

test('the hydration failure guard distinguishes an incomplete or unstarted lazy image from a cached failure', () => {
  assert.equal(isPreparedThumbnailFailure(null), false)
  assert.equal(isPreparedThumbnailFailure({ complete: true, naturalWidth: 0, currentSrc: '' }), false)
  assert.equal(isPreparedThumbnailFailure({ complete: false, naturalWidth: 0, currentSrc: illustration.src }), false)
  assert.equal(isPreparedThumbnailFailure({ complete: true, naturalWidth: 256, currentSrc: illustration.src }), false)
  assert.equal(isPreparedThumbnailFailure({ complete: true, naturalWidth: 0, currentSrc: illustration.src }), true)
})

test('the candidate key preserves fallback state across locale or object changes but resets it for a different source list', () => {
  const getKey = (candidates, locale = 'bg') => PreparedServiceThumbnail({ candidates, locale }).key
  const original = getKey([illustration, authentic])
  assert.equal(getKey([{ ...illustration }, { ...authentic }], 'en'), original)
  assert.notEqual(getKey([authentic, illustration]), original)
  assert.notEqual(getKey([{ ...illustration, srcSet: null }, authentic]), original)
  assert.notEqual(getKey([illustration]), original)
})
