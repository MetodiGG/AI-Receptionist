import { PublicActionContent } from './public-action'

// Presentation only. The parent keeps its real link, submit/button behavior,
// accessible name and disabled state. This is existing GoRez project artwork.
export function BookingCalendarIcon({ className = '', size = 30 }) {
  return <img className={`booking-calendar-icon${className ? ` ${className}` : ''}`} src="/booking-art/calendar-3d-v1.webp" alt="" aria-hidden="true" width={size} height={size} decoding="async"/>
}

export function BookingButtonContent({ children }) {
  return <PublicActionContent>{children}</PublicActionContent>
}
