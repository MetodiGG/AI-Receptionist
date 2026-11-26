const pressAttribute = 'data-public-action-press'
const capturePassive = { capture: true, passive: true }

export function installPublicActionMotion(win, doc) {
  let pressed, pointerId
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

  // The glass follows native CSS timelines. JavaScript only supplements
  // :active for touch browsers; it never schedules or mutates on scroll,
  // captures a pointer, or changes a click/form/navigation.
  doc.addEventListener('pointerdown', press, capturePassive)
  doc.addEventListener('pointerup', release, capturePassive)
  doc.addEventListener('pointercancel', release, capturePassive)
  win.addEventListener('blur', release)
  return () => {
    release()
    doc.removeEventListener('pointerdown', press, capturePassive)
    doc.removeEventListener('pointerup', release, capturePassive)
    doc.removeEventListener('pointercancel', release, capturePassive)
    win.removeEventListener('blur', release)
  }
}
