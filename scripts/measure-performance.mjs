// Small, read-only smoke measurement, not a load test. Never books appointments.
const base = new URL(process.argv[2] || 'https://www.gorez.co')
if (!['http:', 'https:'].includes(base.protocol)) throw Error('Expected an HTTP(S) origin')
const results = []
async function sample(name, path) {
  let body
  for (let attempt = 1; attempt <= 3; attempt++) {
    const start = performance.now(), response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000) })
    const ttfb = performance.now() - start
    const text = await response.text()
    results.push({ name, attempt, status: response.status, ttfb_ms: Math.round(ttfb), total_ms: Math.round(performance.now() - start), region: response.headers.get('x-vercel-id')?.split('::').slice(0, -1).join('::') || null, timing: response.headers.get('server-timing') })
    if (!response.ok) throw Error(`${name}: HTTP ${response.status}`)
    if (response.headers.get('content-type')?.includes('application/json')) body = JSON.parse(text)
  }
  return body
}
await sample('homepage', '/?lang=bg')
const directory = await sample('directory', '/api/public/businesses')
const business = directory.businesses.find(row => row.services?.length)
if (business) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Sofia', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 86400000))
  const query = new URLSearchParams({ date, service_id: business.services[0].id })
  const data = await sample('availability', `/api/public/${encodeURIComponent(business.slug)}/availability?${query}`)
  if (!Array.isArray(data.slots)) throw Error('Invalid availability response')
}
console.log(JSON.stringify(results, null, 2))
