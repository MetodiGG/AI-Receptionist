import { z } from 'zod'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'

function icsEscape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function icsDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function fold(line) {
  return line.match(/.{1,72}/g)?.join('\r\n ') || line
}

export async function GET(_request, context) {
  try {
    const { token } = await context.params
    const feedToken = z.string().uuid().parse(token)
    const supabase = getSupabaseAdmin()
    const { data: business, error: businessError } = await supabase.from('businesses').select('id,name,slug').eq('calendar_feed_token', feedToken).eq('active', true).maybeSingle()
    if (businessError) throw businessError
    if (!business) return new Response('Not found', { status: 404 })

    const from = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data, error } = await supabase
      .from('appointments')
      .select('id,starts_at,ends_at,status,notes,service:services(name),staff:staff(name),customer:customers(name,phone,email)')
      .eq('business_id', business.id)
      .neq('status', 'cancelled')
      .gte('ends_at', from)
      .order('starts_at')
    if (error) throw error

    const events = (data || []).flatMap((item) => [
      'BEGIN:VEVENT',
      `UID:${item.id}@ai-receptionist`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(item.starts_at)}`,
      `DTEND:${icsDate(item.ends_at)}`,
      fold(`SUMMARY:${icsEscape(`${item.service?.name || 'Резервация'} · ${item.customer?.name || 'Клиент'}`)}`),
      fold(`DESCRIPTION:${icsEscape([item.staff?.name ? `Специалист: ${item.staff.name}` : '', item.customer?.phone ? `Телефон: ${item.customer.phone}` : '', item.customer?.email ? `Имейл: ${item.customer.email}` : '', item.notes || ''].filter(Boolean).join('\n'))}`),
      `STATUS:${item.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT',
    ])

    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI Receptionist//Booking Calendar//BG', 'CALSCALE:GREGORIAN', fold(`X-WR-CALNAME:${icsEscape(business.name)}`), ...events, 'END:VCALENDAR', ''].join('\r\n')
    return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `inline; filename="${business.slug}.ics"`, 'Cache-Control': 'private, max-age=300' } })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}

