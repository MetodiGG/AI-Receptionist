'use client'

import { DateTime } from 'luxon'
import { useCallback, useEffect, useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'

function AssistantContent({ business, locale }) {
  const en = locale === 'en'
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async () => {
    const { data, error: requestError } = await supabase.from('conversations').select('id,customer_id,status,channel,created_at,updated_at,customer:customers(name,phone,email)').eq('business_id', business.id).order('updated_at', { ascending: false })
    if (requestError) { setError(requestError.message); setLoading(false); return }
    const visibleConversations = (data || []).filter((item) => item.customer_id)
    setConversations(visibleConversations)
    setSelected((current) => visibleConversations.find((item) => item.id === current?.id) || visibleConversations[0] || null)
    setLoading(false)
  }, [business.id])

  useEffect(() => { loadConversations() }, [loadConversations])
  useEffect(() => {
    if (!selected) { setMessages([]); setMessagesLoading(false); return }
    let cancelled = false
    setMessages([])
    setMessagesLoading(true)
    setError('')
    supabase.from('messages').select('id,role,content,created_at').eq('conversation_id', selected.id).order('created_at').then(({ data, error: requestError }) => {
      if (cancelled) return
      if (requestError) setError(requestError.message)
      else setMessages(data || [])
      setMessagesLoading(false)
    })
    return () => { cancelled = true }
  }, [selected])

  async function toggleResolved() {
    if (!selected) return
    const nextStatus = selected.status === 'resolved' ? 'open' : 'resolved'
    const { error: updateError } = await supabase.from('conversations').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', selected.id)
    if (updateError) { setError(updateError.message); return }
    setSelected({ ...selected, status: nextStatus })
    setConversations((current) => current.map((item) => item.id === selected.id ? { ...item, status: nextStatus } : item))
  }

  return (
    <main className="dashboard-content admin-page assistant-admin-page">
      <div className="admin-page-head"><div><p className="auth-kicker">{en ? 'Conversations' : 'Разговори'}</p><h2>{en ? 'Online assistant' : 'Онлайн асистент'}</h2><p>{en ? 'See how the assistant guides clients through booking.' : 'Виж как асистентът води клиентите през резервацията.'}</p></div><span className="status-chip"><span className="online-dot" /> {en ? 'Active' : 'Активен'}</span></div>
      {error && <p className="form-message" role="alert">{error}</p>}
      {loading && <div className="admin-loading"><span className="button-spinner" /> {en ? 'Loading conversations...' : 'Зареждаме разговорите...'}</div>}
      {!loading && conversations.length === 0 && <div className="empty-state"><h3>{en ? 'No conversations yet' : 'Все още няма разговори'}</h3><p>{en ? 'Conversations from the public page will appear here.' : 'Разговорите от публичната страница ще се появят тук.'}</p></div>}
      {!loading && conversations.length > 0 && <div className="inbox-layout">
        <aside className="conversation-list">{conversations.map((item) => <button type="button" className={selected?.id === item.id ? 'active' : ''} onClick={() => setSelected(item)} key={item.id}><span className="customer-avatar small">{(item.customer?.name || '?').slice(0, 1).toUpperCase()}</span><span><strong>{item.customer?.name || (en ? 'Visitor' : 'Посетител')}</strong><small>{item.customer?.phone || (en ? 'Website chat' : 'Чат от сайта')}</small></span><time>{DateTime.fromISO(item.updated_at).setLocale(locale).toRelative()}</time>{item.status === 'open' && <i />}</button>)}</aside>
        <section className="conversation-view">
          <header><div><h3>{selected?.customer?.name || (en ? 'Visitor' : 'Посетител')}</h3><p>{selected?.customer?.phone || selected?.customer?.email || (en ? 'Chat from the public page' : 'Чат от публичната страница')}</p></div><button className="ghost-button" type="button" onClick={toggleResolved}>{selected?.status === 'resolved' ? (en ? 'Reopen' : 'Отвори отново') : (en ? 'Mark as resolved' : 'Маркирай като приключен')}</button></header>
          <div className="conversation-messages">
            {messagesLoading && <div className="conversation-message-state"><span className="button-spinner" /><p>{en ? 'Loading conversation...' : 'Зареждаме разговора...'}</p></div>}
            {!messagesLoading && messages.length === 0 && <div className="conversation-message-state"><strong>{en ? 'No saved messages' : 'Няма запазени съобщения'}</strong><p>{en ? 'This conversation is empty or its history was removed when the client was deleted.' : 'Този разговор е празен или историята му е била премахната при изтриване на клиент.'}</p></div>}
            {!messagesLoading && messages.map((message) => <div className={`admin-chat-message ${message.role}`} key={message.id}><span>{message.content}</span><time>{DateTime.fromISO(message.created_at).setZone(business.timezone).toFormat('HH:mm')}</time></div>)}
          </div>
        </section>
      </div>}
    </main>
  )
}

export default function AssistantPage() {
  return <OwnerPage title={{ bg: 'Онлайн асистент', en: 'Online assistant' }}>{(props) => <AssistantContent {...props} />}</OwnerPage>
}
