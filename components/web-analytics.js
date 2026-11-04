'use client'

import { Analytics } from '@vercel/analytics/next'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { allowAnalyticsReferrer, filterWebAnalyticsEvent, publicAnalyticsUrl } from '../lib/web-analytics.mjs'

function beforeSend(event) {
  return filterWebAnalyticsEvent(event, {
    currentUrl: window.location.href,
    referrer: document.referrer,
    doNotTrack: navigator.doNotTrack || window.doNotTrack,
    globalPrivacyControl: navigator.globalPrivacyControl === true,
  })
}

export function PublicWebAnalytics({ enabled = false }) {
  const pathname = usePathname()
  const [allowedPath, setAllowedPath] = useState(null)
  useEffect(() => {
    const allowed = enabled && publicAnalyticsUrl(window.location.href) && allowAnalyticsReferrer(document.referrer)
      && navigator.doNotTrack !== '1' && navigator.doNotTrack !== 'yes' && window.doNotTrack !== '1' && navigator.globalPrivacyControl !== true
    setAllowedPath(allowed ? pathname : null)
  }, [enabled, pathname])
  // Never load the collection script on an initial private page, in local dev or
  // a Preview deployment. beforeSend remains the boundary during SPA navigation.
  return enabled && pathname && allowedPath === pathname ? <Analytics beforeSend={beforeSend} mode="production" debug={false} /> : null
}
