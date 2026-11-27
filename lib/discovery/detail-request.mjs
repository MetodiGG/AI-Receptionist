export function needsBusinessDetails(row, preview = false) {
  return !preview || Boolean(row.source === 'catalogue' && row.detailsRef)
}

// Only start on a deliberate open (or retry), never when a card enters view
// or on hover. There is no cross-open cache for published business details.
export function startBusinessDetailsRequest(row, { preview = false, fetcher = fetch, timeoutMs = 8000 } = {}) {
  const { id, source } = row
  const path = preview ? '/dev/sofia-catalogue/business/' : '/api/public/discovery/business/'
  const controller = new AbortController()
  let stopped = null, finish
  const interruption = new Promise(resolve => { finish = resolve })
  const stop = status => {
    stopped = status
    finish({ status })
    controller.abort()
  }
  const deadline = setTimeout(() => stop('error'), timeoutMs)
  const response = (async () => {
    try {
      const reply = await fetcher(path + encodeURIComponent(id) + '?photos=1', {
        signal: controller.signal, cache: 'no-store', credentials: 'same-origin',
      })
      if (reply.status === 404) return { status: 'missing' }
      if (!reply.ok) return { status: 'error' }
      const body = await reply.json()
      if (!body?.business || body.business.id !== id || body.business.source !== source) return { status: 'error' }
      return { status: 'ready', business: body.business }
    } catch {
      return { status: stopped || 'error' }
    }
  })()
  const result = Promise.race([response, interruption]).finally(() => clearTimeout(deadline))
  return { result, cancel: () => stop('aborted') }
}
