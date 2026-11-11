import test from 'node:test'
import assert from 'node:assert/strict'
import { stat } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { APPROVED_SERVICE_PHOTO_IDS } from '../lib/service-photos.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const MAKEUP_SRC = '/service-photos/makeup-v1.webp'
const business = { id: 'makeup-business', name: 'Makeup Artist', industry: 'beauty' }
const service = { id: 'makeup-service', name: 'Професионален дневен или вечерен грим в салона', category: 'beauty' }
const resolve = (name, options = {}) => serviceThumbnail({ ...service, name }, { business, ...options })
const otherCatalogueActivities = new Set([
  'Концептуален грим за фотосесия', 'Фото грим с арт елементи', 'Арт грим · лек',
  'Арт грим · детайлен', 'Арт грим · editorial / high fashion', 'Арт грим със специални ефекти',
  'Добавяне на мигли към грим', 'Премахване на стар перманентен грим и татуировки',
  'Грим и почистване на вежди', 'Арт грим', 'Грим и прическа с маша',
  // Newly reviewed permanent techniques are not ordinary makeup application.
  // Never attach the conventional brush/application photo just to pass coverage.
  'Перманентен грим на очи · Инфралаш',
  'Перманентен грим на очи · класическа очна линия',
  'Перманентен грим на устни · контур с преливане',
  'Перманентен грим на устни · техника 3D',
  'Перманентен грим на устни · техника Микс',
])

test('ordinary makeup keeps the existing approved photo with occasion and delivery-location qualifiers', () => {
  for (const name of [
    service.name, 'Пробен грим в салона', 'Абитуриентски грим в салона', 'Грим за бал',
    'Грим за фотосесия', 'Професионален грим в салон', 'Абитуриентски грим в салон',
    'Сватбен грим в салон', 'Пробен грим в салон', 'Професионален грим на адрес в София',
    'Сватбен грим на адрес в София', 'Сватбен грим в студио', 'Вечерен и абитуриентски грим',
    'Професионален грим на клиентски адрес', 'Поставяне на грим', 'Нанасяне на грим',
    'Гримиране в студиото', 'Makeup application', 'Professional make-up application in the studio',
    'Bridal make up at the client’s home', '  ПРОБЕН   ГРИМ В САЛОНА  ',
  ]) {
    const thumbnail = resolve(name)
    assert.equal(thumbnail.src, MAKEUP_SRC, name)
    assert.equal(thumbnail.type, 'photo', name)
    assert.equal(thumbnail.source, 'illustrative', name)
  }
})

test('every current Sofia makeup-title service is reviewed, including all three Vessy Mineva application services', () => {
  const rows = SOFIA_CATALOGUE.flatMap(business => business.services
    .filter(service => /грим|make[ -]?up/iu.test(service.name))
    .map(service => ({ business, service })))
  assert.ok(rows.length > 0)
  const reviewedOtherActivities = new Set()
  for (const { business, service } of rows) {
    const thumbnail = serviceThumbnail(service, { business })
    if (otherCatalogueActivities.has(service.name)) {
      assert.notEqual(thumbnail.src, MAKEUP_SRC, `${business.name}: ${service.name}`)
      reviewedOtherActivities.add(service.name)
    } else {
      assert.equal(thumbnail.src, MAKEUP_SRC, `${business.name}: ${service.name}`)
      assert.equal(thumbnail.source, 'illustrative')
    }
  }
  assert.deepEqual([...reviewedOtherActivities].sort(), [...otherCatalogueActivities].sort())
  const vessy = rows.filter(({ business }) => business.id === 'sofia-vessy-mineva-manastirski')
  assert.deepEqual(vessy.map(({ service }) => service.name).sort(), [
    'Професионален дневен или вечерен грим в салона', 'Пробен грим в салона', 'Абитуриентски грим в салона',
  ].sort())
})

test('makeup application never becomes a default for beauty, permanent work, lessons, art, or bundles', () => {
  for (const name of [
    ...otherCatalogueActivities, 'Урок по грим', 'Курс по грим', 'Обучение по грим',
    'Перманентен грим на устни', 'Микроблейдинг', 'Permanent makeup', 'Makeup removal',
    'Makeup lesson', 'SFX makeup', 'Арт грим в салона', 'Пробен грим · детски',
    'Грим за фотосесия · със специални ефекти', 'Професионален грим в салона · и прическа',
    'Грим и поставяне на мигли', 'Поставяне на мигли', 'Маникюр', 'Педикюр',
    'Почистване на лице', 'Оформяне на вежди', 'Консултация', 'Услуга', '',
  ]) assert.notEqual(resolve(name).src, MAKEUP_SRC, name)
  for (const category of ['pets', 'auto_repair', 'car_wash', 'detailing']) {
    assert.notEqual(serviceThumbnail({ ...service, category }, { business: { industry: category } }).src, MAKEUP_SRC, category)
  }
  assert.notEqual(serviceThumbnail({ name: 'Нанасяне на грим за куче', category: 'pets' }).src, MAKEUP_SRC)
})

test('exact rights-cleared business photos retain priority and failures fall through safely', () => {
  const supplied = { src: '/api/business-media/450c5c2f-db41-476b-a21e-98cf5ee29194',
    businessId: business.id, serviceId: service.id, rightsCleared: true, businessProvided: true,
    alt: { bg: 'Грим от бизнеса', en: 'Makeup by the business' } }
  const first = serviceThumbnail(service, { business, trustedServiceImage: supplied })
  assert.equal(first.src, supplied.src)
  assert.equal(first.alt, supplied.alt.bg)
  const illustrative = serviceThumbnail(service, { business, trustedServiceImage: supplied, unavailableSources: [supplied.src] })
  assert.equal(illustrative.src, MAKEUP_SRC)
  const failed = serviceThumbnail(service, { business, trustedServiceImage: supplied, unavailableSources: [supplied.src, MAKEUP_SRC] })
  assert.equal(failed.type, 'icon')
  assert.equal(failed.src, null)
  assert.equal(failed.icon, 'spark')
  assert.match(failed.alt, /Символ.*не е снимка/u)
  for (const changed of [{ serviceId: 'other' }, { businessId: 'other' }, { rightsCleared: false }, { businessProvided: false }]) {
    assert.equal(serviceThumbnail(service, { business, trustedServiceImage: { ...supplied, ...changed } }).src, MAKEUP_SRC)
  }
  assert.equal(serviceThumbnail(service, { business: { ...business, photos: [supplied] } }).src, MAKEUP_SRC)
})

test('the reused local approved asset remains lightweight and honestly described in Bulgarian and English', async () => {
  assert.ok(APPROVED_SERVICE_PHOTO_IDS.includes('makeup'))
  assert.ok((await stat(new URL(`../public${MAKEUP_SRC}`, import.meta.url))).size < 30000)
  assert.match(resolve(service.name).alt, /Примерна снимка.*не показва работа на бизнеса/u)
  assert.match(resolve(service.name, { locale: 'en' }).alt, /Illustrative photo.*not the business's own work/u)
  const unavailable = resolve(service.name, { locale: 'en', unavailableSources: [MAKEUP_SRC] })
  assert.equal(unavailable.type, 'icon')
  assert.match(unavailable.alt, /Service symbol.*not a photo/u)
})
