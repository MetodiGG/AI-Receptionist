import test from 'node:test'
import assert from 'node:assert/strict'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { EARLY_SERVICE_PHOTO_IDS } from '../lib/service-photos-early.mjs'

const photo = (name, category, business) => serviceThumbnail({ name, category }, { business }).src

test('newly approved salon photos render for exact catalogue and profile services', () => {
  const cases = [
    ['Мъжко подстригване и стайлинг', 'barber', 'mens-haircut'],
    ['Балеаж · 1 доза', 'hair', 'hair-balayage'],
    ['Сешоар · дълга коса', 'hair', 'hair-blowdry'],
    ['Ноктопластика · изграждане', 'nails', 'nail-extension'],
    ['Сваляне на гел лак и оформяне', 'nails', 'nail-gel-removal'],
    ['Оформяне на вежди', 'beauty', 'brow-shaping'],
    ['Мигли косъм по косъм', 'beauty', 'lash-extensions'],
    ['Лазерна епилация · Подбедрици · жени', 'beauty', 'laser-hair-removal'],
    ['Оформяне на вежди с конец', 'barber', 'brow-threading'],
  ]
  assert.deepEqual(cases.map(item => item[2]), EARLY_SERVICE_PHOTO_IDS)
  for (const [name, category, id] of cases) assert.equal(photo(name, category), `/service-photos/${id}-v1.webp`, name)
})

test('eyebrow photos follow the actual named method, then the primary business type', () => {
  const resolve = (name, category, business, description) => serviceThumbnail({ name, category, description }, { business }).src
  const threading = '/service-photos/brow-threading-v1.webp'
  const tweezers = '/service-photos/brow-shaping-v1.webp'
  assert.equal(resolve('Оформяне на вежди', 'barber'), threading)
  assert.equal(resolve('Оформяне на вежди · специалист', 'beauty', { category: 'barber' }), threading)
  assert.equal(resolve('Оформяне на вежди', 'beauty', { businessCategory: 'barber', category: 'beauty' }), threading)
  assert.equal(resolve('Оформяне на вежди', undefined, { name: 'Zen Barbershop', industry: 'beauty' }), threading)
  assert.equal(resolve('Оформяне на вежди за мъже', 'beauty', { category: 'nails' }), tweezers)
  assert.equal(resolve('Почистване и оформяне на вежди', 'beauty'), tweezers)
  assert.equal(resolve('Оформяне на вежди с конец', 'beauty', { category: 'hair' }), threading)
  assert.equal(resolve('Eyebrow threading', 'beauty'), threading)
  assert.equal(resolve('Оформяне на вежди', 'beauty', { category: 'beauty' }, 'Работим с памучен конец.'), threading)
  assert.equal(resolve('Оформяне на вежди с пинсета', 'barber'), tweezers)
  assert.equal(resolve('Brow shaping with tweezers', 'barber'), tweezers)
})

test('eyebrow variants, bundles and conflicting techniques do not get a plain shaping photo', () => {
  const shaping = new Set(['/service-photos/brow-threading-v1.webp', '/service-photos/brow-shaping-v1.webp'])
  for (const name of [
    'Оформяне на вежди с восък', 'Оформяне на вежди с конец или пинсета', 'Оформяне на вежди без конец',
    'Оформяне на вежди и горна устна с конец', 'Подстригване и вежди с конец', 'Вежди', 'Боядисване на вежди',
    'Ламиниране на вежди', 'Микроблейдинг на вежди',
  ]) assert.equal(shaping.has(photo(name, 'barber')), false, name)
  assert.equal(shaping.has(photo('Оформяне на вежди с конец', 'pets')), false)
  const conflicting = serviceThumbnail({ name: 'Оформяне на вежди с конец', category: 'beauty', description: 'Само с пинсета.' })
  assert.equal(shaping.has(conflicting.src), false)
})

test('related procedures and technique mismatches do not acquire another service’s photo', () => {
  const variants = [
    ['Women’s haircut', 'hair', 'mens-haircut'], ['Боядисване и сешоар', 'hair', 'hair-blowdry'],
    ['Дамско или мъжко подстригване', 'hair', 'mens-haircut'], ['Мъжко подстригване с ножица', 'barber', 'mens-haircut'],
    ['Кичури с фолио и сешоар', 'hair', 'hair-blowdry'], ['Ламиниране Bioplex и сешоар', 'hair', 'hair-blowdry'],
    ['Ноктопластика · поддръжка 1–2 седмици', 'nails', 'nail-extension'],
    ['Сваляне на гел лак и маникюр', 'nails', 'nail-gel-removal'],
    ['Сваляне на чужд гел лак · крака', 'nails', 'nail-gel-removal'],
    ['Оформяне на вежди с конец', 'beauty', 'brow-shaping'], ['Ламиниране на мигли', 'beauty', 'lash-extensions'],
    ['Поставяне на мигли на долен клепач', 'beauty', 'lash-extensions'],
    ['Лазерна епилация · лице', 'beauty', 'laser-hair-removal'],
    ['Лазерна епилация · Гръб · мъже', 'beauty', 'laser-hair-removal'],
    ['Лазерна епилация · Бикини · жени', 'beauty', 'laser-hair-removal'],
    ['Лазерна епилация · Бедра · мъже', 'beauty', 'laser-hair-removal'],
    ['Лазерна епилация · Контур на чело · жени', 'beauty', 'laser-hair-removal'],
    ['Лазерна епилация · Стъпала · мъже', 'beauty', 'laser-hair-removal'],
    ['Лазерна епилация · Длани · мъже', 'beauty', 'laser-hair-removal'],
    ['IPL фотоепилация', 'beauty', 'laser-hair-removal'],
    ['Мъжко подстригване', 'pets', 'mens-haircut'],
  ]
  for (const [name, category, id] of variants) assert.notEqual(photo(name, category), `/service-photos/${id}-v1.webp`, name)
})
