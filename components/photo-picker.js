'use client'

import { useEffect, useId, useState } from 'react'
import { preparePhotoFile } from '../lib/photo-selection'
import { mediaErrorText } from '../lib/business-media.mjs'
import { Icon } from './icon'

function SelectedPhoto({ file }) {
  const [src, setSrc] = useState('')
  useEffect(() => { const url = URL.createObjectURL(file); setSrc(url); return () => URL.revokeObjectURL(url) }, [file])
  return src ? <img src={src} alt="" className="photo-picker-preview"/> : null
}
export function PhotoPicker({ files, onChange, locale = 'bg', single = false, disabled = false, label, onProcessing }) {
  const id = useId(), en = locale === 'en', [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function choose(event) {
    const chosen = [...(event.target.files || [])]; event.target.value = ''
    if (!chosen.length) return
    setError('')
    if ((!single && files.length + chosen.length > 12) || (single && chosen.length > 1)) { setError(mediaErrorText('MEDIA_LIMIT', locale)); return }
    setBusy(true); onProcessing?.(true)
    try { const prepared = []; for (const file of chosen) prepared.push(await preparePhotoFile(file)); onChange(single ? prepared : [...files, ...prepared]) }
    catch (problem) { setError(mediaErrorText(problem.message, locale)) }
    finally { setBusy(false); onProcessing?.(false) }
  }
  return <div className="photo-picker"><label htmlFor={id} className="photo-picker-label"><Icon name="plus"/>{busy ? (en ? 'Preparing…' : 'Подготвяне…') : label || (en ? 'Add photos (optional)' : 'Добави снимки (по желание)')}</label><input id={id} type="file" accept="image/jpeg,image/png,image/webp" multiple={!single} disabled={disabled || busy} onChange={choose}/>
    {files.length > 0 && <ul className="photo-picker-list">{files.map((file, index) => <li key={index}><SelectedPhoto file={file}/><button type="button" className="secondary-button" disabled={disabled || busy} onClick={() => onChange(files.filter((_, i) => i !== index))} aria-label={`${en ? 'Remove photo' : 'Премахни снимка'} ${index + 1}`}>×</button></li>)}</ul>}
    {error && <p className="form-message" role="alert">{error}</p>}
  </div>
}
