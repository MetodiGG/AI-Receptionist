'use client'

import { useState } from 'react'
import { BookingStory } from '../../../components/booking-story'
import { FILM_PHASES, FILM_PHASE_MS } from '../../../lib/booking-film.mjs'

export function BookingFilmPreview() {
  const [scene, setScene] = useState('live'), [locale, setLocale] = useState('bg')
  return <main className="film-preview">
    <div className="launch-qa-controls"><b>LOCAL QA · animation only · no bookings or emails</b><label>Scene <select value={scene} onChange={event => setScene(event.target.value)}>{['live', ...FILM_PHASES, 'reduced'].map(value => <option key={value}>{value}</option>)}</select></label><button type="button" onClick={() => setLocale(locale === 'bg' ? 'en' : 'bg')}>{locale === 'bg' ? 'EN' : 'BG'}</button></div>
    <div className="film-preview-stage"><BookingStory key={`${scene}-${locale}`} locale={locale} previewPaused={scene !== 'live'} previewOffset={Math.max(0, FILM_PHASES.indexOf(scene)) * FILM_PHASE_MS + (scene === 'live' ? 0 : 950)} previewReduced={scene === 'reduced'}/></div>
  </main>
}
