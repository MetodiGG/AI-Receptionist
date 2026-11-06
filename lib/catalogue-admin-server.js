import 'server-only'
import { requireUser, isPlatformAdmin } from './server-auth'
import { consumeRateLimit } from './rate-limit'
import { normalizeBusinessImage } from './image-normalization.mjs'
import { createCataloguePhotoHandlers } from './catalogue-photo-handlers.mjs'
import { findCatalogueEntry, catalogueAdminList, cataloguePhotoDetail, saveCataloguePhoto, clearCataloguePhoto } from './catalogue-photo-server'

export const catalogueAdminHandlers = createCataloguePhotoHandlers({
  authenticate: requireUser, isAdmin: isPlatformAdmin, findEntry: findCatalogueEntry,
  list: catalogueAdminList, detail: cataloguePhotoDetail, normalize: normalizeBusinessImage,
  upload: saveCataloguePhoto, remove: clearCataloguePhoto,
  allowAttempt: (request, id, writing) => consumeRateLimit(request, { scope: `catalogue-media:${id}:${writing ? 'write' : 'read'}`, limit: writing ? 30 : 120, windowSeconds: writing ? 3600 : 60, includeUserAgent: false }),
})
