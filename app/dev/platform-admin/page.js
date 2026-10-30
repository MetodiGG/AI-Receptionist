import {notFound} from 'next/navigation'
import {PlatformAdmin} from '../../../components/platform-admin'

export default function Preview(){
  if(process.env.NODE_ENV==='production')notFound()
  const businesses=[
    {id:'00000000-0000-4000-8000-000000000001',name:'Studio Linden',slug:'studio-linden',industry:'beauty',city:'София',contact_email:'studio@example.com',active:true,platform_status:'enabled',platform_revision:0,bookings30d:28,failedNotifications30d:0},
    {id:'00000000-0000-4000-8000-000000000002',name:'North Garage',slug:'north-garage',industry:'auto',city:'Пловдив',contact_email:'garage@example.com',active:true,platform_status:'suspended',platform_revision:1,bookings30d:12,failedNotifications30d:1},
    {id:'00000000-0000-4000-8000-000000000003',name:'Archive Example',slug:'archive-example',industry:'fitness',city:'Варна',contact_email:null,active:true,platform_status:'archived',platform_revision:2,bookings30d:0,failedNotifications30d:0},
  ]
  for(const b of businesses)Object.assign(b,{content_revision:0,city_ekatte:b.city==='София'?'68134':b.city==='Пловдив'?'56784':'10135',address:'Локален тестов адрес 1',timezone:'Europe/Sofia'})
  const details=Object.fromEntries(businesses.map((b,index)=>[b.id,{business:b,counts:{customers:14,bookings:38,upcoming:index===0?3:0},services:[{id:'40000000-0000-4000-8000-000000000001',name:index===1?'Диагностика / Diagnostics':'Подстригване / Haircut',duration_min:60,price:25,active:true}],staff:[{id:'30000000-0000-4000-8000-000000000001',name:'Alex Example',active:true}],hours:[]}]))
  const leads=[
    {id:'lead-auto',business_name:'Central Auto Care',contact_name:'Alex Example',phone:'+359000000000',email:'garage@example.com',category:'auto',city:'София',status:'new',notes:'',website_url:'https://example.com'},
    {id:'lead-beauty',business_name:'Belle Beauty Studio',contact_name:'Maria Example',phone:'+359000000001',email:'beauty@example.com',category:'beauty',city:'Пловдив',status:'new',notes:'Споделена заявка от собственика / Submitted by the owner'},
    {id:'lead-approved',business_name:'Balance Studio',contact_name:'Sam Example',phone:'+359000000002',email:'fitness@example.com',category:'fitness',city:'Варна',status:'onboarding',notes:''},
  ].map(row=>({...row,created_at:'2026-10-16T12:00:00Z',updated_at:'2026-10-16T12:00:00Z'}))
  return <PlatformAdmin preview={{overview:{businesses,totals:{businesses:2,active:1,archived:1,bookings30d:40},audit:[]},leads,details}}/>
}
