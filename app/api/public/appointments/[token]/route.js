import { DateTime } from 'luxon'
import { z } from 'zod'
import { apiError, getSafeError } from '../../../../../lib/api-response'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { sendCancellationNotification } from '../../../../../lib/notifications'
import { trackEvent } from '../../../../../lib/analytics'

const tokenSchema = z.string().uuid()

async function getAppointment(token) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('appointments')
    .select('id,business_id,starts_at,ends_at,status,cancellation_token,notes,business:businesses(name,slug,phone,address,timezone,cancellation_notice_hours),service:services(name,duration_min,price,currency),staff:staff(name),customer:customers(name,email,phone)')
    .eq('cancellation_token', tokenSchema.parse(token))
    .maybeSingle()
  if (error) throw error
  return data
}

export async function GET(request, context) {
  try {
    const { token } = await context.params
    if (!await consumeRateLimit(request, { scope: 'appointment-view', limit: 60, windowSeconds: 600 })) {
      return apiError('Твърде много заявки. Опитай отново след малко.', 429, 'RATE_LIMITED')
    }
    const appointment = await getAppointment(token)
    if (!appointment) return apiError('Резервацията не е намерена.', 404, 'NOT_FOUND')
    return Response.json({ appointment })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}

export async function POST(request, context) {
  try {
    const { token } = await context.params
    if (!await consumeRateLimit(request, { scope: 'appointment-cancel', limit: 10, windowSeconds: 600 })) {
      return apiError('Твърде много опити. Изчакай няколко минути.', 429, 'RATE_LIMITED')
    }
    const body = await request.json()
    if (body.action !== 'cancel') return apiError('Невалидно действие.', 422, 'VALIDATION_ERROR')

    const appointment = await getAppointment(token)
    if (!appointment) return apiError('Резервацията не е намерена.', 404, 'NOT_FOUND')
    if (appointment.status === 'cancelled') return Response.json({ appointment })
    if (!['booked', 'confirmed'].includes(appointment.status)) return apiError('Тази резервация вече не може да бъде отменена.', 409, 'CANNOT_CANCEL')

    const cutoff = DateTime.fromISO(appointment.starts_at).minus({ hours: appointment.business.cancellation_notice_hours || 0 })
    if (DateTime.now() >= cutoff) {
      return apiError(`Онлайн отказ е възможен до ${appointment.business.cancellation_notice_hours || 0} часа преди часа. Свържи се директно с бизнеса.`, 409, 'CANCELLATION_WINDOW_CLOSED')
    }

    const supabase = getSupabaseAdmin()
    const cancelledAt = new Date().toISOString()
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', cancelled_at: cancelledAt, updated_at: cancelledAt })
      .eq('id', appointment.id)
      .eq('cancellation_token', token)
      .in('status', ['booked', 'confirmed'])
      .select('id,status,cancelled_at')
      .maybeSingle()
    if (error) throw error
    if (!data) return apiError('Резервацията вече е променена. Обнови страницата.', 409, 'STATE_CHANGED')

    await Promise.allSettled([
      sendCancellationNotification({ appointment }),
      trackEvent({ businessId: appointment.business_id, eventType: 'booking_cancelled', source: 'customer-link' }),
    ])

    return Response.json({ appointment: { ...appointment, ...data } })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
