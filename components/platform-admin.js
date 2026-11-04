'use client'

import Link from 'next/link'
import { useCallback,useEffect,useId,useMemo,useRef,useState } from 'react'
import { BrandLogo } from './brand-logo'
import { Icon } from './icon'
import { LanguageSwitch } from './language-switch'
import { HomeLink } from './home-link'
import { usePublicLocale } from '../hooks/use-public-locale'
import { supabase,createReauthenticationClient } from '../lib/supabase'
import { filterPartnerLeads,partnerReviewGroup } from '../lib/partner-leads.mjs'
import { AdminApplicationCard } from './admin-application-card'
import { BusinessCategoryIcon } from './business-category-icon'
import { getIndustryLabel } from '../lib/public-locale.mjs'
import { businessState,filterAdminBusinesses } from '../lib/platform-business-view.mjs'
import { AdminBusinessEditor } from './admin-business-editor'
import { scheduleRows } from '../lib/business-schedule.mjs'
import { AdminExternalBookingLinks } from './admin-external-booking-links'
import { AdminReferralAnalytics } from './admin-referral-analytics'

const STATES={pending:['Чака одобрение','Awaiting approval'],published:['Публикуван','Published'],unpublished:['Непубликуван','Unpublished'],suspended:['Спрян от админ','Suspended'],archived:['В кошчето','In trash']}
const ACTIONS={publish:['Публикувай','Publish'],suspend:['Спри записванията','Suspend bookings'],archive:['Премести в кошчето','Move to trash'],restore:['Възстанови като спрян','Restore as suspended'],delete:['Изтрий окончателно','Delete permanently']}
const LEAD_GROUPS={all:['Всички','All'],pending:['За преглед','To review'],approved:['Одобрени','Approved'],rejected:['Отказани','Rejected'],completed:['Приключени','Completed']}
const NOTICES={
  'lead-saved':['Заявката е запазена.','Application saved.'],
  'lead-approved':['Заявката е одобрена за настройване. Публикуването на бизнеса е отделна стъпка.','Application approved for setup. Business publication is a separate step.'],
  'application-published':['Бизнесът е одобрен и публикуван. Собственикът може да влезе.','Business approved and published. The owner can now sign in.'],
  'lead-rejected':['Заявката е отказана. Можеш да промениш решението от „Детайли“.','Application rejected. You can change the decision in Details.'],
  'business-saved':['Промяната е запазена.','Change saved.'],
}
const ERRORS={
  ADMIN_UNAVAILABLE:['Панелът временно не е достъпен. Опитай отново.','The panel is temporarily unavailable. Try again.'],
  UNAUTHORIZED:['Сесията е приключила. Влез отново.','Your session has ended. Sign in again.'],
  FORBIDDEN:['Този профил няма администраторски достъп.','This account does not have administrator access.'],
  BUSINESS_CHANGED:['Бизнесът е променен междувременно. Затвори прозореца и обнови.','This business has changed. Close this dialog and refresh.'],
  BUSINESS_NOT_FOUND:['Бизнесът вече не съществува. Обнови списъка.','This business no longer exists. Refresh the list.'],
  LEAD_CHANGED:['Заявката е променена междувременно. Обнови списъка и провери статуса, преди да опиташ отново.','This application changed. Refresh and check its status before trying again.'],
  CONFIRMATION_MISMATCH:['Напиши точно адреса на избрания бизнес.','Type the exact business slug.'],
  SETUP_REQUIRED:['Провери активните услуги и настройките на режима: GoRez календар изисква екип и график; външният режим — потвърден линк, разрешение и публично работно време.','Check active services and booking-mode setup: GoRez calendar needs staff and schedules; external mode needs an approved destination, permission and public opening hours.'],
  OWNER_ACTIVATION_REQUIRED:['Входът на собственика не може да бъде активиран. Провери заявката и имейла; бизнесът не е публикуван.','Owner sign-in could not be activated. Check the application and email; the business was not published.'],
  RESTORE_FIRST:['Първо възстанови бизнеса от кошчето.','Restore the business from trash first.'],
  ARCHIVE_FIRST:['Първо премести бизнеса в кошчето.','Move this business to trash first.'],
  UPCOMING_BOOKINGS:['Има предстоящи резервации. Окончателното изтриване е блокирано; данните остават в кошчето.','There are upcoming bookings. Permanent deletion is blocked; data remains in trash.'],
  REAUTH_REQUIRED:['За окончателно изтриване потвърди отново паролата си.','Confirm your password again for permanent deletion.'],
  REAUTH_FAILED:['Паролата не е потвърдена. Нищо не е изтрито.','Password verification failed. Nothing was deleted.'],
  MFA_REQUIRED:['Нужно е MFA удостоверяване. Използвай кошчето; не изключвай MFA за изтриване.','MFA verification is required. Use trash; do not disable MFA for deletion.'],
  RATE_LIMITED:['Твърде много промени. Изчакай и опитай отново.','Too many changes. Wait and try again.'],
  VALIDATION_ERROR:['Провери потвърждението и причината.','Check your confirmation and reason.'],
}
const EXPLANATIONS={
  publish:['Публикува профила с избрания начин на резервации. Проверява услугите и готовността за съответния режим.','Publishes the profile with its chosen booking method. Checks services and readiness for that mode.'],
  suspend:['Спира новите резервации и скрива публичната страница. Съществуващите часове и техните известия остават непроменени.','Stops new bookings and hides the public page. Existing visits and their emails are unchanged.'],
  archive:['Скрива бизнеса и спира новите резервации и чакащите имейли. Данните и записаните часове остават. Можеш да го възстановиш.','Hides the business and stops new bookings and pending emails. Data and existing visits remain. You can restore it.'],
  restore:['Възстановява бизнеса като спрян. Публикувай отделно, когато е готов. Спрените имейли няма да се изпратят повторно.','Restores the business as suspended. Publish separately when ready. Stopped emails will not be replayed.'],
  delete:['Необратимо изтрива този бизнес, услугите, екипа, клиентите, резервациите и разговорите му. Няма възстановяване от GoRez. Резервни копия може да се пазят според срока на доставчика.','Permanently deletes this business, its services, team, customers, bookings and conversations. No recovery in GoRez. Provider backups may retain data according to their retention policy.'],
}
const text=(map,key,en)=>(map[key]||map.ADMIN_UNAVAILABLE)?.[en?1:0]||key
const stamp=(value,locale)=>new Intl.DateTimeFormat(locale==='en'?'en-GB':'bg-BG',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))

