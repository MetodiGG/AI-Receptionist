'use client'

import { useEffect, useRef, useState } from 'react'
import { containDialogTab } from '../lib/dialog-focus.mjs'

export function CatalogueImportReview({draft,locale='bg',replace=false,onConfirm,onCancel}) {
  const en=locale==='en',dialog=useRef(null),bulk=useRef(null),limit=draft.serviceLimit||40
  const [selected,setSelected]=useState(()=>draft.services.length<=limit?draft.services.map((_,i)=>i):[])
  const selectableCount=Math.min(draft.services.length,limit),allSelected=selectableCount>0&&selected.length===selectableCount,mixed=selected.length>0&&!allSelected
  useEffect(()=>{if(bulk.current)bulk.current.indeterminate=mixed},[mixed])
  useEffect(()=>{
    const target=dialog.current,previous=document.activeElement
    target.showModal()
    return()=>{target.close();if(previous?.isConnected)previous.focus()}
  },[])
  function toggle(index){setSelected(current=>current.includes(index)?current.filter(i=>i!==index):current.length<limit?[...current,index]:current)}
  function toggleAll(){setSelected(current=>current.length===selectableCount?[]:[...current,...draft.services.map((_,index)=>index).filter(index=>!current.includes(index))].slice(0,limit))}
  return <dialog ref={dialog} className="catalogue-import-dialog" aria-labelledby="catalogue-import-title" onCancel={event=>{event.preventDefault();onCancel()}} onKeyDown={event=>containDialogTab(event,dialog.current)}>
    <header><div><h2 id="catalogue-import-title">{draft.business.name}</h2><p>{draft.business.address}</p></div><button type="button" className="icon-button" aria-label={en?'Close import':'Затвори зареждането'} onClick={onCancel}>×</button></header>
    {replace&&<p className="catalogue-replace-note">{en?'This will replace your current service list. Other entered details are kept.':'Това ще замени въведените услуги. Другите попълнени данни се запазват.'}</p>}
    <div className="catalogue-import-selection"><label className="catalogue-import-select-all"><input ref={bulk} type="checkbox" checked={allSelected} aria-checked={mixed?'mixed':allSelected} aria-controls="catalogue-import-services" disabled={!selectableCount} onChange={toggleAll}/><strong>{allSelected?(en?'Deselect all':'Изчисти избора'):draft.services.length>limit?(en?`Select up to ${limit}`:`Избери до ${limit}`):(en?'Select all services':'Избери всички услуги')}</strong></label><span aria-live="polite">{selected.length} / {limit}</span></div>
    <ul id="catalogue-import-services">{draft.services.map((service,index)=><li key={index}><label><input type="checkbox" checked={selected.includes(index)} disabled={!selected.includes(index)&&selected.length>=limit} onChange={()=>toggle(index)}/><span><strong>{service.name}</strong><small>{service.catalogueHint?.priceLabel|| (en?'Price not published':'Няма публикувана цена')}</small></span></label>{(service.description||service.catalogueHint?.description)&&<details className="catalogue-import-conditions"><summary>{en?'Published conditions':'Публикувани условия'}</summary><p>{service.description||service.catalogueHint.description}</p></details>}</li>)}</ul>
    <footer><button type="button" className="secondary-button" onClick={onCancel}>{en?'Cancel':'Отказ'}</button><button type="button" className="primary-button" disabled={!selected.length} onClick={()=>onConfirm([...selected].sort((a,b)=>a-b))}>{en?'Load services':'Зареди услугите'} · {selected.length}</button></footer>
  </dialog>
}
