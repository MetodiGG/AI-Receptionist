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
    <section><h2>{en ? 'Service discovery' : 'Откриване на услуги'}</h2>{type === 'privacy' ? <p>{en ? 'Discovery uses your query and chosen city. Optional browser location is requested only after your action and is not stored in search logs. When enabled, Google receives a service/location search; Places UI Kit connects your browser directly to Google. Optional AI interpretation sends only the short search text to OpenAI, not Google results, account data or precise browser coordinates. Do not include sensitive information. Queries and provider content are not persisted by GoRez; aggregate budget counters are retained for up to 90 days. Provider retention follows their policies.' : 'Търсенето използва заявката и избраното населено място. Незадължителното местоположение от браузъра се иска само след твое действие и не се пази в логовете за търсене. Когато е включен, Google получава търсене по услуга и място; Places UI Kit свързва браузъра директно с Google. Незадължителното AI разчитане изпраща само краткия текст до OpenAI, без резултати от Google, данни за акаунта или точните координати от браузъра. Не включвай чувствителна информация. GoRez не съхранява заявките или съдържанието от доставчика; обобщени броячи за бюджета се пазят до 90 дни. Сроковете на доставчиците следват техните политики.'} <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.</p> : <p>{en ? 'External Google Maps listings are not GoRez partners and have no verified GoRez appointment availability. Confirm their services, prices and times directly. GoRez booking remains available only for published partner businesses; times are rechecked before confirmation. Google-sourced functionality is also subject to the ' : 'Външните Google Maps места не са GoRez партньори и нямат проверена GoRez наличност. Уточни услугите, цените и часовете директно с тях. Резервациите през GoRez са само за публикувани партньорски бизнеси; часовете се проверяват отново преди потвърждение. За функционалността с данни от Google важат и '}<a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener noreferrer">Google Maps/Google Earth Additional Terms of Service</a>.</p>}</section>
    {supportEmail && <p>{en ? 'Platform contact' : 'Контакт за платформата'}: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>}
    {identity.company && <address>{identity.company.name} · {en?'Company ID':'ЕИК'} {identity.company.eik}<br/>{identity.company.address}</address>}
    {identity.dpaUrl && <p><a href={identity.dpaUrl}>{en?'Data processing agreement':'Споразумение за обработване на данни'}</a></p>}
    <p className="legal-note">{copy.note}</p>
    <div className="legal-actions"><Link href={`/${type === 'privacy' ? 'terms' : 'privacy'}?lang=${language}`}>{en ? (type === 'privacy' ? 'Terms' : 'Privacy') : (type === 'privacy' ? 'Общи условия' : 'Поверителност')}</Link><Link href={`/?lang=${language}`}>{en ? 'Home' : 'Към началото'}</Link></div>
  </article></main>
}
