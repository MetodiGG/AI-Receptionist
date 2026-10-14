'use client'

import { useCallback, useEffect, useState } from 'react'
import { normalizeLocale } from '../lib/public-locale.mjs'

const STORAGE_KEY = 'ai-receptionist-locale'
const CHANGE_EVENT = 'gorez-locale-change'

export function usePublicLocale() {
  const [locale, setLocaleState] = useState('bg')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('lang')
    const fromStorage = window.localStorage.getItem(STORAGE_KEY)
    const nextLocale = normalizeLocale(fromUrl || fromStorage)
    setLocaleState(nextLocale)
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
    document.documentElement.lang = nextLocale
    const syncLocale = (event) => setLocaleState(normalizeLocale(event.detail))
    window.addEventListener(CHANGE_EVENT, syncLocale)
    return () => window.removeEventListener(CHANGE_EVENT, syncLocale)
  }, [])

  const setLocale = useCallback((nextValue) => {
    const nextLocale = normalizeLocale(nextValue)
    setLocaleState(nextLocale)
    document.documentElement.lang = nextLocale
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: nextLocale }))
    const url = new URL(window.location.href)
    url.searchParams.set('lang', nextLocale)
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  return { locale, setLocale }
}
