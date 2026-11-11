import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSearchText } from '../lib/discovery/categories.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { LATE_SERVICE_PHOTO_IDS, lateServicePhotoKind } from '../lib/service-photos-late.mjs'

const resolve = (name, category, context) => lateServicePhotoKind(normalizeSearchText(name), { category, ...context })

test('classic prep represents generic standalone nail services without implying a lacquer technique', () => {
  // Both approved photos depict filing natural nails, common to a plain service
  // and to conventional polish before its application. A named technique, gel,
  // medical care, treatment, or multiple services needs its own photo.
  for (const name of ['Маникюр', 'Класически маникюр', 'Маникюр с обикновен лак · Мадлена Миткова', 'Класически маникюр без гел', 'Manicure']) {
    assert.equal(resolve(name, 'nails'), 'classic-manicure', name)
  }
  for (const name of ['Педикюр', 'Класически педикюр без лак', 'Педикюр с обикновен лак', 'Класически мъжки педикюр', 'Classic pedicure without gel']) {
    assert.equal(resolve(name, 'nails'), 'classic-pedicure', name)
  }
  for (const name of ['Маникюр и педикюр', 'Маникюр · с гел лак', 'Класически маникюр · с шеллак', 'Педикюр с гел лак', 'MED педикюр', 'Терапевтичен педикюр', 'Маникюр · с парафин', 'Класически маникюр · с декорации', 'Сваляне на гел лак и маникюр', 'Педикюр за куче']) {
    assert.equal(resolve(name, 'nails'), null, name)
  }
  assert.equal(resolve('Маникюр', 'nails', { business: { industry: 'pets' } }), null)
  assert.equal(resolve('Педикюр', 'other', { artKind: 'pet-care' }), null)
})

