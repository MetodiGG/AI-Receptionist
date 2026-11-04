'use client'
import { useState } from 'react'
import { DashboardShell } from '../../../components/dashboard-shell'
import { SettingsContent } from '../../dashboard/settings/page'
export default function DashboardPreview() {
  const [locale, setLocale] = useState('bg')
  const business = {id:'local-layout-only',name:'Локална проверка · не е истински бизнес',slug:'local-layout-only',industry:'beauty',city_ekatte:'68134',address:'Тестов адрес',platform_status:'pending',public_profile:{},default_duration_min:45}
  const collections={services:[{id:'local-service',name:'Оформяне на вежди и индивидуална консултация',price:25,duration_min:45}],staff:[{id:'local-staff',name:'Локален специалист с дълго име за проверка'}],hours:[1,2,3,4,5].map(weekday=>({staff_id:'local-staff',weekday,open_time:'09:00',close_time:'18:00'}))}
  return <DashboardShell title={business.name} businessSlug={business.slug} platformStatus="pending" locale={locale} onLocaleChange={setLocale} onLogout={()=>{}}><p role="note">LOCAL QA · synthetic data · no account or database writes</p><div onSubmitCapture={event=>{event.preventDefault();event.stopPropagation()}}><SettingsContent business={business} refreshBusiness={async()=>{}} locale={locale} preview previewCollections={collections}/></div></DashboardShell>
}
