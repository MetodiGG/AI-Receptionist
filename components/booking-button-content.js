// Presentation only. The parent keeps its real link, submit/button behavior,
// accessible name and disabled state. This is existing GoRez project artwork.
export function BookingCalendarIcon({ className = '', size = 30 }) {
  return <img className={`booking-calendar-icon${className ? ` ${className}` : ''}`} src="/booking-art/calendar-3d-v1.webp" alt="" aria-hidden="true" width={size} height={size} decoding="async"/>
}

export function BookingButtonContent({ children, iconSize = 30 }) {
  return <span className="booking-button-content"><BookingCalendarIcon size={iconSize}/><span className="booking-button-label">{children}</span></span>
}
