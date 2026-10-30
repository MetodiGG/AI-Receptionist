import { businessArtCategory, categoryArtSource } from '../lib/category-art.mjs'

// Decorative category art only. The adjacent readable business/category label
// remains the accessible name and the image never substitutes for a real photo.
export function BusinessCategoryIcon({ category, business, size = 64, eager = false, className = '' }) {
  const resolved = category || businessArtCategory(business)
  return <span className={`business-category-art ${className}`.trim()} aria-hidden="true" data-category={resolved} style={{ '--business-art-size': `${size}px` }}><img src={categoryArtSource(resolved, true)} srcSet={`${categoryArtSource(resolved, true)} 128w, ${categoryArtSource(resolved)} 256w`} sizes={`${size}px`} width={size} height={size} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async"/></span>
}
