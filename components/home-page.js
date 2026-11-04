'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DiscoveryPage } from './discovery-page'

export function HomePage({ initialLocale = 'bg', identity = {}, preview = null, discoveryEnabled = false }) {
  const router = useRouter(), [accountDeleted, setAccountDeleted] = useState(false)
  useEffect(() => {
    const url = new URL(window.location.href)
    setAccountDeleted(url.searchParams.get('account') === 'deleted')
    // Hashes never reach the server. Preserve legacy business-login bookmarks.
    if (url.hash === '#business') router.replace(`/login${url.search || `?lang=${initialLocale}`}`)
    if (['#clients', '#find-appointment', '#how'].includes(url.hash)) router.replace(`/?lang=${initialLocale}#ai-query`)
  }, [router, initialLocale])
  return <DiscoveryPage initialLocale={initialLocale} identity={identity} preview={Boolean(preview)} enabled={discoveryEnabled} accountDeleted={accountDeleted} home directoryData={preview?.directory}/>
}
