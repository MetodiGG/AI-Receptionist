import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { BusinessDirectory } from '../../../components/business-directory'
import { BusinessCategoryIcon } from '../../../components/business-category-icon'

export default async function CategoryArtFixture({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  const en = (await searchParams)?.lang === 'en', locale = en ? 'en' : 'bg'
  const samples = [['hair','Фризьор','Hair'],['barber','Барбър','Barber'],['nails','Маникюр','Nails'],['car_wash','Автоуслуги','Auto'],['fitness','Спорт','Sports'],['beauty','Красота','Beauty'],['education','Обучение','Education'],['consulting','Консултации','Consulting'],['home_services','За дома','Home services'],['pets','Домашни любимци','Pets'],['health','Здраве','Health'],['other','Резервации','Appointments']]
  const preview = { status:'ready', businesses:[
    { id:'local-art-zen',slug:'local-art-zen',name:'Zen Barbershop',industry:'beauty',address:en?'Design reference only, not a live business profile.':'Само дизайнерски преглед, не е реален бизнес профил.',services:[] },
    { id:'local-art-nails',slug:'local-art-nails',name:en?'Fictional manicure studio':'Примерен маникюрен салон',industry:'beauty',address:en?'Fictional example. No real services or prices.':'Измислен пример. Без реални услуги или цени.',services:[{id:'local-service',name:en?'Manicure':'Маникюр',duration_min:30,price:null,active:true}] },
  ] }
  return <main className="category-art-preview"><h1>{en?'Local category design preview':'Локален преглед на новите икони'}</h1><p className="discovery-notice discovery-test">{en?'LOCAL DESIGN TEST · No Google/AI requests, real profile edits or reservations. Zen is a name reference only.':'ЛОКАЛЕН ДИЗАЙН ТЕСТ · Без Google/AI заявки, редакция на реални профили или резервации. Zen е само референция за името.'}</p><section className="partners-page"><BusinessDirectory locale={locale} preview={preview} showFilters={false} partners bookingDisabled/></section><h2>{en?'Complete icon collection':'Целият комплект'}</h2><div className="category-art-samples">{samples.map(([category,bg,label])=><div key={category}><BusinessCategoryIcon category={category} size={80}/><span>{en?label:bg}</span></div>)}</div></main>
}
