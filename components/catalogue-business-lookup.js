'use client'

import { BrandLoading } from './brand-loading'
import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './icon'

// Suggestions only: selecting a public catalogue entry is not proof of ownership.
export function CatalogueBusinessLookup({value,onChange,cityCode='',locale='bg',onSelect,disabled=false,loadedName=''}) {
  const en=locale==='en',id=useId(),root=useRef(null),request=useRef(null),detailRequest=useRef(null),version=useRef(0),chosenNames=useRef(new Set()),selectCallback=useRef(onSelect)
  const [matches,setMatches]=useState([]),[open,setOpen]=useState(false),[loading,setLoading]=useState(false),[loadingId,setLoadingId]=useState(''),[error,setError]=useState(''),[active,setActive]=useState(-1),[retry,setRetry]=useState(0)
  const listId=`${id}-matches`
  useEffect(()=>{selectCallback.current=onSelect},[onSelect])
  useEffect(()=>{
    const close=event=>{if(root.current&&!root.current.contains(event.target))setOpen(false)}
    document.addEventListener('pointerdown',close)
    return()=>{document.removeEventListener('pointerdown',close);request.current?.abort();detailRequest.current?.abort()}
  },[])
  useEffect(()=>{
    const generation=++version.current,query=value.trim()
    request.current?.abort();detailRequest.current?.abort();setLoadingId('')
    setError('');setActive(-1);setMatches([]);setOpen(false)
    if(query.length<2||chosenNames.current.has(value)||value===loadedName){setMatches([]);setLoading(false);setOpen(false);return}
    let alive=true
    const controller=new AbortController();request.current=controller
    const timer=setTimeout(async()=>{
      setLoading(true)
      try{
        const params=new URLSearchParams({q:query,lang:locale,...(cityCode?{city:cityCode}:{})})
        const response=await fetch(`/api/public/catalogue-onboarding?${params}`,{signal:controller.signal,cache:'no-store'})
        if(!response.ok)throw Error('CATALOGUE_LOOKUP_UNAVAILABLE')
        const result=await response.json()
        if(!alive||generation!==version.current)return
        setMatches(Array.isArray(result.businesses)?result.businesses:[]);setOpen(true)
      }catch(problem){if(alive&&generation===version.current&&problem.name!=='AbortError'){setMatches([]);setError(en?'Catalogue unavailable. You can enter your details below.':'Каталогът не отговаря. Можеш да попълниш данните по-долу.')}}
      finally{if(alive&&generation===version.current)setLoading(false)}
    },280)
    return()=>{alive=false;clearTimeout(timer);controller.abort()}
  },[value,cityCode,locale,retry,en,loadedName])

  async function select(match){
    request.current?.abort();detailRequest.current?.abort()
    const generation=++version.current,controller=new AbortController();detailRequest.current=controller
    setLoading(false);setLoadingId(match.id);setError('')
    try{
      const params=new URLSearchParams({id:match.id,lang:locale})
      const response=await fetch(`/api/public/catalogue-onboarding?${params}`,{signal:controller.signal,cache:'no-store'})
      if(!response.ok)throw Error('CATALOGUE_LOOKUP_UNAVAILABLE')
      const result=await response.json()
      if(generation!==version.current||controller.signal.aborted)return
      if(!result.business||!Array.isArray(result.services))throw Error('CATALOGUE_LOOKUP_UNAVAILABLE')
      chosenNames.current=new Set([value,result.business.name]);setOpen(false);setMatches([])
      selectCallback.current(result)
    }catch(problem){if(generation===version.current&&problem.name!=='AbortError')setError(en?'Could not load this business. Try again or enter the details.':'Не успяхме да заредим бизнеса. Опитай пак или въведи данните.')}
    finally{if(generation===version.current)setLoadingId('')}
  }
  function change(next){
    ++version.current;request.current?.abort();detailRequest.current?.abort();chosenNames.current.clear();setLoadingId('');setLoading(false);setMatches([]);setOpen(false);setError('');setActive(-1);onChange(next)
  }
  function manual(){++version.current;request.current?.abort();detailRequest.current?.abort();setLoading(false);setLoadingId('');setOpen(false);setMatches([]);setError('');setActive(-1);chosenNames.current.add(value)}
  function keyboard(event){
    if(event.key==='Escape'){setOpen(false);setActive(-1);return}
    if(event.key==='Tab'){setOpen(false);return}
    if(!matches.length||loadingId)return
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();setOpen(true);setActive(current=>current<0?(event.key==='ArrowDown'?0:matches.length-1):(current+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length)
    }else if(event.key==='Enter'&&open&&active>=0){event.preventDefault();select(matches[active])}
  }
  return <div className="field full catalogue-lookup" ref={root}>
    <label htmlFor="business-name">{en?'Business name':'Име на бизнеса'} *</label>
    <div className="catalogue-name-control"><Icon name="search"/><input id="business-name" className="text-input" value={value} maxLength={120} onChange={event=>change(event.target.value)} onFocus={()=>{if(matches.length)setOpen(true)}} onKeyDown={keyboard} placeholder={en?'Enter your business name':'Напиши името на бизнеса'} autoComplete="organization" autoFocus disabled={disabled} role="combobox" aria-autocomplete="list" aria-expanded={open&&matches.length>0} aria-controls={listId} aria-activedescendant={open&&active>=0?`${id}-match-${active}`:undefined} aria-describedby={loading||loadingId||error?`${id}-status`:undefined}/></div>
    {open&&matches.length>0&&<div className="catalogue-match-panel"><p>{en?'Already listed? Load your details.':'Вече си в каталога? Зареди данните си.'}</p><ul id={listId} role="listbox" aria-label={en?'Businesses in the catalogue':'Бизнеси в каталога'}>{matches.map((match,index)=><li key={match.id} role="presentation"><button id={`${id}-match-${index}`} type="button" role="option" aria-selected={active===index} className={active===index?'active':''} disabled={disabled||Boolean(loadingId)} onClick={()=>select(match)}><span><strong>{match.name}</strong><small>{match.address}</small></span><span className="catalogue-match-count">{match.serviceCount} {en?'services':'услуги'}<Icon name="arrow"/></span></button></li>)}</ul><button type="button" className="catalogue-manual-entry" onClick={manual}>{en?'Continue with this name':'Продължи с въведеното име'}</button></div>}
    {(loading||loadingId||error)&&<div id={`${id}-status`} className="catalogue-lookup-status" role="status">{error?<>{error} <button type="button" onClick={()=>{chosenNames.current.clear();setRetry(current=>current+1)}}>{en?'Retry':'Опитай пак'}</button></>:<BrandLoading locale={locale} announce={false} size={24} label={loadingId?(en?'Loading services and prices…':'Зареждаме услугите и цените…'):(en?'Searching the catalogue…':'Търсим в каталога…')}/>}</div>}
  </div>
}
