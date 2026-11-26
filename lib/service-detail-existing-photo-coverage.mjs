import { catalogueIdPattern } from './catalogue-photo-view.mjs'

// Detail-only reuse of visually reviewed scenes for the same activity. These
// are illustrations, never a partner's premises, work or customer. An asset
// selected here still has to pass the caller's hero/gallery/navigation check.
const shot = (file, bg, en) => Object.freeze({
  type: 'photo', source: 'illustrative', photoMatch: 'activity',
  src: '/service-photos/' + file + '.webp', srcSet: null,
  alt: Object.freeze({ bg: 'Примерна снимка: ' + bg, en: 'Illustrative photo: ' + en }),
})

const photography = {
  maternity: shot('sx-maternity-studio-photography-v1', 'портретна фотосесия за бременни', 'maternity portrait session'),
  newborn: shot('sx-newborn-studio-photo-v1', 'студийна фотосесия на новородено', 'newborn studio portrait session'),
  baptism: shot('sx-baptism-event-photography-v1', 'фотозаснемане на кръщене', 'photographing a christening'),
}
const auto = {
  paint: shot('sx-auto-bumper-spray-paint-v1', 'боядисване на автомобилен детайл', 'spray painting a vehicle body panel'),
  diagnostics: shot('go-detail-auto-computer-diagnostics-20261126-v2', 'компютърна диагностика на автомобил', 'computer diagnostics for a car'),
  oil: shot('go-detail-auto-engine-oil-service-20261126-v2', 'обслужване на двигателното масло и филтъра', 'engine oil and filter service'),
  inspection: shot('sx-auto-car-inspection-v1', 'оглед на автомобил в сервиз', 'vehicle inspection in a workshop'),
  engine: shot('sx-auto-engine-rebuild-v1', 'ремонт на двигател в сервиз', 'engine work in a repair shop'),
  ac: shot('go-detail-vehicle-ac-service-station-20261126-v2', 'обслужване на автоклиматик', 'vehicle air conditioning service'),
  interior: shot('sx-detail-complete-interior-v1', 'почистване на автомобилен интериор', 'car interior cleaning'),
  mobileInterior: shot('sx-detail-mobile-interior-v1', 'почистване на автомобилен интериор на адрес', 'mobile car interior cleaning'),
}
const grooming = {
  clipper: shot('go-detail-mens-haircut-20261126-v1', 'мъжко подстригване', 'men’s haircut'),
  child: shot('go-detail-child-haircut-20261126-v2', 'детско подстригване', 'child’s haircut'),
  beard: shot('go-detail-beard-shaping-20261126-v2', 'оформяне на брада', 'beard shaping'),
  haircutBeard: shot('haircut-beard-combo-v1', 'оформяне на коса и брада', 'haircut and beard grooming'),
  style: shot('sx-hair-styling-finish-v1', 'оформяне на прическа', 'hair styling'),
}
const nails = {
  manicure: shot('go-detail-classic-natural-manicure-20261126-v2', 'оформяне на ноктите при маникюр', 'shaping fingernails during a manicure'),
  pedicure: shot('go-detail-classic-unpolished-pedicure-20261126-v2', 'оформяне на ноктите при педикюр', 'shaping toenails during a pedicure'),
  gel: shot('go-detail-gel-manicure-20261126-v1', 'нанасяне на гел лак', 'applying gel polish'),
}
const consultation = {
  family: shot('family-counselling-v1', 'среща за семейна консултация', 'family counselling session'),
  dental: shot('go-detail-dental-exam-20261126-v1', 'стоматологичен преглед', 'dental examination'),
}

const native = new Map()
const register = (business, rows) => {
  for (const [id, name, photo] of rows) native.set(id, { business, name, photo })
}
// This closed list supplements the rights-checked partner manifest without
// overriding it. Reusing a label elsewhere (or editing an existing service)
// cannot pick up a partner's exact binding.
register('2ddceca9-1716-4ba2-bf63-2beaf0857afb', [
  ['ad048076-cdb2-462a-901f-147e4b7275e4', 'Боядисване на детайл', auto.paint],
])
register('6b57b901-acd8-494b-a992-2cec551b4b00', [
  ['46ff9c8d-2eba-4f07-a71c-714c01b55d59', 'Компютърна диагностика', auto.diagnostics],
  ['65f0c253-172b-4f56-b89c-0a9bfbcdd620', 'Смяна на масло и филтри', auto.oil],
  ['191082c0-a7f0-4f69-88e8-149ed69eac2c', 'Преглед и оценка за ремонт', auto.inspection],
  ['9b74aa5f-2735-4d41-8c8b-fae2422c8a6f', 'Ремонт двигатели', auto.engine],
  ['69f2e80d-6631-4fd4-8210-622272d68fcb', 'Зареждане и ремонт климатик', auto.ac],
])
register('f309d060-d96d-4237-8fa6-00db10b7ac3d', [
  ['45c81056-2276-4c2f-8884-81cf7fa9d711', 'Мъжко подстригване', grooming.clipper],
  ['5b66bee1-6034-4f22-b1dd-85616533544f', 'Оформяне на брада', grooming.beard],
  ['4b9e9d79-f390-4de2-8da8-f04ab74206a6', 'Детско подстригване', grooming.child],
])
register('09f6d770-cdd5-40d2-8e82-d7e2cc9e263a', [
  ['5d6acf61-79a2-4e9e-8682-8c3248863806', 'Детско подстригване за момчета', grooming.child],
  ['a8c0d8e1-3e86-4d07-ab5f-71439b79f8dd', 'Подстригване на коса и брада', grooming.haircutBeard],
  ['5916e4b4-a1d3-4fe0-8b08-d489b140ee93', 'Подстригване на коса', grooming.clipper],
  ['86a88b43-fa2f-4d34-b109-4a8b730f52cb', 'Оформяне на брада', grooming.beard],
])
register('450c5c2f-db41-476b-a21e-98cf5ee29194', [
  ['a41aaf3d-99b6-4f6f-b80a-d1863c672f1d', 'Педикюр', nails.pedicure],
  ['4622e6d9-af83-4e97-9b34-031c8c9355bf', 'Маникюр', nails.manicure],
])

