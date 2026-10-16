export async function fetchDirectory({ fetcher = fetch, signal, timeoutMs = 10000 } = {}) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  let timer
  try {
    if (signal?.aborted) controller.abort()
    // The explicit race also covers a stalled/malformed response body.
    return await Promise.race([
      (async () => {
        const response = await fetcher('/api/public/businesses', { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('DIRECTORY_UNAVAILABLE')
        const body = await response.json()
        if (!Array.isArray(body.businesses) || !body.businesses.every(validDirectoryBusiness)) throw new Error('DIRECTORY_UNAVAILABLE')
        return body.businesses
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('DIRECTORY_TIMEOUT')) }, timeoutMs) }),
    ])
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}

function validDirectoryBusiness(row) {
  return row && typeof row.id === 'string' && typeof row.name === 'string' && row.name.trim()
    && typeof row.slug === 'string' && /^[a-z0-9-]{1,64}$/.test(row.slug)
    && typeof row.industry === 'string' && (!row.city || typeof row.city === 'string')
    && (!row.address || typeof row.address === 'string') && Array.isArray(row.services)
    && row.services.every(service => service && typeof service.id === 'string' && typeof service.name === 'string'
      && Number.isFinite(service.duration_min) && service.duration_min > 0
      && (service.price == null || Number.isFinite(Number(service.price)))
      && (!service.currency || /^[A-Z]{3}$/.test(service.currency)))
}

export function directoryCategories(rows) {
  return [...new Set(rows.map(row => row.industry))]
}
