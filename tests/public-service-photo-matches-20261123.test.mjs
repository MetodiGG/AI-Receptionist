import test from 'node:test'
import assert from 'node:assert/strict'
import { stat } from 'node:fs/promises'
import partners from './fixtures/guided-public-partners-20261121.json' with { type: 'json' }
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'
import { DISCOVERY_SUBCATEGORIES } from '../lib/discovery/subcategories.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { visiblePublicServices } from '../lib/public-service-eligibility.mjs'
import { auditServicePhotoCoverage } from '../scripts/audit-service-photo-coverage.mjs'

const electricalAssets = ['sx-home-electrical-inspect', 'sx-home-electrical-inspect', 'sx-home-cable-route',
  'sx-home-electrical-panel-equipment', 'sx-home-switch-socket-install', 'sx-home-appliance-repair']
const src = key => `/service-photos/${key}-v1.webp`
const assertLocalPhoto = async (image, { navigation = false } = {}) => {
  assert.match(image, navigation
    ? /^\/subcategory-photos\/[a-z0-9_-]+\.webp$/u
    : /^\/(?:service|category)-photos\/[a-z0-9_-]+\.webp$/u)
  assert.doesNotMatch(image, /appointment-workspace|notebook/u)
  assert.ok((await stat(new URL(`../public${image}`, import.meta.url))).size > 0, image)
}

test('the live-reported eight services resolve to their reviewed scenes across languages and payload shapes', async () => {
  const electromax = partners.businesses.find(row => row.name === 'ЕлектроMAX')
  const services = visiblePublicServices(electromax)
  assert.equal(services.length, electricalAssets.length)
  const azis = { name: 'Азис Стил', industry: 'beauty', source: 'gorez' }
  const cases = [
    ...services.map((service, index) => [electromax, service, electricalAssets[index]]),
    [azis, { name: 'Боядисване на брада' }, 'sx-barber-beard-colour'],
    [azis, { name: 'Удължаване на коса' }, 'sx-hair-extension-result-method-unknown'],
  ]
  for (const [business, service, key] of cases) {
    for (const locale of ['bg', 'en']) for (const shape of [business, { source: 'gorez', businessCategory: business.industry }]) {
      const photo = serviceThumbnail(service, { business: shape, locale })
      assert.equal(photo.src, src(key), service.name)
      assert.equal(photo.source, 'illustrative')
      assert.equal(photo.photoMatch, 'activity')
    }
    await assertLocalPhoto(src(key))
  }
  const exclusions = [
    [{ name: 'Диагностика и ремонт на електроинсталации' }, { industry: 'auto_repair' }, electricalAssets[0]],
    [{ name: 'Диагностика и ремонт на електроуреди за автомобил' }, electromax, electricalAssets[5]],
    [{ name: 'Подмяна на електрически табла и контакти' }, electromax, electricalAssets[3]],
    [{ name: 'Удължаване на коса с кератинови кичури' }, azis, 'sx-hair-extension-result-method-unknown'],
    [{ name: 'Боядисване на брада' }, { industry: 'pets' }, 'sx-barber-beard-colour'],
  ]
  for (const [service, business, key] of exclusions) assert.notEqual(serviceThumbnail(service, { business }).src, src(key), service.name)
})

test('all checked-in public services and the 21 Nov partner snapshot resolve without a notebook', () => {
  const report = auditServicePhotoCoverage(PUBLIC_CATALOGUE, { now: Date.parse('2026-11-23T12:00:00Z') })
  assert.ok(report.approvedBusinesses >= 1700)
  assert.ok(report.totals.services.total >= 10000)
  assert.equal(report.specificComplete, true)
  let checked = 0
  for (const business of partners.businesses) for (const service of visiblePublicServices(business)) {
    const photo = serviceThumbnail(service, { business })
    assert.ok(['exact', 'activity'].includes(photo.photoMatch), `${business.name}: ${service.name}`)
    assert.doesNotMatch(photo.src, /appointment-workspace|notebook/u)
    checked++
  }
  assert.equal(checked, 28)
})

test('all category and subcategory choices still have their own local artwork', async () => {
  const categories = homeCategories()
  assert.equal(categories.length, 14)
  assert.equal(DISCOVERY_SUBCATEGORIES.length, 113)
  await Promise.all([...new Set(categories.flatMap(({ photo, photo2x, photoLarge }) => [photo, photo2x, photoLarge].filter(Boolean)))]
    .map(photo => assertLocalPhoto(photo)))
  await Promise.all(DISCOVERY_SUBCATEGORIES.map(({ id, photo, photoSource }) => {
    const navigation = photoSource === 'illustrative'
    if (navigation) assert.equal(photo, `/subcategory-photos/${id}-v1.webp`)
    return assertLocalPhoto(photo, { navigation })
  }))
})