const examples = [
  ['classic-shave', 'barber', ['Класическо бръснене', 'Класическо мокро бръснене', 'Кралско бръснене на брада', 'Straight razor shave'], ['Бръснене на глава', 'Гладко бръснене на брада / глава', 'Оформяне на брада', 'Класическо бръснене · с шейвър', 'Класическо бръснене · с машинка', 'Бръснене на лапи']],
  ['kids-haircut', 'hair', ['Детско подстригване', 'Детско подстригване · 6–12 г.', 'Детско подстригване до 7 години без измиване', 'Детско подстригване до 12 г. · Никол Петрова', 'Kids’ haircut'], ['Мъжко подстригване', 'Детско подстригване с машинка', 'Детско подстригване и боядисване', 'Подстригване на куче', 'Детско подстригване · за възрастни']],
  ['hair-color', 'hair', ['Боядисване на корени', 'Боядисване · корени', 'Farmavita боядисване · корени', 'Боядисване на корен, измиване и сешоар', 'Root touch-up'], ['Боядисване на корен/къса коса', 'Боядисване на корен + подстригване', 'Боядисване · дълга коса', 'Изрусяване на корени', 'Боядисване на корени и кичури']],
  ['waxing', 'beauty', ['Кола маска', 'Кола маска · половин крака', 'Кола маска на половин крака за жени', 'Кола маска крака мъже', 'Leg waxing'], ['Кола маска · горна устна', 'Кола маска · интимна зона', 'Кола маска цели ръце жени', 'Кола маска · цяло тяло', 'VIP комбо · коса, брада, вежди, кола маска уши/нос', 'Лазерна епилация · крака', 'Шугаринг · крака']],
  ['makeup', 'beauty', ['Професионален грим', 'Официален / вечерен грим · лек', 'Сватбен грим · в студиото', 'Бюти грим за фотосесия', 'Bridal makeup'], ['Арт грим · детайлен', 'Грим · арт', 'Грим · перманентен', 'Добавяне на мигли към грим', 'Премахване на стар перманентен грим и татуировки', 'Урок по грим']],
  ['brake-service', 'auto_repair', ['Смяна на накладки', 'Смяна на предни дискове и накладки', 'Смяна дискове + накладки предни', 'Смяна на задни накладки (дискови)', 'Смяна на задни накладки с електрическа ръчна спирачка', 'Brake pad replacement'], ['Смяна на задни накладки (барабанни)', 'Смяна на спирачна течност', 'Смяна на спирачни дискове', 'Смяна на спирачен маркуч', 'Боядисване на четири спирачни апарата']],
  ['veterinary-exam', 'other', ['Ветеринарен преглед', 'Стандартен ветеринарен преглед', 'Повторен ветеринарен преглед', 'Ветеринарен преглед на куче', 'Veterinary check-up for dogs'], ['Ветеринарен преглед на котка', 'Ветеринарен преглед · у дома', 'Ветеринарен преглед · ваксина', 'Ветеринарно посещение у дома · София', 'Почистване на зъбен камък от ветеринарен лекар', 'Специализиран ветеринарен преглед']],
  ['yoga-class', 'fitness', ['Йога', 'Йога практика с резервация', 'Йога клас · 55 минути', 'Запазено групово занятие по йога', 'Карта за йога · 3 посещения', 'Group yoga class'], ['Йога клас · младежи от 12 до 17,99 години', 'Индивидуална йога · двама', 'Частна йога практика', 'Карта йога или солна стая · 4 посещения', 'Йога / Cardio Workout · единично посещение', 'Терапевтична йога · единично посещение', 'Aerial yoga class']],
  ['electrical-repair', 'home_services', ['Електрически ремонт на адрес', 'Монтаж на електрически ключове и контакти', 'Нова електрическа точка', 'Откриване на електрически проблем', 'Посещение, електродиагностика и ремонт до 30 минути', 'Outlet repair'], ['Смяна на апартаментно електрическо табло', 'Монтаж на трифазен електромер', 'Пералня · Ремонт на електроника', 'Диагностика и ремонт на автомобилна електроника', 'Електротерапия']],
  ['dental-exam', 'other', ['Дентален преглед', 'Стоматологичен преглед за възрастни', 'Дентален преглед и план за лечение', 'Първичен дентален преглед · д-р Сашка Хаджиева', 'Преглед при зъболекар', 'Routine dental check-up'], ['Детски стоматологичен преглед', 'Дентален преглед · за деца', 'Дентален преглед · рентген', 'Лечение на кариес и стоматологична профилактика', 'Почистване на зъбен камък', 'Дентална консултация и лечение на кариес']],
]

for (const [id, category, positives, negatives] of examples) {
  test(`${id} uses the approved activity, not a similar name or another technique`, () => {
    for (const name of positives) assert.equal(resolve(name, category), id, name)
    for (const name of negatives) assert.equal(resolve(name, category), null, name)
  })
}

test('domain checks distinguish pet care, home electrical repair and automotive work', () => {
  assert.equal(resolve('Ветеринарен преглед', 'pets', { artKind: 'pet-care' }), 'veterinary-exam')
  assert.equal(resolve('Детско подстригване', 'pets'), null)
  assert.equal(resolve('Дентален преглед', 'pets'), null)
  assert.equal(resolve('Кола маска', 'car_wash'), null)
  assert.equal(resolve('Outlet repair', 'auto_repair'), null)
  assert.equal(resolve('Смяна на накладки', 'fitness'), null)
  assert.equal(resolve('Смяна на накладки', 'other', { business: { industry: 'auto' } }), 'brake-service')
})

test('every approved late photo has a matching example in the reviewed Sofia catalogue', () => {
  const now = Date.parse('2026-11-11T00:00:00Z')
  const matched = new Set()
  for (const record of SOFIA_CATALOGUE) {
    const business = approvedCatalogueRecord(record, now)
    if (!business) continue
    for (const service of business.services) {
      const kind = resolve(service.name, service.category, { business })
      if (kind) matched.add(kind)
    }
  }
  assert.deepEqual([...matched].sort(), [...LATE_SERVICE_PHOTO_IDS].sort())
})
