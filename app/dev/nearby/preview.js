'use client'

import { useState } from 'react'
import { DiscoveryPage } from '../../../components/discovery-page'

export function NearbyPreview({ locale, denied }) {
  const [calls, setCalls] = useState(0)
  async function syntheticLocation() {
    setCalls(value => value + 1)
    if (denied) throw new Error('LOCATION_DENIED')
    return { latitude: 42.6977, longitude: 23.3219, consent: true, accuracyMeters: 10, observedAt: Date.now() }
  }
  return <><p className="discovery-notice discovery-test">LOCAL QA · Synthetic location only · Location requests: <span data-testid="location-calls">{calls}</span></p><DiscoveryPage initialLocale={locale} preview locationProvider={syntheticLocation}/></>
}
