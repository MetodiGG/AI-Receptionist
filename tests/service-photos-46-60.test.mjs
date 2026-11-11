import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSearchText } from '../lib/discovery/categories.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { SERVICE_PHOTO_46_TO_60_IDS, approvedServicePhoto46To60 } from '../lib/service-photos-46-60.mjs'

const resolve = (name, category, extra) => approvedServicePhoto46To60({ name: normalizeSearchText(name), category, ...extra })
const cases = [
  ['full-hair-color', 'hair',
    ['Боядисване на коса', 'Боядисване на цялата коса', 'Боядисване · дълга коса', 'Майстор · боядисване на дълга коса', 'Боядисване с Balmain - Средна дължина', 'All-over hair colour'],
    ['Боядисване на корени', 'Боядисване на корен / дълга коса', 'Боядисване DIA · 1 боя', 'Боядисване на коса + балеаж', 'Боядисване на коса и брада', 'Мъжко боядисване на коса', 'Тониране на дълга коса']],
  ['formal-updo', 'hair',
    ['Официален кок · мастър фризьор', 'Официална прическа · кок', 'Прибрана прическа', 'Formal updo'],
    ['Официална прическа', 'Сватбена прическа · разпусната', 'Кок с плитки', 'Кок или къдрици', 'Прическа с екстеншъни']],
  ['hair-curling', 'hair',
    ['Стайлинг с маша · добавка', 'Прическа с маша', 'Къдрици с маша', 'Hair curling with a curling iron'],
    ['Къдрене', 'Мъжко къдрене', 'Студено къдрене', 'Стайлинг с маша / преса', 'Прическа с маша на екстеншъни', 'Hair curling', 'Cold perm']],
  ['hair-washing', 'hair',
    ['Измиване на коса', 'Измиване · дълга коса', 'Hair washing'],
    ['Измиване на коса и подстригване', 'Измиване · с кератинова терапия', 'Измиване и сешоар', 'Матиране и измиване', 'Миене на кола']],
  ['hair-highlights', 'hair',
    ['Кичури с фолио без сешоар', 'Кичури на фолио · дълга коса', 'Foil highlights'],
    ['Кичури', 'Кичури на шапка', 'Кичури с фолио или шапка', 'Кичури с фолио · балеаж', 'Поддръжка на кератинови кичури']],
  ['male-manicure', 'nails',
    ['Мъжки маникюр', 'Класически мъжки маникюр без лак', 'Маникюр за мъже', 'Men’s manicure without polish'],
    ['Маникюр', 'Мъжки маникюр и педикюр', 'Мъжки маникюр · с гел лак', 'Мъжки маникюр с класически лак', 'Мъжки маникюр и парафинова терапия']],
  ['medical-pedicure', 'nails',
    ['MED педикюр', 'Терапевтичен педикюр', 'Медицински педикюр без гел лак', 'Medical pedicure'],
    ['Педикюр', 'Медицински педикюр · впит нокът', 'Медицински педикюр + лазер', 'Медицински педикюр и маникюр', 'Medical pedicure for dogs']],
  ['nail-art', 'nails',
    ['Декорации на нокът', 'Декорация на 2 нокътя', 'Декорация на всички нокти', 'Рисувана декорация · сложна', 'Ръчно рисувани декорации', 'Hand-painted nail art'],
    ['Декорация със сухи цветя или 3D стикер', 'Декорации: стикери, печати', 'Декорация с брокат', 'Гел лак с декорации', 'Nail art · glitter', 'Декорации за педикюр']],
  ['nail-refill', 'nails',
    ['Ноктопластика · поддръжка 3–4 седмици', 'Поддръжка на ноктопластика', 'Поддръжка на изградени нокти · Елена', 'Поддръжка на гел и гел лак', 'Поддръжка с твърд гел', 'Поддръжка (корекция) — средно дълги нокти', 'Builder-gel infill'],
    ['Изграждане с гел', 'Сваляне на ноктопластика', 'Поддръжка на акригел', 'Поддръжка на екстеншъни', 'Поддръжка · къси нокти · френски или омбре', 'Поддръжка на гел · естествени нокти']],
  ['lash-lift', 'beauty',
    ['Ламиниране на мигли', 'Корейско ламиниране на мигли', 'Ламиниране и боядисване на мигли', 'Лифтинг на мигли без боядисване', 'Korean lash lift'],
    ['Ламиниране на мигли и вежди', 'Ламиниране на коса', 'Боядисване на мигли', 'Сваляне на мигли', 'Lash extensions']],
  ['brow-lamination', 'beauty',
    ['Ламиниране на вежди', 'Оформяне и ламиниране на вежди', 'Ламиниране на вежди + боядисване', 'Brow lamination'],
    ['Ламиниране на вежди и мигли', 'Ламиниране на вежди · с конец', 'Ламиниране на коса', 'Оформяне на вежди', 'Brow tint']],
  ['brow-tint', 'beauty',
    ['Боядисване на вежди', 'Оформяне и боядисване на вежди', 'Eyebrow tinting'],
    ['Боядисване на мигли', 'Боядисване на вежди с къна', 'Боядисване на вежди + оформяне с конец', 'Ламиниране на вежди + боядисване', 'Лазерно премахване на вежди']],
  ['microblading', 'beauty',
    ['Микроблейдинг', 'Микроблейдинг на вежди', 'Микроблейдинг · Десислава Илиева', 'Eyebrow microblading'],
    ['Лазерно премахване на микроблейдинг', 'Ретуш на микроблейдинг до 30–40 дни', 'Микроблейдинг с ретуш', 'Microblading · touch-up']],
  ['hydrafacial', 'beauty',
    ['HydraFacial', 'Хидратиращо водно почистване на лице', 'Аква пилинг на лице', 'Hydrodermabrasion facial'],
    ['Хидратираща терапия за лице', 'GUINOT HYDRACLEAN treatment', 'JetPeel Classic', 'HydraFacial + микронидлинг', 'HydraFacial за гръб']],
  ['chemical-peel', 'beauty',
    ['Химичен пилинг на лице', 'Химичен пилинг · акнеична кожа', 'BioRePeelCl3 · лице', 'Пилинг Mesopeel Jessner Pro', 'Facial chemical peel'],
    ['Химичен пилинг · околоочен контур', 'Карбонов пилинг', 'Ензимен пилинг', 'Пилинг Mesopeel Eyecon · околоочна зона', 'Химичен пилинг · гръб', 'BioRePeelCl3 · лице, шия и деколте', 'Микронидлинг с BioRePeel']],
]

