import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DateTime } from 'luxon'
import { bookingFilmDates, filmPhaseAt, FILM_COPY, FILM_CYCLE_MS, FILM_PHASE_MS, FILM_PHASES } from '../lib/booking-film.mjs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('booking film has five equal scenes in one repeating ten-second cycle', () => {
  assert.equal(FILM_CYCLE_MS, 10000)
  assert.equal(FILM_PHASE_MS, 2000)
  assert.deepEqual(FILM_PHASES, ['service', 'time', 'details', 'confirmation', 'slogan'])
  for (let loop = 0; loop < 3; loop++) {
    FILM_PHASES.forEach((phase, index) => {
      assert.equal(filmPhaseAt(loop * 10000 + index * 2000), phase)
      assert.equal(filmPhaseAt(loop * 10000 + index * 2000 + 1999), phase)
    })
  }
  assert.equal(filmPhaseAt(-1), 'slogan')
  assert.equal(filmPhaseAt(10000), 'service')
})

test('film copy is complete in BG and EN, including the requested final slogan', () => {
  assert.deepEqual(Object.keys(FILM_COPY.bg), Object.keys(FILM_COPY.en))
  assert.deepEqual(FILM_COPY.bg.slogan, ['Бързо.', 'Лесно.', 'Удобно.'])
  assert.deepEqual(FILM_COPY.en.slogan, ['Quick.', 'Easy.', 'Convenient.'])
  assert.doesNotMatch(JSON.stringify(FILM_COPY.en), /[А-Яа-я]/)
  for (const copy of Object.values(FILM_COPY)) {
    assert.equal(copy.services.length, 3)
    assert.ok(copy.pauseLabel && copy.resumeLabel && copy.reduced)
    assert.match(copy.caption, /не създава резервация|does not create a reservation/)
  }
})

test('film dates start tomorrow in Sofia and cross month/year boundaries correctly', () => {
  const dates = bookingFilmDates('bg', '2026-12-31T22:30:00Z')
  assert.deepEqual(dates.map(day => day.key), ['2027-01-02', '2027-01-03', '2027-01-04', '2027-01-05', '2027-01-06'])
  assert.equal(dates[0].day, 2)
  assert.equal(dates[0].label, '2 януари')
  assert.equal(dates[0].month, 'яну.')
  assert.equal(dates[0].monthName, 'януари')
  assert.equal(bookingFilmDates('en', '2026-12-31T22:30:00Z')[0].label, '2 January')
})

test('film dates stay consecutive across the Bulgarian DST change', () => {
  const dates = bookingFilmDates('en', DateTime.fromISO('2026-10-23T23:30:00Z'))
  assert.deepEqual(dates.map(day => day.key), ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'])
  assert.deepEqual(bookingFilmDates('bg', 'invalid'), [])
})

test('homepage replaces AI photos and interactive fake bookings without changing real directory controls', () => {
  const film = read('components/booking-story.js'), home = read('components/home-page.js')
  assert.doesNotMatch(film, /next\/image|gorez-salon|gorez-barber|gorez-garage|INTERACTIVE EXAMPLE|ИНТЕРАКТИВЕН ПРИМЕР|onExplore/)
  assert.doesNotMatch(film, /\bfetch\s*\(|supabase|trackProductEvent|createBooking|setConfirmed/)
  assert.equal((film.match(/<button /g) || []).length, 1, 'only the real playback control is interactive')
  assert.doesNotMatch(film, /<input|<form|<a\s/)
  assert.match(home, /<BookingStory locale=\{locale\}\/>/)
  assert.match(home, /<BusinessDirectory locale=\{locale\} industry=\{industry\} setIndustry=\{setIndustry\}/)
  assert.match(home, /cta_find_appointment_click/)
})

test('motion has accessible pause, static description and reduced-motion fallback with cleanup', () => {
  const film = read('components/booking-story.js'), css = read('app/globals.css')
  assert.match(film, /className="film-visual" aria-hidden="true"/)
  assert.match(film, /className="sr-only"/)
  assert.match(film, /aria-describedby=/)
  assert.match(film, /prefers-reduced-motion: reduce/)
  assert.match(film, /media\.removeEventListener/)
  assert.match(film, /document\.removeEventListener\('visibilitychange'/)
  assert.match(film, /observer\?\.disconnect/)
  assert.match(film, /!inView \|\| !tabVisible/)
  assert.match(css, /data-paused="true"[\s\S]*?animation-play-state:paused !important/)
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\s*\{\s*\.booking-film[\s\S]*?animation:none !important/)
  assert.match(css, /\.booking-film \.film-slogan,\.booking-film \.film-slogan h3 > span \{ opacity:1; transform:none; \}/)
  assert.match(css, /film-stage-motion var\(--film-cycle\)/)
})

test('frame-by-frame QA fixture is unavailable in production and not indexed', () => {
  assert.match(read('app/dev/booking-film/page.js'), /process\.env\.NODE_ENV === 'production'\) notFound\(\)/)
  assert.match(read('app/dev/layout.js'), /index:false,follow:false/)
})
