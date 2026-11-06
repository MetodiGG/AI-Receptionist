import test from 'node:test'
import assert from 'node:assert/strict'
import { createServiceEvidenceMatcher, serviceHasEvidence } from '../lib/discovery/service-lexicon.mjs'

test('a request-local prepared matcher preserves the complete service/qualifier evidence rules', () => {
  const queries = ['маникюр', 'оформяне', 'оформяне на вежди с конец', 'детски невролог', 'къдрава коса', 'котешки груминг', 'счетоводна консултация', 'данъчна консултация', 'пилатес реформър', 'масаж за бременни', 'математика', 'фотостудио под наем', 'ГТП', 'unknown specialty', null]
  const published = ['Маникюр с гел лак', 'Оформяне на брада', 'Оформяне на вежди с пинсета', 'Оформяне на вежди с конец', 'Преглед при невролог', 'Преглед при детски невролог', 'Подстригване на къдрава коса', 'Груминг за кучета', 'Котешки груминг', 'Счетоводна консултация', 'Данъчна и счетоводна консултация', 'Индивидуален пилатес реформър', 'Групов пилатес', 'Масаж за бременни', 'Лечебен масаж', 'Индивидуален урок по математика', 'Фотостудио под наем', 'Коледна фотосесия', 'Годишен технически преглед', 'Автомивка']
  for (const query of queries) {
    const matcher = createServiceEvidenceMatcher(query)
    for (const text of published) assert.equal(matcher(text), serviceHasEvidence(text, query), `${query}: ${text}`)
  }
  const eyebrows = createServiceEvidenceMatcher('оформяне на вежди с конец')
  const beard = createServiceEvidenceMatcher('оформяне на брада')
  assert.equal(eyebrows('Оформяне на брада'), false)
  assert.equal(beard('Оформяне на брада'), true, 'separate request matchers cannot overwrite each other')
})
