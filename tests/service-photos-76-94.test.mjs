import test from 'node:test'
import assert from 'node:assert/strict'
import { approvedServicePhoto76To94, SERVICE_PHOTO_76_TO_94_IDS } from '../lib/service-photos-76-94.mjs'

function photo(name, category, description, business, artKind) {
  return approvedServicePhoto76To94({ name, category, artKind, context: { service: { description }, business } })
}

test('laser hair removal uses the exact shown area in BG and EN', () => {
  const examples = {
    'Лазерна епилация на лице': 'laser-face',
    'Лазерна епилация · Брадичка · мъже': 'laser-face',
    'Лазерна епилация · Цяло лице — 4 зони без шия · жени': 'laser-face',
    'Laser hair removal: forearms': 'laser-arms',
    'Лазерна епилация · Ръце от китка до лакът · жени': 'laser-arms',
    'Лазерно обезкосмяване · Мишници': 'laser-underarms',
    'Laser epilation: underarms': 'laser-underarms',
    'Лазерна епилация · 1/2 корем · жени': 'laser-torso',
    'Laser hair removal: upper back': 'laser-back',
    'Лазерна епилация · Шия · жени': 'laser-neck',
    'Laser hair removal: upper legs': 'laser-thighs',
  }
  for (const [name, id] of Object.entries(examples)) assert.equal(photo(name, 'beauty'), id, name)
})

test('sensitive, mixed and unpictured laser zones show equipment only, not an unrelated body area', () => {
  for (const name of [
    'Лазерна епилация · Интим цял · жени', 'Лазерна епилация · Слип · мъже',
    'Лазерна епилация Soprano Titanium · Ареоли · жени', 'Лазерна епилация · Цяло тяло',
    'Лазерна епилация Soprano Titanium · Гърди и корем · мъже', 'Лазерна епилация · Горна устна и брадичка',
    'Лазерна епилация · Лице и скалп', 'Лазерна епилация · Гръб и кръст', 'Laser hair removal: back and thighs',
    'Laser hair removal: 3 zones', 'Laser hair removal: neck and chest', 'Лазерна епилация · Бедра + Подбедрици',
    'Лазерна епилация · Половини ръце', 'Лазерна епилация · Пръсти на ръце', 'Лазерна епилация · Пръсти на краката',
    'Лазерна епилация · Коремна лента', 'Лазерна епилация · Врат', 'Лазерна епилация · Половин шия',
    'Лазерна епилация · Горна устна', 'Лазерна епилация · Кръст', 'Лазерна епилация · Бакенбарди', 'Лазерна епилация на вежди',
    'Laser hair removal: feet',
  ]) assert.equal(photo(name, 'beauty'), 'laser-equipment', name)
})

test('laser guardrails preserve existing leg and unzoned photos and reject unconfirmed procedures', () => {
  for (const name of [
    'Лазерна епилация', 'Лазерно обезкосмяване за жени', 'Лазерна епилация · Цели крака · жени',
    'Лазерна епилация · Крака - бедра, подбедрици · мъже', 'Лазерна епилация · Подбедрици · мъже',
    'Лазерна епилация · Пилонидална киста',
    'Laser Genesis · Цяло лице', 'Лазер · лице · жени', 'IPL епилация · лице', 'Лазерна епилация на лице за деца',
    'Лазерна епилация · Консултация за лице', 'Laser hair removal · patch test · face',
  ]) assert.equal(photo(name, 'beauty'), null, name)
  assert.equal(photo('Лазер · лице · жени', 'beauty', 'Лазерна епилация на посочената зона.'), 'laser-face')
  assert.equal(photo('Лазер · лице', 'beauty', 'Лазерна епилация или IPL.'), null)
  assert.equal(photo('Лазерна епилация · лице', 'pets'), null)
})

test('each later approved photo maps a real and specific service', () => {
  const examples = [
    ['Комбо (подстригване + оформяне на брада)', 'barber', 'haircut-beard-combo'],
    ['Мъжко подстригване - Комбо с брада', 'hair', 'haircut-beard-combo'],
    ['Подстригване и брада · Кристиан', 'barber', 'haircut-beard-combo'],
    ['Бръснене на глава с шейвър', 'barber', 'head-shave'],
    ['Маникюр с обикновен лак · Мадлена Миткова', 'nails', 'regular-nail-polish'],
    ['Частичен педикюр с лак', 'nails', 'regular-toenail-polish'],
    ['Pedicure with conventional polish', 'nails', 'regular-toenail-polish'],
    ['Микронидлинг · долна част на лице', 'beauty', 'microneedling'],
    ['Дермапен', 'beauty', 'microneedling'],
    ['Класически лечебен масаж · една функционална зона', 'health', 'therapeutic-massage'],
    ['Лечебен масаж — една зона', 'beauty', 'therapeutic-massage'],
    ['Вътрешно почистване · лек автомобил', 'car_wash', 'car-interior-vacuum'],
    ['Затъмняване на задните стъкла', 'detailing', 'vehicle-window-tint'],
    ['Правна консултация с адвокат', 'consulting', 'legal-consultation'],
    ['Радиален и Фокусиращ Шокуейв', 'health', 'shockwave-therapy'],
    ['Ударно-вълнова терапия', 'health', 'shockwave-therapy'],
    ['Почистване на DPF/FAP филтри', 'auto_repair', 'vehicle-dpf-clean'],
  ]
  for (const [name, category, id] of examples) assert.equal(photo(name, category), id, name)
  assert.equal(new Set(SERVICE_PHOTO_76_TO_94_IDS).size, 19)
})

test('do not infer new approved photos for different modalities, procedures or combo services', () => {
  const examples = [
    ['Подстригване, брада и вежди', 'barber'], ['Бръснене на глава + оформяне на брада', 'barber'],
    ['Бръснене на глава с бръснач', 'barber'], ['Бръснене на лице', 'barber'],
    ['Френски педикюр с обикновен лак', 'nails'], ['Маникюр с гел лак', 'nails'], ['Маникюр без лак', 'nails'],
    ['Педикюр с обикновен лак · за куче', 'nails'], ['Педикюр с обикновен лак', 'pets'],
    ['SQT биомикронидлинг', 'beauty'], ['Микронидлинг · устни', 'beauty'], ['Микронидлинг с BioRePeel', 'beauty'],
    ['Микронидлинг · лице и шия', 'beauty'], ['Лечебен масаж у дома', 'health'], ['Лечебен масаж · цяло тяло', 'health'],
    ['Вътрешно почистване · пране на салон', 'car_wash'], ['Прахосмукачка на салона', 'home_services'],
    ['Затъмняване на стъкла', 'home_services'], ['Затъмняване на челно стъкло', 'detailing'],
    ['Затъмняване на стъкла · премахване на фолио', 'detailing'], ['Онлайн правна консултация', 'consulting'],
    ['Правна консултация в онлайн чат', 'consulting'], ['Shockwave - Цели бедра', 'health'],
    ['Регенерация на DPF/FAP филтри', 'auto_repair'], ['Почистване на DPF филтър без демонтаж', 'auto_repair'],
  ]
  for (const [name, category] of examples) assert.equal(photo(name, category), null, name)
  assert.equal(photo('Вътрешно почистване на автомобил', 'detailing', 'Почистване с пара'), null)
  assert.equal(photo('Правна консултация', 'consulting', 'Разговор по телефон'), null)
})
