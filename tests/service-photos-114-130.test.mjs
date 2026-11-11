import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSearchText } from '../lib/discovery/categories.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { SERVICE_PHOTO_114_TO_130_IDS, approvedServicePhoto114To130 } from '../lib/service-photos-114-130.mjs'

const resolve = (name, category, context) => approvedServicePhoto114To130({ name: normalizeSearchText(name), category, context })

const cases = [
  ['dental-extraction', 'other',
    ['Екстракция на еднокоренов зъб с упойка', 'Вадене на зъб', 'Екстракция на мъдрец', 'Routine tooth extraction'],
    ['Почистване на лице с екстракция', 'Екстракция на млечен зъб', 'Екстракция на ретиниран мъдрец', 'Tooth extraction consultation', 'Вадене на зъб на куче']],
  ['post-renovation-cleaning', 'home_services',
    ['Почистване на апартамент след ремонт', 'Планирано почистване след ремонт · до 45 м²', 'Почистване след ремонт на адрес', 'Post-renovation home cleaning'],
    ['Основно почистване на дом', 'Почистване на офиси след ремонт', 'Оглед за почистване след ремонт', 'Почистване след ремонт и извозване на отпадъци']],
  ['armchair-cleaning', 'home_services',
    ['Пране на фотьойл', 'Пране · Фотьойл', 'Мокро почистване на тапициран фотьойл', 'Upholstered armchair extraction cleaning'],
    ['Сухо пране на фотьойл', 'Пране на фотьойл с пара', 'Пране на фотьойл и диван', 'Почистване на кожен фотьойл']],
  ['manual-therapy', 'health',
    ['Мануална терапия', 'Физиотерапевтична и мануална терапия', 'Преглед и мануална манипулация', 'Individual manual therapy'],
    ['Мануално почистване на лице', 'Мануална терапия на гръбнак', 'Преглед, мануална манипулация и локална ВИ лазерна терапия', 'Online manual therapy']],
  ['cupping-therapy', 'health',
    ['Вендузотерапия', 'Суха вендузотерапия', 'Терапия с вакуумни вендузи', 'Dry cupping therapy'],
    ['Мокри вендузи', 'Вендузотерапия · с огън', 'Комплексен пакет · масаж, мокса и вендузи', 'Cupping therapy · at home']],
  ['car-exterior-hand-wash', 'car_wash',
    ['Ръчно измиване на автомобил на адрес', 'Външно измиване с гъба · лек автомобил', 'Ръчно външно измиване на джип', 'Exterior hand wash'],
    ['Външно измиване на автомобил', 'Безконтактно външно измиване', 'Ръчно измиване под налягане', 'Външно измиване с гъба · и полиране']],
  ['dog-full-grooming', 'pets',
    ['Пълен груминг за куче', 'Куче · цялостен груминг', 'Цялостен груминг · средно куче до 15 кг', 'Full dog grooming'],
    ['Цялостен груминг', 'Цялостен груминг · българско овчарско куче', 'Груминг на кучета и котки', 'Котка · цялостен груминг', 'Цялостен груминг за куче · без къпане']],
  ['kickboxing-training', 'fitness',
    ['Кикбокс · персонален треньор', 'Индивидуална тренировка по кикбокс', 'Kickboxing training'],
    ['Бокс', 'Персонално занятие по бокс или кикбокс', 'Кикбокс · спаринг', 'Кикбокс · за деца', 'Kickboxing class · remote']],
  ['martial-arts-aikido', 'fitness',
    ['Занятие по бойни изкуства на основата на айкидо · едно посещение', 'Групова тренировка по айкидо', 'Aikido class'],
    ['Джудо', 'Айкидо · тренировка с меч', 'Айкидо · за деца', 'Айкидо и карате']],
  ['formal-event-hairstyle', 'hair',
    ['Официална прическа', 'Пробна официална прическа', 'Официална прическа · Никол Петрова', 'Formal event hairstyle'],
    ['Официална прическа · кок', 'Официална прическа с плитка', 'Официална прическа · за деца', 'Подстригване и официална прическа']],
  ['hair-heat-styling', 'hair',
    ['Стайлинг с преса или маша', 'Стайлинг с маша / преса', 'Преса / маша без измиване · дълга коса', 'Heat styling'],
    ['Стайлинг с маша', 'Стайлинг с преса', 'Преса / маша без измиване · екстеншъни', 'Heat styling · keratin']],
  ['hair-perm', 'hair',
    ['Студено къдрене', 'Трайно къдрене на коса', 'Химическо къдрене', 'Hair perm'],
    ['Къдрене', 'Къдрене с маша', 'Трайно къдрене · на мигли', 'Perm · without chemicals · chemical free']],
  ['hair-extension-row', 'hair',
    ['Поставяне на един ред екстеншъни с клипс', 'Поставяне на 1 ред екстеншъни с щипки', 'Single-row clip-in hair extensions fitting'],
    ['Сешоар и един ред екстеншъни', 'Поставяне на един ред екстеншъни с капси', 'Сваляне на екстеншъни с клипс', 'Tape-in extensions fitting']],
  ['gel-manicure-with-removal', 'nails',
    ['Маникюр с гел лак със сваляне', 'Маникюр с гел лак, сваляне и изравняване', 'Маникюр с гел лак и сваляне на старо покритие', 'Gel polish manicure with removal'],
    ['Маникюр с гел лак без сваляне', 'Сваляне на гел лак без маникюр', 'Сваляне на гел с маникюр без лак', 'Сваляне на гел лак и цялостен маникюр', 'Педикюр с гел лак и сваляне']],
  ['oral-hygiene', 'other',
    ['Професионална орална хигиена', 'Почистване на зъбен камък · ултразвук', 'Цялостно почистване на зъбен камък', 'Professional teeth cleaning'],
    ['Почистване на зъбен камък от ветеринарен лекар', 'Клинична орална хигиена на дете', 'Почистване на зъбен камък и AirFlow', 'Почистване на зъбен камък и избелване']],
  ['deep-tissue-massage', 'health',
    ['Дълбокотъканен масаж', 'Дълбокотъканнен лечебен масаж на гръб', 'Дълбокотъканен масаж · 90 мин.', 'Deep-tissue massage for the shoulders'],
    ['Масаж на лице', 'Дълбокотъканен масаж · за крака', 'Дълбокотъканен масаж · вендузи', 'Deep tissue massage at home']],
  ['prenatal-massage', 'health',
    ['Масаж при бременност', 'Масаж за бременни жени', 'Пренатален масаж', 'Prenatal massage'],
    ['Масаж след раждане', 'Масаж за бременни · на корем', 'Масаж за бременни · лимфен', 'Prenatal massage for baby']],
]

