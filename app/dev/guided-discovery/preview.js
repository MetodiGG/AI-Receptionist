'use client'

import { DiscoveryPage } from '../../../components/discovery-page'
import { DiscoveryBusinessCard } from '../../../components/discovery-business-card'
import { BusinessPhotoGallery } from '../../../components/business-photo-gallery'
import { getBusinessPhotos } from '../../../lib/business-photos.mjs'
import snapshot from '../../../tests/fixtures/guided-public-partners-20261121.json'

const disabledLocation = async () => { throw Error('LOCATION_DENIED') }
const partners = snapshot.businesses.map(row => ({ ...row, photos: snapshot.localPhotos[row.id] || getBusinessPhotos(row) }))

export function GuidedDiscoveryPreview({ locale, photos, largeText = false, partners: suppliedPartners }) {
  const rows = suppliedPartners || partners
  return <>
    {/* Review-only root-font emulation, not a production control or a browser
        zoom claim. The route remains behind the existing devMock gate. */}
    {largeText && <style>{'html:has([data-guided-review-text="large"]) { font-size: 150%; }'}</style>}
    <p className="home-fixture-notice" role="note" data-guided-review-text={largeText ? 'large' : undefined}>{locale === 'en' ? 'LOCAL REVIEW · real public catalogue and partner snapshot · bookings disabled' : 'ЛОКАЛЕН ПРЕГЛЕД · реален каталог и публични партньорски данни · резервациите са изключени'}</p>
    {photos ? <main className="customer-home quick-choice guided-photo-evidence">
      <h1>{locale === 'en' ? 'Original partner photo previews' : 'Преглед на оригиналните партньорски снимки'}</h1>
      <p>{locale === 'en' ? 'Unaltered originals. Portrait and landscape uploads are available; the current partner snapshot has no square uploads.' : 'Непроменени оригинали. Налични са портретни и пейзажни снимки; в текущите партньорски данни няма квадратни.'}</p>
      <div className="home-business-grid">{rows.map(row => <DiscoveryBusinessCard key={row.id} row={row} locale={locale} preview quickChoice/>)}</div>
      <div className="guided-gallery-evidence">{rows.filter(row => ['450c5c2f-db41-476b-a21e-98cf5ee29194','e5b029ba-3586-485b-ac19-978a8386922d'].includes(row.id)).map(row => <section key={row.id}><h2>{row.name}</h2><BusinessPhotoGallery businessName={row.name} photos={row.photos} locale={locale} autoplay={false}/></section>)}</div>
    </main> : <DiscoveryPage initialLocale={locale} home preview cataloguePreview previewSearchEndpoint="/dev/guided-discovery/search" directoryData={{ businesses: rows, status: 'ready' }} locationProvider={disabledLocation}/>}
  </>
}
