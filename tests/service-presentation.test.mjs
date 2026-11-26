import test from 'node:test'
import assert from 'node:assert/strict'
import { serviceDisplayFacts, servicePresentation } from '../lib/discovery/service-presentation.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBusinessDetails } from '../lib/discovery/business-details.mjs'

const audit = 'Текуща цена с отстъпка, валидна САМО при онлайн записване, проверена на 10.11.2026. Условията се потвърждават при записване; не е зачеркнатата стара цена.'

test('G Point review narration becomes one compact online-only discount condition in both locales', () => {
  const service = Object.freeze({ name: 'Лазерна епилация · Цяло лице · жени', price: 30, priceUnit: 'процедура', priceKind: 'fixed', description: audit })
  const before = JSON.stringify(service)
  assert.deepEqual(servicePresentation(service), { description: '', conditions: ['Отстъпка само онлайн'] })
  assert.deepEqual(servicePresentation(service, 'en'), { description: '', conditions: ['Online-only discount'] })
  assert.equal(JSON.stringify(service), before)
  assert.equal(service.priceUnit, 'процедура')
  assert.equal(service.price, 30)
})

test('all current G Point catalogue service descriptions are shortened without changing source facts', () => {
  const records = SOFIA_CATALOGUE.filter(row => row.id.startsWith('sofia-gpoint-'))
  const before = JSON.stringify(records)
  let services = 0
  for (const record of records) {
    for (const service of catalogueBusinessDetails(record, Date.parse('2026-11-22T12:00:00Z')).services) {
      if (!service.description.includes('Текуща цена с отстъпка')) continue
      const result = servicePresentation(service)
      assert.equal(result.description, '')
      assert.deepEqual(result.conditions, ['Отстъпка само онлайн'])
      assert.equal(service.priceUnit, 'процедура')
      assert.ok(service.priceSourceUrl.startsWith('https://gpoint.bg/'))
      services++
    }
  }
  assert.ok(services > 1000)
  assert.equal(JSON.stringify(records), before)
})

test('fresh G Point prices and discount badges cannot leak into a date before the source review', () => {
  const beforeReview = Date.parse('2026-11-11T00:00:00Z')
  let withheld = 0
  for (const record of SOFIA_CATALOGUE.filter(row => row.id.startsWith('sofia-gpoint-'))) {
    const promotions = record.services.filter(service => service.description?.includes('Текуща цена с отстъпка'))
    assert.ok(promotions.every(service => Date.parse(service.price?.checkedOn) > beforeReview))
    const promotionNames = new Set(promotions.map(service => service.name))
    for (const service of catalogueBusinessDetails(record, beforeReview).services) {
      assert.ok(!promotionNames.has(service.name), `${record.id}: ${service.name}`)
      assert.ok(!servicePresentation(service).conditions.includes('Отстъпка само онлайн'))
    }
    withheld += promotions.length
  }
  assert.equal(withheld, 1772)
})

test('a missing or expired displayed price does not advertise a current discount', () => {
  for (const price of [null, undefined, -1, Infinity, NaN]) {
    assert.deepEqual(servicePresentation({ description: audit, price }), { description: '', conditions: [] })
  }
  assert.deepEqual(servicePresentation({ description: audit, price: { amount: 30, unit: 'процедура' } }).conditions, ['Отстъпка само онлайн'])
})

test('extra substantive conditions survive around the exact audit paragraph', () => {
  const service = { price: 30, description: 'Не включва продукти. ' + audit + ' Валидно само при първо посещение.' }
  assert.deepEqual(servicePresentation(service), {
    description: 'Не включва продукти. Валидно само при първо посещение.',
    conditions: ['Отстъпка само онлайн'],
  })
})

test('routine branch/menu narration is short but keeps variant and branch qualifications', () => {
  for (const description of [
    'Меню за посочения салон; вариантът и специалистът се потвърждават при записване.',
    'Тарифа за този обект според услугата и специалиста. Точният вариант се уточнява при записване.',
  ]) assert.deepEqual(servicePresentation({ description }), { description: '', conditions: ['Според варианта и специалиста'] })
  assert.deepEqual(servicePresentation({ description: 'Тарифа само за посочения обект; при записване уточнете правилния салон.' }, 'en'), {
    description: '', conditions: ["This branch's tariff"],
  })
})

test('unknown wording, package terms, additional charges and substantive service descriptions remain unchanged', () => {
  for (const description of [
    'Публикувана обща цена за пакета, не зачеркнатата стойност на единични посещения. Валидност 2 месеца.',
    'Ориентировъчен труд без материали. Огледът струва 40 € и се приспада при приета оферта.',
    'Публикувана основна цена; при извънредно време заради хигиената е възможно увеличение до 20%.',
    'Сайтът все още публикува тарифата в BGN; потвърди актуалната цена и валута при записване. Няма извършена конверсия в EUR.',
    'Сумата е валидна до 17.11.2026 и включва една процедура.',
    'Лазерна епилация за жени; цена за една процедура на посочената зона.',
    'Процедура с пинсета; предварителната консултация се заплаща отделно.',
    'Цена при посочения специалист; не всички предлагат тази услуга.',
    'Текуща цена само при плащане на пакет.',
  ]) assert.deepEqual(servicePresentation({ price: 25, description }), { description, conditions: [] })
})

