'use client'

import { usePublicLocale } from '../../../hooks/use-public-locale'
import { MarketingNavigation } from '../../../components/marketing-navigation'
import { BusinessDirectory } from '../../../components/business-directory'

export function PartnerCategoriesPreview({ initialLocale, category, data }) {
  const { locale, setLocale } = usePublicLocale(initialLocale, true)
  return <main className="marketing-page platform-home partners-page">
    <MarketingNavigation locale={locale} setLocale={setLocale}/>
    <p className="discovery-notice discovery-test">{locale === 'en' ? 'LOCAL DESIGN TEST · Fictional businesses. Booking is disabled.' : 'ЛОКАЛЕН ДИЗАЙН ТЕСТ · Измислени бизнеси. Резервациите са изключени.'}</p>
    <BusinessDirectory locale={locale} partners showFilters={false} data={{ ...data, retry: () => window.location.reload() }} bookingDisabled categoryBrowsing partnerCategory={category} categoryBasePath="/dev/partner-categories"/>
  </main>
}
