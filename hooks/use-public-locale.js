'use client'

import { useCallback, useEffect, useState } from 'react'
import { normalizeLocale } from '../lib/public-locale.mjs'

const STORAGE_KEY = 'ai-receptionist-locale'
const CHANGE_EVENT = 'gorez-locale-change'

export function usePublicLocale() {
  const [locale, setLocaleState] = useState('bg')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('lang')
    let fromStorage
    try { fromStorage = window.localStorage.getItem(STORAGE_KEY) } catch { /* Storage may be disabled. URL selection still works. */ }
    const nextLocale = normalizeLocale(fromUrl || fromStorage)
    setLocaleState(nextLocale)
    setReady(true)
    try { window.localStorage.setItem(STORAGE_KEY, nextLocale) } catch { /* Do not block the booking flow. */ }
    document.documentElement.lang = nextLocale
    const syncLocale = (event) => setLocaleState(normalizeLocale(event.detail))
    window.addEventListener(CHANGE_EVENT, syncLocale)
    return () => window.removeEventListener(CHANGE_EVENT, syncLocale)
  }, [])

  const setLocale = useCallback((nextValue) => {
    const nextLocale = normalizeLocale(nextValue)
    setLocaleState(nextLocale)
    document.documentElement.lang = nextLocale
    try { window.localStorage.setItem(STORAGE_KEY, nextLocale) } catch { /* The language is also retained in the URL. */ }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: nextLocale }))
    const url = new URL(window.location.href)
    url.searchParams.set('lang', nextLocale)
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  return { locale, setLocale, ready }
}
