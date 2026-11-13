// Public route shell only. Prefetching never mounts discovery, requests
// location, loads Google/AI, or touches accounts/appointment availability.
import { BrandLoading } from './brand-loading'
export function PublicRouteLoading() {
  return <main className="route-loading-shell" aria-busy="true"><div className="route-loading-brand" role="status"><BrandLoading size={48} announce={false} label="Зареждане · Loading…"/></div><div className="route-loading-heading" aria-hidden="true"/><div className="route-loading-field" aria-hidden="true"/><div className="route-loading-cards" aria-hidden="true"><i/><i/><i/></div></main>
}
