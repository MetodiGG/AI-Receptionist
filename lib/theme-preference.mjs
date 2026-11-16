export const THEME_STORAGE_KEY = 'gorez.theme'
export const THEME_CHANGE_EVENT = 'gorez:theme-change'

// Keep the first visit light. This trusted, fixed script runs in the document
// head before content paints; only the two accepted preference values reach DOM.
export const THEME_BOOTSTRAP_SCRIPT = `(()=>{let theme='light';try{const saved=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(saved==='dark')theme='dark';}catch{}document.documentElement.setAttribute('data-theme',theme);})();`

const browserWindow = () => typeof window === 'undefined' ? undefined : window

export function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light'
}

export function getServerThemeSnapshot() {
  return 'light'
}

export function getThemeSnapshot(browser = browserWindow()) {
  return normalizeTheme(browser?.document?.documentElement?.getAttribute('data-theme'))
}

export function setTheme(value, browser = browserWindow()) {
  const theme = normalizeTheme(value)
  if (!browser) return theme
  browser.document.documentElement.setAttribute('data-theme', theme)
  // Private/restricted browsing can deny persistence; the current tab must
  // still switch and keep all mounted controls in agreement.
  try { browser.localStorage.setItem(THEME_STORAGE_KEY, theme) } catch {}
  browser.dispatchEvent(new browser.Event(THEME_CHANGE_EVENT))
  return theme
}

export function subscribeTheme(listener, browser = browserWindow()) {
  if (!browser) return () => {}
  const changed = () => listener()
  const stored = event => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return
    // The same key in sessionStorage is not a site theme preference.
    if (event.storageArea) {
      try { if (event.storageArea !== browser.localStorage) return } catch { return }
    }
    browser.document.documentElement.setAttribute('data-theme', normalizeTheme(event.newValue))
    listener()
  }
  browser.addEventListener(THEME_CHANGE_EVENT, changed)
  browser.addEventListener('storage', stored)
  return () => {
    browser.removeEventListener(THEME_CHANGE_EVENT, changed)
    browser.removeEventListener('storage', stored)
  }
}
