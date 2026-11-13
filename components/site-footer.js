'use client'

import Link from 'next/link'
import { BrandLogo } from './brand-logo'
import { SUPPORT_EMAIL } from '../lib/product-config.mjs'
import { ProductMeasurement } from './product-measurement'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_LICENSE_URL, OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_PROCESSED_DATA_URL } from '../lib/discovery/catalogue-attribution.mjs'

export function SiteFooter({ locale = 'bg', identity = {}, compact = false }) {
  const en = locale === 'en'
  return <footer className={`site-footer${compact ? ' site-footer-compact' : ''}`}>
    <div className="site-footer-main"><Link href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo compact decorative/></Link><p>{en ? 'Online booking for appointment-based businesses.' : 'Онлайн резервации за бизнеси, които работят с часове.'}</p><a className="site-contact" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></div>
    <nav aria-label={en ? 'Footer navigation' : 'Навигация в долната част'}><Link href={`/?lang=${locale}`}>{en ? 'Find an appointment' : 'Намери час'}</Link><Link href={`/account?lang=${locale}`}>{en ? 'Client login' : 'Вход за клиенти'}</Link><Link href={`/for-businesses?lang=${locale}`}>{en ? 'For businesses' : 'За бизнеса'}</Link><Link href={`/login?lang=${locale}`}>{en ? 'Business login' : 'Вход за бизнес'}</Link><Link href={`/privacy?lang=${locale}`}>{en ? 'Privacy' : 'Поверителност'}</Link><Link href={`/terms?lang=${locale}`}>{en ? 'Terms' : 'Условия'}</Link><Link href={`/partners?lang=${locale}`}>{en ? 'GoRez partners' : 'GoRez партньори'}</Link><Link href={`/faq?lang=${locale}`}>{en?'FAQ':'ЧЗВ'}</Link>{identity.dpaUrl && <a href={identity.dpaUrl}>{en ? 'Data processing agreement' : 'Споразумение за обработване на данни'}</a>}</nav>
    {identity.company && <address className="company-identity">{identity.company.name} · {en ? 'Company ID' : 'ЕИК'} {identity.company.eik}<br/>{identity.company.address}</address>}
    <ProductMeasurement locale={locale}/>
    <p className="site-location-credit"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a><span aria-hidden="true"> · </span><a href="/catalogue-location-data-20261106.json" target="_blank" rel="noopener noreferrer">{en ? 'Data (ODbL)' : 'Данни (ODbL)'}</a><span aria-hidden="true"> · </span><a href={OFFICIAL_SOFIA_SOURCE_URL} target="_blank" rel="noopener noreferrer">{OFFICIAL_SOFIA_ATTRIBUTION}</a><span aria-hidden="true"> · </span><a href={OFFICIAL_SOFIA_LICENSE_URL} target="_blank" rel="noopener noreferrer">CC BY 4.0</a><span aria-hidden="true"> · </span><a href={OFFICIAL_SOFIA_PROCESSED_DATA_URL} target="_blank" rel="noopener noreferrer">{en ? 'Address points processed by GoRez' : 'Адресни точки, обработени от GoRez'}</a></p>
  </footer>
}
