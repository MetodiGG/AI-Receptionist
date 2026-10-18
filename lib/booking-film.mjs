import { DateTime } from 'luxon'
import { formatBulgarianMonthShort } from './booking-window.mjs'

export const FILM_CYCLE_MS = 10000
export const FILM_PHASES = ['service', 'time', 'details', 'confirmation', 'slogan']
export const FILM_PHASE_MS = FILM_CYCLE_MS / FILM_PHASES.length

export function filmPhaseAt(elapsedMs) {
  const position = ((elapsedMs % FILM_CYCLE_MS) + FILM_CYCLE_MS) % FILM_CYCLE_MS
  return FILM_PHASES[Math.floor(position / FILM_PHASE_MS)]
}

export function bookingFilmDates(locale = 'bg', now = DateTime.now()) {
  const date = (typeof now === 'string' ? DateTime.fromISO(now) : now).setZone('Europe/Sofia')
  if (!date.isValid) return []
  return Array.from({ length: 5 }, (_, index) => {
    const day = date.startOf('day').plus({ days: index + 1 }).setLocale(locale === 'en' ? 'en-GB' : 'bg')
    return { key: day.toISODate(), day: day.day, weekday: day.toFormat('ccc'), month: locale === 'en' ? day.toFormat('LLL') : formatBulgarianMonthShort(day.month), monthName: day.toFormat('LLLL'), label: day.toFormat('d LLLL') }
  })
}

export const FILM_COPY = {
  bg: {
    title: 'От избора до готовия час.', subtitle: 'Ето колко е лесно',
    description: 'Избираш услуга, дата и час, въвеждаш данните си и потвърждаваш. Бързо. Лесно. Удобно. Това е анимация на процеса, не истинска резервация.',
    pause: 'Пауза', resume: 'Продължи', pauseLabel: 'Пауза на анимацията', resumeLabel: 'Продължи анимацията', reduced: 'Без анимация',
    caption: 'Визуализация на записването · не създава резервация',
    service: 'Избери услуга.', serviceNote: 'Точно това, от което имаш нужда.',
    services: ['Подстригване', 'Подстригване и брада', 'Оформяне на брада'], minutes: 'мин',
    time: 'Когато ти е удобно.', timeNote: 'Избери дата и свободен час.', date: 'Дата', hour: 'Час',
    details: 'Твоите данни.', detailsNote: 'Без профил. Без излишни стъпки.',
    name: 'Име', nameValue: 'Твоето име', phone: 'Телефон', email: 'Имейл', privacy: 'Приемам политиката за поверителност', confirm: 'Потвърди часа',
    done: 'Готово!', booked: 'Твоят час е запазен.', bookedNote: 'Всичко важно е на едно място.',
    finale: 'Повече време за теб.', slogan: ['Бързо.', 'Лесно.', 'Удобно.'], endNote: 'Твоят следващ час започва тук.',
  },
  en: {
    title: 'From choosing to booked.', subtitle: 'See how easy it is',
    description: 'Choose a service, a date and time, enter your details and confirm. Quick. Easy. Convenient. This is an animation of the process, not a real booking.',
    pause: 'Pause', resume: 'Resume', pauseLabel: 'Pause booking animation', resumeLabel: 'Resume booking animation', reduced: 'Motion off',
    caption: 'Booking walkthrough · does not create a reservation',
    service: 'Choose your service.', serviceNote: 'Exactly what you need.',
    services: ['Haircut', 'Haircut & beard', 'Beard shaping'], minutes: 'min',
    time: 'When it suits you.', timeNote: 'Choose a date and an available time.', date: 'Date', hour: 'Time',
    details: 'Just a few details.', detailsNote: 'No account. No extra steps.',
    name: 'Name', nameValue: 'Your name', phone: 'Phone', email: 'Email', privacy: 'I accept the privacy policy', confirm: 'Confirm appointment',
    done: 'All set!', booked: 'Your appointment is booked.', bookedNote: 'Everything you need in one place.',
    finale: 'More time for you.', slogan: ['Quick.', 'Easy.', 'Convenient.'], endNote: 'Your next appointment starts here.',
  },
}
