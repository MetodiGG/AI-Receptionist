'use client'

import { useSyncExternalStore } from 'react'
import { getServerThemeSnapshot, getThemeSnapshot, setTheme, subscribeTheme } from '../lib/theme-preference.mjs'
import { Icon } from './icon'

export function ThemeToggle({ locale = 'bg' }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot)
  const dark = theme === 'dark', en = locale === 'en'
  const label = en
    ? dark ? 'Switch to light mode' : 'Switch to dark mode'
    : dark ? 'Включи светъл режим' : 'Включи тъмен режим'

  return <button type="button" className="theme-toggle" aria-label={label} title={label} aria-pressed={dark} onClick={() => setTheme(dark ? 'light' : 'dark')}><Icon name={dark ? 'sun' : 'moon'}/></button>
}
