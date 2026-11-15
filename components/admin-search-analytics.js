'use client'

import { useEffect, useState } from 'react'
import { BrandLoading } from './brand-loading'
import { searchAnalyticsTopicLabel } from '../lib/search-analytics-vocabulary.mjs'

export function AdminSearchAnalytics({ send, locale = 'bg', preview = false }) {
  const en = locale === 'en'
  const [days, setDays] = useState('30'), [data, setData] = useState(null), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0)
  useEffect(() => {
    if (preview) return
    let current = true
    setData(null); setFailed(false)
    send(`/api/admin/search-analytics?days=${days}`).then(value => { if (current) setData(value) }).catch(() => { if (current) setFailed(true) })
    return () => { current = false }
  }, [send, days, preview, retry])
  const keys = ['searches', 'zeroResults', 'errors', 'suggestionSelections', 'profileOpens']
  const labels = en ? ['Searches', 'Zero results', 'Search errors', 'Suggestion selections', 'Profile opens'] : ['Търсения', 'Без резултат', 'Грешки при търсене', 'Избрани предложения', 'Отворени профили']
  return <section className="settings-panel admin-search-analytics" aria-labelledby="search-analytics-title">
    <h3 id="search-analytics-title">{en ? 'Search performance' : 'Ефективност на търсенето'}</h3>
    <label>{en ? 'Period' : 'Период'}<select value={days} onChange={event => setDays(event.target.value)}><option value="7">{en ? 'Last 7 days' : 'Последните 7 дни'}</option><option value="30">{en ? 'Last 30 days' : 'Последните 30 дни'}</option></select></label>
    {preview ? <p>{en ? 'Local preview; no live search metrics loaded.' : 'Локален преглед; не са заредени реални показатели.'}</p>
      : failed ? <p role="status">{en ? 'Search metrics are temporarily unavailable.' : 'Показателите за търсенето временно не са достъпни.'} <button className="link-button" type="button" onClick={() => setRetry(value => value + 1)}>{en ? 'Retry' : 'Опитай отново'}</button></p>
      : !data ? <div role="status"><BrandLoading announce={false} label={en ? 'Loading search metrics' : 'Зареждане на показатели'}/></div>
      : !data.enabled ? <p>{en ? 'Optional search measurement is disabled. No search events are being collected.' : 'Незадължителното измерване на търсенето е изключено. Не се събират събития от търсенето.'}</p>
      : <><div className="admin-console-kpis">{keys.map((key, index) => <article key={key}><small>{labels[index]}</small><strong>{data.summary.totals[key]}</strong></article>)}</div>
        <h4>{en ? 'Services needing attention' : 'Услуги, които изискват внимание'}</h4>
        {!data.summary.topics.length ? <p>{en ? 'Not enough aggregate events yet. Service rows require at least five search events.' : 'Все още няма достатъчно обобщени данни. Услуга се показва след поне пет събития на търсене.'}</p>
          : <ul className="admin-search-topic-list">{data.summary.topics.map(topic => <li key={topic.topic}><strong>{searchAnalyticsTopicLabel(topic.topic, locale)}</strong><span>{topic.searches} {en ? 'searches' : 'търсения'} · {topic.zeroResults} {en ? 'without results' : 'без резултат'} · {topic.errors} {en ? 'errors' : 'грешки'}</span></li>)}</ul>}
        <p>{en ? 'Consented events, not unique people or popularity rankings. Only a closed, ordinary-service vocabulary and totals are stored; private/unknown searches share an unspecified bucket. No query text, business IDs, coordinates, IP or user identifiers. UTC daily aggregates are retained for 30 days with daily cleanup.' : 'Събития със съгласие, не уникални хора или класация по популярност. Пазят се само общи услуги от затворен речник и броячи; лични и непознати търсения са в обща неуточнена група. Без текст на заявки, бизнес ID, координати, IP или потребителски идентификатори. Дневните обобщения са по UTC за 30 дни с ежедневно почистване.'}</p>
      </>}
  </section>
}
