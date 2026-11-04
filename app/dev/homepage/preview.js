'use client'

import { DiscoveryPage } from '../../../components/discovery-page'
import { requestDiscoveryLocation } from '../../../lib/discovery/search-ui.mjs'
import { usePublicLocale } from '../../../hooks/use-public-locale'

// Fictional names/coordinates only. Reusing two existing project photo files
// exercises actual rendering; these are NOT new public business records.
const origin = { latitude: 42.6627, longitude: 23.2849 }
const examples = [
  ['Amélie Studio', 'beauty', 'Маникюр', 'interior-20261026'],
  ['Atelier Hair', 'beauty', 'Подстригване', 'entrance-20261026'],
  ['Bare Nails', 'beauty', 'Маникюр', 'interior-20261026'],
  ['Go Auto', 'auto', 'Смяна на масло'],
  ['Pilates Studio', 'fitness', 'Пилатес'],
  ['Zen Lessons', 'education', 'Урок по математика'],
].map(([name, industry, service, photo], index) => ({ id: `fixture-${index}`, name: `ДЕМО · ${name}`, slug: `local-demo-${index}`, industry, city_ekatte: '68134', city: 'София', neighborhood: 'Манастирски ливади', booking_mode: index === 1 ? 'external' : 'gorez', coordinates: { latitude: origin.latitude + index * .004, longitude: origin.longitude }, services: [{ id: `s-${index}`, name: service, price: 25, duration_min: 45 }], photos: photo ? [{ src: `/businesses/vesi-studio/${photo}.webp`, alt: { bg: 'Снимка от проекта само за локален преглед', en: 'Project photo used only for local design review' } }] : [] }))

export function HomepageDesignFixture({ locale, scenario }) {
  const { locale: activeLocale } = usePublicLocale(locale)
  const provider = (unused, options) => requestDiscoveryLocation({ getCurrentPosition(success, fail) { if (scenario === 'denied') fail({ code: 1 }); else success({ coords: origin }) } }, options)
  return <><DiscoveryPage initialLocale={locale} home preview directoryData={{ businesses: scenario === 'empty' ? [] : examples, status: scenario === 'error' ? 'error' : scenario === 'loading' ? 'loading' : 'ready', retry: () => {} }} locationProvider={provider}/><p className="home-fixture-notice" role="note">{activeLocale === 'en' ? 'LOCAL PREVIEW · fictional businesses / location · no Google or AI calls · booking disabled' : 'ЛОКАЛЕН ПРЕГЛЕД · примерни бизнеси и локация · без Google/AI заявки и резервации'}</p></>
}
