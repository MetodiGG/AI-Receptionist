'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { PHOTO_INPUT_ACCEPT, preparePhotoFile } from '../lib/photo-selection'
import { mediaErrorText } from '../lib/business-media.mjs'
import { Icon } from './icon'

function SelectedPhoto({ file }) {
  const [src, setSrc] = useState('')
  useEffect(() => { const url = URL.createObjectURL(file); setSrc(url); return () => URL.revokeObjectURL(url) }, [file])
  return src ? <img src={src} alt="" className="photo-picker-preview"/> : null
}
export function PhotoPicker({ files, onChange, locale = 'bg', single = false, disabled = false, label, onProcessing, required = false }) {
  const id = useId(), en = locale === 'en', [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [progress, setProgress] = useState(''), generation = useRef(0), locked = useRef(false)
  useEffect(() => () => { generation.current++ }, [])
  async function choose(event) {
    const chosen = [...(event.target.files || [])]; event.target.value = ''
    if (!chosen.length || locked.current || disabled) return
    setError('')
    if ((!single && files.length + chosen.length > 12) || (single && chosen.length > 1)) { setError(mediaErrorText('MEDIA_LIMIT', locale)); return }
    locked.current = true
    const current = ++generation.current, prepared = [], failures = []
    setBusy(true); onProcessing?.(true)
    try {
      for (const [index, file] of chosen.entries()) {
        if (generation.current !== current) return
        setProgress(`${index + 1} / ${chosen.length}`)
        try { prepared.push(await preparePhotoFile(file)) } catch (problem) { failures.push(problem.message) }
      }
      if (generation.current !== current) return
      if (prepared.length) onChange(single ? prepared : [...files, ...prepared])
      if (failures.length) setError(`${failures.length > 1 ? `${failures.length} ${en ? 'photos were not added. ' : 'снимки не бяха добавени. '}` : ''}${mediaErrorText(failures[0], locale)}`)
    } finally { locked.current = false; if (generation.current === current) { setBusy(false); setProgress('') }; onProcessing?.(false) }
  }
  return <div className="photo-picker" aria-busy={busy}><label htmlFor={id} className="photo-picker-label"><Icon name="plus"/>{busy ? `${en ? 'Preparing' : 'Подготвяне'} ${progress}…` : label || (en ? 'Add photos (optional)' : 'Добави снимки (по желание)')}</label><input id={id} type="file" accept={PHOTO_INPUT_ACCEPT} multiple={!single} disabled={disabled || busy} onChange={choose} aria-required={required || undefined} aria-describedby={required ? `${id}-requirement` : undefined}/>
    {required && <p id={`${id}-requirement`} className="photo-picker-requirement">{en ? 'Add at least one photo of your business.' : 'Добави поне една снимка на бизнеса.'}</p>}
    {files.length > 0 && <p role="status">{files.length} {en ? (files.length === 1 ? 'photo ready to upload' : 'photos ready to upload') : (files.length === 1 ? 'снимка е готова за качване' : 'снимки са готови за качване')}</p>}
    {files.length > 0 && <ul className="photo-picker-list">{files.map((file, index) => <li key={index}><SelectedPhoto file={file}/><button type="button" className="secondary-button" disabled={disabled || busy} onClick={() => onChange(files.filter((_, i) => i !== index))} aria-label={`${en ? 'Remove photo' : 'Премахни снимка'} ${index + 1}`}>×</button></li>)}</ul>}
    {error && <p className="form-message" role="alert">{error}</p>}
  </div>
}
