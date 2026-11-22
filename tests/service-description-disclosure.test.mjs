import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { serviceDescriptionDisclosure } from '../lib/discovery/service-description-disclosure.mjs'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { presentPublicService } from '../lib/locale/public-content-server.mjs'

const narrative = {
  bg: 'Оформяме косата с плавни линии и меко движение, като съчетаваме естествения цвят с фин завършек. Прическата подчертава индивидуалния стил и създава лекота, а внимателното измиване и подсушаване допълват усещането за свежа коса.',
  en: 'We shape the hair with flowing lines and soft movement, combining its natural colour with a refined finish. The hairstyle expresses individual style and creates a light feel, while careful washing and drying complete the fresh look.',
}
const folded = (source, hasConditions) => ({
  visible: [],
  more: source.trim(),
  hasConditions,
})

test('empty or malformed input is inert with no hidden-conditions warning', () => {
  for (const value of [null, undefined, '', '  ', 0, {}, []]) {
    assert.deepEqual(serviceDescriptionDisclosure(value), { visible: [], more: '', hasConditions: false })
  }
})

test('up to 180 trimmed characters stay wholly visible even when they contain conditions', () => {
  for (const value of ['Сешоар и цвят се избират отделно.', 'Materials are not included.', 'x'.repeat(180)]) {
    assert.deepEqual(serviceDescriptionDisclosure('  ' + value + '\n'), {
      visible: [value], more: '', hasConditions: false,
    })
  }
})

test('181 characters fold in their entirety without keeping a partial intro', () => {
  const source = 'x'.repeat(181)
  assert.deepEqual(serviceDescriptionDisclosure(source), folded(source, false))
})

for (const locale of ['bg', 'en']) test(locale + ': all long narrative is disclosed verbatim, without a false conditions warning', () => {
  assert.deepEqual(serviceDescriptionDisclosure(narrative[locale]), folded(narrative[locale], false))
})

for (const [locale, qualification] of [
  ['bg', 'Цената не включва материали; доплащането се уточнява предварително, а резервацията се потвърждава от бизнеса.'],
  ['en', 'The price excludes materials; additional charges are agreed in advance, and the business confirms the booking.'],
]) test(locale + ': the entire qualified description folds with a visible-warning flag', () => {
  const source = narrative[locale] + ' ' + qualification
  assert.deepEqual(serviceDescriptionDisclosure(source), folded(source, true))
})

test('decimals, abbreviations, initials, exclusion pairs and paragraphs are never split or rewritten', () => {
  const source = 'Цена 46.02 € / 90 лв. При д-р. Иванова се записва предварително.\n\nPrice 46.02 EUR with Dr. Smith at V.V.H. Includes the stated consultation; subsequent treatment and materials are charged separately.'
  assert.ok(source.length > 180)
  assert.deepEqual(serviceDescriptionDisclosure(source), folded(source, true))
})

test('unknown long prose folds completely without pretending to classify it as narrative', () => {
  const source = 'Авторът описва особеностите на подхода с внимание към контекста и запазва всички важни пояснения за човека, който ще чете този необичаен свободен текст. Обяснението продължава с неясно формулирани допълнения, които нямат предварително проверена структура.'
  const result = serviceDescriptionDisclosure(source)
  assert.deepEqual(result.visible, [])
  assert.equal(result.more, source)
  assert.equal(typeof result.hasConditions, 'boolean')
})

test('numbers, packages, VAT, materials, eligibility and confirmation flag the hidden full text', () => {
  const statements = [
    'Общо 4 посещения; валидност 30 дни, не цена за едно посещение.',
    'Минимум 40 € без ДДС, материали и транспорт.',
    'Само за пълнолетни; не се приемат агресивни кучета.',
    'За един зъб, а не цялата челюст.',
    'An indicative rate per hour; parts and VAT are charged separately.',
    'A package of 8 sessions, not a single visit; valid for 60 days.',
    'Only for adults and subject to prior confirmation.',
    'The price is not a guaranteed final quote; availability must be confirmed.',
    'Почистването се съобразява със състоянието на пациента.',
    'Cleaning for mild to moderate contamination.',
    'Children bring their own sketchbook and paints.',
    'For short, shoulder-length or longer hair.',
    'Labor for installing a washing machine with prepared connections.',
    'External and internal cleaning in normal pollution.',
    'Отказът се уточнява с клиента.',
  ]
  for (const statement of statements) {
    const source = narrative.en + '\n\n' + statement
    assert.deepEqual(serviceDescriptionDisclosure(source), folded(source, true), statement)
  }
})

test('actual Kosara BG and EN tariff descriptions fold intact with a conditions warning and no source mutation', () => {
  const row = SOFIA_CATALOGUE.find(value => value.id === 'sofia-kosara-style-knyaz-boris132')
  assert.ok(row)
  const before = JSON.stringify(row)
  for (const service of row.services) {
    const bgDescription = servicePresentation(service, 'bg').description
    assert.ok(bgDescription.length > 180)
    const bg = serviceDescriptionDisclosure(bgDescription)
    assert.deepEqual(bg, folded(bgDescription, true))
    assert.match(bg.more, /Велислава Крумова/)
    assert.match(bg.more, /отделно/)
    assert.match(bg.more, /крайната цена/)
    const translated = presentPublicService(service, row)
    const enDescription = servicePresentation(translated, 'en').description
    assert.ok(enDescription.length > 180)
    const en = serviceDescriptionDisclosure(enDescription)
    assert.deepEqual(en, folded(enDescription, true))
    assert.match(en.more, /separat|extra|additional/iu)
    assert.match(en.more, /price|tariff|fee/iu)
  }
  assert.equal(JSON.stringify(row), before)
})

test('only outer whitespace is trimmed; line breaks, tabs, ranges and all source punctuation remain exact', () => {
  const source = narrative.bg + '\n\n\tЦена: 12,50–18,00 €; без ДДС.\r\n\tЗа деца 6–12 г., не за възрастни.'
  const result = serviceDescriptionDisclosure('  \n' + source + '\t ')
  assert.deepEqual(result, folded(source, true))
  assert.equal([...result.visible, result.more].join(''), source)
})

test('condition detection is deterministic and conservative, not a semantic validation or destructive filter', () => {
  for (let index = 0; index < 8; index++) {
    assert.deepEqual(serviceDescriptionDisclosure(narrative.en), folded(narrative.en, false))
    const source = narrative.en + ' Photograph reference 2026.'
    assert.deepEqual(serviceDescriptionDisclosure(source), folded(source, true))
    assert.deepEqual(serviceDescriptionDisclosure(narrative.bg), folded(narrative.bg, false))
  }
})

test('helper stays pure and UI-only without API, truncation, sentence selection, mutation or translation machinery', async () => {
  const source = await readFile(new URL('../lib/discovery/service-description-disclosure.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /fetch\(|supabase|process\.env|node:fs|writeFile|\.slice\(0|substring\(|JSON\.parse|price\s*=|function sentences|clearlyNarrative|dependentStart|narrativeTerms/u)
  assert.match(source, /retain every long description verbatim/)
  assert.match(source, /hasConditions: isCritical\(source\)/)
})
