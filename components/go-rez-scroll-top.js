'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { normalizeLocale } from '../lib/public-locale.mjs'
import { scrollTopDockInset, scrollTopOptions, shouldShowScrollTop } from '../lib/scroll-top.mjs'
import { Icon } from './icon'
import styles from './go-rez-scroll-top.module.css'

const LABEL = { bg: 'Към началото на страницата', en: 'Back to top' }

function focusPageStart() {
  const target = document.querySelector('main h1, [role="main"] h1, .main-area .topbar h1')
    || document.querySelector('main, [role="main"], .main-area')
    || document.body
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1')
    target.addEventListener('blur', () => {
      if (target.getAttribute('tabindex') === '-1') target.removeAttribute('tabindex')
    }, { once: true })
  }
  target.focus({ preventScroll: true })
}

export function GoRezScrollTop() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [locale, setLocale] = useState('bg')
  const [dockInset, setDockInset] = useState(null)

  useEffect(() => {
    const root = document.documentElement
    const syncLocale = () => setLocale(normalizeLocale(root.lang))
    const observer = new MutationObserver(syncLocale)
    observer.observe(root, { attributes: true, attributeFilter: ['lang'] })
    syncLocale()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let frame, previous
    const syncVisibility = () => {
      frame = undefined
      const next = shouldShowScrollTop(window.scrollY, window.innerHeight)
      if (next === previous) return
      previous = next
      setVisible(next)
    }
    const schedule = () => {
      if (frame === undefined) frame = window.requestAnimationFrame(syncVisibility)
    }
    syncVisibility()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('pageshow', schedule)
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('pageshow', schedule)
    }
  }, [pathname])

  useEffect(() => {
    // The dashboard sidebar is the site's only viewport-bottom navigation.
    // Its height can grow with language, enlarged text or a device safe area.
    const dock = document.querySelector('.app-shell > .sidebar')
    if (!dock) {
      setDockInset(null)
      return
    }
    const syncDock = () => setDockInset(window.getComputedStyle(dock).position === 'fixed'
      ? scrollTopDockInset(window.innerHeight, dock.getBoundingClientRect().top)
      : null)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(syncDock) : null
    observer?.observe(dock)
    window.addEventListener('resize', syncDock)
    syncDock()
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', syncDock)
    }
  }, [pathname, visible])

  // A focused control disappearing mid-scroll can interrupt the animation.
  function goToTop() {
    focusPageStart()
    window.scrollTo(scrollTopOptions(window.matchMedia('(prefers-reduced-motion: reduce)').matches))
  }

  return (
    <button type="button" className={styles.control} aria-label={LABEL[locale]} title={LABEL[locale]}
      hidden={!visible} onClick={goToTop} style={dockInset == null ? undefined : { '--scroll-top-dock': `${dockInset}px` }}>
      <Icon name="arrow" />
    </button>
  )
}
