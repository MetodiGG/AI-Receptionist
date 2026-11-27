import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('quick-choice registration is scoped to the actual application, not dashboard setup or site navigation', async () => {
  const css = await read('app/quick-choice-onboarding.css')
  const onboarding = await read('components/business-onboarding.js')
  const setup = await read('components/business-setup.js')
  assert.match(onboarding, /className="business-onboarding business-signup"/)
  assert.match(onboarding, /<BusinessSetup application session=/)
  assert.match(setup, /className=\{`setup-layout compact-business-setup\$\{application\?' signup-flow':''\}/)
  for (const line of css.split('\n')) {
    if (line.startsWith('.') || line.startsWith('  .')) assert.match(line.trimStart(), /^\.business-onboarding(?:[\s.{>])/)
  }
  assert.doesNotMatch(css, /\.launch-navigation|\.language-switch|\.country-flag|\.launch-menu|\.dashboard|\.admin|^body\s*\{|^:root/m)
})

test('new applications group the existing service, team, and schedule controls into their three visible steps', async () => {
  const css = await read('app/quick-choice-onboarding.css')
  const refresh = await read('app/business-signup-refresh.css')
  const setup = await read('components/business-setup.js')
  assert.match(css, /\.steps-card \{[^}]*grid-auto-flow: column; grid-auto-columns: minmax\(0,1fr\)/)
  assert.match(css, /\.step-item\.active \{[^}]*border-top-color: #a44f24/)
  assert.match(css, /\.step-item\.done \{[^}]*border-top-color: #658460/)
  assert.match(css, /\.step-label \{[^}]*font-size: 15px/)
  assert.match(setup, /const APPLICATION_STEPS = \[0, 1, 4\]/)
  assert.match(setup, /visibleSteps=application\?APPLICATION_STEPS:phoneOnly\?\[0,1,4\]:\[0,1,2,3,4\]/)
  assert.match(setup, /application&&step===1\?\[1,2,3\]:\[step\]/)
  assert.match(setup, /\(step === 2 \|\| application&&step===1\)/)
  assert.match(setup, /\(step === 3 \|\| application&&step===1\)/)
  assert.match(setup, /aria-current=\{index===step\?'step':undefined\}/)
  assert.match(setup, /fixedCityCode=\{application\?SOFIA_CITY_CODE:''\}/)
  assert.match(refresh, /\.wizard-head \.steps-card[\s\S]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/)
  assert.doesNotMatch(css, /\.step-item[^}]*display:\s*none/)
})

test('entry controls keep readable editable type, soft borders and comfortable tap height', async () => {
  const css = await read('app/quick-choice-onboarding.css')
  assert.match(css, /\.text-input,\.select-input,\.compact-input[^}]*min-height: 46px[^}]*border-radius: 12px[^}]*font-size: 16px/)
  assert.match(css, /\.onboarding-extra-fields textarea[^}]*min-height: 88px[^}]*font-size: 16px[^}]*resize: vertical/)
  assert.match(css, /\.field>label[^}]*font-size: 15px[^}]*text-transform: none/)
  assert.match(css, /\.wizard-head p \{[^}]*font-size: 16px; line-height: 1.55/)
  assert.match(css, /\.photo-picker-requirement \{[^}]*font-size: 15px[^}]*text-align: center/)
  assert.match(css, /\.catalogue-name-control input \{ padding-left: 39px; padding-right: 36px/)
})

test('all five content sections, external hours, account and consent remain readable', async () => {
  const css = await read('app/quick-choice-onboarding.css')
  for (const selector of ['.onboarding-service-row', '.staff-row', '.weekly-day', '.opening-hours-period', '.review-card', '.onboarding-account', '.onboarding-consent', '.form-message']) assert.ok(css.includes(selector), selector)
  assert.match(css, /\.weekly-day label:not\(\.schedule-check\) \{[^}]*font-size: 15px/)
  assert.match(css, /\.review-card p \{[^}]*font-size: 16px; line-height: 1.55/)
  assert.match(css, /\.onboarding-consent \{ font-size: 15px; line-height: 1.6/)
  assert.doesNotMatch(css, /font-size:\s*(?:[0-9]|1[0-4])px/)
})

test('narrow service rows and progress reflow instead of clipping or hiding information', async () => {
  const css = await read('app/quick-choice-onboarding.css')
  assert.match(css, /@media \(max-width: 600px\)/)
  assert.match(css, /\.onboarding-service-row \{ grid-template-columns: minmax\(0,1fr\) minmax\(0,1fr\) 40px/)
  assert.match(css, /\.onboarding-service-price-options \.settings-form-grid \{ grid-template-columns: minmax\(0,1fr\)/)
  assert.match(css, /\.staff-row > \.icon-button \{ grid-column: 3; grid-row: 1/)
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*\.staff-row > \.icon-button \{ grid-column: 2/)
  assert.match(css, /@media \(max-width: 349px\)[\s\S]*grid-auto-flow: row; grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/)
  assert.match(css, /\.wizard-actions :is\(\.primary-button,\.secondary-button\)[^}]*white-space: normal/)
  assert.doesNotMatch(css, /overflow-x:\s*hidden|text-overflow:\s*ellipsis|line-clamp|pointer-events:\s*none/)
})

test('focus and validation stay visible, including the searchable select enclosing its input', async () => {
  const css = await read('app/quick-choice-onboarding.css')
  assert.match(css, /:is\(button,input,select,textarea,summary,a\):focus-visible \{ outline: 3px solid #a34e24/)
  assert.match(css, /\.checked-select-control:focus-within \{[^}]*border-color: #a45127; box-shadow: 0 0 0 3px/)
  assert.match(css, /\.form-message \{ font-size: 16px; line-height: 1.55/)
  assert.doesNotMatch(css, /\.form-message[^}]*display:\s*none|\.onboarding-consent[^}]*display:\s*none/)
})
