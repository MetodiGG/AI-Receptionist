import './globals.css'
import './business-profile.css'
import './monthly-booking-calendar.css'
import './discovery.css'
import './home-navigation.css'
import './owner-calendar-month.css'
import './solar.css'
import './business-management.css'
import './category-art.css'
import './dashboard-responsive.css'
import './discovery-home.css'
import './service-thumbnail.css'
import './service-photo-surfaces.css'
import './brand.css'
import './header-controls.css'
import './catalogue-admin.css'
import { PwaRegister } from '../components/pwa-register'
import { PublicWebAnalytics } from '../components/web-analytics'
import { SITE_ORIGIN } from '../lib/seo.mjs'
import { BRAND_APPLE_ICON, BRAND_FAVICON_PNG } from '../lib/brand-assets.mjs'
import { SOCIAL_PREVIEW_TITLE, socialPreviewImage } from '../lib/social-preview.mjs'

export const metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: 'GoRez',
  title: { default: SOCIAL_PREVIEW_TITLE, template: '%s · GoRez' },
  description: 'Открий бизнес, виж реално свободните часове и резервирай онлайн с GoRez.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: { url: BRAND_FAVICON_PNG, type: 'image/png', sizes: '96x96' },
    apple: { url: BRAND_APPLE_ICON, type: 'image/png', sizes: '180x180' },
  },
  openGraph: {
    title: SOCIAL_PREVIEW_TITLE,
    description: 'Открий подходящия бизнес, виж свободните часове и резервирай онлайн.',
    type: 'website',
    locale: 'bg_BG',
    siteName: 'GoRez',
    images: [socialPreviewImage('bg')],
  },
  twitter: { card: 'summary_large_image', title: SOCIAL_PREVIEW_TITLE, description: 'Онлайн резервации без излишни обаждания.', images: [socialPreviewImage('bg').url] },
}

export const viewport = { themeColor: '#f6f5f2' }

export default function RootLayout({ children }) {
  return (
    <html lang="bg" data-scroll-behavior="smooth">
      <body><PwaRegister />{children}<PublicWebAnalytics enabled={process.env.VERCEL_ENV === 'production'} /></body>
    </html>
  )
}
