import { BusinessLogin } from '../../components/business-login'
import { companyIdentity } from '../../lib/product-config.mjs'

export const metadata = { title: 'Business login / Вход за бизнес', robots: {index:false,follow:false} }
export default async function Login({searchParams}) {
  return <BusinessLogin initialLocale={(await searchParams)?.lang === 'en' ? 'en' : 'bg'} identity={companyIdentity(process.env)}/>
}
