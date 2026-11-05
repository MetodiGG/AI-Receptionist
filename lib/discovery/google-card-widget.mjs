const idOK = value => typeof value === 'string' && /^[A-Za-z0-9_-]{5,200}$/.test(value)
export function createGoogleCardWidget(document, plan, { nearby = false } = {}) {
  if (!['ui_kit_card', 'ui_kit_contacts'].includes(plan?.mode) || !idOK(plan.placeId)) throw new Error('INVALID_CARD_PLAN')
  const contacts = plan.mode === 'ui_kit_contacts'
  const widget = document.createElement(contacts ? 'gmp-advanced-place-details' : 'gmp-advanced-place-details-compact')
  if (!contacts) { widget.setAttribute('orientation', 'vertical'); widget.setAttribute('truncation-preferred', '') }
  const request = document.createElement('gmp-place-details-place-request')
  request.setAttribute('place', `places/${plan.placeId}`)
  widget.append(request)
  if (!contacts) {
    const media = document.createElement('gmp-place-media')
    media.setAttribute('preferred-size', 'large'); media.setAttribute('lightbox-preferred', '')
    widget.append(media)
  }
  // Selection is supported; Google's standard visual order is provider-owned.
  for (const tag of contacts ? ['gmp-place-name', 'gmp-place-website', 'gmp-place-phone-number'] : ['gmp-place-name', 'gmp-place-type', 'gmp-place-rating', ...(!nearby ? ['gmp-place-address'] : [])]) widget.append(document.createElement(tag))
  if (contacts) for (const action of ['open-website', 'call']) {
    const link = document.createElement('gmp-place-link')
    link.setAttribute('action', action)
    if (action === 'open-website') link.setAttribute('target', '_blank')
    widget.append(link)
  }
  const attribution = document.createElement('gmp-place-attribution')
  attribution.setAttribute('light-scheme-color', 'black')
  widget.append(attribution)
  return widget
}
