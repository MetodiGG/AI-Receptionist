'use client'

import { useRef, useState } from 'react'

export function PreviewReviewMailControl() {
  const [secret, setSecret] = useState(''), [busy, setBusy] = useState(false), [result, setResult] = useState(null)
  const locked = useRef(false)
  async function submit(event) {
    event.preventDefault()
    if (locked.current) return
    locked.current = true; setBusy(true); setResult(null)
    try {
      // A normal HTML form POST with no-referrer can have Origin:null. Explicit
      // CORS-mode fetch preserves Origin while retaining no-referrer privacy.
      const response = await fetch('/api/operator/preview-review-test', {
        method: 'POST', mode: 'cors', credentials: 'same-origin', cache: 'no-store', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ secret }).toString(),
      })
      const body = await response.json()
      setResult(response.ok ? { accepted: body.accepted || 0, alreadyAccepted: Boolean(body.alreadyAccepted), failed: body.failed || 0, skipped: body.skipped || 0 } : { error: body.error || 'UNCONFIRMED' })
    } catch { setResult({ error: 'UNCONFIRMED' }) }
    finally { setSecret(''); setBusy(false); locked.current = false }
  }
  const accepted = result?.accepted || result?.alreadyAccepted
  return <><form onSubmit={submit}><label className="review-form-field"><span>Само за оператор: отделна тестова тайна</span><input type="password" name="secret" required minLength={32} autoComplete="off" value={secret} onChange={event => setSecret(event.target.value)} /></label><button className="primary-button" type="submit" disabled={busy || Boolean(accepted)}>{busy ? 'Обработване…' : 'Изпрати един одобрен тестов имейл'}</button></form>{result && <div role="status"><h2>{accepted ? 'Приет от доставчика — провери пощата' : 'Няма потвърдено изпращане'}</h2><pre>{JSON.stringify(result, null, 2)}</pre><p>Приемането от доставчика не доказва доставка във „Входящи“.</p></div>}</>
}
