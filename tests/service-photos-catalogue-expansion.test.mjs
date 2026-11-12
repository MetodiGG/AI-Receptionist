import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { generatedCatalogueServicePhotoKind as resolve, GENERATED_CATALOGUE_SERVICE_PHOTO_IDS } from '../lib/service-photos-catalogue-expansion.mjs'

const photo = (name, category, business = {}) => resolve({ name, category }, { category, ...business })
const positives = [
  ['Индивидуален урок по английски · 45 минути', 'education', 'language-lesson'],
  ['Индивидуален английски с native speaker · 60 минути', 'education', 'language-lesson'],
  ['Частен урок по немски език', 'education', 'language-lesson'],
  ['Private French lesson', 'education', 'language-lesson'],
  ['Индивидуален урок по цигулка · 50 минути', 'education', 'violin-lesson'],
  ['Урок по барабани', 'education', 'drums-lesson'],
  ['Private percussion lesson', 'education', 'drums-lesson'],
  ['Индивидуален урок по солфеж', 'education', 'music-theory-lesson'],
  ['Music theory lesson', 'education', 'music-theory-lesson'],
  ['Шофьорски курс категория B', 'education', 'driving-lesson'],
  ['Опреснително кормуване · пакет 10 учебни часа', 'education', 'driving-lesson'],
  ['Индивидуален урок по танци за възрастни · 60 минути', 'fitness', 'dance-lesson'],
  ['Резервирана пробна тренировка по карате', 'fitness', 'karate-training'],
  ['Бразилско джу джицу за начинаещи', 'fitness', 'bjj-training'],
  ['Brazilian jiu-jitsu session', 'fitness', 'bjj-training'],
  ['Индивидуална силова тренировка', 'fitness', 'strength-training'],
  ['Фотополимерна пломба · една повърхност', 'other', 'dental-filling'],
  ['Лечение на кариес · две повърхности', 'other', 'dental-filling'],
  ['Кореново лечение · еднокоренов зъб', 'other', 'dental-root-canal'],
  ['Консултация за зъбни импланти', 'other', 'dental-implant-consultation'],
  ['Ортодонтска консултация', 'other', 'orthodontic-consultation'],
  ['Детски стоматологичен преглед', 'other', 'child-dental-exam'],
  ['Психологическа консултация за двойки', 'other', 'couples-counselling'],
  ['Семейна психотерапия', 'other', 'family-counselling'],
  ['Детско-юношеска психологична консултация', 'other', 'child-psychology'],
  ['Фотозаснемане на кръщене', 'other', 'photography-session'],
  ['Фотосесия за новородено · 15 кадъра', 'other', 'photography-session'],
  ['Годишен технически преглед · лек автомобил M1', 'auto_repair', 'vehicle-technical-inspection'],
  ['ГТП · лек автомобил', 'auto_repair', 'vehicle-technical-inspection'],
  ['Годишен технически преглед · мотоциклет, категория L', 'auto_repair', 'motorcycle-inspection'],
  ['Първоначална проверка на газова/метанова уредба', 'auto_repair', 'vehicle-lpg-inspection'],
  ['Смяна на въздушен филтър', 'auto_repair', 'car-air-filter-service'],
  ['Смяна на горивен филтър', 'auto_repair', 'car-fuel-filter-service'],
  ['Ремонт на ходова част', 'auto_repair', 'suspension-repair'],
  ['Смяна на носач', 'auto_repair', 'suspension-repair'],
  ['Сваляне на мигли', 'beauty', 'lash-removal'],
  ['Диамантено микродермабразио', 'beauty', 'microdermabrasion'],
  ['Масаж на лице', 'beauty', 'facial-massage'],
  ['Парафинова терапия за ръце', 'nails', 'paraffin-hand-treatment'],
  ['Монтаж на пералня или съдомиялна', 'home_services', 'household-appliance-installation'],
  ['Боядисване на стени', 'home_services', 'wall-painting'],
  ['Профилактика на климатик 9000 BTU', 'home_services', 'home-aircon-service'],
  ['Пресотерапия', 'beauty', 'pressotherapy'],
  ['Гризач · цялостен груминг', 'pets', 'small-pet-grooming'],
  ['Разресване на морско свинче', 'pets', 'small-pet-grooming'],
  ['Масаж с горещи камъни', 'health', 'hot-stone-massage'],
  ['Почистване на лице с ултразвукова шпатула', 'beauty', 'facial-ultrasound'],
]

test('new generated scene families cover actual named activities, not source prices, equipment claims or availability', () => {
  for (const [name, category, id] of positives) assert.equal(photo(name, category), id, name)
  assert.equal(new Set(GENERATED_CATALOGUE_SERVICE_PHOTO_IDS).size, GENERATED_CATALOGUE_SERVICE_PHOTO_IDS.length)
  assert.equal(GENERATED_CATALOGUE_SERVICE_PHOTO_IDS.length, 35)
  assert.deepEqual([...new Set(positives.map(row => row[2]))].sort(), [...GENERATED_CATALOGUE_SERVICE_PHOTO_IDS].sort())
})

