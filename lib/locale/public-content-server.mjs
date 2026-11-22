// Server response/SSR boundaries only. Never import from a client component.
import dictionary from './service-english.json' with { type: 'json' }
import { createEnglishContentResolver } from './public-content-resolver.mjs'

const resolver = createEnglishContentResolver(dictionary)
export const presentPublicService = resolver.service
export const presentPublicBusiness = resolver.business
export const presentPublicBooking = resolver.booking
export const presentPublicProse = resolver.prose
