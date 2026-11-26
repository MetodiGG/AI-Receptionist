import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'

const css = await readFile(new URL('../components/public-action.module.css', import.meta.url), 'utf8')
const preview = css.split('/* The discovery action pair uses the approved glass finish')[1]
const scopedSelector = '\\.pair:global\\(\\.home-business-actions\\)'
const declarations = selector => new RegExp(`${scopedSelector} ${selector} \\{([^}]*)\\}`).exec(preview)?.[1] || ''

test('only the discovery pair gets left icons, balanced labels and reliable hit areas', () => {
  assert.match(declarations('\\.action'), /min-height: 50px;/)
  assert.match(declarations('\\.content'), /grid-template-columns: var\(--discovery-glass-slot\) minmax\(min-content, 1fr\) var\(--discovery-glass-slot\);/)
  assert.match(declarations('\\.chip'), /grid-column: 1;[\s\S]*grid-row: 1;/)
  assert.match(declarations('\\.label'), /grid-column: 2;[\s\S]*justify-self: center;[\s\S]*inset-inline-start: 6px;/)
  assert.match(preview, / > \* \{[\s\S]*flex: 46 1 min-content;[\s\S]*min-inline-size: min-content;/)
  assert.match(preview, / > :is\(\.primary, \.outboundForm\) \{\s*flex-grow: 54;/)
  assert.doesNotMatch(preview, /\bprofile-action-modes\b|\bdirectory-reservation-action\b/)
})

test('only the decorative reflection follows scroll; no motion when reduced or unsupported', () => {
  assert.match(preview, /\.action::before,\s*[^{]+\.action::after \{[^}]*pointer-events: none;/)
  assert.match(preview, /@supports[^\n]*animation-timeline: scroll\(nearest block\)[^\n]*overflow: clip/)
  assert.match(preview, /@media \(prefers-reduced-motion:no-preference\) \{\s*[^\n]+\.action::before \{[^}]*animation-timeline: scroll\(root block\);/)
  assert.match(preview, /:global\(\.discovery-business-details\)[^\n]+\.action::before \{[^}]*animation-timeline: scroll\(nearest block\);/)
  assert.match(preview, /@keyframes discovery-glass-reflection \{\s*from \{ transform: translate3d\(-34%, 0, 0\); \}\s*to \{ transform: translate3d\(34%, 0, 0\); \}/)
  assert.doesNotMatch(preview, /\binfinite\b/)
})
