import test from 'node:test'
import assert from 'node:assert/strict'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'
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
    for (const service of catalogueBusinessDetails(record, Date.parse('2026-11-11T00:00:00Z')).services) {
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