for (const [id, category, positives, negatives] of cases) {
  test(`${id} matches the illustrated technique without claiming an unrelated variant`, () => {
    for (const name of positives) assert.equal(resolve(name, category), id, name)
    for (const name of negatives) assert.notEqual(resolve(name, category), id, name)
  })
}

test('the batch does not cross pet, automotive, sports, or unspecified service domains', () => {
  assert.equal(resolve('Мъжки маникюр', 'other', { context: { business: { industry: 'pets' } } }), null)
  assert.equal(resolve('Медицински педикюр', 'nails', { artKind: 'dog-grooming' }), null)
  assert.equal(resolve('Измиване', 'car_wash'), null)
  assert.equal(resolve('Кок', 'fitness'), null)
  assert.equal(resolve('Декорации', 'other'), null)
  assert.equal(resolve('Красота', 'beauty'), null)
})

test('all fifteen approved photos resolve for at least one reviewed Sofia catalogue service', () => {
  const now = Date.parse('2026-11-11T00:00:00Z')
  const found = new Set()
  for (const record of SOFIA_CATALOGUE) {
    const business = approvedCatalogueRecord(record, now)
    if (!business) continue
    for (const service of business.services) {
      const id = resolve(service.name, service.category, { context: business })
      if (id) found.add(id)
    }
  }
  assert.deepEqual([...found].sort(), [...SERVICE_PHOTO_46_TO_60_IDS].sort())
})
