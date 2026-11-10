import { DateTime } from 'luxon'
import { z } from 'zod'
import { buildMonthlyAvailability } from '../../../../../lib/monthly-availability.mjs'

const qaId = z.string().uuid().refine(value => value.startsWith('00000000-0000-4000-8000-'))
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/)
const inputSchema = z.object({
  month: z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/), serviceId: qaId, staffId: qaId.optional(),
  attempt: z.number().int().min(1).max(10000), scenario: z.enum(['normal', 'empty', 'error', 'slow', 'conflict']),
  business: z.object({ id: z.literal('00000000-0000-4000-8000-000000000001'), slug: z.literal('qa-fictional-review-studio'), timezone: z.literal('Europe/Sofia'), booking_window_days: z.number().int().min(1).max(90),
    services: z.array(z.object({ id: qaId, duration_min: z.number().min(5).max(240) }).passthrough()).max(10),
    staff: z.array(z.object({ id: qaId, name: z.string().max(100) }).passthrough()).max(5),
    staffServices: z.array(z.object({ service_id: qaId, staff_id: qaId })).max(50),
    workingHours: z.array(z.object({ staff_id: qaId, weekday: z.number().int().min(1).max(7), open_time: time, close_time: time, break_start: time.nullish(), break_end: time.nullish() })).max(35),
  }).passthrough(),
})
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow' }

export async function POST(request) {
  // This route has no database/provider dependency and is inaccessible in a
  // production build. Its only purpose is exercising fictional local UI data.
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404, headers })
  const text = await request.text()
  if (text.length > 40000) return new Response(null, { status: 413, headers })
  try {
    const { business, scenario, attempt, ...selection } = inputSchema.parse(JSON.parse(text))
    if (scenario === 'error' && attempt === 1) return Response.json({ error: { code: 'QA_NETWORK_FAILURE' } }, { status: 503, headers })
    if (scenario === 'slow') await new Promise(resolve => setTimeout(resolve, 700))
    const fixture = { ...business, booking_slot_minutes: 30, minimum_notice_minutes: 0, ...(scenario === 'empty' ? { workingHours: [] } : {}) }
    const appointments = []
    if (scenario === 'conflict' && attempt > 1) {
      const first = DateTime.fromISO(`${selection.month}-01`, { zone: business.timezone })
      for (let index = 0; index < first.daysInMonth; index++) for (const person of business.staff) {
        const start = first.plus({ days: index }).set({ hour: 9 })
        appointments.push({ staff_id: person.id, starts_at: start.toUTC().toISO(), ends_at: start.plus({ hours: 1 }).toUTC().toISO() })
      }
    }
    return Response.json(buildMonthlyAvailability({ business: fixture, ...selection, appointments }), { headers })
  } catch { return Response.json({ error: { code: 'QA_INVALID_FIXTURE' } }, { status: 422, headers }) }
}
