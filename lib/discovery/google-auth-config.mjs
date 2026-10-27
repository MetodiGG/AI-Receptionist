import { z } from 'zod'

export const googleProjectIdSchema = z.string().regex(/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/)
export function googleServiceAccountEmail(project, email) {
  const suffix = `@${googleProjectIdSchema.parse(project)}.iam.gserviceaccount.com`
  if (typeof email !== 'string' || !email.endsWith(suffix) || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(email.slice(0, -suffix.length))) throw new Error('INVALID_SERVICE_ACCOUNT')
  return email
}

export const GOOGLE_PLACES_SCOPES = Object.freeze({
  ids: 'https://www.googleapis.com/auth/maps-platform.places.textsearch',
  text: 'https://www.googleapis.com/auth/maps-platform.places.textsearch',
  nearby: 'https://www.googleapis.com/auth/maps-platform.places.nearbysearch',
  details: 'https://www.googleapis.com/auth/maps-platform.places.details',
})
