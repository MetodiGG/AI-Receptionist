'use client'

import Link from 'next/link'
import { BrandLogo } from './brand-logo'
import { SUPPORT_EMAIL } from '../lib/product-config.mjs'
import { ProductMeasurement } from './product-measurement'

export function SiteFooter({ locale = 'bg', identity = {} }) {
  const en = locale === 'en'
  return <footer className="site-footer">
    <div className="site-footer-main"><Link href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo compact decorative/></Link><p>{en ? 'Online booking for appointment-based businesses.' : 'Онлайн резервации за бизнеси, които работят с часове.'}</p><a className="site-contact" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></div>
    <nav aria-label={en ? 'Footer navigation' : 'Навигация в долната част'}><Link href={`/?lang=${locale}`}>{en ? 'Find an appointment' : 'Намери час'}</Link><Link href={`/for-businesses?lang=${locale}`}>{en ? 'For businesses' : 'За бизнеса'}</Link><Link href={`/login?lang=${locale}`}>{en ? 'Business login' : 'Вход за бизнес'}</Link><Link href={`/privacy?lang=${locale}`}>{en ? 'Privacy' : 'Поверителност'}</Link><Link href={`/terms?lang=${locale}`}>{en ? 'Terms' : 'Условия'}</Link><Link href={`/partners?lang=${locale}`}>{en ? 'GoRez partners' : 'GoRez партньори'}</Link>{identity.dpaUrl && <a href={identity.dpaUrl}>{en ? 'Data processing agreement' : 'Споразумение за обработване на данни'}</a>}</nav>
    {identity.company && <address className="company-identity">{identity.company.name} · {en ? 'Company ID' : 'ЕИК'} {identity.company.eik}<br/>{identity.company.address}</address>}
    <ProductMeasurement locale={locale}/>
  </footer>
}
