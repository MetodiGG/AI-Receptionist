// Public route shell only. Prefetching never mounts discovery, requests
// location, loads Google/AI, or touches accounts/appointment availability.
export function PublicRouteLoading() {
  return <main className="route-loading-shell" aria-busy="true"><span className="sr-only" role="status">Зареждане · Loading…</span><div className="route-loading-brand" aria-hidden="true">GoRez</div><div className="route-loading-heading" aria-hidden="true"/><div className="route-loading-field" aria-hidden="true"/><div className="route-loading-cards" aria-hidden="true"><i/><i/><i/></div></main>
}
