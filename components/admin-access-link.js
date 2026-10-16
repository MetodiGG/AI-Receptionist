'use client'

import Link from 'next/link'
import { useEffect,useState } from 'react'
import { supabase,hasSupabaseConfig } from '../lib/supabase'
import { Icon } from './icon'

export function AdminAccessLink({locale='bg'}) {
  const [token,setToken]=useState(''),[allowed,setAllowed]=useState(false)
  useEffect(()=>{
    if(!hasSupabaseConfig)return
    let active=true
    supabase.auth.getSession().then(({data})=>{if(active)setToken(data.session?.access_token||'')}).catch(()=>{})
    const {data}=supabase.auth.onAuthStateChange((_event,session)=>{if(active)setToken(session?.access_token||'')})
    return()=>{active=false;data.subscription.unsubscribe()}
  },[])
  useEffect(()=>{
    setAllowed(false)
    if(!token)return
    const controller=new AbortController()
    fetch('/api/admin/access',{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:controller.signal})
      .then(async response=>{const data=await response.json();if(!controller.signal.aborted)setAllowed(response.ok&&data.admin===true)})
      .catch(()=>{})
    return()=>controller.abort()
  },[token])
  return allowed?<Link className="admin-access-link" href={`/admin?lang=${locale}`}><Icon name="settings"/>{locale==='en'?'Admin panel':'Админ панел'}</Link>:null
}
