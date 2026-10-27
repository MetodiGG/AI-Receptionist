// Fixed URLs are supplied by server adapters, never by the request payload.
// The deadline covers response headers AND the response body. No retries: a
// timeout may already have been billed and must not silently double costs.
export async function providerJson(url, options, { fetcher = fetch, timeoutMs = 5000, maxBytes = 100000 } = {}) {
  const controller = new AbortController()
  let timer
  try {
    return await Promise.race([
      (async () => {
        const response = await fetcher(url, { ...options, cache: 'no-store', redirect: 'error', signal: controller.signal })
        if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE')
        if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('PROVIDER_RESPONSE_TOO_LARGE')
        const reader = response.body?.getReader()
        if (!reader) throw new Error('PROVIDER_UNAVAILABLE')
        const decoder = new TextDecoder(); let bytes = 0, body = ''
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            bytes += value.byteLength
            if (bytes > maxBytes) { await reader.cancel(); throw new Error('PROVIDER_RESPONSE_TOO_LARGE') }
            body += decoder.decode(value, { stream: true })
          }
          return JSON.parse(body + decoder.decode())
        } finally { reader.releaseLock() }
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('PROVIDER_TIMEOUT')) }, timeoutMs) }),
    ])
  } finally { clearTimeout(timer) }
}

export async function readBoundedJson(request, maxBytes = 4096, timeoutMs = 3000) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new SyntaxError('JSON required')
  if (Number(request.headers.get('content-length')) > maxBytes) throw new SyntaxError('Body too large')
  const reader = request.body?.getReader()
  if (!reader) throw new SyntaxError('Body required')
  const decoder = new TextDecoder(); let bytes = 0, text = '', timer
  try {
    return await Promise.race([
      (async () => {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          bytes += value.byteLength
          if (bytes > maxBytes) { await reader.cancel(); throw new SyntaxError('Body too large') }
          text += decoder.decode(value, { stream: true })
        }
        return JSON.parse(text + decoder.decode())
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { void reader.cancel().catch(() => {}); reject(new SyntaxError('Body timeout')) }, timeoutMs) }),
    ])
  } finally { clearTimeout(timer); reader.releaseLock() }
}
export const discoveryHeaders = { 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' }
export function sameSiteRequest(request, { development = false } = {}) {
  const origin = request.headers.get('origin'), site = request.headers.get('sec-fetch-site')
  const target = new URL(request.url)
  let loopbackAlias = false
  if (development && origin) {
    try {
      const source = new URL(origin), loopbacks = ['localhost', '127.0.0.1', '[::1]']
      loopbackAlias = loopbacks.includes(source.hostname) && loopbacks.includes(target.hostname) && source.port === target.port && source.protocol === target.protocol
    } catch { return false }
  }
  return (!origin || origin === target.origin || loopbackAlias) && !['cross-site', 'none'].includes(site)
}
