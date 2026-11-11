import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { boundedBytes, boundedForm } from './media-handlers.mjs'
import { privateJson } from './platform-admin.mjs'
import { sameOriginRequest } from './profile-management.mjs'
import { catalogueIdPattern, cataloguePhotoView } from './catalogue-photo-view.mjs'
import { CATALOGUE_MAX_RECORDS } from './discovery/catalogue-limits.mjs'

const revision = z.string().regex(/^\d{1,15}$/).transform(Number).pipe(z.number().int().nonnegative().safe())
const inputSchema = z.object({ revision, consent: z.literal('true'), rightsReference: z.string().trim().min(5).max(160), alt: z.string().trim().max(160) }).strict()
const fail = (code, status) => privateJson({ error: { code } }, status)
export function cataloguePhotoFailure(error) {
  if (error?.name === 'ZodError' || error instanceof SyntaxError) return fail('VALIDATION_ERROR', 422)
  const code = ['CATALOGUE_PHOTO_CHANGED','CATALOGUE_PHOTO_NOT_FOUND','CATALOGUE_MEDIA_LIMIT','INVALID_IMAGE','IMAGE_TOO_LARGE','VALIDATION_ERROR'].find(value => error?.message?.includes(value))
  if (code) return fail(code, ['INVALID_IMAGE','IMAGE_TOO_LARGE','VALIDATION_ERROR'].includes(code) ? 422 : 409)
  return fail(error?.code === '42P01' || error?.code === 'PGRST205' ? 'CATALOGUE_MEDIA_NOT_READY' : 'MEDIA_UNAVAILABLE', 503)
}
export function createCataloguePhotoHandlers(deps) {
  async function access(request, id, writing = false) {
    const user = await deps.authenticate(request)
    if (!user?.id || !user.email_confirmed_at || user.is_anonymous) return { error: fail('UNAUTHORIZED', 401) }
    if (!deps.isAdmin(user) || (writing && !sameOriginRequest(request))) return { error: fail('FORBIDDEN', 403) }
    if (!await deps.allowAttempt(request, user.id, writing)) return { error: fail('RATE_LIMITED', 429) }
    if (id != null && (!catalogueIdPattern.test(id) || !deps.findEntry(id))) return { error: fail('CATALOGUE_NOT_FOUND', 404) }
    return { user }
  }
  return {
    async LIST(request) {
      try {
        const auth = await access(request)
        if (auth.error) return auth.error
        const params = new URL(request.url).searchParams
        if ([...params.keys()].some(key => !['q','category','offset'].includes(key)) || [...new Set(params.keys())].some(key => params.getAll(key).length > 1)) return fail('VALIDATION_ERROR', 422)
        const input = z.object({ q: z.string().trim().max(100), category: z.string().max(30), offset: z.coerce.number().int().min(0).max(CATALOGUE_MAX_RECORDS) }).parse({ q: params.get('q') || '', category: params.get('category') || '', offset: params.get('offset') || 0 })
        return privateJson(await deps.list(input))
      } catch (error) { return cataloguePhotoFailure(error) }
    },
    async GET(request, id) {
      try { const auth = await access(request, id); return auth.error || privateJson(await deps.detail(id)) }
      catch (error) { return cataloguePhotoFailure(error) }
    },
    async POST(request, id) {
      try {
        const auth = await access(request, id, true)
        if (auth.error) return auth.error
        if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return fail('VALIDATION_ERROR', 422)
        const form = await boundedForm(request), names = [...form.keys()]
        if (new Set(names).size !== names.length || names.some(key => !['file','revision','consent','rightsReference','alt'].includes(key))) return fail('VALIDATION_ERROR', 422)
        const input = inputSchema.parse({ revision: form.get('revision'), consent: form.get('consent'), rightsReference: form.get('rightsReference'), alt: form.get('alt') || '' })
        const current = await deps.detail(id)
        if (current.revision !== input.revision) return fail('CATALOGUE_PHOTO_CHANGED', 409)
        if (!current.editable) return fail('CATALOGUE_REVIEW_REQUIRED', 409)
        const image = await deps.normalize(form.get('file'))
        await deps.upload({ catalogueId: id, actorId: auth.user.id, mediaId: randomUUID(), ...input, image })
        return privateJson(await deps.detail(id))
      } catch (error) { return cataloguePhotoFailure(error) }
    },
    async PATCH(request, id) {
      try {
        const auth = await access(request, id, true)
        if (auth.error) return auth.error
        if (!request.headers.get('content-type')?.startsWith('application/json')) return fail('VALIDATION_ERROR', 422)
        const bytes = await boundedBytes(request, 2048)
        const input = z.object({ revision: z.number().int().nonnegative().safe(), action: z.literal('remove') }).strict().parse(JSON.parse(bytes.toString('utf8')))
        await deps.remove({ catalogueId: id, actorId: auth.user.id, revision: input.revision })
        return privateJson(await deps.detail(id))
      } catch (error) { return cataloguePhotoFailure(error) }
    },
  }
}

export function createCatalogueImageHandler({ allowAttempt, read, findApprovedEntry, download }) {
  const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex', 'Content-Security-Policy': "default-src 'none'; sandbox" }
  const missing = () => new Response(null, { status: 404, headers })
  return async (request, id) => {
    try {
      if (!z.uuid().safeParse(id).success) return missing()
      if (!await allowAttempt(request)) return new Response(null, { status: 429, headers })
      const row = await read(id), photo = cataloguePhotoView(row)
      if (!photo || row.photo_id !== id || !findApprovedEntry(row.catalogue_id) || row.object_key !== `catalogue/${row.catalogue_id}/${id}.webp`) return missing()
      const bytes = await download(row.object_key)
      if (!bytes) return missing()
      return new Response(bytes, { headers: { ...headers, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline; filename="business.webp"' } })
    } catch { return missing() }
  }
}
