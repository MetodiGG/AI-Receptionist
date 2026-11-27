'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { businessDisplayAddress, publicProse, serviceDisplayName } from '../lib/locale/public-content.mjs'
import { publicProfileDetails } from '../lib/business-profile.mjs'
import { profileServicePrice } from '../lib/business-profile-ui.mjs'
import { getBusinessPhotos } from '../lib/business-photos.mjs'
import { safeBookingPhone, safeBookingUrl } from '../lib/booking-mode.mjs'
import { Icon } from './icon'
import styles from '../app/dashboard/settings/settings-profile.module.css'

const managedPhoto = /^\/api\/business-media\/[0-9a-f-]{36}$/i

function useOwnerCover(business, fixture) {
  const { id, content_revision: revision, media_gallery_managed: managed } = business
  const key = `${id}:${revision}`, [cover, setCover] = useState(null)
  useEffect(() => {
    if (fixture || !managed) return
    const controller = new AbortController()
    let objectUrl
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!data?.session || controller.signal.aborted) return
      const options = { signal: controller.signal, cache: 'no-store', headers: { Authorization: `Bearer ${data.session.access_token}` } }
      const response = await fetch(`/api/businesses/${encodeURIComponent(id)}/media`, options)
      if (!response.ok) throw Error('MEDIA_UNAVAILABLE')
      const { media } = await response.json()
      const photo = getBusinessPhotos({ id, media_gallery_managed: managed, media })[0]
      if (!photo || !managedPhoto.test(photo.src)) {
        if (!controller.signal.aborted) setCover({ key, photo: null })
        return
      }
      const image = await fetch(photo.src, options)
      if (!image.ok) throw Error('MEDIA_UNAVAILABLE')
      const blob = await image.blob()
      if (controller.signal.aborted) return
      objectUrl = URL.createObjectURL(blob)
      setCover({ key, photo: { ...photo, src: objectUrl } })
    })().catch(() => { if (!controller.signal.aborted) setCover({ key, unavailable: true }) })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [id, key, managed, fixture])
  return fixture ? { photo: business.photos?.[0] } : !managed ? { photo: getBusinessPhotos(business)[0] } : cover?.key === key ? cover : { loading: true }
}

// Mirror public presentation with the saved business only. Preview actions explain
// where a customer goes without opening a booking, dialing or registering a view.
export function OwnerBusinessClientPreview({ business, savedServices, locale, fixture = false, loading = false, unavailable = false }) {
  const en = locale === 'en'
  const cover = useOwnerCover(business, fixture)
  const [destination, setDestination] = useState('')
  const address = businessDisplayAddress(business, locale)
  const description = publicProse(publicProfileDetails(business).description, locale, business.presentationEn?.description)
  const website = /^https?:\/\//i.test(business.website_url || '') ? business.website_url : ''
  const external = business.booking_mode === 'external', phone = business.booking_mode === 'phone'
  const booking = external ? (business.external_booking_consent_at && safeBookingUrl(business.external_booking_url)) : phone ? safeBookingPhone(business.phone)?.slice(4) : 'GoRez'
  const bookingLabel = external ? (en ? 'Book on the website' : 'Резервирай в сайта') : phone ? (en ? 'Book by phone' : 'Резервирай по телефон') : (en ? 'Book on GoRez' : 'Резервирай в GoRez')
  return (
    <section className={styles.clientPreview} aria-label={en ? 'Customer view' : 'Клиентски изглед'}>
      <div className={styles.clientPhoto}>
        {cover.photo ? <img src={cover.photo.src} alt={cover.photo.alt?.[locale] || business.name} style={{ objectPosition: cover.photo.position || undefined }} /> : <div className={styles.photoPlaceholder}><Icon name="store"/><span>{cover.loading ? (en ? 'Loading cover…' : 'Зареждане на корицата…') : cover.unavailable ? (en ? 'Cover temporarily unavailable' : 'Корицата временно не е достъпна') : (en ? 'No business photo yet' : 'Още няма снимка на бизнеса')}</span></div>}
      </div>
      <div className={styles.clientBody}>
        <p className={styles.overline}>{en ? 'Saved profile preview' : 'Преглед на запазения профил'}</p>
        <h3>{business.name}</h3>
        {address && <p className={styles.place}><Icon name="pin" />{address}</p>}
        {description && <p className={styles.clientDescription}>{description}</p>}
        <div className={styles.clientButtons}>
          {website && <button type="button" className={styles.quietButton} onClick={() => setDestination('website')}><Icon name="external"/>{en ? 'Business website' : 'Сайт на бизнеса'}</button>}
          <button type="button" className={styles.accentButton} disabled={!booking} onClick={() => setDestination('booking')}>{bookingLabel}<Icon name={phone ? 'phone' : 'arrowUpRight'}/></button>
        </div>
        {destination && <p className={styles.previewNote} role="status">{en ? 'Preview only · destination:' : 'Само преглед · дестинация:'} {destination === 'website' ? website : booking}</p>}
        {external && <p className={styles.clientHint}>{en ? 'Customers continue outside GoRez. No calendar is synchronized.' : 'Клиентите продължават извън GoRez. Не се синхронизира календар.'}</p>}
        <h4>{en ? 'Services and prices' : 'Услуги и цени'}</h4>
        {loading ? <p className={styles.clientHint}>{en ? 'Loading services…' : 'Зареждане на услугите…'}</p> : unavailable ? <p className={styles.clientHint}>{en ? 'Services are temporarily unavailable.' : 'Услугите временно не са достъпни.'}</p> : savedServices.length ? <ul className={styles.previewServices}>{savedServices.map(service => <li key={service.id}><span>{serviceDisplayName(service, locale)}</span><strong>{profileServicePrice(service, locale)}</strong></li>)}</ul> : <p className={styles.clientHint}>{en ? 'No services have been saved.' : 'Още няма запазени услуги.'}</p>}
      </div>
    </section>
  )
}
