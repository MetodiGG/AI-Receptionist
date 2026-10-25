'use client'

import { useEffect, useState } from 'react'
import { fetchDirectory } from '../lib/directory.mjs'
import { createReadCache } from '../lib/read-cache.mjs'

const directoryCache = createReadCache()

export function useDirectory(preview = null, external = null) {
  const supplied = external || preview
  const [businesses, setBusinesses] = useState(() => directoryCache.peek() || []), [status, setStatus] = useState(() => directoryCache.peek() ? 'ready' : 'loading'), [version, setVersion] = useState(0)
  const suppliedData = Boolean(supplied)
  useEffect(() => {
    if (suppliedData) return
    let active = true
    const load = (force = false) => {
      if (!directoryCache.peek()) setStatus('loading')
      directoryCache.read(() => fetchDirectory(), { force }).then(rows => {
        if (active) { setBusinesses(rows); setStatus('ready') }
      }).catch(() => { if (active) setStatus('error') })
    }
    load(version > 0)
    const refreshVisible = () => { if (document.visibilityState === 'visible') load(true) }
    window.addEventListener('focus', refreshVisible)
    return () => { active = false; window.removeEventListener('focus', refreshVisible) }
  }, [version, suppliedData])
  return supplied || { businesses, status, retry: () => setVersion(current => current + 1) }
}
