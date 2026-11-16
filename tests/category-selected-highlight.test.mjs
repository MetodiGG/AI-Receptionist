import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const direct = (tree, selector) => tree.nodes.find(node => node.type === 'rule' && node.selector === selector)
const value = (rule, prop) => rule?.nodes.find(node => node.prop === prop)?.value

test('quick choice selected categories use a stronger warm wash without a frame or layout change', async () => {
  const tree = parse(await read('app/quick-choice-home.css'))
  const selected = direct(tree, '.customer-home.quick-choice .home-categories .home-discovery-rail button.selected')
  assert.equal(value(selected, 'background-color'), '#e3964a3b')
  assert.equal(value(selected, 'box-shadow'), 'none')
  assert.ok(parseInt(value(selected, 'background-color').slice(-2), 16) / 255 > .22)
  for (const prop of ['width', 'height', 'padding', 'font-size', 'transform']) assert.equal(value(selected, prop), undefined)
  const tile = direct(tree, '.customer-home.quick-choice .home-categories .home-discovery-rail button')
  assert.equal(value(tile, 'border-radius'), '999px')
  assert.equal(value(direct(tree, '.customer-home.quick-choice .home-categories img'), 'width'), '50px')
  assert.equal(value(direct(tree, '.customer-home.quick-choice .home-categories button > span'), 'font-size'), '18px')
})

test('subcategory selections remain slightly lighter, photographic and rounded in both CSS layers', async () => {
  for (const [path, selector] of [
    ['app/discovery-subcategories.css', '.discovery-subcategory-option[aria-pressed="true"]'],
    ['app/quick-choice-home.css', '.customer-home.quick-choice .discovery-subcategory-option[aria-pressed="true"]'],
  ]) {
    const tree = parse(await read(path)), selected = direct(tree, selector)
    assert.equal(value(selected, 'background-color'), '#f3a76930')
    assert.equal(value(selected, 'box-shadow'), 'none')
    assert.equal(value(selected, 'border-color'), 'transparent')
  }
  const dark = parse(await read('app/dark-mode.css'))
  const selected = direct(dark, 'html[data-theme="dark"] .customer-home.quick-choice .home-categories .home-discovery-rail button.selected')
  assert.equal(value(selected, 'background'), 'linear-gradient(110deg,#5b3e2a,#453022)')
  assert.equal(value(selected, 'box-shadow'), 'none')
})

test('mobile categories expose the existing next control without shrinking photographs or labels', async () => {
  const tree = parse(await read('app/quick-choice-home.css'))
  const mobile = tree.nodes.find(node => node.type === 'atrule' && node.name === 'media' && node.params === '(max-width:699px)')
  const heading = direct(mobile, '.customer-home.quick-choice .home-categories > .home-section-heading')
  assert.equal(value(heading, 'position'), 'absolute')
  assert.equal(value(heading, 'width'), '44px')
  const arrows = direct(mobile, '.customer-home.quick-choice .home-categories .home-rail-arrows')
  assert.equal(value(arrows, 'display'), 'flex')
  const next = direct(mobile, '.customer-home.quick-choice .home-categories .home-rail-arrows button:last-child')
  assert.equal(value(next, 'width'), '44px')
  assert.equal(value(next, 'height'), '44px')
  assert.equal(value(next, 'border-radius'), '999px')
  const end = direct(mobile, '.customer-home.quick-choice .home-categories .home-rail-arrows button:last-child:disabled')
  assert.equal(value(end, 'opacity'), '.4')
  assert.equal(value(heading, 'visibility'), undefined, 'reaching the end must not hide the focused navigation container')
  assert.equal(value(heading, 'inset-block-start'), '42px', 'leave the upper portion of the next photo unobscured')
  const rail = direct(mobile, '.customer-home.quick-choice .home-categories .home-discovery-rail')
  assert.equal(value(rail, 'padding-inline'), '3px 52px')
  for (const rule of mobile.nodes.filter(node => node.type === 'rule')) {
    assert.equal(value(rule, '--category-photo-size'), undefined)
    assert.equal(value(rule, 'font-size'), undefined)
  }
})
