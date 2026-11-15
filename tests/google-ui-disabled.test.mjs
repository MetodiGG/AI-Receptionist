import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { loadPlacesLibrary } from '../lib/discovery/google-ui-loader.mjs'

function replaceGlobal(name, descriptor) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name)
  Object.defineProperty(globalThis, name, { configurable: true, ...descriptor })
  return () => previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name]
}

test('catalogue-only SDK loader rejects before touching a browser, document, network or credentials', async () => {
  const forbidden = () => assert.fail('Google loading must be denied before any browser or network access')
  const restore = [replaceGlobal('window', { get: forbidden }), replaceGlobal('document', { get: forbidden }), replaceGlobal('fetch', { value: forbidden })]
  try {
    for (const key of ['synthetic-browser-key', '', null, { toString: forbidden }]) await assert.rejects(loadPlacesLibrary(key, 'bg'), /^Error: GOOGLE_PLACES_DISABLED$/)
  } finally { restore.reverse().forEach(undo => undo()) }
})

test('stale plans, repeated mounts and an already present Maps SDK cannot bypass the hard denial', async () => {
  let imports = 0, scripts = 0
  const restore = [replaceGlobal('window', { value: { google: { maps: { importLibrary: () => { imports++; throw Error('must not import') } } } } }),
    replaceGlobal('document', { value: { createElement: () => { scripts++; throw Error('must not create a script') }, head: { append: () => { scripts++; throw Error('must not attach a script') } } } })]
  try {
    for (const locale of ['bg', 'en', 'bg']) await assert.rejects(loadPlacesLibrary('stale-key-from-an-old-plan', locale), /GOOGLE_PLACES_DISABLED/)
    assert.equal(imports, 0); assert.equal(scripts, 0)
  } finally { restore.reverse().forEach(undo => undo()) }
})

test('hard denial precedes cached or existing SDK branches and cannot be enabled by an environment flag', async () => {
  const source = await readFile(new URL('../lib/discovery/google-ui-loader.mjs', import.meta.url), 'utf8')
  assert.match(source, /const PLACES_RUNTIME_ALLOWED = false/)
  assert.ok(source.indexOf("new Error('GOOGLE_PLACES_DISABLED')") < source.indexOf('if (libraryPromise)'))
  assert.ok(source.indexOf("new Error('GOOGLE_PLACES_DISABLED')") < source.indexOf('window.google'))
  assert.doesNotMatch(source, /process\.env|NEXT_PUBLIC_/)
})
