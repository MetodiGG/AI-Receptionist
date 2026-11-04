import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { allowAnalyticsReferrer, filterWebAnalyticsEvent, publicAnalyticsUrl } from '../lib/web-analytics.mjs'

const origin = 'https://www.gorez.co'
test('web analytics allow only public production URLs and remove every query', () => {
  for (const path of ['/', '/search', '/partners', '/for-businesses', '/faq', '/privacy', '/terms', '/book/real-public-slug']) {
    assert.equal(publicAnalyticsUrl(`${origin}${path}?lang=bg&q=private+search&lat=42.5&lng=23.5`), `${origin}${path}`)
  }
  for (const path of ['/admin','/admin/reviews','/dashboard','/account','/api/public/business','/booking/private-token','/review/private-token','/reset-password','/out/place/id','/dev/dashboard','/unknown/new-private-route','/book/a/secret','/book/%2Fsecret']) {
    assert.equal(publicAnalyticsUrl(`${origin}${path}`), null, path)
  }
  for (const url of ['http://www.gorez.co/', 'https://preview.vercel.app/', 'https://gorez.co.evil.test/', 'https://user:secret@www.gorez.co/', `${origin}:444/`, `${origin}/?access_token=secret`, `${origin}/?email=person%40test.test`, `${origin}/?code=secret`, `${origin}/#access_token=secret`, 'invalid']) assert.equal(publicAnalyticsUrl(url), null)
})
test('web analytics discard private navigation, custom events and privacy opt-outs', () => {
  const event = { type: 'pageview', url: `${origin}/search?q=do+not+send`, payload: { account: 'not-allowed' } }
  const context = { currentUrl: `${origin}/search?q=do+not+send&lat=42`, referrer: 'https://www.google.com/' }
  assert.deepEqual(filterWebAnalyticsEvent(event, context), { type: 'pageview', url: `${origin}/search` })
  for (const change of [{currentUrl:`${origin}/dashboard`},{currentUrl:`${origin}/faq`},{doNotTrack:'1'},{doNotTrack:'yes'},{globalPrivacyControl:true},{referrer:'https://other.test/private?token=secret'}]) assert.equal(filterWebAnalyticsEvent(event,{...context,...change}), null)
  assert.equal(filterWebAnalyticsEvent({...event,type:'event'},context),null)
  assert.equal(filterWebAnalyticsEvent(null,context),null)
})
test('web analytics do not forward potentially personal referrers', () => {
  for (const value of ['', 'https://www.gorez.co/', 'https://www.google.com/']) assert.equal(allowAnalyticsReferrer(value),true)
  for (const value of ['https://other.test/person/name','https://other.test/?q=name','https://other.test/#token','https://user:secret@other.test/','invalid']) assert.equal(allowAnalyticsReferrer(value),false)
})
test('analytics is production-gated, filtered and does not install custom event calls', () => {
  const layout = readFileSync(new URL('../app/layout.js',import.meta.url),'utf8')
  const component = readFileSync(new URL('../components/web-analytics.js',import.meta.url),'utf8')
  assert.match(layout,/enabled=\{process\.env\.VERCEL_ENV === 'production'\}/)
  assert.match(component,/beforeSend=\{beforeSend\}/)
  assert.match(component,/allowedPath === pathname/)
  assert.doesNotMatch(component,/\btrack\(/)
})
