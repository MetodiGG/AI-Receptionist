import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { containDialogTab } from '../lib/dialog-focus.mjs'

test('dialog keyboard cycling reaches native opening-hours summary without entering collapsed content', () => {
  const focused = []
  const field = (name, visible = true) => ({ name, tabIndex:0, getClientRects:()=>visible?[{}]:[], focus:()=>focused.push(name) })
  const close=field('close'), hours=field('hours-summary'), hidden=field('closed-hours-content',false), reserve=field('reserve')
  const dialog={querySelectorAll:selector=>{
    assert.match(selector,/(?:^|,)summary(?:,|$)/)
    return [close,hours,hidden,reserve]
  },ownerDocument:{activeElement:close},focus:()=>assert.fail('dialog should retain an actionable control')}
  const event={key:'Tab',preventDefault:()=>{},shiftKey:false}
  containDialogTab(event,dialog);assert.equal(focused.at(-1),'hours-summary')
  dialog.ownerDocument.activeElement=hours
  containDialogTab(event,dialog);assert.equal(focused.at(-1),'reserve')
  dialog.ownerDocument.activeElement=reserve
  containDialogTab(event,dialog);assert.equal(focused.at(-1),'close')
  dialog.ownerDocument.activeElement=close
  containDialogTab({...event,shiftKey:true},dialog);assert.equal(focused.at(-1),'reserve')
})

test('compact hours retain a visible focus state, comfortably tappable summary and native open-state chevron', async()=>{
  const css=await readFile(new URL('../app/service-photo-surfaces.css',import.meta.url),'utf8')
  assert.match(css,/\.business-details-hours-toggle > summary \{[^}]*min-height: 44px;/)
  assert.match(css,/\.business-details-hours-toggle\[open\] > summary svg \{ transform: rotate\(180deg\);/)
  assert.match(css,/\.business-details-hours-toggle > summary:focus-visible \{[^}]*outline: 3px solid/)
  assert.match(css,/\.discovery-business-details \.business-details-address h3 \{ margin-bottom: 4px;/)
  assert.match(css,/\.discovery-business-details > footer \{ margin-top: 14px;/)
})

test('AI cover disclosure is smaller but remains real readable text over a contrasting background',async()=>{
  const css=await readFile(new URL('../app/service-photo-surfaces.css',import.meta.url),'utf8')
  const rule=css.match(/\.business-category-cover-label \{([^}]+)\}/)[1]
  assert.match(rule,/font-size: \.5625rem;/)
  assert.match(rule,/background: #fff8efe8; color: #512b19;/)
  assert.doesNotMatch(rule,/display:\s*none|visibility:\s*hidden|opacity:\s*0(?:;|\s)/)
  const component=await readFile(new URL('../components/business-cover-photo.js',import.meta.url),'utf8')
  assert.match(component,/AI illustration/)
  assert.match(component,/AI илюстрация/)
})
