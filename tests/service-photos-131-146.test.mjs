import assert from 'node:assert/strict'
import test from 'node:test'
import { approvedServicePhoto131To146, SERVICE_PHOTO_131_TO_146_IDS } from '../lib/service-photos-131-146.mjs'

const resolve = (name, category, description, business) =>
  approvedServicePhoto131To146({ name, context: { category, business, service: { description } } })

test('approved 131–146 photos have exact Bulgarian and English matches', () => {
  const entries = [
    ['dog-ear-cleaning', 'pets', 'Почистване на уши на куче', 'Canine ear cleaning'],
    ['water-heater-installation', 'home_services', 'Оглед и монтаж на домашен бойлер', 'Water heater installation'],
    ['brake-fluid-service', 'auto_repair', 'Смяна спирачна течност', 'Brake fluid flush'],
    ['car-radiator-replacement', 'auto_repair', 'Смяна на воден радиатор', 'Engine radiator replacement'],
    ['dog-paw-trim', 'pets', 'Подстригване на козина около лапите на кучето', 'Dog paw pad hair trimming'],
    ['car-interior-detailing', 'detailing', 'Интериорен детайлинг · лек автомобил', 'Car interior detailing'],
    ['endospheres-roller-massage', 'beauty', 'Endospheres · лице и шия · 12 процедури', 'Endospheres therapy'],
    ['french-manicure-regular', 'nails', 'Френски маникюр с обикновен лак · Мадлена Миткова', 'French manicure with regular nail polish'],
    ['french-pedicure-regular', 'nails', 'Френски педикюр с обикновен лак', 'French pedicure with regular polish'],
    ['head-shave-beard-trim', 'barber', 'Бръснене на глава + оформяне на брада', 'Head shave and beard trim'],
    ['brow-and-upper-lip-threading', 'beauty', 'Вежди и горна устна с конец', 'Eyebrow and upper lip threading'],
    ['music-lesson-choice', 'education', 'Пеене / пиано / китара / солфеж · единичен урок 30 минути', 'Piano, guitar, singing or solfege'],
    ['car-glass-chip-repair', 'auto_repair', 'Ремонт на пукнатина в челно стъкло', 'Windshield chip repair'],
    ['acupuncture', 'health', 'Акупунктура', 'Traditional acupuncture'],
    ['one-to-one-yoga', 'fitness', 'Индивидуална йога · един човек', 'One-to-one yoga session'],
    ['online-psychology-session', 'other', 'Онлайн психологична консултация / психотерапия', 'Online psychological counseling'],
  ]
  assert.deepEqual(entries.map(entry => entry[0]), [...SERVICE_PHOTO_131_TO_146_IDS])
  for (const [id, category, ...titles] of entries) for (const title of titles) assert.equal(resolve(title, category), id, title)
})

test('do not infer a different animal, treatment method, consultation format, or bundle', () => {
  const entries = [
    ['Почистване на уши', 'pets'], ['Почистване на уши на котка', 'pets'], ['Гризач · почистване на уши', 'pets'],
    ['Куче · очи и уши', 'pets'], ['Бръснене на лапи', 'pets'], ['Подрязване на нокти на куче', 'pets'],
    ['Монтаж на проточен бойлер', 'home_services'], ['Монтаж на бойлерно табло', 'home_services'],
    ['Смяна на спирачни дискове', 'auto_repair'], ['Доливане на спирачна течност', 'auto_repair'],
    ['Смяна на воден радиатор', 'home_services'], ['Смяна на радиатор на парното', 'auto_repair'],
    ['След наводнение · интериорен детайлинг · хечбек', 'detailing'], ['Прахосмукачка на салона', 'detailing'],
    ['Endospheres · консултация', 'beauty'], ['Ръчен антицелулитен масаж', 'beauty'],
    ['Френски маникюр с гел лак', 'nails'], ['Френски педикюр с гел лак', 'nails'], ['Френски маникюр / омбре', 'nails'],
    ['Бръснене на глава', 'barber'], ['Бръснене на глава + боядисване на брада', 'barber'], ['Подстригване и оформяне на брада', 'barber'],
    ['Оформяне на вежди с конец', 'beauty'], ['Горна устна с конец', 'beauty'], ['Вежди и горна устна с восък', 'beauty'],
    ['Урок по пиано', 'education'], ['Пеене / пиано / китара / солфеж · и барабани', 'education'],
    ['Смяна на челно стъкло', 'auto_repair'], ['Полиране на стъкло', 'detailing'],
    ['Сухо иглоубождане', 'health'], ['Акупунктура · електрическа', 'health'], ['Акупунктура · на ухо', 'health'],
    ['Индивидуална йога · двама', 'fitness'], ['Индивидуална йога · 2 души', 'fitness'], ['Йога за бременни', 'fitness'],
    ['Онлайн консултация', 'other'], ['Психологична консултация', 'other'], ['Онлайн психотерапия · семейна', 'other'],
  ]
  for (const [title, category] of entries) assert.equal(resolve(title, category), null, title)
  assert.equal(resolve('Вежди и горна устна с конец', 'beauty', 'Посочена е алтернатива с пинсета.'), null)
  assert.equal(resolve('Онлайн психотерапия', 'other', 'Провежда се по телефон.'), null)
  assert.equal(resolve('Свързване на бойлер', 'home_services', undefined, { name: 'Електротехник на адрес' }), null)
})

test('same-service evidence can disambiguate a generic title, independently of a business name', () => {
  assert.equal(resolve('Куче · почистване на уши', 'pets'), 'dog-ear-cleaning')
  assert.equal(resolve('Почистване на уши', 'pets', 'Услугата е за кучета.'), 'dog-ear-cleaning')
  assert.equal(resolve('Почистване на уши', 'pets', 'Услугата е за кучета и котки.'), null)
  assert.equal(resolve('Почистване на уши', 'pets', undefined, { name: 'Dog Grooming' }), null)
  assert.equal(resolve('Бръснене на лапи', 'pets', 'Подстригване на козина при кучета.'), 'dog-paw-trim')
  assert.equal(resolve('Свързване на бойлер', 'home_services', 'Към тръби за вода.', { name: 'Електротехник на адрес' }), 'water-heater-installation')
})
