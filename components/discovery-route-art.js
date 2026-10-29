import { Icon } from './icon'

// An illustration of the journey, never a business, result or bookable slot.
export function DiscoveryRouteArt({ locale = 'bg' }) {
  const en = locale === 'en'
  return <div className="discovery-route-art" aria-hidden="true">
    <span className="discovery-route-plane"/>
    <svg className="discovery-route-connector" viewBox="0 0 300 240" fill="none" focusable="false"><path d="M91 67C91 107 217 65 217 119S130 145 130 193"/></svg>
    <span className="discovery-route-card discovery-route-service"><span className="discovery-route-icon"><Icon name="grid"/></span><span>{en ? 'A service' : 'Услуга'}</span></span>
    <span className="discovery-route-card discovery-route-place"><span className="discovery-route-icon"><Icon name="pin"/></span><span>{en ? 'A place' : 'Място'}</span></span>
    <span className="discovery-route-card discovery-route-time"><span className="discovery-route-icon"><Icon name="calendar"/></span><span>{en ? 'Your next visit' : 'Твоят час'}</span><Icon name="arrow"/></span>
  </div>
}
