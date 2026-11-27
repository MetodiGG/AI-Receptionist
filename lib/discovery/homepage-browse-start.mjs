import { DEFAULT_DISCOVERY_CITY, DEFAULT_DISCOVERY_RADIUS_KM } from './defaults.mjs'

const HANDOFF = '__gorezHomepageBrowse'
const ENDPOINT = '/api/public/discovery'
const MAX_AGE_MS = 20_000

// This source runs before hydration. It is a single public, unfiltered request
// for this document, not a cache or a second source of search state.
export function homepageBrowseStartScript(locale) {
  const input = { query: '', locale: locale === 'en' ? 'en' : 'bg', radiusKm: DEFAULT_DISCOVERY_RADIUS_KM, browse: true, cityCode: DEFAULT_DISCOVERY_CITY }
  const argumentsSource = [HANDOFF, ENDPOINT, JSON.stringify(input), MAX_AGE_MS].map(value => JSON.stringify(value)).join(',').replace(/</g, '\\u003c')
  return `(function(key, endpoint, body, maxAge) {
    var loc = window.location, params = new URLSearchParams(loc.search);
    if (loc.pathname !== '/' || loc.hash || window[key] || Array.from(params.keys()).some(function(name) { return name !== 'lang'; }) || params.getAll('lang').length > 1 || document.prerendering) return;
    var controller = new AbortController();
    var entry = { body: body, startedAt: Date.now(), controller: controller };
    window[key] = entry;
    var timer = setTimeout(function() { controller.abort(); }, maxAge);
    entry.result = fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', signal: controller.signal, body: body
    }).then(async function(response) {
      return { ok: response.ok, data: await response.json() };
    }).catch(function(error) {
      return { error: error };
    }).finally(function() {
      clearTimeout(timer);
    });
  })(${argumentsSource});`
}

// Consume only the precise initial payload. A newer filter, draft or user
// action can never read this response as if it belonged to that new request.
export function takeHomepageBrowse(host, body, signal, eligible, now = Date.now()) {
  const entry = host[HANDOFF]
  if (!entry) return null
  delete host[HANDOFF]
  if (!eligible || entry.body !== body || signal.aborted || now - entry.startedAt >= MAX_AGE_MS) {
    entry.controller.abort()
    return null
  }
  const cancel = () => entry.controller.abort()
  signal.addEventListener('abort', cancel, { once: true })
  return entry.result.finally(() => signal.removeEventListener('abort', cancel))
}
