import { z } from 'zod'
import { PRODUCT_EVENT_NAMES } from './product-event-names.mjs'
export { PRODUCT_EVENT_NAMES }
export const productEventSchema = z.object({ event: z.enum(PRODUCT_EVENT_NAMES), page: z.enum(['home','for-businesses','book']), locale: z.enum(['bg','en']), flowKey: z.string().uuid(), consent: z.literal(true) }).strict()

export function createProductEventHandler({ enabled, allowAttempt, write }) {
  return async request => {
    const reply = (code,status) => Response.json({error:{code}},{status,headers:{'Cache-Control':'private, no-store'}})
    try {
      if (!enabled()) return new Response(null,{status:204})
      const origin=request.headers.get('origin')
      if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site')==='cross-site') return reply('FORBIDDEN',403)
      if (!request.headers.get('content-type')?.startsWith('application/json')) return reply('VALIDATION_ERROR',422)
      const raw=await request.text()
      if (raw.length>1024) return reply('VALIDATION_ERROR',422)
      const input=productEventSchema.safeParse(await Promise.resolve().then(()=>JSON.parse(raw)).catch(()=>null))
      if (!input.success) return reply('VALIDATION_ERROR',422)
      if (!await allowAttempt(request)) return reply('RATE_LIMITED',429)
      await write(input.data)
      return new Response(null,{status:204,headers:{'Cache-Control':'private, no-store'}})
    } catch { return reply('EVENT_UNAVAILABLE',503) }
  }
}
