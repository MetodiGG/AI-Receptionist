const pagePhase = '--gorez-page-action-phase'
const dialogPhase = '--gorez-dialog-action-phase'
const pressAttribute = 'data-public-action-press'
const passive = { passive: true }
const capturePassive = { capture: true, passive: true }

export function publicActionScrollPhase(offset, viewport) {
  const distance = Math.max(0, offset || 0) / Math.max(240, (viewport || 0) * .58)
  const wave = 1 - Math.abs(1 - distance % 2)
  // 24 levels keep the finish smooth without invalidating styles for every
  // pixel of an inertial scroll. The cycle is local, not page-length based.
  return Math.round(wave * 24) / 24
}

export function installPublicActionMotion(win, doc) {
  const root = doc.documentElement
  const reducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)')
  const dialogPhases = new WeakMap()
  let pagePending = false, frame, previousPage, pendingDialog, pressed, pointerId
  const update = () => {
    frame = undefined
    const dialog = pendingDialog
    const page = pagePending ? publicActionScrollPhase(win.scrollY, win.innerHeight) : null
    const local = dialog?.isConnected && dialog.open ? publicActionScrollPhase(dialog.scrollTop, dialog.clientHeight) : null
    pagePending = false
    pendingDialog = undefined
    if (reducedMotion.matches) return
    if (page !== null && page !== previousPage) {
      previousPage = page
      root.style.setProperty(pagePhase, String(page))
    }
    if (local !== null && local !== dialogPhases.get(dialog)) {
      dialogPhases.set(dialog, local)
      dialog.style.setProperty(dialogPhase, String(local))
    }
  }
  const schedule = () => {
    if (!reducedMotion.matches && frame === undefined) frame = win.requestAnimationFrame(update)
  }
  const pageChanged = () => { pagePending = true; schedule() }
  const dialogChanged = event => {
    if (!event.target?.matches?.('dialog.discovery-business-details[open]')) return
    pendingDialog = event.target
    schedule()
  }
  const release = event => {
    if (!pressed || (event?.pointerId !== undefined && event.pointerId !== pointerId)) return
    pressed.removeAttribute(pressAttribute)
    pressed = undefined
    pointerId = undefined
  }
  const press = event => {
    if (event.button !== 0 || !event.isPrimary) return
    release()
    const action = event.target?.closest?.('.home-business-actions [data-public-action]:not(:disabled):not([aria-disabled="true"])')
    if (!action) return
    pressed = action
    pointerId = event.pointerId
    pressed.setAttribute(pressAttribute, '')
  }

  // Passive delegation handles both Safari taps and desktop presses. This
  // never captures a pointer or changes an actual click/form/navigation.
  win.addEventListener('scroll', pageChanged, passive)
  win.addEventListener('resize', pageChanged, passive)
  win.addEventListener('pageshow', pageChanged, passive)
  doc.addEventListener('scroll', dialogChanged, capturePassive)
  doc.addEventListener('pointerdown', press, capturePassive)
  doc.addEventListener('pointerup', release, capturePassive)
  doc.addEventListener('pointercancel', release, capturePassive)
  win.addEventListener('blur', release)
  reducedMotion.addEventListener?.('change', pageChanged)
  pageChanged()
  return () => {
    if (frame !== undefined) win.cancelAnimationFrame(frame)
    release()
    root.style.removeProperty(pagePhase)
    win.removeEventListener('scroll', pageChanged, passive)
    win.removeEventListener('resize', pageChanged, passive)
    win.removeEventListener('pageshow', pageChanged, passive)
    doc.removeEventListener('scroll', dialogChanged, capturePassive)
    doc.removeEventListener('pointerdown', press, capturePassive)
    doc.removeEventListener('pointerup', release, capturePassive)
    doc.removeEventListener('pointercancel', release, capturePassive)
    win.removeEventListener('blur', release)
    reducedMotion.removeEventListener?.('change', pageChanged)
  }
}
