import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSearchText } from '../lib/discovery/categories.mjs'
import { approvedServicePhoto95To113, SERVICE_PHOTO_95_TO_113_IDS } from '../lib/service-photos-95-113.mjs'

function photo(name, category, business, artKind) {
  return approvedServicePhoto95To113({ name: normalizeSearchText(name), category, artKind, context: { business } })
}

const positives = [
  ['ipl-hair-removal', 'beauty', ['IPL епилация · ръце', 'Фотоепилация с IPL на предмишници', 'IPL hair removal · forearm', 'Фотоепилация']],
  ['hair-toning', 'hair', ['Тониране', 'Матиране · без сешоар', 'Матиране DIA или COLOR TOUCH · 1 боя', 'Hair toning']],
  ['hair-straightening', 'hair', ['Изправяне на коса с преса', 'Стайлинг с преса · добавка', 'Straightening with a flat iron']],
  ['hair-braiding', 'hair', ['Плитка · 1 бр.', 'Плитки', 'Сплитане на коса', 'Three-strand braiding']],
  ['dog-hand-stripping', 'pets', ['Триминг на твърдокосместо куче', 'Ръчен триминг', 'Dog hand-stripping']],
  ['nail-repair', 'nails', ['Лепене на счупен нокът · Мадлена Миткова', 'Поправка / лепене на счупен нокът', 'Възстановяване на счупен нокът', 'Split nail repair']],
  ['foot-reflexology', 'health', ['Рефлексология на ходилата', 'Масаж на стъпалата', 'Foot reflexology']],
  ['tennis-court-rental', 'fitness', ['Резервация на тенис корт', 'Тенис корт с резервация', 'Outdoor tennis court rental']],
  ['table-tennis', 'fitness', ['Тенис на маса с резервация', 'Тренировка по тенис на маса', 'Table tennis lesson']],
  ['carpet-cleaning', 'home_services', ['Пране на килими', 'Машинно пране на килим', 'Rug cleaning']],
  ['wheel-alignment', 'auto_repair', ['Реглаж на преден и заден мост', 'Регулиране на геометрията на колелата', 'Four-wheel alignment']],
  ['hair-camouflage', 'barber', ['Камуфлиране на коса', 'Камуфлаж на побеляла коса', 'Gray hair blending']],
  ['one-guard-buzz-cut', 'barber', ['Подстригване с един номер', 'Мъжко подстригване с машинка · един номер', 'Single-guard buzz cut']],
  ['father-and-son-haircuts', 'barber', ['Баща и син · дете до 10 години', 'Бръснарски пакет · баща и син', 'Father and son haircuts']],
  ['gel-natural-nail-overlay', 'nails', ['Гел върху естествен нокът', 'Укрепване с гел върху естествен нокът', 'Поставяне на гел върху естествен нокът + гел лак – експерт', 'Builder gel overlay on natural nails']],
  ['hand-hydration-treatment', 'nails', ['Хидратираща терапия за ръце', 'Moisturizing hand treatment']],
  ['foot-hydration-treatment', 'nails', ['Хидратираща СПА терапия за крака', 'Hydrating foot mask']],
  ['dental-crown', 'other', ['Циркониева коронка с прагова препарация', 'Поставяне на зъбна корона', 'Изцяло керамична корона', 'Porcelain dental crown']],
]

test('each approved photo in 95–113 matches the pictured work in Bulgarian and English', () => {
  assert.deepEqual(positives.map(([id]) => id), SERVICE_PHOTO_95_TO_113_IDS)
  for (const [id, category, names] of positives) for (const name of names) {
    assert.equal(photo(name, category), id, name)
  }
})

test('unrelated zones, alternatives, packages and lookalike techniques stay out', () => {
  const negatives = [
    ['IPL фотоепилация на лице', 'beauty'], ['IPL епилация · интимна зона', 'beauty'],
    ['IPL Anthelia · лице и шия', 'beauty'], ['IPL епилация · подмишници', 'beauty'],
    ['Лазерна епилация на ръце', 'beauty'],
    ['Матиране на коса и кичури', 'hair'], ['Тониране на брада', 'barber'],
    ['Стайлинг с маша/преса', 'hair'], ['Изправяне с преса и кератин', 'hair'],
    ['Плитка рибена кост', 'hair'], ['Сенегалски плитки с вграждане', 'hair'],
    ['Подстригване с машинка на куче', 'pets'], ['Триминг на котка', 'pets'],
    ['Триминг и къпане на куче', 'pets'],
    ['Поправка на счупен нокът с фибростъкло', 'nails'], ['Изграждане на счупен нокът', 'nails'],
    ['Ремонт на нокът на куче', 'pets'], ['Рефлексотерапия на ходила и длани', 'health'],
    ['Наем на тенис корт на закрито', 'fitness'], ['Урок по тенис на корт', 'fitness'],
    ['Терапия на тенис лакът', 'health'], ['Тенис или тенис на маса', 'fitness'],
    ['Пране на автомобилни стелки', 'car_wash'], ['Пране на килим и диван', 'home_services'],
    ['Реглаж на фарове', 'auto_repair'], ['Смяна на гуми', 'auto_repair'],
    ['Камуфлиране на коса и брада', 'barber'], ['Подстригване с един номер и оформяне на брада', 'barber'],
    ['Детско подстригване с един номер', 'barber'], ['Баща и син · боен спорт', 'fitness'],
    ['Гел или полигел върху естествени нокти', 'nails'], ['Премахване на гел върху естествен нокът', 'nails'],
    ['Хидратираща терапия за ръце и стъпала', 'nails'], ['Хидратираща парафинова терапия за крака', 'nails'],
    ['Циркониева корона върху имплант', 'other'], ['Временна зъбна корона', 'health'],
    ['Оформяне на вежди с конец', 'beauty'],
  ]
  for (const [name, category] of negatives) assert.equal(photo(name, category), null, name)
})

test('use the service category first, then business context for category-less profile rows', () => {
  assert.equal(photo('Плитка', 'hair', { category: 'nails' }), 'hair-braiding')
  assert.equal(photo('Баща и син', undefined, { businessCategory: 'barber' }), 'father-and-son-haircuts')
  assert.equal(photo('Циркониева корона', 'other', { category: 'health' }), 'dental-crown')
  assert.equal(photo('Триминг', 'other', { industry: 'pets' }), 'dog-hand-stripping')
  assert.equal(photo('Гел върху естествен нокът', 'nails', { industry: 'pets' }), null)
  assert.equal(photo('Тенис на маса', 'health'), null)
  assert.equal(photo('Камуфлиране на коса', 'home_services'), null)
})
