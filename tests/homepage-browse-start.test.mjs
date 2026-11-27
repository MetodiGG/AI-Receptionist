import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import { homepageBrowseStartScript, takeHomepageBrowse } from '../lib/discovery/homepage-browse-start.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'

const endpoint = '/api/public/discovery'
const body = locale => JSON.stringify(discoverySearchInput({ locale, browse: true, categoryBrowse: true }))
const reply = { results: [], externalStatus: 'disabled' }

function browser(href, { prerendering = false } = {}) {
  const window = { location: new URL(href, 'https://www.gorez.co') }
  const requests = []
  const timers = new Map()
  let timerId = 0
  const context = {
    window, document: { prerendering }, URLSearchParams, AbortController, Date,
    setTimeout: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId },
    clearTimeout: id => timers.delete(id),
    fetch(path, init) {
      return new Promise((resolve, reject) => {
        const item = {
          path, init,
          end(data = reply, ok = true) { resolve({ ok, json: async () => data }) },
        }
        init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })
        requests.push(item)
      })
    },
  }
  return { window, requests, timers, start: locale => runInNewContext(homepageBrowseStartScript(locale), context) }
}

test('before hydration, the first visit starts exactly the real public browse, once in BG and EN', async () => {
  for (const locale of ['bg', 'en']) {
    const f = browser('/?lang=' + locale)
    f.start(locale)
    f.start(locale)
    assert.equal(f.requests.length, 1)
    const [{ path, init, end }] = f.requests
    assert.equal(path, endpoint)
    assert.equal(init.method, 'POST')
    assert.equal(init.cache, 'no-store')
    assert.equal(init.body, body(locale))
    end()
    const result = await takeHomepageBrowse(f.window, body(locale), new AbortController().signal, true)
    assert.equal(result.ok, true)
    assert.equal(result.data, reply)
    assert.equal(takeHomepageBrowse(f.window, body(locale), new AbortController().signal, true), null)
    assert.equal(f.timers.size, 0)
  }
})

test('no speculative request for a direct link, preview, legacy hash, location or prerender', () => {
  for (const href of ['/search', '/?q=hair', '/?category=hair', '/?lang=en&lang=bg', '/?city=68134', '/?latitude=42', '/#business']) {
    const f = browser(href)
    f.start('bg')
    assert.equal(f.requests.length, 0, href)
  }
  const hidden = browser('/', { prerendering: true })
  hidden.start('bg')
  assert.equal(hidden.requests.length, 0)
})

test('a submitted action, mismatched locale/body or stale handoff cancels unused work', () => {
  for (const [claimBody, eligible, now] of [
    [body('bg'), false, Date.now()],
    [body('en'), true, Date.now()],
    [body('bg'), true, Date.now() + 30_000],
  ]) {
    const f = browser('/')
    f.start('bg')
    assert.equal(takeHomepageBrowse(f.window, claimBody, new AbortController().signal, eligible, now), null)
    assert.equal(f.requests[0].init.signal.aborted, true)
  }
})

test('the active search cancels the adopted request and rate limits are not hidden or retried', async () => {
  const f = browser('/')
  f.start('bg')
  const control = new AbortController()
  const pending = takeHomepageBrowse(f.window, body('bg'), control.signal, true)
  control.abort()
  assert.equal((await pending).error.name, 'AbortError')
  assert.equal(f.requests.length, 1)

  const limited = browser('/')
  limited.start('bg')
  limited.requests[0].end({ error: { code: 'RATE_LIMITED' } }, false)
  const result = await takeHomepageBrowse(limited.window, body('bg'), new AbortController().signal, true)
  assert.equal(result.ok, false)
  assert.equal(result.data.error.code, 'RATE_LIMITED')
  assert.equal(limited.requests.length, 1)
})
