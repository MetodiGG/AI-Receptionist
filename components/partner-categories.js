import Link from 'next/link'
import { BusinessCategoryIcon } from './business-category-icon'
import { Icon } from './icon'
import { getIndustryLabel } from '../lib/public-locale.mjs'
import { partnerCategoryHref } from '../lib/partner-categories.mjs'

export function PartnerCategories({ categories, selected, total, count, locale, basePath = '/partners' }) {
  const en = locale === 'en'
  const href = category => partnerCategoryHref(category, locale, basePath)
  const businessCount = value => `${value} ${en ? (value === 1 ? 'business' : 'businesses') : (value === 1 ? 'бизнес' : 'бизнеса')}`

  if (selected) return <div className="partner-category-selection">
    <Link className="partner-categories-back" href={href('')} prefetch={false}><Icon name="back"/>{en ? 'All categories' : 'Всички категории'}</Link>
    <div className="partner-category-selection-heading">
      <BusinessCategoryIcon business={{ industry: selected === 'all' ? 'other' : selected }} size={64}/>
      <div><h2>{selected === 'all' ? (en ? 'All partners' : 'Всички партньори') : getIndustryLabel(selected, locale)}</h2><p role="status">{businessCount(count)}</p></div>
    </div>
  </div>

  return <div className="partner-category-overview">
    <div className="partner-category-overview-heading"><h2>{en ? 'Choose a category' : 'Избери категория'}</h2><Link className="partner-categories-all" href={href('all')} prefetch={false}>{en ? 'All partners' : 'Всички партньори'}<span>{total}</span><Icon name="arrow"/></Link></div>
    <nav className="partner-category-grid" aria-label={en ? 'Partner categories' : 'Категории партньори'}>
      {categories.map(category => <Link key={category.id} className="partner-category-card" href={href(category.id)} prefetch={false}>
        <span className="partner-category-art"><BusinessCategoryIcon business={{ industry: category.id }} size={80}/></span>
        <span className="partner-category-card-copy"><strong>{category.label}</strong><span>{businessCount(category.count)}</span></span>
        <span className="partner-category-arrow"><Icon name="arrow"/></span>
      </Link>)}
    </nav>
  </div>
}
