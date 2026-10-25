import { OwnerProvider } from '../../components/owner-context'

export const metadata={robots:{index:false,follow:false}}
export default function DashboardLayout({children}) {return <OwnerProvider>{children}</OwnerProvider>}
