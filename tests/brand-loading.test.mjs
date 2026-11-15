import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BrandLoading, BrandMark } from './helpers/brand-loading.mjs'
import { BRAND_MARK_SRC, BRAND_MARK_SRC_SET } from '../lib/brand-assets.mjs'

test('loading uses the current whole owner logo with localized screen-reader-only status', () => {
  for (const [locale, text] of [['bg', 'Зареждане…'], ['en', 'Loading…']]) {
    const html = renderToStaticMarkup(createElement(BrandLoading, { locale }))
    assert.ok(html.includes(BRAND_MARK_SRC)); assert.ok(html.includes(BRAND_MARK_SRC_SET))
    assert.match(html, /role="status"/); assert.ok(html.includes(`<span class="sr-only">${text}</span>`))
    assert.match(html, /loading="eager"/); assert.match(html, /width="40" height="40"/)
    assert.match(html, /sizes="40px"/)
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
test('all loading contexts grow modestly while non-loading brand marks keep their existing size', () => {
  for (const [size, expected] of [[16,20],[20,24],[24,28],[32,40],[40,50],[48,60],[NaN,40],[-1,40]]) {
    const html=renderToStaticMarkup(createElement(BrandLoading,{size}))
    assert.ok(html.includes(`width="${expected}" height="${expected}"`))
    assert.ok(html.includes(`sizes="${expected}px"`))
    assert.ok(html.includes(`--loading-mark-size:${expected}px`))
  }
  const logo=renderToStaticMarkup(createElement(BrandMark,{size:72}))
  assert.match(logo,/width="72" height="72"/);assert.match(logo,/sizes="48px"/)
})
test('CSS makes complete left/right/up/down 3D turns with a seamless loop and no visible sphere', async () => {
  const css = await readFile(new URL('../app/brand.css', import.meta.url), 'utf8')
  assert.match(css, /gorez-loading-orbit 2\.8s ease-in-out infinite/)
  assert.match(css, /backface-visibility:visible/)
  const orbit = css.slice(css.indexOf('@keyframes gorez-loading-orbit'), css.indexOf('@media (prefers-reduced-motion'))
  assert.ok(orbit.includes('0%,50%,100% { transform:perspective(240px) rotateX(0deg) rotateY(0deg); }'))
  assert.ok(orbit.includes('25% { transform:perspective(240px) rotateX(0deg) rotateY(-360deg); }'))
  assert.ok(orbit.includes('75% { transform:perspective(240px) rotateX(360deg) rotateY(0deg); }'))
  assert.doesNotMatch(orbit, /translate|rotateZ|opacity|scale/)
  assert.doesNotMatch(css, /gorez-loading-four-way|gorez-loading-half-turn|::before|::after|background\s*:/)
  assert.match(css, /prefers-reduced-motion:reduce[^]*?gorez-loading-mark[^]*?animation:none; transform:none/)
  const source = await readFile(new URL('../components/brand-loading.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /useEffect|setInterval|setTimeout|fetch\(|next\/image|use client/)
})
test('full perspective turns fit every current loading size without enlarging its fixed wrapper', async () => {
  const css = await readFile(new URL('../app/brand.css', import.meta.url), 'utf8')
  const perspective = Number(css.match(/perspective\((\d+)px\)/)?.[1])
  assert.equal(perspective, 240)
  assert.match(css, /width:calc\(var\(--loading-mark-size,40px\) \* 1\.45\)/)
  // Project all four square corners through each axis for one full turn.
  // Left/right and up/down use the same path in opposite directions.
  for (const size of [20,24,28,40,50,60]) {
    const half = size/2, envelope = size*1.45/2
    for (let degree=0; degree<=360; degree++) {
      const angle=degree*Math.PI/180
      for (const x of [-half,half]) for (const y of [-half,half]) {
        const yScale=perspective/(perspective-x*Math.sin(angle))
        assert.ok(Math.abs(x*Math.cos(angle)*yScale)<=envelope)
        assert.ok(Math.abs(y*yScale)<=envelope)
        const xScale=perspective/(perspective-y*Math.sin(angle))
        assert.ok(Math.abs(x*xScale)<=envelope)
        assert.ok(Math.abs(y*Math.cos(angle)*xScale)<=envelope)
      }
    }
  }
})
test('small search controls reserve motion space and compact/mobile labels do not hide the logo',async()=>{
  const css=await readFile(new URL('../app/brand.css',import.meta.url),'utf8')
  assert.match(css,/\.home-search-trigger:has\(>\.gorez-loading\),\.home-inline-control:has\(>\.gorez-loading\) \{ padding:0;/)
  const discovery=await readFile(new URL('../app/discovery.css',import.meta.url),'utf8')
  assert.doesNotMatch(discovery,/\.discovery-submit span \{ display: none/)
  assert.match(discovery,/\.discovery-submit > span:not\(\.gorez-loading\) \{ display: none/)
})