async function adminRequest(path,options={}) {
  const {data,error}=await supabase.auth.getSession()
  if(error||!data.session)throw {code:'UNAUTHORIZED'}
  const response=await fetch(path,{...options,cache:'no-store',headers:{Authorization:`Bearer ${data.session.access_token}`,...options.headers}})
  const body=await response.json()
  if(!response.ok)throw {code:body.error?.code||'ADMIN_UNAVAILABLE'}
  return body
}

function Dialog({children,onClose,busy,title,id}) {
  const ref=useRef(null)
  useEffect(()=>{
    const opener=document.activeElement,overflow=document.body.style.overflow
    document.body.style.overflow='hidden';ref.current?.querySelector('h2')?.focus()
    return()=>{document.body.style.overflow=overflow;opener?.focus()}
  },[])
  function keydown(event){
    if(event.key==='Escape'&&!busy){event.preventDefault();onClose()}
    if(event.key!=='Tab')return
    const items=[...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],select:not(:disabled)')]
    if(!items.length){event.preventDefault();return}
    const first=items[0],last=items.at(-1)
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===ref.current.querySelector('h2'))){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
  return <div className="platform-dialog-backdrop" onKeyDown={keydown}><section className="platform-dialog" ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} aria-busy={busy}><header><h2 id={id} tabIndex={-1}>{title}</h2><button className="secondary-button" onClick={onClose} disabled={busy} type="button" aria-label="Close / Затвори">×</button></header>{children}</section></div>
}

