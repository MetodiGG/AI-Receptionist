'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [email, setEmail] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/')
      else setEmail(data.session.user.email)
    })
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!email) return <p style={{ padding: 24 }}>Зареждане...</p>

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Табло</h2>
        <button onClick={logout}
          style={{ padding: '8px 14px', border: '1px solid #ccc', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
          Изход
        </button>
      </div>
      <p>Влязъл си като: <b>{email}</b></p>
      <div style={{ background: '#fff', padding: 20, borderRadius: 12 }}>
        Следва: въвеждане на бизнес, услуги и работно време.
      </div>
    </div>
  )
}
