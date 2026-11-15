import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('partner profile links get real flow spacing after either external forms or telephone actions', async () => {
  const css = await read('app/solar.css')
  const match = css.match(/\.partners-page \.directory-business-card > \.outbound-booking-form \+ a,\s*\.partners-page \.directory-business-card > \.directory-book-button \+ a \{([^}]+)\}/)
  assert.ok(match, 'scope only adjacent profile links inside partner cards')
  assert.equal(match[1].trim(), 'margin-block-start: 12px;')
  assert.doesNotMatch(match[1], /transform|position|padding|height|line-height/)
})

test('the existing external form and telephone anchor retain their real GoRez profile destination', async () => {
  const directory = await read('components/business-directory.js')
  const outbound = await read('components/outbound-booking-button.js')
  assert.match(directory, /<OutboundBookingButton business=\{row\} locale=\{locale\} className="directory-book-button"\/><Link href=\{`\/book\/\$\{row.slug\}\?lang=\$\{locale\}`\}>/)
  assert.match(directory, /View GoRez profile.*Виж профила в GoRez/)
  assert.match(outbound, /<form className="outbound-booking-form" action=\{path\} method="post"/)
  assert.match(outbound, /<a className=\{className\} href=\{path\}>/)
})

test('the narrow link-spacing fix does not restyle the shared booking action component', async () => {
  const css = await read('app/booking-actions.css')
  assert.doesNotMatch(css, /directory-business-card > \.outbound-booking-form \+ a|directory-business-card > \.directory-book-button \+ a/)
  assert.match(css, /box-shadow: inset 0 1px 0 #ffffffd9,inset 0 -1px 0 #ffffff38,0 2px 0 var\(--action-edge\)/)
})

test('development-only directory spacing samples preserve the real layout structure without navigation or submission', async () => {
  const source = await read('app/dev/button-states/page.js')
  assert.match(source, /if \(process.env.NODE_ENV !== 'development'\) notFound\(\)/)
  assert.match(source, /className="partners-page platform-home"/)
  assert.match(source, /className="directory-results-grid"/)
  assert.match(source, /data-button-fit-surface="directory-external"/)
  assert.match(source, /data-button-fit-surface="directory-phone"/)
  assert.match(source, /<div className="outbound-booking-form"><button type="button" className="directory-book-button"/)
  assert.equal((source.match(/<a role="link" aria-disabled="true">/g) || []).length, 2)
  assert.doesNotMatch(source, /fetch\(|supabase|href=|action=|onClick=|<form\b|type="submit"/)
})
