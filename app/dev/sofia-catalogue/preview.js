'use client'
import { DiscoveryPage } from '../../../components/discovery-page'

// No OS location prompt or live database. The near-me QA point is explicitly
// synthetic; the catalogue business records themselves are real sourced facts.
export function SofiaCataloguePreview({ locale, nearby }) {
  const locationProvider = async () => {
    if (nearby) return { latitude: 42.67, longitude: 23.29, consent: true }
    throw { code: 1 }
  }
  return <><p className="home-fixture-notice" role="note">{locale === 'en' ? 'LOCAL CATALOGUE REVIEW · real sourced listings · bookings disabled' : 'ЛОКАЛЕН ПРЕГЛЕД НА КАТАЛОГА · реални публични записи · резервациите са изключени'}{nearby && (locale === 'en' ? ' · synthetic QA location' : ' · примерна тестова локация')}</p><DiscoveryPage initialLocale={locale} home preview cataloguePreview directoryData={{ businesses: [], status: 'ready' }} locationProvider={locationProvider}/></>
}