export function PlatformAdmin({preview=null}) {
  const {locale,setLocale}=usePublicLocale(),en=locale==='en',titleId=useId()
  const [session,setSession]=useState(preview?{user:{email:'admin@example.com'}}:null),[checking,setChecking]=useState(!preview)
  const [overview,setOverview]=useState(preview?.overview||null),[leads,setLeads]=useState(preview?.leads||[]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[loading,setLoading]=useState(false)
  const [tab,setTab]=useState('businesses'),[query,setQuery]=useState(''),[state,setState]=useState('all'),[leadFilter,setLeadFilter]=useState('all'),[saving,setSaving]=useState('')
  const [selected,setSelected]=useState(null),[detail,setDetail]=useState(null),[detailError,setDetailError]=useState(''),[action,setAction]=useState(''),[reason,setReason]=useState(''),[confirmation,setConfirmation]=useState(''),[ack,setAck]=useState(false),[password,setPassword]=useState(''),[busy,setBusy]=useState(false)
  const [editing,setEditing]=useState(''),[editorDirty,setEditorDirty]=useState(false)
  const [linkDirty,setLinkDirty]=useState(false)
  const sequence=useRef(0),detailSequence=useRef(0),mutating=useRef(false),leadMutating=useRef(false)
  useEffect(()=>{
    if(preview)return
    let active=true
    supabase.auth.getSession().then(({data})=>{if(active){setSession(data.session);setChecking(false)}}).catch(()=>{if(active)setChecking(false)})
    const {data}=supabase.auth.onAuthStateChange((_event,next)=>{if(active){setSession(next);setChecking(false)}})
    return()=>{active=false;data.subscription.unsubscribe()}
  },[preview])
  const load=useCallback(async()=>{
    if(preview)return
    const version=++sequence.current
    setLoading(true);setError('')
    try{
      const [data,requests]=await Promise.all([adminRequest('/api/admin/overview'),adminRequest('/api/admin/partner-leads')])
      if(version===sequence.current){setOverview(data);setLeads(requests.leads||[])}
    }catch(problem){if(version===sequence.current){setError(problem.code||'ADMIN_UNAVAILABLE');setOverview(null);setLeads([]);setSelected(null);setDetail(null);setPassword('')}}
    finally{if(version===sequence.current)setLoading(false)}
  },[preview])
  useEffect(()=>{
    if(session)load()
    else {sequence.current++;setOverview(null);setLeads([]);setSelected(null);setPassword('')}
    return()=>{sequence.current++}
  },[session,load])
  const businesses=useMemo(()=>filterAdminBusinesses(overview?.businesses||[],query,state),[overview,query,state])
  const visibleLeads=filterPartnerLeads(leads,leadFilter)
  const newLeads=leads.filter(row=>row.status==='new').length
  const fail=code=>text(ERRORS,code,en)
  function close(){if(busy)return;if(editorDirty&&!window.confirm(en?'Discard unsaved changes?':'Да се откажем ли от незапазените промени?'))return;detailSequence.current++;setSelected(null);setDetail(null);setAction('');setEditing('');setEditorDirty(false);setDetailError('');setPassword('')}
  async function open(row){
    const version=++detailSequence.current
    setSelected(row);setDetail(null);setAction('');setDetailError('');setReason('');setConfirmation('');setAck(false);setPassword('')
    setEditing('');setEditorDirty(false)
    try{const data=preview?{...preview.details[row.id],business:row}:await adminRequest(`/api/admin/businesses/${row.id}`);if(version===detailSequence.current)setDetail(data)}
    catch(problem){if(version===detailSequence.current)setDetailError(problem.code||'ADMIN_UNAVAILABLE')}
  }
  function choose(value){setAction(value);setReason('');setConfirmation('');setAck(false);setPassword('');setDetailError('')}
  async function contentSaved(input){
    setEditorDirty(false)
    if(preview){
      const nextBusiness={...detail.business,...(input?.section==='business'?input.payload:{}),content_revision:(detail.business.content_revision||0)+1}
      const result={...detail,business:nextBusiness,...(input?.section==='services'?{services:input.payload.map(row=>({...row,id:row.id||crypto.randomUUID()}))}:{}),...(input?.section==='staff'?{staff:input.payload.map(row=>({...row,id:row.id||crypto.randomUUID()}))}:{}),...(input?.section==='hours'?{hours:[...(detail.hours||[]).filter(row=>row.staff_id!==input.payload.staffId),...scheduleRows(input.payload.days).map(row=>({...row,staff_id:input.payload.staffId}))]}:{})}
      setDetail(result);setSelected(row=>({...row,...nextBusiness}));setOverview(current=>({...current,businesses:current.businesses.map(row=>row.id===nextBusiness.id?{...row,...nextBusiness}:row)}));setNotice('business-saved');return
    }
    const current=detailSequence.current
    const next=await adminRequest(`/api/admin/businesses/${selected.id}`)
    if(current!==detailSequence.current)return
    setDetail(next);setSelected(row=>({...row,...next.business}));setNotice('business-saved')
    setOverview(value=>({...value,businesses:value.businesses.map(row=>row.id===next.business.id?{...row,...next.business}:row)}))
  }
  async function perform(event){
    event.preventDefault()
    if(mutating.current||!detail||!action||confirmation!==detail.business.slug||!ack||reason.trim().length<3)return
    if(action==='delete'&&(!password||detail.counts.upcoming>0))return
    mutating.current=true;setBusy(true);setDetailError('')
    let reauth
    try{
      const payload={action,revision:detail.business.platform_revision,confirmation,reason,acknowledged:ack}
      if(preview){
        const next=action==='archive'?'archived':action==='restore'||action==='suspend'?'suspended':'enabled'
        setOverview(current=>{
          const businesses=action==='delete'?current.businesses.filter(row=>row.id!==selected.id):current.businesses.map(row=>row.id===selected.id?{...row,platform_status:next,active:action==='publish'?true:row.active,platform_revision:row.platform_revision+1}:row)
          return {...current,businesses,totals:{...current.totals,active:businesses.filter(row=>businessState(row)==='published').length,archived:businesses.filter(row=>businessState(row)==='archived').length}}
        })
      }else if(action==='delete'){
        reauth=createReauthenticationClient()
        const {data,error:problem}=await reauth.auth.signInWithPassword({email:session.user.email,password})
        setPassword('')
        if(problem||!data.session||data.user.id!==session.user.id)throw {code:'REAUTH_FAILED'}
        const response=await fetch(`/api/admin/businesses/${selected.id}`,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify(payload)})
        const body=await response.json()
        if(!response.ok)throw {code:body.error?.code||'ADMIN_UNAVAILABLE'}
        if(body.result?.deleted!==true||body.result.id!==selected.id)throw {code:'ADMIN_UNAVAILABLE'}
      }else await adminRequest(`/api/admin/businesses/${selected.id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      setSelected(null);setDetail(null);setAction('');setPassword('');setNotice('business-saved')
      if(!preview)await load()
    }catch(problem){setPassword('');setDetailError(problem.code||'ADMIN_UNAVAILABLE')}
    finally{if(reauth)await reauth.auth.signOut({scope:'local'}).catch(()=>{});mutating.current=false;setBusy(false)}
  }
  async function saveLead(row,changes){
    if(leadMutating.current||loading)return false
    leadMutating.current=true
    const version=sequence.current
    setSaving(row.id);setError('');setNotice('')
    try{
      const result=preview?{lead:{...row,...changes,updated_at:new Date().toISOString()}}:await adminRequest('/api/admin/partner-leads',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:row.id,expectedUpdatedAt:row.updated_at,...changes})})
      if(version!==sequence.current)return false
      setLeads(items=>items.map(item=>item.id===row.id?{...item,...result.lead}:item))
      setNotice(row.business_id&&changes.status==='active'?'application-published':changes.status===row.status?'lead-saved':changes.status==='onboarding'?'lead-approved':changes.status==='declined'?'lead-rejected':'lead-saved')
      if(row.business_id&&!preview)await load()
      return true
    }catch(problem){if(version===sequence.current)setError(problem.code||'ADMIN_UNAVAILABLE');return false}finally{leadMutating.current=false;setSaving('')}
  }
  async function logout(){if(preview)return;await supabase.auth.signOut({scope:'local'});setSession(null)}
  const b=detail?.business
  return <main className="platform-admin admin-console">
    {preview&&<p className="admin-preview-notice">{en?'Local preview · fictional data · no real changes or emails':'Локален преглед · измислени данни · без реални промени и имейли'}</p>}
    <header className="admin-console-header home-navigation-header"><div className="admin-heading-identity"><Link className="admin-brand" href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo eager/></Link><div><h1>{en?'Admin panel':'Админ панел'}</h1>{session&&<p className="admin-identity">{session.user.email}</p>}</div></div><div className="admin-header-actions home-header-actions"><LanguageSwitch locale={locale} onChange={setLocale} compact/>{session&&<button className="secondary-button" onClick={logout} type="button">{en?'Sign out':'Изход'}</button>}</div><HomeLink locale={locale}/></header>
    {checking?<div className="admin-loading" role="status">{en?'Checking access…':'Проверка на достъпа…'}</div>:!session||error==='UNAUTHORIZED'?<section className="admin-access-state"><Icon name="user"/><h2>{en?'Administrator sign-in':'Вход за администратори'}</h2><p>{en?'Sign in with your administrator account. You will return here after sign-in.':'Влез с администраторския си профил. След вход ще се върнеш тук.'}</p><Link className="primary-button" href={`/account?lang=${locale}&next=admin`}>{en?'Sign in':'Влез в профила'}</Link></section>:error==='FORBIDDEN'?<section className="admin-access-state" role="alert"><h2>{en?'Administrator access required':'Нужен е администраторски достъп'}</h2><p>{fail(error)}</p><Link className="secondary-button" href={`/account?lang=${locale}`}>{en?'My account':'Моят профил'}</Link></section>:<>
      {error&&<p className="form-message" role="alert">{fail(error)} <button className="link-button" onClick={load} type="button">{en?'Retry':'Опитай отново'}</button></p>}
      {notice&&<p className="form-message success" role="status">{text(NOTICES,notice,en)}</p>}
      {loading&&!overview?<div className="admin-loading" role="status"><span className="button-spinner"/>{en?'Loading the platform…':'Зареждаме платформата…'}</div>:overview&&<>
        <div className="admin-console-kpis">{[[en?'Published businesses':'Публикувани бизнеси',overview.totals.active,'store'],[en?'New leads':'Нови заявки',newLeads,'users'],[en?'Bookings / 30 days':'Резервации / 30 дни',overview.totals.bookings30d,'calendar'],[en?'In trash':'В кошчето',overview.totals.archived||0,'trash']].map(([title,value,icon])=><article key={title}><Icon name={icon}/><small>{title}</small><strong>{value}</strong></article>)}</div>
        <div className="admin-console-toolbar"><nav aria-label={en?'Admin sections':'Админ секции'}>{[['businesses',en?'Businesses':'Бизнеси'],['leads',en?'Applications':'Заявки'],['audit',en?'Activity log':'Журнал'],['external-links',en?'Booking links':'Линкове за резервации'],['statistics',en?'Statistics':'Статистика']].map(([key,value])=><button key={key} aria-pressed={tab===key} onClick={()=>{if(tab!=='external-links'||!linkDirty||window.confirm(en?'Discard the unsaved booking-link draft?':'Да отхвърлим ли незапазения линк за резервации?'))setTab(key)}} type="button">{value}{key==='leads'&&newLeads>0&&<span>{newLeads}</span>}</button>)}<Link className="admin-review-link" href={`/admin/reviews?lang=${locale}`}>{en?'Reviews':'Отзиви'}</Link></nav><button className="secondary-button" type="button" disabled={loading||Boolean(saving)} onClick={load}>{loading?(en?'Loading…':'Зареждане…'):(en?'Refresh':'Обнови')}</button></div>
        {tab==='statistics'&&<AdminReferralAnalytics send={adminRequest} locale={locale} preview={Boolean(preview)}/>}
        {tab==='external-links'&&<AdminExternalBookingLinks onDirty={setLinkDirty} send={adminRequest} locale={locale} preview={Boolean(preview)}/>}
        {tab==='businesses'&&<section className="admin-console-section">
          <header><div><h2>{en?'Business profiles':'Бизнес профили'}</h2><p>{en?'Visibility and management at a glance.':'Видимост и управление на едно място.'}</p></div><span>{businesses.length} {en?'results':'резултата'}</span></header>
          <div className="admin-business-filters"><label>{en?'Search':'Търси'}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={en?'Name, city or email':'Име, град или имейл'}/></label><label>{en?'Visibility':'Видимост'}<select value={state} onChange={e=>setState(e.target.value)}><option value="all">{en?'All, including trash':'Всички, включително кошчето'}</option>{Object.keys(STATES).map(key=><option key={key} value={key}>{text(STATES,key,en)}</option>)}</select></label></div>
          <div className="admin-business-cards">{businesses.map(row=><article key={row.id} className="admin-business-card">
            <div className="admin-business-card-title"><span className="admin-store-icon"><BusinessCategoryIcon business={row} size={42}/></span><div><h3>{row.name}</h3><p>{getIndustryLabel(row.industry,locale)}{row.city?` · ${row.city}`:''}</p></div><span className={`admin-state ${businessState(row)}`}>{text(STATES,businessState(row),en)}</span></div>
            {row.contact_email&&<a className="admin-business-contact" href={`mailto:${row.contact_email}`}><Icon name="mail"/>{row.contact_email}</a>}
            <div className="admin-business-metrics"><span><Icon name="calendar"/><b>{row.bookings30d}</b> {en?'bookings / 30d':'резервации / 30д'}</span>{row.failedNotifications30d>0&&<span className="admin-email-warning"><b>{row.failedNotifications30d}</b> {en?'failed emails':'неуспешни имейли'}</span>}</div>
            <div className="admin-card-actions"><button className="primary-button" type="button" onClick={()=>open(row)}><Icon name="settings"/>{en?'Manage':'Управлявай'}</button>{businessState(row)==='published'&&<Link className="secondary-button" href={`/book/${row.slug}?lang=${locale}`} target="_blank" rel="noreferrer"><Icon name="external"/>{en?'Public page':'Публична страница'}</Link>}</div>
          </article>)}</div>{!businesses.length&&<div className="empty-state">{en?'No businesses match these filters.':'Няма бизнеси по тези филтри.'}</div>}
        </section>}
        {tab==='leads'&&<section className="admin-console-section">
          <header><div><h2>{en?'Business applications':'Заявки от бизнеси'}</h2><p>{en?'Ready profiles publish after approval. Contact-only requests still need setup.':'Готовите профили се публикуват след одобрение. Старите кратки заявки изискват настройване.'}</p></div></header>
          <div className="admin-lead-filters" role="group" aria-label={en?'Filter applications':'Филтрирай заявките'}>{Object.keys(LEAD_GROUPS).map(key=><button key={key} type="button" aria-pressed={leadFilter===key} onClick={()=>setLeadFilter(key)}>{text(LEAD_GROUPS,key,en)}<span>{key==='all'?leads.length:leads.filter(row=>partnerReviewGroup(row.status)===key).length}</span></button>)}</div>
          <div className="partner-lead-list">{visibleLeads.map(row=><AdminApplicationCard key={row.id} row={row} locale={locale} saving={Boolean(saving)||loading} onSave={saveLead}/>)}</div>
          {!visibleLeads.length&&<p className="empty-state">{en?'No applications in this group.':'Няма заявки в тази група.'}</p>}
        </section>}
        {tab==='audit'&&<section className="admin-console-section"><header><div><h2>{en?'Administrator activity':'Администраторски действия'}</h2><p>{en?'Latest 100 business actions. The log remains after business deletion.':'Последните 100 действия по бизнеси. Журналът остава и след изтриване на бизнес.'}</p></div></header><div className="admin-audit-list">{(overview.audit||[]).map(row=><article key={row.id}><Icon name={row.action==='delete'||row.action==='archive'?'trash':'settings'}/><div><h3>{text(ACTIONS,row.action,en)} · {row.business_name}</h3><p>{row.reason}</p><small>/{row.business_slug} · {en?'Actor':'Администратор'}: {row.actor_id||'—'}</small></div><time>{stamp(row.created_at,locale)}</time></article>)}</div>{!overview.audit?.length&&<div className="empty-state">{en?'New actions will appear here.':'Новите действия ще се показват тук.'}</div>}</section>}
      </>}
    </>}
    {selected&&<Dialog id={titleId} title={selected.name} busy={busy} onClose={close}>
      {detailError&&<p className="form-message" role="alert">{fail(detailError)}</p>}
      {!detail&&!detailError&&<p role="status">{en?'Loading details…':'Зареждаме детайлите…'}</p>}
      {detail&&<><div className="admin-dialog-business"><span className={`admin-state ${businessState(b)}`}>{text(STATES,businessState(b),en)}</span><p>/{b.slug} · {getIndustryLabel(b.industry,locale)}</p><p>{b.city||b.address||'—'} · {b.contact_email||'—'}</p></div><div className="admin-detail-counts">{[[en?'Bookings':'Резервации',detail.counts.bookings],[en?'Upcoming':'Предстоящи',detail.counts.upcoming],[en?'Customers':'Клиенти',detail.counts.customers]].map(([value,count])=><div key={value}><strong>{count}</strong><span>{value}</span></div>)}</div>
        {editing?<><button className="secondary-button" type="button" disabled={busy} onClick={()=>{if(!editorDirty||window.confirm(en?'Discard unsaved changes?':'Да се откажем ли от незапазените промени?')){setEditing('');setEditorDirty(false)}}}>{en?'Back to management':'Към управлението'}</button><AdminBusinessEditor key={`${b.id}:${b.content_revision}:${editing}`} detail={detail} locale={locale} send={adminRequest} onSaved={contentSaved} onBusy={setBusy} onDirty={setEditorDirty} section={editing} onSection={setEditing} preview={Boolean(preview)}/></>:!action?<><div className="admin-detail-resources"><div><h3>{en?'Services':'Услуги'}</h3>{detail.services.map(row=><p key={row.id}>{row.name} · {row.duration_min} {en?'min':'мин'} {!row.active&&`(${en?'inactive':'неактивна'})`}</p>)}{!detail.services.length&&<p>{en?'Not set up yet':'Още няма настроени услуги'}</p>}</div><div><h3>{en?'Team':'Екип'}</h3>{detail.staff.map(row=><p key={row.id}>{row.name} {!row.active&&`(${en?'inactive':'неактивен'})`}</p>)}{!detail.staff.length&&<p>{en?'Not set up yet':'Още няма екип'}</p>}</div></div><p className="admin-preserve-note">{en?'Only this business is affected. Its owner’s login and other businesses are not deleted.':'Засяга се само този бизнес. Акаунтът на собственика и други негови бизнеси не се изтриват.'}</p><div className="admin-operation-buttons">{businessState(b)!=='archived'&&<button className="primary-button" type="button" onClick={()=>setEditing('business')}><Icon name="settings"/>{en?'Edit details & photos':'Редактирай данни и снимки'}</button>}{(businessState(b)==='archived'?['restore','delete']:businessState(b)==='published'?['suspend','archive']:['publish','archive']).map(key=><button className={key==='delete'?'account-delete-button':'secondary-button'} key={key} type="button" onClick={()=>choose(key)}><Icon name={key==='delete'||key==='archive'?'trash':'settings'}/>{text(ACTIONS,key,en)}</button>)}</div></>:<form onSubmit={perform} className="admin-action-form"><h3>{text(ACTIONS,action,en)}</h3><p className={action==='delete'?'account-delete-warning':'admin-preserve-note'}>{text(EXPLANATIONS,action,en)}</p>
          {action==='delete'&&detail.counts.upcoming>0&&<p className="form-message" role="alert">{fail('UPCOMING_BOOKINGS')}</p>}
          <fieldset disabled={busy}><label>{en?'Reason for the activity log':'Причина за журнала'}<textarea required minLength={3} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label><label>{en?'Type the business slug':'Напиши адреса на бизнеса'}: <strong>{b.slug}</strong><input required autoComplete="off" autoCapitalize="none" spellCheck={false} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>{action==='delete'&&<label>{en?'Your administrator password':'Твоята администраторска парола'}<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/><small>{en?'Verified directly with Supabase Auth; never saved in the application or activity log.':'Проверява се директно от Supabase Auth; не се записва в приложението или журнала.'}</small></label>}<label className="admin-action-ack"><input type="checkbox" required checked={ack} onChange={e=>setAck(e.target.checked)}/><span>{en?'I understand the consequences for this business and its existing bookings.':'Разбирам последствията за този бизнес и съществуващите му резервации.'}</span></label></fieldset><div className="admin-operation-buttons"><button type="button" className="secondary-button" disabled={busy} onClick={()=>choose('')}>{en?'Back':'Назад'}</button><button type="submit" className={action==='delete'?'account-delete-button':'primary-button'} disabled={busy||!ack||confirmation!==b.slug||reason.trim().length<3||(action==='delete'&&(!password||detail.counts.upcoming>0))}>{busy?(en?'Saving…':'Запазване…'):text(ACTIONS,action,en)}</button></div>
        </form>}
      </>}
    </Dialog>}
  </main>
}
