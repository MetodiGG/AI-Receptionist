import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const source = await readFile(new URL('../components/inline-discovery-panel.js', import.meta.url), 'utf8')
const css = await readFile(new URL('../app/inline-discovery-panel.css', import.meta.url), 'utf8')
const { code } = await transform(source, { filename: 'components/inline-discovery-panel.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const module = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name === '../app/inline-discovery-panel.css' ? {} : require(name), module, module.exports)
const { InlineDiscoveryPanel } = module.exports

test('the inline panel commits fresh content immediately and removes prior controls synchronously on close', () => {
  const first = React.createElement('button', null, 'Old choice')
  const next = React.createElement('button', null, 'New choice')
  const render = (open, child) => renderToStaticMarkup(React.createElement(InlineDiscoveryPanel, { open }, child))
  assert.match(render(true, first), /data-open="true"><button>Old choice/)
  assert.match(render(true, next), /data-open="true"><button>New choice/)
  assert.equal(render(false, next), '', 'closed controls do not stay focusable or take up layout')
  assert.doesNotMatch(source, /useLayoutEffect|useState|setTimeout|requestAnimationFrame/)
})

test('the panel animates opacity without layout, only when motion is permitted', () => {
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*animation: inline-discovery-reveal 160ms/)
  assert.match(css, /@keyframes inline-discovery-reveal \{\s*from \{ opacity: \.55; \}\s*to \{ opacity: 1; \}/)
  assert.doesNotMatch(css, /(?:height|grid-template-rows|overflow|transition)\s*:/)
})
