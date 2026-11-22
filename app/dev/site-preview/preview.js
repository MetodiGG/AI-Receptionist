'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../../components/icon'
import './preview.css'

export const PREVIEW_DEVICES = Object.freeze({
  phone: { widths: [320, 390, 430], width: 390, height: 844 },
  laptop: { widths: [1280, 1440], width: 1440, height: 900 },
})
export function previewFitScale(available, width) {
  return Math.max(.1, Math.min(1, Math.max(0, available - 32) / width))
}
export function previewZoomStep(scale, delta) {
  return Math.max(.5, Math.min(2, Math.round((scale + delta) * 4) / 4))
}

const COPY = {
  bg: { title: 'GoRez · преглед', note: 'Само локално · резервациите са изключени', devices: 'Размер на устройството', phone: 'Телефон', laptop: 'Лаптоп', width: 'Ширина', fit: 'Побери', zoom: 'Мащаб на прегледа', smaller: 'Намали', larger: 'Увеличи', full: 'Цял екран', exit: 'Изход от цял екран', fullscreenError: 'Целият екран не е достъпен тук. Използвай 100% или „Без рамка“.', open: 'Без рамка', top: 'Най-горе', loading: 'Зареждаме прегледа…', hint: 'Скролвай вътре в сайта. Размерът се сменя без загуба на избраната услуга.', frame: 'Интерактивен локален преглед на GoRez', viewport: 'Екран на прегледа' },
  en: { title: 'GoRez · preview', note: 'Local only · booking disabled', devices: 'Device size', phone: 'Phone', laptop: 'Laptop', width: 'Width', fit: 'Fit', zoom: 'Preview scale', smaller: 'Zoom out', larger: 'Zoom in', full: 'Full screen', exit: 'Exit full screen', fullscreenError: 'Full screen is unavailable here. Use 100% or “Unframed”.', open: 'Unframed', top: 'Back to top', loading: 'Loading preview…', hint: 'Scroll inside the website. Resizing keeps your selected service.', frame: 'Interactive local GoRez preview', viewport: 'Preview viewport' },
}

export function ResponsiveSitePreview({ locale = 'bg', initialDevice = 'phone' }) {
  const language = locale === 'en' ? 'en' : 'bg', copy = COPY[language]
  const [device, setDevice] = useState(initialDevice === 'laptop' ? 'laptop' : 'phone')
  const [widths, setWidths] = useState({ phone: 390, laptop: 1440 })
  const [zoom, setZoom] = useState('fit'), [availableWidth, setAvailableWidth] = useState(0)
  const [loading, setLoading] = useState(true), [fullscreen, setFullscreen] = useState(false)
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false), [message, setMessage] = useState('')
  const root = useRef(null), stage = useRef(null), frame = useRef(null)
  const width = widths[device], height = PREVIEW_DEVICES[device].height
  const scale = zoom === 'fit' ? previewFitScale(availableWidth || width + 32, width) : zoom
  // Keep this src and the iframe identity stable. Device/zoom changes only
  // resize its actual viewport; selection, history and page scroll stay inside.
  const source = `/dev/inline-discovery?lang=${language}`

  useLayoutEffect(() => {
    const node = stage.current
    if (!node) return
    const measure = () => setAvailableWidth(node.clientWidth)
    measure()
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(measure)
      observer.observe(node)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    setFullscreenAvailable(Boolean(document.fullscreenEnabled && root.current?.requestFullscreen))
    const changed = () => setFullscreen(document.fullscreenElement === root.current)
    document.addEventListener('fullscreenchange', changed)
    return () => document.removeEventListener('fullscreenchange', changed)
  }, [])

  useEffect(() => {
    // A same-origin iframe can finish before its SSR host hydrates, so the
    // React load handler alone can miss it. The usable DOM is enough here;
    // don't keep saying "loading" while lazy photographs finish afterward.
    const doc = frame.current?.contentDocument
    const ready = () => setLoading(false)
    if (!doc || doc.URL === 'about:blank') return
    if (doc.readyState !== 'loading') ready()
    else doc.addEventListener('DOMContentLoaded', ready, { once: true })
    return () => doc.removeEventListener('DOMContentLoaded', ready)
  }, [])

  async function toggleFullscreen() {
    setMessage('')
    try {
      if (document.fullscreenElement === root.current) await document.exitFullscreen()
      else await root.current?.requestFullscreen()
    } catch { setMessage(copy.fullscreenError) }
  }

  function changeWidth(event) {
    const next = Number(event.target.value)
    if (PREVIEW_DEVICES[device].widths.includes(next)) setWidths(current => ({ ...current, [device]: next }))
  }

  return <main className="gorez-responsive-review" ref={root} lang={language}>
    <header className="gorez-review-toolbar">
      <div className="gorez-review-title"><h1>{copy.title}</h1><p>{copy.note}</p></div>
      <div className="gorez-review-controls">
        <div className="gorez-review-segment" role="group" aria-label={copy.devices}>
          {['phone', 'laptop'].map(value => <button key={value} type="button" aria-pressed={device === value} onClick={() => setDevice(value)}>{copy[value]}</button>)}
        </div>
        <label className="gorez-review-width">{copy.width}<select value={width} onChange={changeWidth}>{PREVIEW_DEVICES[device].widths.map(value => <option key={value} value={value}>{value} px</option>)}</select></label>
        <div className="gorez-review-segment" role="group" aria-label={copy.zoom}>
          <button type="button" aria-pressed={zoom === 'fit'} onClick={() => setZoom('fit')}>{copy.fit}</button>
          <button type="button" aria-pressed={zoom === 1} onClick={() => setZoom(1)}>100%</button>
          <button type="button" aria-label={copy.smaller} disabled={scale <= .5} onClick={() => setZoom(previewZoomStep(scale, -.25))}>−</button>
          <button type="button" aria-label={copy.larger} disabled={scale >= 2} onClick={() => setZoom(previewZoomStep(scale, .25))}>+</button>
        </div>
        <button className="gorez-review-action" type="button" disabled={!fullscreenAvailable} onClick={toggleFullscreen}><Icon name="external"/>{fullscreen ? copy.exit : copy.full}</button>
        <a className="gorez-review-action" href={source} target="_blank" rel="noopener noreferrer">{copy.open}<Icon name="arrow"/></a>
        <button className="gorez-review-action" type="button" onClick={() => {
          frame.current?.contentWindow?.scrollTo({ top: 0, behavior: 'instant' })
          stage.current?.scrollTo?.({ top: 0, left: 0, behavior: 'instant' })
        }}>{copy.top}</button>
      </div>
      <div className="gorez-review-meta"><output aria-live="polite">{copy[device]} · {width} × {height} px · {Math.round(scale * 100)}%</output><span>{copy.hint}</span></div>
      {message && <p role="status" className="gorez-review-message">{message}</p>}
    </header>
    <section className="gorez-review-stage" ref={stage} aria-label={copy.viewport} tabIndex={0}>
      {loading && <p className="gorez-review-loading" role="status">{copy.loading}</p>}
      <div className="gorez-review-canvas" data-device={device} style={{ width: width * scale, height: height * scale }}>
        <iframe ref={frame} title={`${copy.frame} · ${copy[device]} · ${width} × ${height} px`} src={source} width={width} height={height} style={{ transform: `scale(${scale})` }} sandbox="allow-scripts allow-same-origin" allow="geolocation 'none'; camera 'none'; microphone 'none'" onLoad={() => setLoading(false)}/>
      </div>
    </section>
  </main>
}
