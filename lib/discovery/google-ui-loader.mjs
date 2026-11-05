// Browser-only work starts inside this function, never during server rendering.
// All attributed Places widgets share one load; no extra Maps script per card.
let libraryPromise
export function loadPlacesLibrary(key, locale) {
  if (libraryPromise) return libraryPromise
  libraryPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.importLibrary) { window.google.maps.importLibrary('places').then(resolve, reject); return }
    const script = document.createElement('script'), callback = '__gorezPlacesReady'
    const timeout = setTimeout(() => { delete window[callback]; reject(new Error('GOOGLE_TIMEOUT')) }, 8000)
    window[callback] = async () => { clearTimeout(timeout); delete window[callback]; try { resolve(await window.google.maps.importLibrary('places')) } catch { reject(new Error('GOOGLE_UNAVAILABLE')) } }
    const url = new URL('https://maps.googleapis.com/maps/api/js')
    // Advanced widgets are GA on weekly; never silently opt into alpha/beta.
    url.search = new URLSearchParams({ key, v: 'weekly', libraries: 'places', language: locale, region: 'BG', loading: 'async', callback }).toString()
    script.src = url.href; script.async = true; script.referrerPolicy = 'strict-origin-when-cross-origin'
    script.onerror = () => { clearTimeout(timeout); delete window[callback]; reject(new Error('GOOGLE_UNAVAILABLE')) }
    document.head.append(script)
  }).catch(error => { libraryPromise = null; throw error })
  return libraryPromise
}
