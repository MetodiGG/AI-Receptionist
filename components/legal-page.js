'use client'

import Link from 'next/link'
import { BrandLogo } from './brand-logo'
import { LanguageSwitch } from './language-switch'
import { usePublicLocale } from '../hooks/use-public-locale'
import { LEGAL_COPY } from '../lib/legal-copy.mjs'
import { SUPPORT_EMAIL } from '../lib/product-config.mjs'

export function LegalPage({ type, initialLocale = 'bg', identity = {} }) {
  const { locale, setLocale, ready } = usePublicLocale(initialLocale, true)
  const language = ready ? locale : initialLocale
  const en = language === 'en'
  const copy = LEGAL_COPY[type][language]
  const supportEmail = SUPPORT_EMAIL
  return <main className="legal-page"><article lang={language}>
    <div className="legal-header"><Link className="legal-logo" href={`/?lang=${language}`} aria-label={en ? 'GoRez · Home' : 'GoRez · Начало'}><BrandLogo eager /></Link><LanguageSwitch locale={language} onChange={setLocale} compact /></div>
    <p className="auth-kicker">{copy.kicker}</p><h1>{copy.title}</h1><p className="legal-updated">{copy.updated}</p>
    {copy.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
    {supportEmail && <p>{en ? 'Platform contact' : 'Контакт за платформата'}: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>}
    {identity.company && <address>{identity.company.name} · {en?'Company ID':'ЕИК'} {identity.company.eik}<br/>{identity.company.address}</address>}
    {identity.dpaUrl && <p><a href={identity.dpaUrl}>{en?'Data processing agreement':'Споразумение за обработване на данни'}</a></p>}
    <p className="legal-note">{copy.note}</p>
    <div className="legal-actions"><Link href={`/${type === 'privacy' ? 'terms' : 'privacy'}?lang=${language}`}>{en ? (type === 'privacy' ? 'Terms' : 'Privacy') : (type === 'privacy' ? 'Общи условия' : 'Поверителност')}</Link><Link href={`/?lang=${language}`}>{en ? 'Home' : 'Към началото'}</Link></div>
  </article></main>
}
