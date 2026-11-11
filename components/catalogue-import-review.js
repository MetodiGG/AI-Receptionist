'use client'

import { useEffect, useRef, useState } from 'react'
import { containDialogTab } from '../lib/dialog-focus.mjs'

export function CatalogueImportReview({draft,locale='bg',replace=false,onConfirm,onCancel}) {
  const en=locale==='en',dialog=useRef(null),limit=draft.serviceLimit||40
  const [selected,setSelected]=useState(()=>draft.services.length<=limit?draft.services.map((_,i)=>i):[])
  useEffect(()=>{
    const target=dialog.current,previous=document.activeElement
    target.showModal()
    return()=>{target.close();if(previous?.isConnected)previous.focus()}
  },[])
  function toggle(index){setSelected(current=>current.includes(index)?current.filter(i=>i!==index):current.length<limit?[...current,index]:current)}
  return <dialog ref={dialog} className="catalogue-import-dialog" aria-labelledby="catalogue-import-title" onCancel={event=>{event.preventDefault();onCancel()}} onKeyDown={event=>containDialogTab(event,dialog.current)}>
    <header><div><h2 id="catalogue-import-title">{draft.business.name}</h2><p>{draft.business.address}</p></div><button type="button" className="icon-button" aria-label={en?'Close import':'Затвори зареждането'} onClick={onCancel}>×</button></header>
    {replace&&<p className="catalogue-replace-note">{en?'This will replace your current service list. Other entered details are kept.':'Това ще замени въведените услуги. Другите попълнени данни се запазват.'}</p>}
    <div className="catalogue-import-selection"><strong>{en?'Choose services':'Избери услуги'}</strong><span aria-live="polite">{selected.length} / {limit}</span></div>
    <ul>{draft.services.map((service,index)=><li key={index}><label><input type="checkbox" checked={selected.includes(index)} disabled={!selected.includes(index)&&selected.length>=limit} onChange={()=>toggle(index)}/><span><strong>{service.name}</strong><small>{service.catalogueHint?.priceLabel|| (en?'Price not published':'Няма публикувана цена')}</small></span></label>{service.catalogueHint?.requiresPriceConfirmation&&service.catalogueHint.description&&<details className="catalogue-import-conditions"><summary>{en?'Published conditions':'Публикувани условия'}</summary><p>{service.catalogueHint.description}</p></details>}</li>)}</ul>
    <footer><button type="button" className="secondary-button" onClick={onCancel}>{en?'Cancel':'Отказ'}</button><button type="button" className="primary-button" disabled={!selected.length} onClick={()=>onConfirm([...selected].sort((a,b)=>a-b))}>{en?'Load services':'Зареди услугите'} · {selected.length}</button></footer>
  </dialog>
}
