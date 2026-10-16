import {notFound} from 'next/navigation'
import {PlatformAdmin} from '../../../components/platform-admin'

export default function Preview(){
  if(process.env.NODE_ENV==='production')notFound()
  const businesses=[
    {id:'00000000-0000-4000-8000-000000000001',name:'Studio Linden',slug:'studio-linden',industry:'beauty',city:'София',contact_email:'studio@example.com',active:true,platform_status:'enabled',platform_revision:0,bookings30d:28,failedNotifications30d:0},
    {id:'00000000-0000-4000-8000-000000000002',name:'North Garage',slug:'north-garage',industry:'auto',city:'Пловдив',contact_email:'garage@example.com',active:true,platform_status:'suspended',platform_revision:1,bookings30d:12,failedNotifications30d:1},
    {id:'00000000-0000-4000-8000-000000000003',name:'Archive Example',slug:'archive-example',industry:'fitness',city:'Варна',contact_email:null,active:true,platform_status:'archived',platform_revision:2,bookings30d:0,failedNotifications30d:0},
  ]
  const details=Object.fromEntries(businesses.map((b,index)=>[b.id,{business:b,counts:{customers:14,bookings:38,upcoming:index===0?3:0},services:[{id:'service',name:index===1?'Диагностика / Diagnostics':'Подстригване / Haircut',duration_min:60,active:true}],staff:[{id:'person',name:'Alex Example',active:true}]}]))
  return <PlatformAdmin preview={{overview:{businesses,totals:{businesses:2,active:1,archived:1,bookings30d:40},audit:[]},leads:[{id:'lead',business_name:'New Business Example',contact_name:'Example Contact',phone:'0000000000',email:'lead@example.com',category:'auto',city:'София',status:'new',notes:'',created_at:'2026-10-16T12:00:00Z'}],details}}/>
}
