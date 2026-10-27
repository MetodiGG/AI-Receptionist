// Navigation-only memory, not a URL, cookie, localStorage or analytics event.
// Precise coordinates and free-text queries disappear on reload/tab close.
let draft = null
export const setDiscoveryDraft = value => { draft = value }
export const peekDiscoveryDraft = () => draft
export const clearDiscoveryDraft = () => { draft = null }
