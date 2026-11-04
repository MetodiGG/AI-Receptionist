import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { hasBusinessCoordinates, parseBusinessCoordinates } from '../lib/business-coordinates.mjs'

test('parses an explicit Bulgarian business pin, not a Google map viewport', () => {
  assert.deepEqual(parseBusinessCoordinates('42.665, 23.286'), { latitude: 42.665, longitude: 23.286 })
  assert.deepEqual(parseBusinessCoordinates('42.665;23.286'), { latitude: 42.665, longitude: 23.286 })
  assert.deepEqual(parseBusinessCoordinates('https://www.google.com/maps/place/Test/@42.7,23.3,17z/data=!8m2!3d42.665!4d23.286'), { latitude: 42.665, longitude: 23.286 })
  assert.deepEqual(parseBusinessCoordinates('https://www.google.com/maps/search/?api=1&query=42.665%2C23.286'), { latitude: 42.665, longitude: 23.286 })
  assert.equal(parseBusinessCoordinates('https://www.google.com/maps/@42.7,23.3,17z'), null)
})
test('rejects arbitrary URLs, credentials, short links, missing/invalid and non-Bulgarian coordinates', () => {
  for (const value of ['', null, '42.7', '0,0', '91,23', '42,200', 'NaN,23', 'https://evil.example/maps/data=!3d42.665!4d23.286', 'https://user:pass@www.google.com/maps?q=42.665,23.286', 'javascript:alert(1)', 'https://maps.app.goo.gl/example', 'http://www.google.com/maps?q=42.665,23.286']) assert.equal(parseBusinessCoordinates(value), null, String(value))
})
test('location readiness never treats an empty field or zero as nearby coordinates', () => {
  assert.equal(hasBusinessCoordinates('42.665', '23.286'), true)
  for (const point of [[null,null],['',''],[undefined,23],[0,0],[91,23],['abc','def']]) assert.equal(hasBusinessCoordinates(...point), false)
})
test('both existing authenticated editors explain nearby eligibility and use a no-network pin helper', async () => {
  const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
  for (const file of ['components/admin-business-editor.js','components/business-public-profile-editor.js']) assert.match(await read(file), /<BusinessCoordinatesFields/)
  const editor = await read('components/business-coordinates-fields.js')
  assert.match(editor, /Липсва точка на картата/)
  assert.match(editor, /type="button" disabled=\{!pin.trim\(\)\} onClick=\{applyPin\}/)
  assert.doesNotMatch(editor, /fetch\(|getCurrentPosition|watchPosition|localStorage/)
})
