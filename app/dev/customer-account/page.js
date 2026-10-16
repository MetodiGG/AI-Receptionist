import { notFound } from 'next/navigation'
import { CustomerAccount } from '../../../components/customer-account'

export default function CustomerAccountPreview() {
  if(process.env.NODE_ENV==='production')notFound()
  const date=new Date();date.setUTCDate(date.getUTCDate()+2)
  return <><p style={{textAlign:'center',background:'#e8f3d9',padding:10,margin:0}}>Development-only preview · fictional bookings · no email sent</p><CustomerAccount preview={{session:{user:{email:'client@example.com'}},bookings:[{id:'preview-1',starts_at:date.toISOString(),ends_at:new Date(date.getTime()+45*60000).toISOString(),status:'confirmed',cancellation_token:'00000000-0000-4000-8000-000000000001',business:{name:'Example Barbershop',slug:'example',address:'София, център',timezone:'Europe/Sofia',active:true},service:{name:'Подстригване / Haircut'},staff:{name:'Alex'}},{id:'preview-2',starts_at:'2026-09-10T10:00:00Z',ends_at:'2026-09-10T11:00:00Z',status:'done',cancellation_token:'00000000-0000-4000-8000-000000000002',business:{name:'Example Auto Service',slug:'example-auto',address:'София',timezone:'Europe/Sofia',active:true},service:{name:'Диагностика / Diagnostics'},staff:{name:'Sam'}}]}} /></>
}