test('malformed input stays empty, never becomes text from an object or an invented price', () => {
  for (const service of [undefined, null, {}, { description: null }, { description: {} }, { description: 5 }]) {
    assert.deepEqual(servicePresentation(service), { description: '', conditions: [] })
  }
  assert.deepEqual(servicePresentation({ description: '  Услуга\nс  реално описание. ' }), { description: 'Услуга с реално описание.', conditions: [] })
})

test('compact public facts only remove a duplicate duration/scope or extract the distinct pass validity', () => {
  const name = 'Индивидуална йога практика — 60 минути'
  const facts = { name, price: 35.79, priceUnit: 'индивидуална практика, 60 минути', durationMin: 60,
    presentationEn: { name: 'Individual Yoga Practice — 60 minutes', unit: 'individual practice, 60 minutes' } }
  assert.deepEqual(serviceDisplayFacts(facts), { name, unit: '', durationMin: 0 })
  assert.deepEqual(serviceDisplayFacts(facts, 'en'), { name: facts.presentationEn.name, unit: '', durationMin: 0 })
  assert.deepEqual(serviceDisplayFacts({ ...facts, name: 'Практика 30–60 минути', priceUnit: 'до 60 минути на човек' }),
    { name: 'Практика 30–60 минути', unit: 'до 60 минути на човек', durationMin: 60 })
  assert.equal(serviceDisplayFacts({ ...facts, priceUnit: 'само за двама' }).unit, 'само за двама')
  assert.equal(serviceDisplayFacts({ ...facts, name: 'Индивидуален пилатес реформър – карта за 7 тренировки',
    priceUnit: 'карта за 7 тренировки в рамките на 2 месеца' }).unit, 'Валидна 2 месеца')
  assert.equal(serviceDisplayFacts({ ...facts, name: 'Индивидуална тренировка по пилатес на постелка · 1 човек',
    priceUnit: 'едно индивидуално посещение за 1 човек' }).unit, '')
})

test('only the detailed menu can remove a fully restated equivalent published price and duration in BG and EN', () => {
  const description = 'Предварително записване. Публикувана цена 35,79 € / 70 лв. за 60 минути; не включва материали.'
  const translated = 'Advance booking. Published price 35.79 € / 70 BGN for 60 minutes; materials are not included.'
  const service = Object.freeze({ name: 'Йога 60 минути', price: 35.79, currency: 'EUR', priceKind: 'fixed',
    description, presentationEn: { name: 'Yoga 60 minutes', description: translated } })
  const before = JSON.stringify(service)
  assert.equal(servicePresentation(service, 'bg').description, description)
  assert.equal(servicePresentation(service, 'en').description, translated)
  const menu = (row, locale) => servicePresentation(row, locale, { displayedTariff: serviceDisplayFacts(row, locale) }).description
  assert.equal(menu(service, 'bg'), 'Предварително записване. Не включва материали.')
  assert.equal(menu(service, 'en'), 'Advance booking. Materials are not included.')
  assert.equal(menu({ ...service, currency: 'BGN', price: 70 }, 'bg'), 'Предварително записване. Не включва материали.')
  assert.equal(menu({ ...service, description: 'Публикувана цена 35,79 € / 70 лв. за 60 минути. Не включва материали.' }, 'bg'), 'Не включва материали.')
  for (const row of [
    { ...service, price: 34.79 },
    { ...service, price: null },
    { ...service, priceKind: 'from' },
    { ...service, priceKind: 'range', priceMaximum: 60 },
    { ...service, name: 'Йога 45 минути' },
    { ...service, name: 'Йога от 30 до 60 минути' },
    { ...service, description: description.replace('70 лв.', '71 лв.') },
    { ...service, description: description.replace('35,79 €', '32,79 €') },
    { ...service, description: description.replace('35,79 €', '35,79 USD') },
    { ...service, description: description.replace('60 минути;', '60 минути само с ваучер;') },
    { ...service, description: description.replace('Публикувана цена', 'Допълнителна такса') },
  ]) assert.equal(menu(row, 'bg'), row.description)
  assert.equal(menu({ ...service, presentationEn: { ...service.presentationEn, description: translated.replace('70 BGN', '72 BGN') } }, 'en'), translated.replace('70 BGN', '72 BGN'))
  assert.equal(JSON.stringify(service), before)
})
