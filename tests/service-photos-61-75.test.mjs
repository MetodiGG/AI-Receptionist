import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSearchText } from '../lib/discovery/categories.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedServicePhoto61To75, SERVICE_PHOTO_61_TO_75_IDS } from '../lib/service-photos-61-75.mjs'

const resolve = (name, category, context) => approvedServicePhoto61To75({ name: normalizeSearchText(name), category, context })

const cases = [
  ['home-deep-clean', 'home_services', ['Основно почистване на жилище', 'Почистване на дома на адрес', 'Еднократно почистване на апартамент до 50 м²', 'Стандартно основно почистване', 'Основно почистване / след наематели · до 45 м²', 'Deep home cleaning'], ['Почистване на апартамент след ремонт', 'Оглед за почистване на жилище', 'Основно почистване · офис', 'Профилактика и почистване на домашен климатик']],
  ['mattress-cleaning', 'home_services', ['Пране на единичен матрак · едностранно', 'Почистване на матрак у дома', 'Пране · Бебешки матрак · двулицев', 'Дълбоко почистване на матрак · 90/110×200 см', 'Wet mattress cleaning'], ['Сухо пране на матрак', 'Почистване на матрак · сухо', 'Пране на калъф на матрак', 'Локално премахване на петно от матрак', 'Дезинфекция на матрак']],
  ['window-cleaning', 'home_services', ['Почистване на прозорци на адрес', 'Миене на прозорци', 'Indoor window cleaning'], ['Почистване на прозорци · височинно', 'Миене на външни прозорци', 'Почистване на прозорци и щори', 'Почистване на фасада']],
  ['headlight-restoration', 'detailing', ['Полиране на фарове', 'Полиране на комплект фарове', 'Полиране на фарове · допълнителна услуга', 'Headlight lens restoration'], ['Машинно полиране на автомобил', 'Регулиране на фарове', 'Защитно фолио за фарове', 'Полиране на фарове и керамика', 'Полиране на фарове · фолио']],
  ['ceramic-car-coating', 'detailing', ['Керамично покритие', 'Перманентно керамично покритие', 'Керамично покритие на автомобил', 'Car ceramic coating'], ['Полиране и керамично покритие', 'Поддръжка на керамично покритие', 'Керамика за автомобилен салон', 'Керамично покритие · за фарове', 'Нано керамика за предно стъкло']],
  ['cat-grooming', 'pets', ['Разресване на котка', 'Разресване на подкосъм на котка', 'Котка · разресване', 'Груминг за дългокосмести котки · 4–8 кг', 'Цялостен груминг · дългокосместа котка', 'Cat brushing'], ['Груминг на кучета и котки', 'Къпане и разресване на котки', 'Груминг за късокосмести котки · до 4 кг', 'Котка · разресване и къпане', 'Котка · нокти']],
  ['pet-claw-trim', 'pets', ['Подрязване на нокти на куче', 'Куче · подрязване на нокти', 'Dog nail trimming'], ['Подрязване на нокти', 'Подрязване на нокти на куче · пилене и къпане', 'Котка · нокти', 'Гризач · нокти', 'Подрязване на нокти на кучета и котки', 'Dog nail grinding']],
  ['sports-massage', 'health', ['Спортен масаж', 'Спортен масаж · 80 минути', 'Спортно възстановяване и спортен масаж', 'Sports massage therapy'], ['Спортен масаж у дома', 'Спортен масаж · за гръб', 'Спортен масаж · за деца', 'Релаксиращ масаж', 'Sports massage · machine assisted']],
  ['speech-therapy', 'other', ['Логопедична терапия', 'Логопедична терапия · 2 посещения седмично', 'Логопедична терапия за деца', 'Child speech therapy'], ['Логопедична консултация', 'Логопедична диагностика', 'Онлайн логопедична терапия', 'Логопедична терапия · възрастни след инсулт', 'Логопедична терапия · на адрес']],
  ['psychology-consultation', 'other', ['Психологична консултация за възрастни', 'Индивидуална психологическа консултация', 'Клиничен психолог · вторична консултация', 'Consultation with a psychologist'], ['Детски психолог', 'Психологична консултация за деца и възрастни', 'Психологично консултиране · дете', 'Психологична консултация · семейства', 'Онлайн консултация с психолог', 'Психологична консултация / психотерапия на английски']],
  ['teeth-whitening', 'other', ['Клинично избелване', 'Кабинетно избелване на зъбите', 'Избелване на зъби', 'In-office teeth whitening'], ['Домашно избелване със шини', 'Лазерно избелване на зъбите', 'Избелваща терапия', 'Избелване на зъби · домашна система', 'Teeth whitening · laser']],
  ['guitar-lesson', 'education', ['Индивидуални уроци по китара', 'Китара с Ангел Демирев', 'Индивидуална китара · 4 урока', 'Acoustic guitar lesson'], ['Пробен урок по пиано, пеене или китара', 'Урок по китара или барабани', 'Урок по китара · електрическа', 'Уроци по китара · групово', 'Урок по китара · за деца']],
  ['vocal-lesson', 'education', ['Индивидуален урок по пеене', 'Пеене с Натаса Андреу · едно посещение седмично', 'Народно пеене · 2 посещения седмично', 'Vocal coaching'], ['Пеене в начинаеща група', 'Пеене · хорова репетиция', 'Урок по пеене · за деца', 'Пробен урок по музикален инструмент или пеене', 'Пеене / пиано / китара / солфеж · единичен урок']],
  ['ceramics-class', 'education', ['Индивидуален урок по грънчарство', 'Керамика и точарско колело', 'Керамика на колело за двойка', 'Pottery wheel workshop'], ['Клас по керамика за възрастни', 'Рожден ден с керамика', 'Рисуване на керамика', 'Керамика и точарско колело · за деца', 'Pottery class · hand-building']],
  ['car-aircon-service', 'auto_repair', ['Обслужване на автомобилен климатик', 'Диагностика и зареждане на автоклиматик на адрес', 'Зареждане с фреон R1234yf', 'Проверка за наличие на фреон', 'Automotive air conditioning recharge'], ['Смяна на радиатор на парното или климатика в купето', 'Профилактика и почистване на домашен климатик', 'Смяна на кондензатор на климатик', 'Фреон R134 · 100 грама']],
]

