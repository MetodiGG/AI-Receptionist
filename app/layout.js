import './globals.css'
import { PwaRegister } from '../components/pwa-register'

export const metadata = {
  title: { default: 'GoRez', template: '%s · GoRez' },
  description: 'Онлайн резервации за всеки бизнес, който работи с часове.',
  manifest: '/manifest.webmanifest',
}

export const viewport = { themeColor: '#173e2a' }

export default function RootLayout({ children }) {
  return (
    <html lang="bg">
      <body><PwaRegister />{children}</body>
    </html>
  )
}
