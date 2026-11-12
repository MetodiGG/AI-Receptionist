import assert from 'node:assert/strict'
import test from 'node:test'
import { access, readFile } from 'node:fs/promises'
import { catalogueServicePhotoKind } from '../lib/service-photo-catalogue-matches.mjs'
import { APPROVED_SERVICE_PHOTO_IDS } from '../lib/service-photos.mjs'

const photo = (name, category, extra = {}) => catalogueServicePhotoKind({ name, category }, { category, ...extra })
const approved = new Set(APPROVED_SERVICE_PHOTO_IDS)
const positive = [
  ['Боядисване DIA · ½ боя', 'hair', 'full-hair-color'],
  ['Боядисване ILLUMINA · 1 боя', 'hair', 'full-hair-color'],
  ['Боядисване COLOR TOUCH · 1 боя', 'hair', 'full-hair-color'],
  ['Боя Q10 · дълга коса', 'hair', 'full-hair-color'],
  ['Гланциране · без сешоар', 'hair', 'hair-toning'],
  ['Специална прическа', 'hair', 'formal-event-hairstyle'],
  ['Пробна прическа · стилист', 'hair', 'formal-event-hairstyle'],
  ['Подстригване с машинка (1номер)', 'barber', 'one-guard-buzz-cut'],
  ['Подстригване · Алекс', 'barber', 'mens-haircut'],
  ['Коса и брада · Wessam', 'barber', 'haircut-beard-combo'],
  ['Бръснене на глава с бръснач', 'barber', 'head-shave'],
  ['Оформяне на дълга брада', 'barber', 'beard-trim'],
  ['Speedy маникюр', 'nails', 'classic-manicure'],
  ['Гел лак без сваляне', 'nails', 'gel-manicure'],
  ['Гел лак на крака', 'nails', 'gel-pedicure'],
  ['Сваляне на гел лак', 'nails', 'nail-gel-removal'],
  ['Водно дермабразио', 'beauty', 'hydrafacial'],
  ['Баланс на гума', 'auto_repair', 'tyre-change'],
  ['Външно измиване · лек автомобил', 'car_wash', 'car-exterior-hand-wash'],
  ['Интериорно почистване · пълен пакет', 'detailing', 'car-interior-detailing'],
  ['Керамика – 3 години', 'detailing', 'ceramic-car-coating'],
  ['Еднократно основно почистване', 'home_services', 'home-deep-clean'],
  ['Абонаментно почистване · 50 м² · два пъти седмично', 'home_services', 'home-deep-clean'],
  ['Почистване на стъкла до 3 м · едностранно', 'home_services', 'window-cleaning'],
  ['Двустранно пране на матрак', 'home_services', 'mattress-cleaning'],
  ['Музикален урок · 40 мин. · модул 2', 'education', 'music-lesson-choice'],
  ['Индивидуална психотерапевтична сесия', 'other', 'psychology-consultation'],
  ['Индивидуална психологическа сесия', 'other', 'psychology-consultation'],
  ['Психотерапия за възрастни', 'other', 'psychology-consultation'],
  ['Кинезитерапия', 'health', 'physiotherapy'],
  ['Пакет 5 кинезитерапевтични процедури', 'health', 'physiotherapy'],
  ['Антистрес и релакс масаж', 'health', 'massage'],
  ['Иглотерапия', 'health', 'acupuncture'],
]

test('wording, quantities and nonvisual catalogue qualifiers reuse the actual pictured activity', () => {
  for (const [name, category, id] of positive) assert.equal(photo(name, category), id, name)
})

