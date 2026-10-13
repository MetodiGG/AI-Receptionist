import './globals.css'
import { PwaRegister } from '../components/pwa-register'

export const metadata = {
  title: 'AI Рецепционист',
  description: 'Умен асистент, който поема запитванията и записва часове денонощно.',
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
