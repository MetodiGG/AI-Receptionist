// Run in the time-button's click handler, after the form has mounted. Keeping
// focus in the user gesture also lets mobile Safari open the name keyboard.
export function focusBookingDetails(heading, nameInput, reduceMotion = false) {
  if (!heading || !nameInput) return false

  const topbar = heading.closest('.public-booking-page')?.querySelector('.booking-topbar')
  heading.style.scrollMarginBlockStart = `${(topbar?.getBoundingClientRect().height || 0) + 24}px`
  nameInput.focus({ preventScroll: true })
  heading.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start', inline: 'nearest' })
  return true
}
