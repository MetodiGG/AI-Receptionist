import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSearchText } from '../lib/discovery/categories.mjs'
import { MID_SERVICE_PHOTO_IDS, midServicePhotoKind } from '../lib/service-photos-mid.mjs'

const match = (name, category, extra) => midServicePhotoKind(normalizeSearchText(name), { category, ...extra })

const positives = {
  massage: [['Класически масаж — цяло тяло · 60 мин', 'beauty'], ['Класически масаж · гръб', 'health'], ['Swedish shoulder massage', 'other']],
  'auto-diagnostics': [['Компютърна диагностика на автомобил', 'auto_repair'], ['Мобилна автодиагностика на адрес', 'auto_repair'], ['OBD-II computer diagnostics', null, { business: { industry: 'auto' } }]],
  'oil-change': [['Смяна на масло и маслен филтър с нулиране на сервизния интервал (без консумативи)', 'auto_repair'], ['Смяна масло + всички филтри', 'auto_repair'], ['Engine oil change', 'other']],
  'interior-car-clean': [['Пране на целия салон', 'detailing'], ['Пране на текстилен автомобилен салон', 'car_wash'], ['Cloth car seat shampoo', null]],
  'math-lesson': [['Математика на адрес · 4 урока месечно', 'education'], ['Урок по алгебра', 'education'], ['Private geometry tutoring', 'other']],
  'pet-bath': [['Къпане и сушене на кучета', 'pets', { artKind: 'dog-grooming' }], ['Куче · къпане и разресване', 'pets'], ['Puppy bath and blow-dry', 'other']],
  plumbing: [['Планиран водопроводен ремонт на адрес', 'home_services'], ['монтаж на сифон на мивка', 'home_services'], ['отпушване / почистване на сифон на мивка', 'home_services'], ['Kitchen sink drain repair', 'other']],
  'dental-cleaning': [['Зъбен камък и полиране', 'other'], ['Почистване на зъбен камък · ултразвук', 'other'], ['Professional teeth cleaning', 'health']],
  boxing: [['Индивидуално занятие по бокс', 'fitness'], ['Бокс · персонален треньор', 'fitness'], ['Adult boxing lesson with a coach', 'other']],
  tennis: [['Индивидуален тенис', 'fitness'], ['Урок по тенис на корт', 'fitness'], ['Private tennis lessons', 'other']],
}

test('all ten approved photos match actual service wording in Bulgarian and English', () => {
  assert.deepEqual(MID_SERVICE_PHOTO_IDS, Object.keys(positives))
  for (const [kind, examples] of Object.entries(positives)) {
    for (const [name, category, extra] of examples) assert.equal(match(name, category, extra), kind, name)
  }
})

test('nearby services and specific but different activities do not reuse approved photos', () => {
  const negatives = [
    ['Масаж на ходила', 'nails'], ['Класически масаж лице и деколте с пилинг и маска', 'beauty'], ['Hot stone back massage', 'health'],
    ['Класически масаж за бременни', 'health'], ['Класически масаж за кучета', 'pets'], ['Sports shoulder massage', 'health'], ['Сегментарен масаж · яка, гръб или долни крайници', 'health'],
    ['Диагностика и ремонт на пералня у дома', 'home_services'], ['Диагностика на MAP сензор', 'auto_repair'], ['Диагностика и зареждане на автоклиматик на адрес', 'auto_repair'],
    ['Компютърна диагностика', 'other'], ['Диагностика на кожата', 'auto_repair'],
    ['Смяна на масло и филтър на автоматична скоростна кутия (без консумативи)', 'auto_repair'], ['Смяна на масло и филтър на Haldex', 'auto_repair'],
    ['Смяна на масло на раздатъчна кутия', 'auto_repair'], ['Gearbox oil change', 'auto_repair'], ['Transmission oil and filter change', 'auto_repair'],
    ['Интериорен и екстериорен детайлинг', 'detailing'], ['Фолиране на интериорни елементи', 'detailing'], ['Пране на диван', 'home_services'], ['Dry cleaning of car seats', 'detailing'],
    ['Математически тест', 'education'], ['Урок по физика и математика', 'education'], ['Online math tutoring', 'education'],
    ['Котка · къпане', 'pets'], ['Къпане и сушене · котка или куче до 10 кг', 'pets'], ['Къпане и подстригване на кучета', 'pets'], ['Подстригване на куче без къпане', 'pets'], ['Обучение за къпане и преповиване', 'health'],
    ['Оглед за ВиК и електроинсталации', 'home_services'], ['Пералня · Теч от пералня', 'home_services'], ['Отстраняване на теч от водомер', 'home_services'],
    ['Монтаж на ВиК за съдомиялна', 'home_services'], ['Виктория', 'home_services'], ['Почистване на зъбен камък от ветеринарен лекар', 'pets'],
    ['Почистване на зъбен камък · към цялостен груминг', 'pets'], ['Почистване на зъбен камък, с включен кюретаж на меките тъкани около всеки зъб', 'other'], ['Teeth whitening', 'health'], ['Професионално почистване на зъбни протези', 'health'],
    ['Индивидуално занятие по бокс и кикбокс', 'fitness'], ['Кикбокс · персонален треньор', 'fitness'], ['Почистване с карбокситерапия', 'beauty'], ['Cardio-boxing class', 'fitness'], ['Детска тренировка по бокс', 'fitness'],
    ['Резервация на тенис корт', 'fitness'], ['Тенис корт с резервация', 'fitness'], ['Тенис на маса с резервация', 'fitness'], ['Тренировка по тенис на маса', 'fitness'], ['Tennis elbow rehabilitation', 'health'], ['Table tennis lesson', 'fitness'],
  ]
  for (const [name, category] of negatives) assert.equal(match(name, category), null, name)
  for (const category of ['pets', 'auto_repair', 'beauty', 'fitness', 'health', 'education', 'home_services']) {
    assert.equal(match('Запази час', category), null, category)
  }
})
