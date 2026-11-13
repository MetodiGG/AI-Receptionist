'use client'

import { BrandLoading } from './brand-loading'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { REVIEW_DIMENSIONS } from '../lib/reviews.mjs'
import { PartnerGoogleRating } from './partner-google-rating'

export function ReviewStars({ value, label }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const shape = 'm12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.6l6.3-.9L12 3Z'
  return <span className="review-stars" role="img" aria-label={label || `${value} / 5`}>
    {[1, 2, 3, 4, 5].map(number => <svg key={number} viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id={`${id}-${number}`}><rect width={24 * Math.max(0, Math.min(1, Number(value) - number + 1))} height="24" /></clipPath></defs><path d={shape} /><path className="review-star-fill" d={shape} clipPath={`url(#${id}-${number})`} /></svg>)}
  </span>
}

export function useBusinessReviews(slug, preview = null) {
  const [data, setData] = useState(preview)
  const [status, setStatus] = useState(preview ? 'ready' : 'loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [pageError, setPageError] = useState(false)
  const generation = useRef(0), inFlight = useRef(false)
  useEffect(() => {
    if (preview) return
    const controller = new AbortController(), version = ++generation.current
    setData(null); setStatus('loading'); setPageError(false); inFlight.current = false
    fetch(`/api/public/${slug}/reviews`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error('Unavailable'); return response.json() })
      .then(result => { if (!controller.signal.aborted && version === generation.current) { setData(result); setStatus('ready') } })
      .catch(() => { if (!controller.signal.aborted && version === generation.current) setStatus('error') })
    return () => controller.abort()
  }, [slug, preview])
  const loadMore = useCallback(async () => {
    if (!data?.next || inFlight.current || preview) return
    const version = generation.current
    inFlight.current = true; setLoadingMore(true); setPageError(false)
    try {
      const query = new URLSearchParams(data.next)
      const response = await fetch(`/api/public/${slug}/reviews?${query}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Unavailable')
      const result = await response.json()
      if (version === generation.current) setData(current => ({ ...result, items: [...current.items, ...result.items.filter(item => !current.items.some(existing => existing.id === item.id))] }))
    } catch { if (version === generation.current) setPageError(true) }
    finally { if (version === generation.current) { inFlight.current = false; setLoadingMore(false) } }
  }, [data, slug, preview])
  return { data, status, loadMore, loadingMore, pageError }
}

export function ReviewSummary({ summary, status, locale = 'bg', compact = false }) {
  const en = locale === 'en'
  if (status === 'loading') return <BrandLoading locale={locale} size={24} label={en ? 'Loading reviews…' : 'Зареждане на отзиви…'}/>
  if (status === 'error') return <span className="review-summary-muted">{en ? 'Reviews are temporarily unavailable' : 'Отзивите временно не са достъпни'}</span>
  if (!summary?.count) return <span className="review-summary-muted">{en ? 'No reviews yet' : 'Все още няма отзиви'}</span>
  return <div className={`review-summary${compact ? ' compact' : ''}`}>
    <strong>{Number(summary.average).toFixed(1)}</strong><ReviewStars value={summary.average} />
    <span>{summary.count} {en ? (summary.count === 1 ? 'review' : 'reviews') : (summary.count === 1 ? 'отзив' : 'отзива')}</span>
  </div>
}

// These are separate, attributed sources, not a blended average/count. A GoRez
// rating without a comment still counts in the existing GoRez SQL aggregate.
export function PartnerReviewSummary({ slug, reviews, locale = 'bg', compact = false, preview = false, includeGoogle = true }) {
  const { data, status } = reviews
  return <div className={`partner-review-summary${compact ? ' compact' : ''}`}>
    {includeGoogle && <PartnerGoogleRating slug={slug} locale={locale} preview={preview}/>}
    {!(status === 'ready' && !data?.summary?.count && compact) && <div className="partner-gorez-rating"><span className="reputation-source" translate="no">GoRez</span><ReviewSummary summary={data?.summary} status={status} locale={locale} compact={compact}/></div>}
  </div>
}

export function BusinessReviews({ reviews, locale = 'bg' }) {
  const en = locale === 'en', { data, status, loadMore, loadingMore, pageError } = reviews
  const empty = status === 'ready' && !data?.summary?.count
  return <section className="business-profile-section business-reviews-section" id="business-reviews" aria-labelledby="business-reviews-heading">
    <header className="business-section-heading"><h2 id="business-reviews-heading">{en ? 'Reviews & ratings' : 'Отзиви и оценки'}</h2>{!empty && <ReviewSummary summary={data?.summary} status={status} locale={locale}/>}</header>
    {empty ? <div className="business-reviews-empty">
      <span className="business-reviews-empty-stars" aria-hidden="true">{[1, 2, 3, 4, 5].map(number => <svg key={number} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.6l6.3-.9L12 3Z" /></svg>)}</span>
      <p>{en ? 'There are no reviews or ratings for this business yet.' : 'Все още няма отзиви и оценки за този бизнес.'}</p>
    </div> : <>
    {Boolean(data?.summary?.count) && <div className="review-dimensions">{Object.entries(REVIEW_DIMENSIONS).map(([key, labels]) => data.summary[key] != null && <div key={key}><span>{labels[locale]}</span><strong>{Number(data.summary[key]).toFixed(1)} <span aria-hidden="true">/ 5</span></strong></div>)}</div>}
    <div className="business-review-list">{data?.items?.map(item => <article key={item.id} className="business-review">
      <div className="business-review-heading"><div><strong>{item.display_name}</strong><span className="verified-visit">{en ? 'Verified visit' : 'Потвърдено посещение'}</span></div><ReviewStars value={item.rating} /></div>
      {item.comment && <p>{item.comment}</p>}
      <time dateTime={item.created_at}>{new Intl.DateTimeFormat(en ? 'en-GB' : 'bg-BG', { dateStyle: 'medium' }).format(new Date(item.created_at))}</time>
    </article>)}</div>
    {pageError && <p role="alert" className="booking-inline-error">{en ? 'Could not load more reviews. Try again.' : 'Останалите отзиви не се заредиха. Опитай отново.'}</p>}
    {data?.next && <button type="button" className="secondary-button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? <BrandLoading locale={locale} size={20}/> : (en ? 'More reviews' : 'Още отзиви')}</button>}
    </>}
  </section>
}