test('age, group, remote and activity restrictions are checked in the entire name, not lost after the metadata separator', () => {
  for (const suffix of ['8 г.', '8 год.', '8 год', '12–17 г.', '7-годишни']) assert.equal(photo(`Индивидуален урок по английски · ${suffix}`, 'education'), null, suffix)
  for (const name of ['Урок по цигулка или виола', 'Урок по барабани джембе', 'Private conga percussion lesson']) assert.equal(photo(name, 'education'), null, name)
  for (const name of ['Урок по английски за деца', 'Английски за 5–6-годишни', 'Индивидуален английски · 8-годишни', 'Индивидуален урок по английски · онлайн', 'Урок по английски · група', 'Урок по цигулка за деца', 'Групов урок по барабани', 'Индивидуален солфеж · по видео връзка', 'Урок по пиано и солфеж', 'Урок по китара и цигулка', 'Шофьорски курс категория A', 'Шофьорски курс категория C', 'Теория за шофьорски курс']) assert.equal(photo(name, 'education'), null, name)
  for (const name of ['Карате Шотокан за деца 6+', 'Карате и кикбокс', 'Групова тренировка по BJJ', 'Индивидуална тренировка по ММА', 'Индивидуална тренировка', 'Йога', 'Силова тренировка и кардио', 'Урок по народни танци', 'Урок по танци · двама души', 'Детски урок по танци']) assert.equal(photo(name, 'fitness'), null, name)
})

test('new dental treatment images never substitute for another procedure, age or an implant operation', () => {
  const business = { name: 'Offline dental practice', primaryType: 'dentist' }
  for (const name of ['Фотополимерна пломба на млечен зъб', 'Детска пломба', 'Обтурация на коренов канал', 'Пломба и зъбна корона', 'Консултация за пломба', 'Кореново лечение и корона', 'Кореново лечение на детски зъб', 'Поставяне на зъбен имплант', 'Хирургична консултация за имплант', 'Ортодонтско лечение', 'Корекция на брекети', 'Детска ортодонтска консултация', 'Преглед за деца и възрастни', 'Детско вадене на зъб', 'Детски преглед и почистване', 'Стоматологичен преглед', 'Почистване на зъбен камък']) assert.equal(photo(name, 'other', business), null, name)
  assert.equal(photo('Попълване на пломба на водомер', 'home_services'), null)
  assert.equal(photo('Фотополимерна пломба', 'other'), 'dental-filling', 'photopolymer never becomes a photography session')
  assert.equal(photo('Онлайн консултация за зъбни импланти', 'other'), null)
  assert.equal(photo('Оценка за фотополимерна пломба', 'other'), null)
})

test('couples, family and child counselling remain separate and special methods or assessment are not invented', () => {
  const business = { name: 'Offline psychology and psychotherapy practice' }
  assert.equal(photo('Семейна консултация', 'consulting', business), 'family-counselling')
  assert.equal(photo('Консултация за двойки', 'consulting', business), 'couples-counselling')
  for (const name of ['Индивидуална сесия', 'Семейна терапия · онлайн', 'Семейна консултация за двойки', 'Семейна консултация за родители', 'Психологическа консултация за родители', 'Детски психолог · тестове', 'Детска психиатрична консултация', 'Детска логопедична терапия', 'Групова психологическа терапия', 'EMDR терапия за двойки', 'Детска арт терапия', 'Психологична оценка на дете']) assert.equal(photo(name, 'other', business), null, name)
  assert.equal(photo('Семейна консултация за ипотека', 'consulting'), null, 'a family mortgage is not psychological counselling')
  assert.equal(photo('Семейна психологическа консултация без деца', 'other'), null, 'a child-present frame must not depict an explicitly adults-only visit')
})

test('vehicle classes, filters and systems never borrow a neighbouring automotive photo', () => {
  for (const name of ['ГТП · ремарке O1', 'Годишен технически преглед · камион', 'ГТП · автобус', 'Монтаж на газова уредба', 'Ремонт на газова уредба', 'Смяна на маслен филтър', 'Смяна на филтър на купе', 'Смяна на въздушен и горивен филтър', 'Смяна на горивен филтър и масло', 'Смяна на въздушен филтър на мотоциклет', 'Смяна на горивен филтър на камион', 'Ремонт на спирачно окачване', 'Ремонт на кормилна система', 'Диагностика на ходова част', 'Хирургичен водач', 'Смяна на задни барабани']) assert.equal(photo(name, 'auto_repair'), null, name)
  assert.equal(photo('Смяна на въздушен филтър на климатик', 'home_services'), null)
  assert.equal(photo('Проверка на газова инсталация', 'home_services'), null)
  assert.equal(photo('Барабанни накладки', 'auto_repair'), null, 'a brake drum is not a music lesson')
})

