import '../app/inline-discovery-panel.css'

// Commit the real height with the content, without a second React render or
// a height transition. Focus/scroll never have to wait for the visual reveal.
export function InlineDiscoveryPanel({ children, open = false }) {
  return open ? <div className="inline-discovery-panel" data-open="true">{children}</div> : null
}
