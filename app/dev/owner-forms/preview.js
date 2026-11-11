'use client'

import { useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { CatalogueImportReview } from '../../../components/catalogue-import-review'
import { PhotoPicker } from '../../../components/photo-picker'
import { OwnerManualBookingDialog } from '../../../components/owner-manual-booking-dialog'
import { WeeklyScheduleFields } from '../../../components/weekly-schedule-fields'
import { OpeningHoursEditor } from '../../../components/opening-hours-editor'

// Fictional local controls only. These IDs, source facts and slots must never
// enter the live catalogue, availability service, customer list or booking API.
export function ownerFormsFixture(locale = 'bg', now = DateTime.now()) {
  const en = locale === 'en'
  const business = { id: 'qa-owner-forms-fictional', slug: 'qa-owner-forms-no-booking', name: en ? 'FICTIONAL QA · Owner forms' : 'ИЗМИСЛЕН QA · Бизнес форми', timezone: 'Europe/Sofia', industry: 'beauty', booking_mode: 'gorez' }
  return {
    business,
    tomorrow: now.setZone(business.timezone).plus({ days: 1 }).toISODate(),
    services: [
      { id: 'qa-owner-ready', name: en ? 'QA · Haircut and beard trim with eyebrow shaping' : 'QA · Подстригване на коса и брада и оформяне на вежди', duration_min: 45, price: 35, currency: 'EUR' },
      { id: 'qa-owner-empty', name: en ? 'QA · Empty availability' : 'QA · Без свободни часове', duration_min: 30, price: 12, currency: 'EUR' },
      { id: 'qa-owner-retry', name: en ? 'QA · Technical error and retry' : 'QA · Техническа грешка и повторен опит', duration_min: 30, price: 5, currency: 'EUR' },
    ],
    staff: [{ id: 'qa-owner-staff-a', name: en ? 'QA specialist A' : 'QA специалист А' }, { id: 'qa-owner-staff-b', name: en ? 'QA specialist B' : 'QA специалист Б' }],
    schedule: Array.from({ length: 7 }, (_, index) => ({ weekday: index + 1, label: (en ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] : ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'])[index], enabled: index === 0 || index === 5, open: index === 0 ? '09:30' : '10:00', close: index === 0 ? '18:00' : index === 5 ? '14:00' : '16:00', breakEnabled: index === 0, breakStart: '12:00', breakEnd: '12:30' })),
    openingHours: Array.from({ length: 7 }, (_, index) => ({ weekday: index + 1, periods: index === 0 ? [{ open: '09:00', close: '12:00' }, { open: '13:00', close: '18:00' }] : index === 5 ? [{ open: '10:00', close: '14:00' }] : [] })),
    importDraft: {
      business: { id: 'qa-owner-import-fictional', name: en ? 'FICTIONAL QA · Source studio' : 'ИЗМИСЛЕН QA · Студио за импорт', address: en ? 'Fictional address · local QA only' : 'Измислен адрес · само локална проверка' },
      serviceLimit: 40,
      services: Array.from({ length: 40 }, (_, index) => ({ id: `qa-import-service-${index + 1}`, name: en ? `QA service ${index + 1} · individual treatment and consultation` : `QA услуга ${index + 1} · индивидуална процедура и консултация`, price: `${index + 10}.00`, duration_min: '30', catalogueHint: { priceLabel: `${index + 10},00 €`, requiresPriceConfirmation: false } })),
    },
  }
}

function waitForFixture(delayMs, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Aborted local preview', 'AbortError')); return }
    const aborted = () => { clearTimeout(timer); reject(new DOMException('Aborted local preview', 'AbortError')) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', aborted); resolve() }, delayMs)
    signal?.addEventListener('abort', aborted, { once: true })
  })
}

// This is deliberately NOT an availability algorithm. It only supplies two
// labelled, fictional QA slots to the real modal's explicit preview boundary.
export function createOwnerFormsPreviewLoader(fixture, { delayMs = 100 } = {}) {
  const failed = new Set()
  return async ({ business, serviceId, staffId, date, signal }) => {
    await waitForFixture(delayMs, signal)
    if (business.id !== fixture.business.id || !fixture.services.some(service => service.id === serviceId) || staffId && !fixture.staff.some(person => person.id === staffId)) throw Error('INVALID_LOCAL_QA_CONTEXT')
    if (date !== fixture.tomorrow || serviceId === 'qa-owner-empty') return { slots: [] }
    const key = JSON.stringify([serviceId, staffId, date])
    if (serviceId === 'qa-owner-retry' && !failed.has(key)) { failed.add(key); throw Error('FICTIONAL_QA_TECHNICAL_FAILURE') }
    const person = fixture.staff.find(row => row.id === staffId) || fixture.staff[0]
    const service = fixture.services.find(row => row.id === serviceId)
    return { slots: ['10:00', '11:30'].map(time => {
      const start = DateTime.fromISO(`${date}T${time}`, { zone: business.timezone }), end = start.plus({ minutes: service.duration_min })
      return { staffId: person.id, staffName: person.name, startsAt: start.toUTC().toISO(), endsAt: end.toUTC().toISO(), localTime: start.toFormat('HH:mm'), localEndTime: end.toFormat('HH:mm') }
    }) }
  }
}

export function OwnerFormsPreview({ locale = 'bg' }) {
  const en = locale === 'en'
  const fixture = useMemo(() => ownerFormsFixture(locale), [locale])
  const loader = useMemo(() => createOwnerFormsPreviewLoader(fixture), [fixture])
  const [importOpen, setImportOpen] = useState(false), [manualOpen, setManualOpen] = useState(false)
  const [files, setFiles] = useState([]), [importCount, setImportCount] = useState(null)
  const [schedule, setSchedule] = useState(fixture.schedule), [openingHours, setOpeningHours] = useState(fixture.openingHours)
  return <main className="booking-setup-preview business-onboarding" style={{ maxWidth: 880, marginInline: 'auto', padding: 20 }}>
    <h1>{en ? 'LOCAL QA · Business forms' : 'ЛОКАЛЕН QA · Бизнес форми'}</h1>
    <p role="note">{en ? 'All businesses, IDs, services and availability are fictional. No account, provider requests, real booking, uploads or notifications. The photo control only prepares local files. Creating bookings is disabled.' : 'Всички бизнеси, ID, услуги и часове са измислени. Без профил, външни заявки, реални резервации, качване или известия. Контролът за снимки обработва само локални файлове. Създаването на резервации е изключено.'}</p>
    <div className="settings-actions"><button type="button" className="primary-button" onClick={() => setManualOpen(true)}>+ {en ? 'New booking' : 'Нова резервация'}</button><button type="button" className="secondary-button" onClick={() => setImportOpen(true)}>{en ? 'Import services (40)' : 'Импорт на услуги (40)'}</button></div>
    <p>{en ? 'Booking preview opens on tomorrow in Europe/Sofia. Choose the empty or error service to check those states; the error service succeeds on retry.' : 'Прегледът за резервация се отваря за утре в Europe/Sofia. Избери услугата без часове или с грешка за проверка; услугата с грешка се зарежда при повторен опит.'}</p>
    {importCount !== null && <p role="status" data-owner-forms-import-count={importCount}>{en ? `QA only · ${importCount} services selected; no business was changed.` : `Само QA · избрани ${importCount} услуги; няма променен бизнес.`}</p>}
    <section className="setup-layout compact-business-setup" data-owner-forms-photo><div className="wizard-card"><div className="wizard-body"><div className="form-grid"><div className="field full"><PhotoPicker files={files} onChange={setFiles} locale={locale} required label={en ? 'Business photos *' : 'Снимки на бизнеса *'}/></div></div></div></div></section>
    <section className="setup-layout compact-business-setup" data-owner-forms-schedule>
      <section className="wizard-card" data-owner-forms-nativehours><div className="wizard-body"><h2>{en ? 'Fictional native weekly schedule' : 'Измислен седмичен график за GoRez'}</h2><WeeklyScheduleFields days={schedule} onChange={setSchedule} locale={locale}/></div></section>
      <section className="wizard-card" data-owner-forms-externalhours><div className="wizard-body"><h2>{en ? 'Fictional external opening hours' : 'Измислено публично работно време'}</h2><OpeningHoursEditor value={openingHours} onChange={setOpeningHours} locale={locale}/></div></section>
    </section>
    {importOpen && <CatalogueImportReview draft={fixture.importDraft} locale={locale} replace onCancel={() => setImportOpen(false)} onConfirm={indexes => { setImportCount(indexes.length); setImportOpen(false) }}/ >}
    {manualOpen && <OwnerManualBookingDialog business={fixture.business} locale={locale} services={fixture.services} staff={fixture.staff} initialDate={fixture.tomorrow} onClose={() => setManualOpen(false)} onCreated={() => { throw Error('LOCAL_QA_MUST_NOT_CREATE_BOOKING') }} preview previewAvailabilityLoader={loader}/ >}
  </main>
}
