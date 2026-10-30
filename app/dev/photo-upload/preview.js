'use client'

import { useState } from 'react'
import { PhotoPicker } from '../../../components/photo-picker'
import { fitPhotoFilesToBudget } from '../../../lib/photo-selection'
import { APPLICATION_PHOTO_BUDGET } from '../../../lib/business-media.mjs'

export default function PhotoUploadPreview() {
  const [files, setFiles] = useState([]), [preparing, setPreparing] = useState(false), [busy, setBusy] = useState(false), [result, setResult] = useState(null)
  async function check() {
    setBusy(true); setResult(null)
    try {
      const fitted = await fitPhotoFilesToBudget(files, APPLICATION_PHOTO_BUDGET), form = new FormData()
      form.append('payload', '{}'); form.append('photoConsent', 'true')
      fitted.forEach((file, index) => form.append(`gallery_${index}`, file))
      const response = await fetch('/dev/photo-upload/check', { method: 'POST', body: form })
      setResult({ status: response.status, ...await response.json() })
    } catch (error) { setResult({ error: error.message }) }
    finally { setBusy(false) }
  }
  return <main className="category-art-preview"><h1>Локална проверка на качване на снимки</h1><p>Само технически тест. Без бизнес, акаунт, база, Storage, имейли или платени услуги. Снимките се обработват в паметта.</p><PhotoPicker files={files} onChange={setFiles} onProcessing={setPreparing} disabled={busy}/><p role="status">Подготвени: {files.length} · {files.map(file => `${file.type}: ${file.size} bytes`).join(' · ')}</p><button className="primary-button" type="button" disabled={!files.length || busy || preparing} onClick={check}>Провери пакетното качване</button>{result && <pre role="status">{JSON.stringify(result, null, 2)}</pre>}</main>
}
