import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { MAX_UPLOAD_BYTES, mediaMutationSchema } from './business-media.mjs'
import { privateJson } from './platform-admin.mjs'
import { sameOriginRequest } from './profile-management.mjs'
import { contentFailure } from './business-content.mjs'

export async function boundedBytes(request, limit) {
  if (Number(request.headers.get('content-length')) > limit || !request.body) throw new Error('IMAGE_TOO_LARGE')
  const reader = request.body.getReader(), chunks = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) { await reader.cancel(); throw new Error('IMAGE_TOO_LARGE') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  return Buffer.concat(chunks)
}
export async function boundedForm(request, limit = MAX_UPLOAD_BYTES + 20000) {
  const bytes = await boundedBytes(request, limit)
  return new Response(bytes, { headers: { 'content-type': request.headers.get('content-type') || '' } }).formData()
}
export function createMediaImageHandler({ allowAttempt, read, authenticate, isAdmin, download, resolveCurated }) {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex', 'Content-Security-Policy': "default-src 'none'; sandbox" }
  const missing = () => new Response(null, { status: 404, headers })
  return async (request, id) => {
    try {
      if (!z.string().uuid().safeParse(id).success) return missing()
      if (!await allowAttempt(request)) return new Response(null, { status: 429, headers })
      const value = await read(id)
      if (!value) return missing()
      const { media, business, staffActive } = value
      const published = media.active && business.active && business.platform_status === 'enabled' && (!media.staff_id || staffActive)
      if (!published) {
        const user = await authenticate(request)
        if (!user?.id || !user.email_confirmed_at || user.is_anonymous || (user.id !== business.owner_id && !isAdmin(user))) return missing()
      }
      if (media.curated_src) {
        const source = resolveCurated?.(business.id, media.curated_src)
        if (!source || !source.startsWith('/businesses/') || source.includes('..')) return missing()
        return new Response(null, { status: 307, headers: { ...headers, Location: source } })
      }
      const bytes = await download(media.object_key)
      if (!bytes) return missing()
      return new Response(bytes, { headers: { ...headers, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline; filename="photo.webp"' } })
    } catch { return missing() }
  }
}
export function createMediaHandlers({ authenticate, isAdmin, readAccess, ownsStaff, allowAttempt, list, normalize, upload, mutate }) {
  async function access(request, businessId, writing = false) {
    const user = await authenticate(request)
    if (!user?.id || !user.email_confirmed_at || user.is_anonymous) return { error: privateJson({ error: { code: 'UNAUTHORIZED' } }, 401) }
    if (writing && !sameOriginRequest(request)) return { error: privateJson({ error: { code: 'FORBIDDEN' } }, 403) }
    if (!z.string().uuid().safeParse(businessId).success) return { error: privateJson({ error: { code: 'BUSINESS_NOT_FOUND' } }, 404) }
    const business = await readAccess(businessId), admin = isAdmin(user)
    if (!business || (!admin && business.owner_id !== user.id)) return { error: privateJson({ error: { code: 'FORBIDDEN' } }, 403) }
    if (writing && business.platform_status === 'archived') return { error: privateJson({ error: { code: 'RESTORE_FIRST' } }, 409) }
    if (!await allowAttempt(request, user.id, writing)) return { error: privateJson({ error: { code: 'RATE_LIMITED' } }, 429) }
    return { user, business, admin }
  }
  const fail = error => ['INVALID_IMAGE', 'IMAGE_TOO_LARGE'].includes(error?.message)
    ? privateJson({ error: { code: error.message } }, 422) : contentFailure(error)
  return {
    async GET(request, id) { try { const auth = await access(request, id); return auth.error || privateJson(await list(id)) } catch (error) { return fail(error) } },
    async POST(request, id) {
      try {
        const auth = await access(request, id, true)
        if (auth.error) return auth.error
        if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) throw new Error('VALIDATION_ERROR')
        const form = await boundedForm(request)
        const names = [...form.keys()]
        if (new Set(names).size !== names.length || names.some(key => !['file', 'revision', 'staffId', 'consent', 'alt'].includes(key))) throw new Error('VALIDATION_ERROR')
        const input = z.object({ revision: z.coerce.number().int().nonnegative(), staffId: z.string().uuid().nullable(), consent: z.literal('true'), alt: z.string().trim().max(180) }).parse({ revision: form.get('revision'), staffId: form.get('staffId') || null, consent: form.get('consent'), alt: form.get('alt') || '' })
        if (input.revision !== auth.business.content_revision) throw new Error('CONTENT_CHANGED')
        if (input.staffId && !await ownsStaff?.(id, input.staffId)) return privateJson({ error: { code: 'FORBIDDEN' } }, 403)
        const image = await normalize(form.get('file'))
        await upload({ businessId: id, actorId: auth.user.id, admin: auth.admin, revision: input.revision, staffId: input.staffId, alt: input.alt, image, mediaId: randomUUID() })
        return privateJson({ ok: true })
      } catch (error) { return fail(error) }
    },
    async PATCH(request, id) {
      try {
        const auth = await access(request, id, true)
        if (auth.error) return auth.error
        if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('VALIDATION_ERROR')
        const bytes = await boundedBytes(request, 4096)
        const input = mediaMutationSchema.parse(JSON.parse(bytes.toString('utf8')))
        await mutate({ businessId: id, actorId: auth.user.id, admin: auth.admin, ...input })
        return privateJson({ ok: true })
      } catch (error) { return fail(error) }
    },
  }
}