test('only existing approved local photo assets are returned; no new media, service or price data', async () => {
  for (const id of new Set(positive.map(row => row[2]))) {
    assert.ok(approved.has(id), id)
    await access(new URL(`../public/service-photos/${id}-v1.webp`, import.meta.url))
  }
  const source = await readFile(new URL('../lib/service-photo-catalogue-matches.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /fetch\(|https?:|price\s*:|duration_min\s*:|SOFIA_CATALOGUE|localStorage/)
})

test('category context disambiguates a named activity but never chooses unrelated category-wide photos', () => {
  for (const category of ['other', 'pets', 'education', 'fitness', 'auto_repair', 'health']) assert.equal(photo('Подстригване', category), null, category)
  assert.equal(photo('Подстригване', 'barber'), 'mens-haircut')
  assert.equal(photo('Консултация', 'other'), null)
  assert.equal(photo('Индивидуална сесия', 'other'), null)
  assert.equal(photo('Индивидуална сесия', 'other', { name: 'Студио за психотерапия' }), 'psychology-consultation')
  assert.equal(photo('Избор на услуга', 'beauty'), null)
  assert.equal(photo('Първо посещение', 'health'), null)
})

test('human photos never substitute for dogs, cats, unnamed pets, species or breed-specific care', () => {
  for (const name of ['Подстригване', 'Къпане и подстригване на кучета', 'Груминг · Померан', 'Почистване на уши', 'Подрязване на нокти', 'Котка · педикюр', 'Гризач · подстригване']) assert.equal(photo(name, 'pets'), null, name)
  assert.equal(photo('Гел лак', 'beauty', { industry: 'pets' }), null)
  assert.equal(photo('Подстригване на куче', 'barber'), null)
})

test('barber bundles, scissors, colouring and eyebrow techniques never get the other-half image', () => {
  for (const name of ['Подстригване и оформяне на вежди', 'Коса, брада и вежди', 'ВИП комбо · коса, брада, вежди, уши и нос', 'Подстригване · с ножица', 'Мъжко подстригване с ножица', 'Коса и брада · боядисване', 'Бръснене на глава · шейвър', 'Оформяне на вежди · с бръснач', 'Оформяне на вежди с конец', 'Оформяне на вежди с пинсета', 'Боядисване на брада', 'Детско подстригване', 'Подстригване · за деца']) assert.equal(photo(name, 'barber'), null, name)
})

test('colour brands and quantities do not override roots, bleach, male clients or multiple activities', () => {
  for (const name of ['Боядисване DIA · корени', 'Боя Q10 · корени / къса коса', 'Боядисване COLOR TOUCH · мъжко', 'Боядисване ILLUMINA · кичури', 'Боядисване INOA · подстригване и сешоар', 'Боядисване DIA · обезцветяване', 'Специална прическа · плитки', 'Гланциране · подстригване', 'Мъжко къдрене', 'Кичури · ½ боя']) assert.equal(photo(name, 'hair'), null, name)
})

test('nails and beauty retain the actual material, tool, body-area and combined-service boundaries', () => {
  for (const name of ['Гел лак · с декорации', 'Гел лак · педикюр', 'Гел лак и изравняване с база', 'Гел лак · сваляне', 'Сваляне на ноктопластика', 'Сваляне на твърд гел', 'Сваляне на гел лак или ноктопластика', 'Speedy маникюр · френски', 'Гел лак на крака · със сваляне', 'Детски маникюр', 'Диамантено микродермабразио', 'Ламиниране на мигли и вежди']) assert.equal(photo(name, 'nails'), null, name)
})

test('adult one-to-one psychotherapy stays separate from families, children, assessments and special methods', () => {
  for (const name of ['Семейна терапия', 'Психологическа консултация за двойки', 'Детско-юношеска психотерапия', 'Психологическа сесия за тийнейджъри', 'Психологическа сесия · спортисти от 13 г.', 'EMDR терапия', 'Психодиагностика с тестове', 'Психиатрична консултация', 'Психотерапия и логопедична терапия', 'Индивидуална сесия · на адрес']) assert.equal(photo(name, 'other', { name: 'Център за психотерапия' }), null, name)
  assert.equal(photo('Индивидуална психотерапевтична сесия · онлайн', 'other'), 'online-psychology-session')
})

test('home cleaning and automotive aliases reject different surfaces, systems and service bundles', () => {
  for (const name of ['Основно почистване на климатик 9000 BTU', 'Основно почистване на фурна', 'Основно почистване на офис', 'Домашна помощница', 'Почистване на стъкла · височинно', 'Пране на матрак · дезинфекция', 'Почистване след ремонт']) assert.equal(photo(name, 'home_services'), null, name)
  for (const name of ['Външно измиване · безконтактно', 'Външно измиване и вътрешно почистване', 'Керамика · стъкла', 'Керамика · кожен салон', 'Интериорно почистване · озон', 'Баланс на гума · камион', 'Реглаж на гуми']) assert.equal(photo(name, 'auto_repair'), null, name)
})

test('unknown input and missing image families remain null instead of fabricated precision', () => {
  for (const service of [undefined, null, {}, { name: 3 }, { name: '  ' }]) assert.equal(catalogueServicePhotoKind(service), null)
  for (const [name, category] of [['Индивидуален английски', 'education'], ['Пломба', 'other'], ['Кореново лечение', 'other'], ['Пресотерапия', 'beauty'], ['Микродермабразио', 'beauty'], ['Годишен технически преглед', 'auto_repair'], ['Групова тренировка', 'fitness']]) assert.equal(photo(name, category), null, name)
})

test('car wash and coating aliases never generalize to another vehicle or component-only procedure', () => {
  for (const target of ['мотоциклет', 'велосипед', 'мотопед', 'скутер', 'камион', 'автобус', 'лодка', 'motorcycle', 'bicycle', 'scooter']) assert.equal(photo(`Външно измиване на ${target}`, 'car_wash'), null, target)
  for (const name of ['Външно почистване на фарове', 'Външно почистване на джанти', 'Керамично покритие на ауспух', 'Керамика · ауспух', 'Интериорно почистване на волан']) assert.equal(photo(name, 'detailing'), null, name)
})

test('a generic music-room photo does not substitute for named instruments, theory or group lessons', () => {
  for (const subject of ['ударни', 'перкусия', 'укулеле', 'тромпет', 'солфеж', 'виолончело', 'група', 'percussion', 'cello', 'group']) assert.equal(photo(`Музикален урок по ${subject}`, 'education'), null, subject)
  assert.equal(photo('Музикален урок за група', 'education'), null)
})

test('a talking-session image is not used for a specifically different therapeutic activity', () => {
  for (const method of ['арт терапия', 'арт-терапия', 'игротерапия', 'пясъчна терапия', 'психодрама', 'EMDR', 'хипноза', 'biofeedback', 'sandplay', 'play therapy']) assert.equal(photo(`Индивидуална сесия по ${method}`, 'other', { name: 'Психолог QA' }), null, method)
})
