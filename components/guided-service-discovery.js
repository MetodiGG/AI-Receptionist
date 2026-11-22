'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './icon'
import { BrandLoading } from './brand-loading'
import { homeCategories } from '../lib/discovery/home.mjs'
import { subcategoryById } from '../lib/discovery/subcategories.mjs'
import { GUIDED_DISCOVERY_COPY } from '../lib/discovery/guided-copy.mjs'

function ChoicePhoto({ source, fallback }) {
  const [failed, setFailed] = useState(null)
  const src = failed === source ? fallback : source
  return <img className="guide-photo" src={src} width={64} height={64} alt="" loading="lazy" decoding="async" onError={() => setFailed(source)}/>
}

export function GuidedChoiceRow({ label, photo, fallbackPhoto, selected = false, onClick, children, kind = 'choice', expanded, controls, buttonRef }) {
  return <button ref={buttonRef} type="button" className={`guide-row guide-row--${kind}${photo ? ' has-photo' : ''}`} aria-pressed={kind === 'choice' ? selected : undefined} aria-expanded={expanded} aria-controls={controls} onClick={onClick}>
    <span className="guide-side guide-side--start" aria-hidden="true">{photo && <ChoicePhoto source={photo} fallback={fallbackPhoto || photo}/>}</span>
    <span className="guide-label">{label}{children}</span>
    <span className="guide-side guide-side--end" aria-hidden="true"><Icon name={kind === 'reveal' ? 'chevronDown' : 'arrow'}/></span>
  </button>
}

export function GuidedServiceDiscovery({ locale = 'bg', stage = 'closed', category = '', subcategory = '', options = [], loading = false, error = '', onStage, onCategory, onService, onRetry, navigationRef }) {
  const copy = GUIDED_DISCOVERY_COPY[locale], panelId = useId(), titleId = useId()
  const heading = useRef(null), launcher = useRef(null), previousStage = useRef(stage)
  const categories = homeCategories(locale), parent = categories.find(item => item.id === category)
  const selectedService = subcategoryById(subcategory)
  const expanded = stage === 'categories' || stage === 'services'
  const choices = options.filter(item => item.category === category && item.count > 0)
  useEffect(() => {
    const changed = previousStage.current !== stage
    previousStage.current = stage
    if (!changed) return
    const frame = requestAnimationFrame(() => {
      if (stage === 'closed') launcher.current?.focus({ preventScroll: true })
      else if (stage === 'categories' || stage === 'services') {
        heading.current?.focus({ preventScroll: true })
        navigationRef?.current?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'instant' : 'smooth' })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [stage, navigationRef])

  return <section className={`guided-discovery${expanded ? ' is-open' : ''}`} ref={navigationRef} aria-label={copy.choose} lang={locale}>
    {stage === 'closed' && <div className="guide-launch"><GuidedChoiceRow buttonRef={launcher} label={copy.choose} kind="reveal" expanded={false} controls={panelId} onClick={() => onStage('categories')}/></div>}
    {stage === 'results' && parent && <nav className="guide-summary" aria-label={copy.choose}>
      <button type="button" className="guide-summary-choice" onClick={() => onStage('categories')} aria-label={`${copy.changeCategory} · ${parent.label}`} aria-expanded={false} aria-controls={panelId}><img src={parent.photo} width={36} height={36} alt=""/><span>{parent.label}</span><Icon name="chevronDown"/></button>
      <span className="guide-summary-separator" aria-hidden="true">/</span>
      <button type="button" className="guide-summary-choice guide-summary-service" onClick={() => onStage('services')} aria-label={`${copy.changeService} · ${selectedService?.[locale] || copy.all}`} aria-expanded={false} aria-controls={panelId}><span>{selectedService?.[locale] || copy.all}</span><Icon name="chevronDown"/></button>
    </nav>}
    {stage === 'results' && !parent && <div className="guide-launch"><GuidedChoiceRow buttonRef={launcher} label={copy.choose} kind="reveal" expanded={false} controls={panelId} onClick={() => onStage('categories')}/></div>}
    <div className="guide-panel" id={panelId} hidden={!expanded} aria-labelledby={expanded ? titleId : undefined}>{expanded && <>
      <div className="guide-panel-toolbar">
        {stage === 'services' ? <button className="guide-back" type="button" onClick={() => onStage('categories')}><Icon name="back"/><span>{copy.back}</span><span aria-hidden="true"/></button> : <span className="guide-back-space" aria-hidden="true"/>}
        <span className="guide-step" aria-hidden="true">{stage === 'categories' ? '01' : '02'}<span> / 02</span></span>
        <button type="button" className="guide-close" onClick={() => onStage('closed')} aria-label={copy.close}><Icon name="close"/></button>
      </div>
      {stage === 'services' && parent && <p className="guide-parent"><img src={parent.photo} width={32} height={32} alt=""/><span>{parent.label}</span></p>}
      <h2 ref={heading} tabIndex={-1} id={titleId}>{stage === 'categories' ? copy.categories : copy.services}</h2>
      {stage === 'categories' ? <ul className="guide-choices">{categories.map(item => <li key={item.id}><GuidedChoiceRow label={item.label} photo={item.photo} selected={category === item.id} onClick={() => onCategory(item.id)}>{category === item.id && <small className="guide-selected">{copy.selected}</small>}</GuidedChoiceRow></li>)}</ul> : <>
        <GuidedChoiceRow label={copy.all} selected={!subcategory} onClick={() => onService('')}><small className="guide-all-context">{parent?.label}</small></GuidedChoiceRow>
        {loading && <div className="guide-loading" role="status"><BrandLoading size={24} decorative/><span>{copy.loading}</span></div>}
        {error && <div className="guide-feedback" role="alert"><p>{copy.failed}</p><button type="button" className="guide-retry" onClick={onRetry}>{copy.retry}<Icon name="arrow"/></button></div>}
        {!loading && !error && <ul className="guide-choices">{choices.map(item => <li key={item.id}><GuidedChoiceRow label={item[locale] || item.label} photo={item.photo} fallbackPhoto={parent?.photo} selected={subcategory === item.id} onClick={() => onService(item.id)}>{subcategory === item.id && <small className="guide-selected">{copy.selected}</small>}</GuidedChoiceRow></li>)}</ul>}
        {!loading && !error && !choices.length && <p className="guide-no-services">{copy.noServices}</p>}
      </>}
    </>}</div>
  </section>
}
