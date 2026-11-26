import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PublicAction, PublicActionContent, PublicActionPair, expandPublicActions } from './helpers/public-action.mjs'

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const require = createRequire(import.meta.url), { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
const css = await read('components/public-action.module.css'), rules = []
parse(css).walkRules(rule => rules.push(rule))
const declarations = rule => Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]))
const style = selector => declarations(rules.find(rule => rule.selector === selector))
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const arrow = 'M6 18 18 6M6 6h12v12'

test('one shared action preserves actual anchor/button/Link/span semantics, callbacks and explicit submit types without managing navigation or analytics', () => {
  let clicked = 0
  const props = { as: 'a', href: '/book/actual-slug?lang=bg', target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Full service action', onClick: () => clicked++, children: 'Резервирай' }
  const tree = PublicAction(props)
  assert.equal(tree.type, 'a')
  for (const key of ['href','target','rel','aria-label','onClick']) assert.equal(tree.props[key], props[key])
  tree.props.onClick(); assert.equal(clicked, 1)
  assert.equal(PublicAction({ children: 'Book' }).props.type, 'button')
  assert.equal(PublicAction({ type: 'submit', disabled: true, children: 'Opening…' }).props.type, 'submit')
  assert.equal(PublicAction({ type: 'submit', disabled: true }).props.disabled, true)
  const Link = () => null
  assert.equal(PublicAction({ as: Link, href: '/book/example', prefetch: false }).type, Link)
  assert.equal(PublicAction({ as: Link, href: '/book/example', prefetch: false }).props.prefetch, false)
  const preview = render(PublicAction, { as: 'span', 'aria-disabled': true, children: 'Book' })
  assert.doesNotMatch(preview, /<button|<a\b|type=|href=|calendar-3d/)
  assert.match(preview, /aria-disabled="true"/)
})

test('primary arrow and secondary outline map share the existing vector system with stable left/right placement and one full label', () => {
  for (const label of ['Резервирай', 'Book', 'Пълно име на услугата без отрязване', 'Long complete service label without clipping']) {
    const primary = expandPublicActions(PublicAction({ children: label }))
    const content = primary.props.children
    assert.equal(content.props.children[1].props.children, label)
    assert.equal(content.props.children[2].props['aria-hidden'], 'true')
    assert.equal(content.props.children[0], false)
    const html = render(PublicAction, { children: label })
    assert.equal((html.match(new RegExp(arrow, 'g')) || []).length, 1)
    assert.ok(html.includes(label)); assert.doesNotMatch(html, /<img|calendar|home-reserve|home-directions/)
  }
  const secondary = expandPublicActions(PublicAction({ variant: 'secondary', children: 'Упътване' }))
  const content = secondary.props.children
  assert.equal(content.props.children[0].props['aria-hidden'], 'true')
  assert.equal(content.props.children[1].props.children, 'Упътване')
  assert.equal(content.props.children[2], false)
  assert.match(render(PublicAction, { variant: 'secondary', children: 'Directions' }), /m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z/)
  assert.doesNotMatch(render(PublicActionContent, { children: 'Book' }), /<button|<a\b|<form/)
})

test('Variant A uses 50px natural-growing pills, 36px chips, 18px outline icons and the requested typography/motion/state values', () => {
  const action = style('.action'), chip = style('.chip'), icon = style('.chip svg'), label = style('.label')
  for (const [name, value] of Object.entries({ 'min-height':'50px', height:'auto', 'border-radius':'999px', 'font-size':'14px', 'font-weight':'500', 'letter-spacing':'-.01em', 'word-break':'normal', 'overflow-wrap':'normal' })) assert.equal(action[name], value, name)
  assert.equal(chip.width, '36px'); assert.equal(chip.height, '36px'); assert.equal(chip.flex, '0 0 36px')
  assert.equal(icon.width, '18px'); assert.equal(icon.height, '18px'); assert.equal(icon['stroke-width'], '1.75')
  assert.match(style('.primary').background, /^linear-gradient\(180deg,/)
  assert.equal(action['--public-action-primary'], '#F2A67E'); assert.equal(action['--public-action-primary-end'], '#E68F62')
  assert.equal(action['--public-action-chip'], '#3A2217')
  assert.equal(action['--public-action-secondary'], 'var(--surface,#FFFFFF)')
  assert.equal(style('.secondaryContent .chip').background, '#F9E6D8')
  assert.equal(style('.secondaryContent .chip').color, '#B8643C')
  assert.equal(style('.action:focus-visible')['outline-offset'], '2px')
  assert.equal(style('.action:focus-visible').outline, '2px solid var(--public-action-focus)')
  assert.equal(style('.action:is(:disabled,[aria-disabled="true"])').opacity, '.5')
  assert.equal(style('.action:not(:disabled):not([aria-disabled="true"]):active').transform, 'scale(.98)')
  assert.ok(rules.some(rule => rule.selector.includes(':hover .chip svg') && declarations(rule).transform === 'translate(2px,-2px)'))
  assert.match(action.transition, /180ms ease-out/)
  assert.equal(label['white-space'], 'normal'); assert.equal(label['word-break'], 'normal'); assert.equal(label['overflow-wrap'], 'normal')
  const glassFace = '.pair:global(.home-business-actions) .action'
  for (const rule of rules) {
    assert.doesNotMatch(rule.toString(), /line-clamp|ellipsis|break-all|(?:home-reserve|home-directions|profile-external-reserve)/)
    if (rule.selector !== '.iconOnlyContent .label' && rule.selector !== glassFace) assert.doesNotMatch(rule.toString(), /overflow:\s*hidden/)
  }
  // The painted sheen needs clipping to the pill, but the shared label and
  // both button containers still have no cap on their natural height.
  assert.equal(style(glassFace).overflow, 'clip')
  assert.equal(style(glassFace)['max-height'], undefined)
  assert.equal(style(glassFace).height, undefined)
})

function rgb(value) { return value.slice(1).match(/../g).map(channel => parseInt(channel,16)) }
function luminance(values) { const [r,g,b] = values.map(value => value/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4); return .2126*r+.7152*g+.0722*b }
function contrast(first, second) { const [light,dark] = [luminance(first),luminance(second)].sort((a,b) => b-a); return (light+.05)/(dark+.05) }
test('normal text and arrow contrast meet AA across every primary gradient stop, hover state and both light/dark secondary surfaces', () => {
  const light = style('.action'), dark = style(':global(html[data-theme="dark"]) .action')
  for (const theme of [light, { ...light, ...dark }]) {
    for (const pair of [['--public-action-primary','--public-action-primary-end'],['--public-action-primary-hover','--public-action-primary-hover-end']]) {
      const start = rgb(theme[pair[0]]), end = rgb(theme[pair[1]])
      for (let step=0;step<=100;step++) assert.ok(contrast(rgb(theme['--public-action-ink']), start.map((value,index) => value+(end[index]-value)*step/100)) >= 4.5)
    }
    assert.ok(contrast(rgb(theme['--public-action-on-chip']),rgb(theme['--public-action-chip'])) >= 4.5)
  }
  assert.ok(contrast(rgb('#4A3F3A'),rgb('#FFFFFF')) >= 4.5)
  assert.ok(contrast(rgb('#4A3F3A'),rgb('#FFF0E4')) >= 4.5)
  assert.ok(contrast(rgb('#F5ECE2'),rgb('#2A221D')) >= 4.5)
  assert.ok(contrast(rgb('#F5ECE2'),rgb('#443024')) >= 4.5)
})

test('pairs fit actual narrow containers, stack below 320px or for enlarged whole words, and retain word-safe forms without legacy hooks', () => {
  assert.equal(style('.pair').display,'flex'); assert.equal(style('.pair')['flex-wrap'],'wrap')
  assert.equal(style('.pair')['container-type'],'inline-size'); assert.equal(style('.pair')['container-name'],'public-actions')
  const responsive = rules.find(rule => rule.selector === '.pair' && declarations(rule)['flex-direction'] === 'column')
  assert.equal(responsive.parent.params,'(max-width:319px)')
  assert.equal(style('.pair > *').flex,'1 1 0'); assert.equal(style('.pair > *')['min-width'],'0')
  assert.equal(style('.pair > form > .action').width,'100%')
  const narrow = rules.filter(rule => rule.parent.type === 'atrule' && rule.parent.name === 'container' && rule.parent.params === 'public-actions (max-width:360px)')
  const words = declarations(narrow.find(rule => rule.selector === '.pair > *'))
  assert.equal(words.flex,'1 1 min-content'); assert.equal(words['min-width'],'min-content')
  assert.equal(declarations(narrow.find(rule => rule.selector === '.label'))['min-inline-size'],'min-content')
  assert.equal(declarations(narrow.find(rule => rule.selector === '.content')).gap,'2px')
  assert.equal(declarations(narrow.find(rule => rule.selector === '.primaryContent,.secondaryContent'))['padding-inline'],'0')
  const pair = PublicActionPair({ children: ['first','second'], 'aria-label':'Actions' })
  assert.equal(pair.type,'div'); assert.equal(pair.props['aria-label'],'Actions')
  assert.equal(pair.props['data-public-action-pair'],true)
  const motion = rules.filter(rule => rule.parent.type === 'atrule' && /prefers-reduced-motion/.test(rule.parent.params))
  assert.ok(motion.some(rule => declarations(rule).transition === 'none'))
  assert.ok(motion.filter(rule => declarations(rule).transform).every(rule => declarations(rule).transform === 'none'))
})

test('the icon system adds only two vector entries; every pre-existing glyph/default and all legacy artwork bytes remain unchanged', async () => {
  const root = fileURLToPath(new URL('../',import.meta.url))
  const baseline = execFileSync('git',['show','49ecbc6:components/icon.js'],{cwd:root,encoding:'utf8'})
  const current = await read('components/icon.js')
  const original = current.split('\n').filter(line => !/^\s*(?:arrowUpRight|outlineMap):/.test(line)).join('\n')
  assert.equal(original,baseline)
  assert.match(current,/strokeWidth="1.8"/,'only action CSS scopes the new 1.75px stroke')
  for (const source of [await read('components/public-action.js'), await read('components/booking-button-content.js')]) assert.doesNotMatch(source,/\bfetch\s*\(|trackProductEvent|trackSearchEvent|localStorage|sessionStorage|window\.|document\./)
})