for (const [id, category, positives, negatives] of cases) {
  test(`${id}: matches only a service the photograph represents`, () => {
    for (const name of positives) assert.equal(resolve(name, category), id, name)
    for (const name of negatives) assert.equal(resolve(name, category), null, name)
  })
}

test('context distinguishes household, automotive, and human or animal services', () => {
  assert.equal(resolve('Основно почистване', 'detailing'), null)
  assert.equal(resolve('Керамично покритие', 'education'), null)
  assert.equal(resolve('Зареждане с фреон R134a', 'home_services'), null)
  assert.equal(resolve('Клинично избелване', 'beauty'), null)
  assert.equal(resolve('Подрязване на нокти на куче', 'nails'), null)
  assert.equal(resolve('Подрязване на нокти на куче', 'other', { artKind: 'pet-care' }), 'pet-claw-trim')
  assert.equal(resolve('Зареждане с фреон R134a', 'other', { business: { industry: 'auto' } }), 'car-aircon-service')
})

test('each approved photograph from 61–75 matches at least one reviewed Sofia service', () => {
  const now = Date.parse('2026-11-11T00:00:00Z')
  const hits = new Set()
  for (const record of SOFIA_CATALOGUE) {
    const business = approvedCatalogueRecord(record, now)
    if (!business) continue
    for (const service of business.services) {
      const id = resolve(service.name, service.category, { business })
      if (id) hits.add(id)
    }
  }
  assert.deepEqual([...hits].sort(), [...SERVICE_PHOTO_61_TO_75_IDS].sort())
})
