import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
const css = await readFile(new URL('../app/quick-choice-home.css', import.meta.url), 'utf8')
const canvas = css.slice(css.indexOf('/* Desktop canvas:'))
const ast = parse(canvas)
const rootSelector = '.customer-home.quick-choice'
const declarations = rule => Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]))

function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(part => parseInt(part, 16) / 255)
  const [r, g, b] = rgb.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return .2126 * r + .7152 * g + .0722 * b
}
function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + .05) / (dark + .05)
}

test('desktop discovery has a seamless document-scrolled pale peach wash without changing mobile or card surfaces', () => {
  const media = ast.nodes.find(node => node.type === 'atrule' && node.name === 'media' && node.params === '(min-width:760px)')
  assert.ok(media)
  const [rule] = media.nodes.filter(node => node.type === 'rule')
  assert.equal(rule.selector, rootSelector)
  const style = declarations(rule)
  assert.equal(style['background-color'], '#fbf8f2')
  assert.equal(style['background-size'], '100% 1800px')
  assert.equal(style['background-repeat'], 'repeat-y')
  assert.equal(style['background-attachment'], 'scroll')
  assert.match(style['background-image'], /^linear-gradient\(180deg,/)
  const stops = [...style['background-image'].matchAll(/#[a-f0-9]{6}/g)].map(match => match[0])
  assert.deepEqual(stops, ['#fbf8f2', '#fbf3e7', '#f9e9d7', '#fbf8f2'])
  assert.equal(stops[0], stops.at(-1), 'repeated washes join without a hard color boundary')
  assert.ok(new Set(stops).size >= 3, 'scroll reveals restrained cream and pale peach shades')
  for (const stop of stops) {
    const rgb = stop.slice(1).match(/../g).map(part => parseInt(part, 16))
    assert.ok(Math.max(...rgb) - Math.min(...rgb) <= 40, `${stop}: the approved wash stays low-chroma`)
    assert.ok(luminance(stop) >= .8, `${stop}: large page areas remain predominantly light cream`)
  }
})

test('existing warm text retains normal-text contrast against every desktop canvas shade', () => {
  const palette = ['#fbf8f2', '#fbf3e7', '#f9e9d7']
  for (const text of ['#332923', '#6b625b', '#4e3728', '#713619']) {
    for (const background of palette) assert.ok(contrast(text, background) >= 4.5, `${text} on ${background}`)
  }
})

test('the optional background drift follows root scrolling only when supported and motion is allowed', () => {
  const support = ast.nodes.find(node => node.type === 'atrule' && node.name === 'supports')
  assert.equal(support.params, '(animation-timeline:scroll())')
  const media = support.nodes.find(node => node.type === 'atrule' && node.name === 'media')
  assert.equal(media.params, '(min-width:760px) and (prefers-reduced-motion:no-preference)')
  const [rule] = media.nodes.filter(node => node.type === 'rule')
  assert.equal(rule.selector, rootSelector)
  const style = declarations(rule)
  assert.equal(style.animation, 'discovery-orange-scroll 1s linear both')
  assert.equal(style['animation-timeline'], 'scroll(root block)', 'the shorthand duration never becomes a wall-clock animation')
  assert.ok(rule.nodes.findIndex(node => node.prop === 'animation-timeline') > rule.nodes.findIndex(node => node.prop === 'animation'), 'the shorthand must not reset the scroll timeline')
  const frames = ast.nodes.find(node => node.type === 'atrule' && node.name === 'keyframes')
  assert.equal(frames.params, 'discovery-orange-scroll')
  assert.deepEqual(frames.nodes.map(declarations), [{ 'background-position': '0 0' }, { 'background-position': '0 -320px' }])
})

test('reduced motion keeps the natural gradient but explicitly disables enhanced background movement', () => {
  const media = ast.nodes.find(node => node.type === 'atrule' && node.name === 'media' && node.params.includes('prefers-reduced-motion:reduce'))
  assert.equal(media.params, '(min-width:760px) and (prefers-reduced-motion:reduce)')
  const [rule] = media.nodes.filter(node => node.type === 'rule')
  assert.equal(rule.selector, rootSelector)
  assert.deepEqual(declarations(rule), { animation: 'none' })
})

test('desktop color treatment adds no overlays, layout changes, requests, timed loops or scroll handlers', () => {
  const allowed = new Set(['background-color', 'background-image', 'background-size', 'background-repeat', 'background-attachment', 'background-position', 'animation', 'animation-timeline'])
  ast.walkDecls(node => assert.ok(allowed.has(node.prop), node.prop))
  ast.walkRules(rule => assert.ok([rootSelector, 'from', 'to'].includes(rule.selector), rule.selector))
  assert.doesNotMatch(canvas, /::before|::after|\burl\(|\binfinite\b|\bblur\(|\bfilter\s*:|\btransform\s*:|background-attachment:\s*fixed|will-change|addEventListener|requestAnimationFrame/)
})
