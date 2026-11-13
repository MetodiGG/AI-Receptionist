import test from 'node:test'
import assert from 'node:assert/strict'
import photography from '../lib/discovery/catalogue-data/neighborhood-photography-2000-001-20261113.mjs'
import psychology from '../lib/discovery/catalogue-data/neighborhood-psychology-2000-001-20261113.mjs'
import home from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-005-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { reportBusinessType } from '../scripts/catalogue-expansion-report.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { businessDirectionsAddress, businessMapsDirectionsUrl } from '../lib/business-directions.mjs'

const now = Date.parse('2026-11-13T20:00:00Z')
const row = id => SOFIA_CATALOGUE.find(value => value.id === id)

test('photography intake retains one real studio and its whole live EUR package, not duplicate or outside-city candidates', () => {
  assert.equal(photography.records.length, 1)
  const studio = row('sofia-vladimir-kadankov-tsaribrodska85')
  assert.equal(studio.address, 'София, ул. Царибродска 85')
  assert.equal(studio.booking.phone, '+359886106403')
  assert.equal(studio.services[0].price.amount, 150)
  assert.equal(studio.services[0].price.currency, 'EUR')
  assert.equal(studio.services[0].durationMin, 120)
  assert.match(studio.services[0].description, /20–30/)
  assert.equal(studio.coordinates.addressId, '48257')
  assert.equal(photography.records.some(item => item.id.includes('yordanka') || item.website.includes('fantasia')), false)
})

test('shared psychology practice is counted once and the private psychiatrist uses the actual owner address, not a third-party number', () => {
  assert.equal(psychology.records.length, 2)
  const shared = row('sofia-simeonova-psychotherapy-nansen29')
  assert.equal(shared.booking.phone, '+359877110741')
  assert.equal(shared.coordinates.addressId, '38730')
  assert.equal(reportBusinessType(shared), 'Психология и психотерапия')
  const doctor = row('sofia-valya-georgieva-kavarna8')
  assert.equal(doctor.address, 'София, ул. Каварна 8')
  assert.equal(doctor.coordinates, null)
  assert.equal(doctor.booking.phone, '+359888673843')
  assert.equal(doctor.openingHours, undefined)
  assert.equal(reportBusinessType(doctor), 'Психиатрия')
  assert.equal(new URL(businessMapsDirectionsUrl({ ...doctor, source: 'catalogue' })).searchParams.get('destination'), businessDirectionsAddress(doctor))
  for (const source of psychology.records) {
    const current = row(source.id)
    assert.ok(current.services.every(service => !service.price && !service.durationMin))
    assert.equal(assessPricingReview(current, reviews.find(review => review.id === current.id), now).state, 'service_reviewed')
  }
})

test('new education fees retain whole lesson units, ranges, VAT qualifications and conditional first-consultation pricing', () => {
  assert.equal(home.records.length, 14)
  const rodina = row('sofia-rodina-klokotnitsa29').services[0]
  assert.equal(rodina.price.amount, 40)
  assert.equal(rodina.price.maximum, 50)
  assert.equal(rodina.price.kind, 'range')
  assert.match(rodina.price.unit, /2 учебни часа.*без ДДС/)
  assert.equal(rodina.durationMin, undefined)
  assert.equal(row('sofia-sofia-math-pirotska79'), undefined, 'full first term and an undated second-term enquiry are not a confirmed paid intake')
  const first = row('sofia-nikolay-gyoshev-pozitano39').services[0]
  assert.equal(first.price.amount, 0)
  assert.match(first.price.unit, /само първата/)
  assert.match(first.description, /не означава безплатно последващо/)
})

test('all seventeen new businesses have inventory-bound receipts and activity-specific photos without neutral workspaces', () => {
  const sourceRows = [...photography.records, ...psychology.records, ...home.records]
  assert.equal(new Set(sourceRows.map(item => item.id)).size, 17)
  for (const source of sourceRows) {
    const current = row(source.id)
    assert.ok(['reviewed', 'service_reviewed'].includes(assessPricingReview(current, reviews.find(review => review.id === current.id), now).state), source.id)
    for (const service of current.services) {
      const photo = serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, current) }, { business: current })
      assert.equal(photo.type, 'photo', `${source.id}: ${service.name}`)
      assert.ok(['exact', 'activity'].includes(photo.photoMatch), `${source.id}: ${service.name}`)
      assert.ok(!photo.src.includes('appointment-workspace'))
    }
  }
})
