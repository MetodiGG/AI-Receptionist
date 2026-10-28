import './globals.css'
import './business-profile.css'
import './discovery.css'
import './home-navigation.css'
import { PwaRegister } from '../components/pwa-register'
import { SITE_ORIGIN } from '../lib/seo.mjs'

export const metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: 'GoRez', template: '%s · GoRez' },
  description: 'Открий бизнес, виж реално свободните часове и резервирай онлайн с GoRez.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  openGraph: {
    title: 'GoRez — Намери. Резервирай. Готово.',
    description: 'Открий подходящия бизнес, виж свободните часове и резервирай онлайн.',
    type: 'website',
    locale: 'bg_BG',
    siteName: 'GoRez',
    images: [{ url: '/share-image?lang=bg', width:1200,height:630,alt: 'GoRez' }],
  },
  twitter: { card: 'summary_large_image', title: 'GoRez', description: 'Онлайн резервации без излишни обаждания.', images: ['/share-image?lang=bg'] },
}

export const viewport = { themeColor: '#173e2a' }

export default function RootLayout({ children }) {
  return (
    <html lang="bg" data-scroll-behavior="smooth">
      <body><PwaRegister />{children}</body>
    </html>
  )
}
