// Native showModal supplies inertness and Escape. Explicit Tab cycling also
// supports WebKit configurations that otherwise skip buttons in tab order.
export function containDialogTab(event, dialog) {
  if (event.key !== 'Tab' || !dialog) return false
  const fields = [...dialog.querySelectorAll('button:not(:disabled),select:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],summary,[tabindex="0"]')]
    .filter(node => node.tabIndex >= 0 && node.getClientRects().length > 0)
  event.preventDefault()
  if (!fields.length) { dialog.focus(); return true }
  const current = fields.indexOf(dialog.ownerDocument.activeElement)
  const next = current < 0 ? (event.shiftKey ? fields.length - 1 : 0) : (current + (event.shiftKey ? -1 : 1) + fields.length) % fields.length
  fields[next].focus()
  return true
}
