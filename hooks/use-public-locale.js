'use client'

import { useCallback, useEffect, useState } from 'react'
import { normalizeLocale } from '../lib/public-locale.mjs'

const STORAGE_KEY = 'ai-receptionist-locale'

export function usePublicLocale() {
  const [locale, setLocaleState] = useState('bg')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('lang')
    const fromStorage = window.localStorage.getItem(STORAGE_KEY)
    const nextLocale = normalizeLocale(fromUrl || fromStorage)
    setLocaleState(nextLocale)
    document.documentElement.lang = nextLocale
  }, [])

  const setLocale = useCallback((nextValue) => {
    const nextLocale = normalizeLocale(nextValue)
    setLocaleState(nextLocale)
    document.documentElement.lang = nextLocale
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', nextLocale)
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  return { locale, setLocale }
}
