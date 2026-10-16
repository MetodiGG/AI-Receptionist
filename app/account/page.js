import { CustomerAccount } from '../../components/customer-account'

export async function generateMetadata({ searchParams }) {
  const params = await searchParams
  return { title: params?.lang === 'en' ? 'My bookings' : 'Моите резервации' }
}

export default function AccountPage() { return <CustomerAccount /> }
