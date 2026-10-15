import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { LEGAL_COPY } from '../lib/legal-copy.mjs'

test('privacy and terms have complete English counterparts and honest pilot limitations', () => {
  for (const type of ['privacy', 'terms']) {
    assert.equal(LEGAL_COPY[type].en.sections.length, LEGAL_COPY[type].bg.sections.length)
    assert.equal(/[а-яА-Я]/.test(JSON.stringify(LEGAL_COPY[type].en)), false)
    assert.match(LEGAL_COPY[type].en.note, /before.*(?:live pilot|live use)/)
  }
  assert.match(JSON.stringify(LEGAL_COPY.terms.en), /whether email notifications and reminders are enabled/)
  assert.match(JSON.stringify(LEGAL_COPY.terms.en), /No SMS or Viber/)
  assert.match(JSON.stringify(LEGAL_COPY.terms.bg), /дали имейл известията и напомнянията са включени/)
  assert.match(JSON.stringify(LEGAL_COPY.terms.bg), /Не се изпращат SMS или Viber/)
})

test('embedded widget carries EN into the iframe, defaults its label and toggles accessibly', async () => {
  const elements = []
  const document = {
    currentScript: { src: 'https://gorez.example/ai-receptionist-widget.js', dataset: { business: 'test-shop', lang: 'en' } },
    body: { appendChild() {} },
    createElement(tag) {
      const element = { tag, attributes: {}, children: [], handlers: {}, style: { set cssText(value) { this.display = value.match(/(?:^|;)display:([^;]+)/)?.[1] } }, setAttribute(key, value) { this.attributes[key] = value }, append(...children) { this.children.push(...children) }, appendChild(child) { this.children.push(child) }, addEventListener(name, callback) { this.handlers[name] = callback } }
      elements.push(element); return element
    },
  }
  vm.runInNewContext(await readFile(new URL('../public/ai-receptionist-widget.js', import.meta.url), 'utf8'), { document, URL })
  const button = elements.find(el=>el.tag === 'button')
  const frame = elements.find(el=>el.tag === 'iframe')
  assert.equal(frame.src, 'https://gorez.example/book/test-shop?embed=1&lang=en')
  assert.equal(frame.title, 'Online booking')
  assert.equal(button.textContent, '✦ Book now')
  assert.equal(button.attributes['aria-expanded'], 'false')
  button.handlers.click()
  assert.equal(button.attributes['aria-expanded'], 'true')
  button.handlers.click()
  assert.equal(button.attributes['aria-expanded'], 'false')
})
