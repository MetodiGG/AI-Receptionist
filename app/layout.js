import './globals.css'
import './business-profile.css'
import './discovery.css'
import './home-navigation.css'
import './owner-calendar-month.css'
import './solar.css'
import './business-management.css'
import './category-art.css'
import './dashboard-responsive.css'
import './discovery-home.css'
import './brand.css'
import './header-controls.css'
import './catalogue-admin.css'
import { PwaRegister } from '../components/pwa-register'
import { PublicWebAnalytics } from '../components/web-analytics'
import { SITE_ORIGIN } from '../lib/seo.mjs'
import { BRAND_MARK_PNG } from '../lib/brand-assets.mjs'

export const metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: 'GoRez', template: '%s · GoRez' },
  description: 'Открий бизнес, виж реално свободните часове и резервирай онлайн с GoRez.',
  manifest: '/manifest.webmanifest',
  icons: { icon: BRAND_MARK_PNG, apple: '/brand-icon?size=180&v=4' },
  openGraph: {
    title: 'GoRez — Намери. Резервирай. Готово.',
    description: 'Открий подходящия бизнес, виж свободните часове и резервирай онлайн.',
    type: 'website',
    locale: 'bg_BG',
    siteName: 'GoRez',
    images: [{ url: '/share-image?lang=bg&v=4', width:1200,height:630,alt: 'GoRez' }],
  },
  twitter: { card: 'summary_large_image', title: 'GoRez', description: 'Онлайн резервации без излишни обаждания.', images: ['/share-image?lang=bg&v=4'] },
}

export const viewport = { themeColor: '#f6f5f2' }

export default function RootLayout({ children }) {
  return (
    <html lang="bg" data-scroll-behavior="smooth">
      <body><PwaRegister />{children}<PublicWebAnalytics enabled={process.env.VERCEL_ENV === 'production'} /></body>
    </html>
  )
}
