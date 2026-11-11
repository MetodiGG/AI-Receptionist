import { businessCoverPhoto } from '../lib/business-cover-photo.mjs'

// Standalone example, never passed into the real-photo carousel or metadata.
export function BusinessCoverPhoto({ business, locale = 'bg', className = '', eager = false }) {
  const { category, src, size } = businessCoverPhoto(business)
  return <div className={`business-category-cover ${className}`.trim()} data-category-cover={category}>
    <img src={src} width={size} height={size} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async"/>
    <span className="business-category-cover-label">{locale === 'en' ? 'Illustrative photo' : 'Примерна снимка'}</span>
  </div>
}
