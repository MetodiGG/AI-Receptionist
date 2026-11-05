// Documented UI Kit content selection only. Google owns the rating, review
// count, attribution, links and notices; none are read back into GoRez data.
export function createPartnerRatingWidget(document, plan) {
  if (plan?.mode !== 'ui_kit_rating' || !/^[A-Za-z0-9_-]{5,200}$/.test(plan.placeId || '')) throw new Error('INVALID_RATING_PLAN')
  const widget = document.createElement('gmp-advanced-place-details')
  const request = document.createElement('gmp-place-details-place-request')
  request.setAttribute('place', `places/${plan.placeId}`)
  const attribution = document.createElement('gmp-place-attribution')
  attribution.setAttribute('light-scheme-color', 'black')
  widget.append(request, document.createElement('gmp-place-rating'), attribution)
  return widget
}
