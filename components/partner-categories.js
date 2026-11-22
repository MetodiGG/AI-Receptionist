import Link from 'next/link'
import { Icon } from './icon'
import { getIndustryLabel } from '../lib/public-locale.mjs'
import { partnerCategoryHref } from '../lib/partner-categories.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'

// Partner browsing keeps its existing industry identifiers. Only its decorative
// artwork resolves to the same photographic source as the homepage category.
function PartnerCategoryPhoto({ industry, locale, heading = false }) {
  const categories = homeCategories(locale)
  const photo = categories.find(category => category.id === (industry === 'auto' ? 'auto_repair' : industry)) || categories.find(category => category.id === 'other')
  return <span className={`partner-category-art${heading ? ' partner-category-art--heading' : ''}`} aria-hidden="true"><img className="partner-category-photo" src={photo.photo2x} srcSet={`${photo.photo} 160w, ${photo.photo2x} 240w`} sizes={heading ? '64px' : '(max-width:600px)72px,88px'} width={240} height={photo.photoHeight || 240} alt="" loading="lazy" decoding="async"/></span>
}

export function PartnerCategories({ categories, selected, total, count, locale, basePath = '/partners' }) {
  const en = locale === 'en'
  const href = category => partnerCategoryHref(category, locale, basePath)
  const businessCount = value => `${value} ${en ? (value === 1 ? 'business' : 'businesses') : (value === 1 ? 'бизнес' : 'бизнеса')}`

  if (selected) return <div className="partner-category-selection">
    <Link className="partner-categories-back" href={href('')} prefetch={false}><Icon name="back"/>{en ? 'All categories' : 'Всички категории'}</Link>
    <div className="partner-category-selection-heading">
      <PartnerCategoryPhoto industry={selected} locale={locale} heading/>
      <div><h2>{selected === 'all' ? (en ? 'All partners' : 'Всички партньори') : getIndustryLabel(selected, locale)}</h2><p role="status">{businessCount(count)}</p></div>
    </div>
  </div>

  return <div className="partner-category-overview">
    <div className="partner-category-overview-heading"><h2>{en ? 'Choose a category' : 'Избери категория'}</h2><Link className="partner-categories-all" href={href('all')} prefetch={false}>{en ? 'All partners' : 'Всички партньори'}<span>{total}</span><Icon name="arrow"/></Link></div>
    <nav className="partner-category-grid" aria-label={en ? 'Partner categories' : 'Категории партньори'}>
      {categories.map(category => <Link key={category.id} className="partner-category-card" href={href(category.id)} prefetch={false}>
        <PartnerCategoryPhoto industry={category.id} locale={locale}/>
        <span className="partner-category-card-copy"><strong>{category.label}</strong><span>{businessCount(category.count)}</span></span>
        <span className="partner-category-arrow"><Icon name="arrow"/></span>
      </Link>)}
    </nav>
  </div>
}
