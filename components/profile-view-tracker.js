'use client'
import { useEffect,useRef } from 'react'
export function ProfileViewTracker({slug,disabled=false}) {
 const seen=useRef(new Set())
 useEffect(()=>{if(disabled)return;let timer;const send=()=>{if(document.visibilityState!=='visible'||seen.current.has(slug))return;seen.current.add(slug);fetch(`/api/public/${encodeURIComponent(slug)}/view`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID()}),keepalive:true}).catch(()=>{})};timer=setTimeout(send,0);document.addEventListener('visibilitychange',send);return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',send)}},[slug,disabled]);return null
}
