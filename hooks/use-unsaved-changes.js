'use client'
import { useEffect } from 'react'
export function useUnsavedChanges(dirty, locale='bg') {
  useEffect(()=>{
    if(!dirty)return
    const message=locale==='en'?'You have unsaved changes. Leave this page?':'Има незапазени промени. Да напуснеш ли страницата?'
    const unload=event=>{event.preventDefault();event.returnValue=''}
    const navigate=event=>{
      if(event.defaultPrevented||event.gorezUnsavedHandled)return
      const link=event.target.closest?.('a[href]'),button=event.target.closest?.('[data-discard-navigation]')
      if(!link&&!button||link?.target==='_blank')return
      if(link){const url=new URL(link.href);if(url.hash&&url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search)return}
      event.gorezUnsavedHandled=true
      if(!window.confirm(message)){event.preventDefault();event.stopPropagation()}
    }
    window.addEventListener('beforeunload',unload);document.addEventListener('click',navigate,true)
    return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',navigate,true)}
  },[dirty,locale])
}