test('beauty pictures preserve the material, body area and technique rather than hiding service bundles', () => {
  for (const name of ['Пресотерапия на корем', 'Масаж с горещи камъни на крака', 'Консултация за микродермабразио', 'Курс по сваляне на мигли']) assert.equal(photo(name, 'beauty'), null, name)
  for (const name of ['Ламиниране на мигли', 'Сваляне на мигли и поставяне на нови мигли', 'Сваляне на грим и мигли', 'Водно дермабразио', 'Микродермабразио на гръб', 'Микродермабразио и химичен пилинг', 'Букален масаж на лице', 'Масаж на лице и скалп', 'Почистване и масаж на лице', 'Парафинова терапия за крака', 'Парафинова терапия', 'Маникюр и парафинова терапия за ръце', 'Пресотерапия за ръце', 'Ултразвукова диагностика на лице', 'HIFU лифтинг на лице', 'Ултразвукова кавитация на тяло', 'Масаж на лице с горещи камъни', 'Масаж с горещи камъни · двама']) assert.equal(photo(name, 'beauty'), null, name)
})

test('household activities do not become unrelated automotive, ceiling, repair or appliance scenes', () => {
  for (const name of ['Консултация за монтаж на пералня', 'Оглед за боядисване на стени', 'Оферта за профилактика на климатик']) assert.equal(photo(name, 'home_services'), null, name)
  for (const name of ['Монтаж на индустриална пералня', 'Почистване на промишлен климатик', 'Профилактика на касетъчен климатик', 'Почистване на външно тяло на климатик']) assert.equal(photo(name, 'home_services'), null, name)
  for (const name of ['Ремонт на пералня', 'Диагностика на пералня', 'Монтаж на газова фурна', 'Изграждане на изводи за пералня', 'Монтаж на климатик', 'Ремонт на климатик', 'Профилактика на автоклиматик', 'Боядисване на таван', 'Боядисване на врата', 'Боядисване на стени и тавани', 'Боядисване на автомобил', 'Основно почистване на дом']) assert.equal(photo(name, 'home_services'), null, name)
  assert.equal(photo('Боядисване на коса', 'hair'), null)
})

test('guinea-pig grooming never becomes dog, cat, rabbit, a different species or veterinary work', () => {
  for (const name of ['Груминг на куче', 'Груминг на котка', 'Груминг на заек', 'Груминг на хамстер', 'Груминг на плъх', 'Груминг на морско свинче и котка', 'Гризач · нокти', 'Гризач · къпане', 'Гризач · почистване на уши', 'Гризач · лечение', 'Почистване на уши', 'Груминг']) assert.equal(photo(name, 'pets'), null, name)
  assert.equal(photo('Фотополимерна пломба', 'pets'), null)
})

test('photography framing describes the operator, not a fabricated subject or unrelated photo-based procedure', () => {
  for (const name of ['Сватбена фотосесия', 'Фотосесия за новородени', 'Фотосесия за бременни', 'Family photoshoot', 'Product photography']) assert.equal(photo(name, 'other'), 'photography-session', name)
  for (const name of ['Фотополимерна пломба', 'Фототерапия на лице', 'Фотоепилация', 'Урок по фотография', 'Курс по фотография', 'Психологическа оценка с фотографии', 'Видеозаснемане']) assert.notEqual(photo(name, 'other'), 'photography-session', name)
  for (const name of ['Фотосесия и грим', 'Фотозаснемане и видеозаснемане', 'Консултация за фотосесия']) assert.equal(photo(name, 'other'), null, name)
  for (const name of ['Ретуш на фотография', 'Печат на фотография', 'Сканиране на фотография', 'Реставрация на фотография']) assert.equal(photo(name, 'other'), null, name)
})

test('unknown input, cross-domain text and caller objects remain untouched; the resolver has no remote or data mutation surface', async () => {
  for (const input of [null, undefined, {}, { name: 4 }, { name: '' }, { name: 'a'.repeat(1001) }, { name: '__proto__', category: 'constructor' }]) assert.equal(resolve(input), null)
  assert.equal(resolve({ name: 'Unknown future activity' }, null), null)
  const service = Object.freeze({ name: 'Смяна на въздушен филтър', category: 'auto_repair', price: Object.freeze({ amount: 25, currency: 'EUR' }) }), business = Object.freeze({ name: 'Offline test garage', category: 'auto_repair' })
  assert.equal(resolve(service, business), 'car-air-filter-service')
  assert.equal(service.price.amount, 25)
  for (const [name, category] of [['Урок по английски', 'auto_repair'], ['Урок по цигулка', 'pets'], ['Силова тренировка', 'education'], ['Диамантено микродермабразио', 'home_services'], ['Пресотерапия', 'auto_repair']]) assert.equal(photo(name, category), null)
  const source = await readFile(new URL('../lib/service-photos-catalogue-expansion.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /fetch\(|https?:|localStorage|supabase|SOFIA_CATALOGUE|price\s*:|duration_min\s*:/)
})