for (const [id, category, positives, negatives] of cases) {
  test(`${id}: matches the activity without inventing a method`, () => {
    for (const name of positives) assert.equal(resolve(name, category), id, name)
    for (const name of negatives) assert.equal(resolve(name, category), null, name)
  })
}

test('domain prevents selecting a photo for a wrong venue or species', () => {
  assert.equal(resolve('Ръчно измиване на автомобил', 'home_services'), null)
  assert.equal(resolve('Ръчно измиване на автомобил', 'other', { business: { industry: 'auto' } }), 'car-exterior-hand-wash')
  assert.equal(resolve('Професионална орална хигиена', 'pets'), null)
  assert.equal(resolve('Пълен груминг за куче', 'beauty'), null)
  assert.equal(resolve('Почистване на апартамент след ремонт', 'detailing'), null)
})

test('all but the clip-in specific photo match reviewed Sofia services', () => {
  const now = Date.parse('2026-11-11T00:00:00Z')
  const hits = new Set()
  for (const record of SOFIA_CATALOGUE) {
    const business = approvedCatalogueRecord(record, now)
    for (const service of business?.services ?? []) {
      const id = resolve(service.name, service.category, { business, service })
      if (id) hits.add(id)
    }
  }
  const expected = SERVICE_PHOTO_114_TO_130_IDS.filter(id => id !== 'hair-extension-row')
  assert.deepEqual([...hits].sort(), [...expected].sort())
})
