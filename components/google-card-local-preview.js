'use client'

import { useState } from 'react'
import { Icon } from './icon'
import { GoogleBusinessCardFrame, GoogleContactDialogFrame } from './google-business-card'
import { DiscoveryBusinessCard } from './discovery-business-card'
import { discoveryDistanceOrigin } from '../lib/discovery/distance-origin.mjs'

// Standalone offline QA, never passed into discovery or a provider component.
// These fabricated facts are labelled on the page AND on every mock card.
const point = { latitude: 42.661, longitude: 23.288 }
const cards = [
  { id: 'qa-website', name: 'ДЕМО · Studio Orange', type: 'Салон за красота', category: 'beauty', contact: 'website' },
  { id: 'qa-phone', name: 'ДЕМО · Orange Barber', type: 'Бръснарница', category: 'barber', contact: 'phone' },
  { id: 'qa-verified', name: 'ДЕМО · Nails', type: 'Маникюр, педикюр', category: 'nails', contact: 'verified' },
  { id: 'qa-none', name: 'ДЕМО · Изключително дълго име на бизнес за проверка на подравняването', type: 'Консултации', category: 'consulting', contact: null },
]
export function GoogleCardLocalPreview({ locale }) {
  const en = locale === 'en', [nearby, setNearby] = useState(false), [dialog, setDialog] = useState(null)
  const origin = discoveryDistanceOrigin(nearby ? { coordinates: { latitude: 42.663, longitude: 23.29, consent: true } } : { cityCode: '68134' })
  const partner = { source: 'gorez', industry: 'beauty', businessCategory: 'barber', category: 'barber', id: 'local-partner', slug: 'local-partner', name: 'ДЕМО · GoRez партньор', coordinates: point, address: 'Измислен QA адрес · София', publicServiceNames: ['Мъжко подстригване', 'Оформяне на брада'], reviews: { summary: { count: 12, average: 4.8 }, items: [] } }
  return <>
    <div className="google-preview-controls"><button type="button" className="secondary-button" onClick={() => setNearby(value => !value)} aria-pressed={nearby}>{en ? 'Demo location' : 'Демо локация'}: {nearby ? en ? 'on' : 'вкл.' : en ? 'off' : 'изкл.'}</button><p>{en ? 'No device location is requested. All distances use fictional QA business points.' : 'Не се иска реална локация. Всички точки на бизнесите са измислени за теста.'}</p></div>
    <ul className="home-discovery-rail" aria-label={en ? 'Fictional card layout' : 'Измислени тестови карти'}>
      <li><DiscoveryBusinessCard row={partner} locale={locale} nearby={nearby} preview distanceOrigin={origin}/></li>
      {cards.map((card, index) => <li key={card.id}><GoogleBusinessCardFrame locale={locale} origin={origin} point={index === 3 ? null : { latitude: point.latitude + index * .002, longitude: point.longitude }} maps={<span className="home-directions" aria-disabled="true"><Icon name="map"/><span className="home-maps-label" translate="no">Google Maps</span></span>} booking={card.contact && <button type="button" className="home-reserve" onClick={() => setDialog(card)} aria-haspopup="dialog">{en ? 'Book a time' : 'Резервирай час'}</button>}>
        <div className="google-preview-native"><div className="google-preview-art"><span>{en ? 'DEMO · Google content area' : 'ДЕМО · място за Google съдържание'}</span></div><h3>{card.name}</h3><p className="home-business-category">{card.type}</p><p className="home-business-reviews">★ 4,8 · 12 {en ? 'demo reviews' : 'демо отзива'}</p>{!nearby && <p className="home-business-address">{en ? 'Fictional test address' : 'Измислен тестов адрес'}</p>}<p className="google-preview-label">{en ? 'Not a Google result. No live provider loaded.' : 'Не е Google резултат. Няма зареден доставчик.'}</p></div>
      </GoogleBusinessCardFrame></li>)}
    </ul>
    {dialog && <GoogleContactDialogFrame locale={locale} onClose={() => setDialog(null)}><p className="google-contact-note">{en ? 'DEMO · No website, phone call or booking will open.' : 'ДЕМО · Няма отваряне на сайт, обаждане или резервация.'}</p><h4>{dialog.name}</h4>{dialog.contact === 'verified' ? <p>{en ? 'With a verified booking record, the real card links directly to that booking page.' : 'При проверен запис истинската карта води директно към страницата за резервации.'}</p> : <><p>{en ? 'The real window keeps Google’s own contact actions and attribution.' : 'Истинският прозорец запазва контактите, действията и атрибуцията на Google.'}</p><button type="button" className="secondary-button" disabled>{dialog.contact === 'phone' ? en ? 'Phone · demo only' : 'Телефон · само демо' : en ? 'Website · demo only' : 'Сайт · само демо'}</button><p>{en ? 'Availability is confirmed by the business, not GoRez.' : 'Свободният час се потвърждава от бизнеса, не от GoRez.'}</p></>}</GoogleContactDialogFrame>}
  </>
}
