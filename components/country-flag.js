'use client'

import { useId } from 'react'

// Country flags drawn locally. The bevel/gloss is decorative;
// the enclosing language button supplies the localized accessible name.
export function CountryFlag({ locale }) {
  const id = useId().replace(/[^a-z0-9_-]/gi, ''), clip = `flag-${id}`, gloss = `flag-gloss-${id}`
  return <svg className="country-flag" viewBox="0 0 44 34" aria-hidden="true" focusable="false">
    <defs><clipPath id={clip}><path d="M4 7C14 2 29 9 40 4v23c-11 5-26-2-36 3V7Z"/></clipPath><linearGradient id={gloss} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#704122" stopOpacity=".13"/><stop offset=".3" stopColor="#fff" stopOpacity=".4"/><stop offset=".65" stopColor="#704122" stopOpacity=".1"/><stop offset="1" stopColor="#fff" stopOpacity=".2"/></linearGradient></defs>
    <g clipPath={`url(#${clip})`}>{locale === 'en' ? <><path d="M0 0h44v34H0Z" fill="#233f78"/><path d="m4 5 36 24M40 5 4 29" stroke="#fff" strokeWidth="6"/><path d="m4 5 36 24M40 5 4 29" stroke="#c9363f" strokeWidth="2.2"/><path d="M22 3v29M2 17h40" stroke="#fff" strokeWidth="8"/><path d="M22 3v29M2 17h40" stroke="#c9363f" strokeWidth="4"/></> : <><path d="M4 7C14 2 29 9 40 4v8c-11 5-26-2-36 3V7Z" fill="#fff"/><path d="M4 15C14 10 29 17 40 12v8c-11 5-26-2-36 3v-8Z" fill="#168263"/><path d="M4 23C14 18 29 25 40 20v10c-11 5-26-2-36 3V23Z" fill="#ce3a41"/></>}<path d="M0 0h44v34H0Z" fill={`url(#${gloss})`}/></g>
  </svg>
}
