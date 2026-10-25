'use client'

import { useEffect, useState } from 'react'
import { fetchDirectory } from '../lib/directory.mjs'

export function useDirectory(preview = null, external = null) {
  const supplied = external || preview
  const [businesses, setBusinesses] = useState([]), [status, setStatus] = useState('loading'), [version, setVersion] = useState(0)
  const suppliedData = Boolean(supplied)
  useEffect(() => {
    if (suppliedData) return
    const controller = new AbortController()
    setStatus('loading')
    fetchDirectory({ signal: controller.signal }).then(rows => {
      if (!controller.signal.aborted) { setBusinesses(rows); setStatus('ready') }
    }).catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => controller.abort()
  }, [version, suppliedData])
  return supplied || { businesses, status, retry: () => setVersion(current => current + 1) }
}
