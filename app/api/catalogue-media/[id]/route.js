import { consumeRateLimit } from '../../../../lib/rate-limit'
import { createCatalogueImageHandler } from '../../../../lib/catalogue-photo-handlers.mjs'
import { findApprovedCatalogueEntry, readCatalogueImage, downloadCatalogueImage } from '../../../../lib/catalogue-photo-server'
export const runtime = 'nodejs'
const handler = createCatalogueImageHandler({ findApprovedEntry: findApprovedCatalogueEntry, read: readCatalogueImage, download: downloadCatalogueImage,
  allowAttempt: request => consumeRateLimit(request, { scope: 'catalogue-image', limit: 240, windowSeconds: 60, includeUserAgent: false }),
})
export async function GET(request, context) { return handler(request, (await context.params).id) }
