import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { focusBookingDetails } from '../lib/booking-details-navigation.mjs'

function targets(headerHeight = 84) {
  const calls = []
  return {
    calls,
    heading: {
      style: {},
      closest: () => ({ querySelector: () => ({ getBoundingClientRect: () => ({ height: headerHeight }) }) }),
      scrollIntoView: options => calls.push(['scroll', options]),
    },
    nameInput: { focus: options => calls.push(['focus', options]) },
  }
}

test('a time selection focuses the name synchronously and scrolls the details heading into view', () => {
  const { calls, heading, nameInput } = targets()
  assert.equal(focusBookingDetails(heading, nameInput), true)
  assert.deepEqual(calls, [
    ['focus', { preventScroll: true }],
    ['scroll', { behavior: 'smooth', block: 'start', inline: 'nearest' }],
  ])
  assert.equal(heading.style.scrollMarginBlockStart, '108px')
})

test('keeps the heading below a taller mobile header and handles embedded booking without a header', () => {
  const mobile = targets(132)
  focusBookingDetails(mobile.heading, mobile.nameInput)
  assert.equal(mobile.heading.style.scrollMarginBlockStart, '156px')
  const embedded = targets(0)
  focusBookingDetails(embedded.heading, embedded.nameInput)
  assert.equal(embedded.heading.style.scrollMarginBlockStart, '24px')
  embedded.heading.closest = () => null
  assert.equal(focusBookingDetails(embedded.heading, embedded.nameInput), true)
  assert.equal(embedded.heading.style.scrollMarginBlockStart, '24px')
})

test('reduced-motion users move directly to their details without a scrolling animation', () => {
  const { calls, heading, nameInput } = targets()
  focusBookingDetails(heading, nameInput, true)
  assert.equal(calls[1][1].behavior, 'instant')
})

test('selecting the same time again still brings the customer back to their name', () => {
  const { calls, heading, nameInput } = targets()
  focusBookingDetails(heading, nameInput)
  focusBookingDetails(heading, nameInput)
  assert.equal(calls.filter(([action]) => action === 'focus').length, 2)
  assert.equal(calls.filter(([action]) => action === 'scroll').length, 2)
})

test('does not move focus if the details form is no longer mounted', () => {
  const { calls, heading, nameInput } = targets()
  assert.equal(focusBookingDetails(null, nameInput), false)
  assert.equal(focusBookingDetails(heading, null), false)
  assert.deepEqual(calls, [])
})

test('public booking mounts the form before navigation and still requires explicit confirmation', async () => {
  const source = await readFile(new URL('../components/public-booking-page.js', import.meta.url), 'utf8')
  assert.match(source, /flushSync\(\(\) => setSlot\(item\)\)\s+focusBookingDetails\(detailsHeadingRef\.current, nameInputRef\.current,/)
  assert.match(source, /onClick=\{\(\) => chooseSlot\(item\)\}/)
  assert.match(source, /className="booking-section-head booking-details-heading" ref=\{detailsHeadingRef\}/)
  assert.match(source, /<input ref=\{nameInputRef\} required minLength=\{2\} name="name" autoComplete="name"/)
  assert.match(source, /<form className="booking-details" onSubmit=\{submit\}/)
  assert.match(source, /<button className="booking-primary" type="submit" disabled=\{submitting\}/)
  const chooseSlot = source.slice(source.indexOf('function chooseSlot('), source.indexOf('async function submit('))
  assert.doesNotMatch(chooseSlot, /fetch\(|submit\(|setDetails\(/)
})
