import './globals.css'
import { PwaRegister } from '../components/pwa-register'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ai-receptionist-beta-six.vercel.app'),
  title: { default: 'GoRez', template: '%s · GoRez' },
  description: 'Открий бизнес, виж реално свободните часове и резервирай онлайн с GoRez.',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  openGraph: {
    title: 'GoRez — Намери. Резервирай. Готово.',
    description: 'Открий подходящия бизнес, виж свободните часове и резервирай онлайн.',
    type: 'website',
    locale: 'bg_BG',
    siteName: 'GoRez',
    images: [{ url: '/gorez-logo.png', alt: 'GoRez' }],
  },
  twitter: { card: 'summary_large_image', title: 'GoRez', description: 'Онлайн резервации без излишни обаждания.', images: ['/gorez-logo.png'] },
}

export const viewport = { themeColor: '#173e2a' }

export default function RootLayout({ children }) {
  return (
    <html lang="bg" data-scroll-behavior="smooth">
      <body><PwaRegister />{children}</body>
    </html>
  )
}