// Activity, not package: counts of photos/hours, car body types or an exact
// published package label do not change the pictured action. Explicitly
// named combinations and materially different procedures are not guessed.
const packageSuffix = /^(?:\s+(?:[·–—-])\s+[^·\n]+)?$/u
const plainOrPackage = (name, phrase) => name.startsWith(phrase) && packageSuffix.test(name.slice(phrase.length))
const preciseNames = new Map()
const aliases = (category, names, photo) => {
  for (const name of names) preciseNames.set(category + '\0' + name, photo)
}
aliases('hair', ['пробна прическа', 'специална прическа'], grooming.style)
aliases('barber', ['мъжко подстригване', 'подстригване на коса'], grooming.clipper)
aliases('barber', ['оформяне на брада'], grooming.beard)
aliases('barber', ['детско подстригване', 'детско подстригване за момчета'], grooming.child)
aliases('nails', ['гел лак', 'гел лак без сваляне', 'маникюр с гел лак без сваляне', 'маникюр с гел лак · без декорация'], nails.gel)
aliases('auto_repair', ['ремонт на двигатели'], auto.engine)
aliases('auto_repair', ['смяна на масла и филтри — посещение с уговорка', 'смяна на масла и филтри с уговорено приемане'], auto.oil)
aliases('detailing', [
  'интериорен детайлинг', 'интериорен детайлинг — голям джип', 'cabin refresh · интериорен детайлинг',
  'интериорен детайлинг · лек автомобил', 'интериорен детайлинг · джип', 'интериорно почистване · пълен пакет',
], auto.interior)
aliases('detailing', ['мобилно вътрешно почистване на автомобил'], auto.mobileInterior)
aliases('other', [
  'семейна терапия', 'семейна консултация', 'пакет 4 семейни консултации',
  'семейна психотерапевтична сесия', 'семейна терапевтична сесия', 'първоначална семейна психологична консултация',
  'семейна консултация със симоника денева',
], consultation.family)
aliases('other', [
  'преглед за установяване на орален статус', 'дентален преглед със зъбен статус',
  'обстоен стоматологичен преглед и консултация', 'обстоен дентален преглед със зъбен статус',
  'дентален преглед със снемане на зъбен статус', 'първичен дентален преглед със снемане на статус',
  'първичен дентален преглед и статус',
], consultation.dental)

export function existingDetailServicePhoto(service, business) {
  if (typeof service?.name !== 'string' || !business) return null
  const supplied = service.name.normalize('NFC').trim()
  if (business.source === 'gorez' || business.source == null) {
    const association = native.get(service.id)
    return association && association.business === business.id && association.name === supplied && !service.category ? association.photo : null
  }
  if (business.source !== 'catalogue' || !catalogueIdPattern.test(business.id || '')) return null
  const category = service.category || business.businessCategory || business.category
  const name = supplied.replace(/\s+/gu, ' ').toLocaleLowerCase('bg')
  if (category === 'other') {
    if (business.id === 'sofia-dental-house-zdravka-asenova' && name === 'преглед и изготвяне на картон') return consultation.dental
    if (business.id === 'sofia-georgi-baldzhiev-buxton' && name === 'семейна сесия') return consultation.family
    const outdoor = /открито|навън|на адрес|у дома|outdoor|at home/u.test(name)
    if (!outdoor && plainOrPackage(name, 'фотосесия за бременни')) return photography.maternity
    if (!outdoor && plainOrPackage(name, 'фотосесия за новородено')) return photography.newborn
    if (plainOrPackage(name, 'фотозаснемане на кръщене') && !/двойн/u.test(name)) return photography.baptism
  }
  return preciseNames.get(category + '\0' + name) || null
}
