import 'server-only'

import { DateTime } from 'luxon'
import { z } from 'zod'
import { buildAvailableSlots } from './availability.mjs'
import { getSupabaseAdmin } from './supabase-admin'

const slugSchema = z.string().trim().min(2).max(64).regex(/^[a-z0-9-]+$/)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const bookingRequestSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(6).max(32),
    email: z.string().trim().email().max(180).optional().or(z.literal('')),
  }),
  notes: z.string().trim().max(600).optional().default(''),
  source: z.enum(['web', 'bot']).optional().default('web'),
})

export function normalizeSlug(value) {
  return slugSchema.parse(value)
}

export async function getPublicBusiness(slug) {
  const supabase = getSupabaseAdmin()
  const normalizedSlug = normalizeSlug(slug)

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id,name,slug,phone,address,timezone,languages,bot_instructions,welcome_message,booking_window_days,minimum_notice_minutes,booking_slot_minutes,theme_color')
    .eq('slug', normalizedSlug)
    .eq('active', true)
    .maybeSingle()

  if (error) throw error
  if (!business) return null

  const [servicesResult, staffResult, hoursResult, staffServicesResult] = await Promise.all([
    supabase.from('services').select('id,name,description,price,currency,duration_min,color,sort_order').eq('business_id', business.id).eq('active', true).order('sort_order').order('name'),
    supabase.from('staff').select('id,name,bio,sort_order').eq('business_id', business.id).eq('active', true).order('sort_order').order('name'),
    supabase.from('working_hours').select('staff_id,weekday,open_time,close_time').eq('business_id', business.id).order('weekday'),
    supabase.from('staff_services').select('staff_id,service_id').eq('business_id', business.id),
  ])

  const firstError = [servicesResult, staffResult, hoursResult, staffServicesResult].find((result) => result.error)?.error
  if (firstError) throw firstError

  return {
    ...business,
    services: servicesResult.data,
    staff: staffResult.data,
    workingHours: hoursResult.data,
    staffServices: staffServicesResult.data,
  }
}

export async function getAvailableSlots({ business, serviceId, staffId, date }) {
  const parsedDate = dateSchema.parse(date)
  const zone = business.timezone || 'Europe/Sofia'
  const requestedDay = DateTime.fromISO(parsedDate, { zone }).startOf('day')

  if (!requestedDay.isValid) return []

  const today = DateTime.now().setZone(zone).startOf('day')
  const lastBookableDay = today.plus({ days: business.booking_window_days || 60 })
  if (requestedDay < today || requestedDay > lastBookableDay) return []

  const service = business.services.find((item) => item.id === serviceId)
  if (!service) return []

  const mappedStaffIds = business.staffServices.filter((item) => item.service_id === serviceId).map((item) => item.staff_id)
  const eligibleStaff = business.staff.filter((person) => {
    if (staffId && person.id !== staffId) return false
    return mappedStaffIds.length === 0 || mappedStaffIds.includes(person.id)
  })
  if (!eligibleStaff.length) return []

  const supabase = getSupabaseAdmin()
  const rangeStart = requestedDay.toUTC().toISO()
  const rangeEnd = requestedDay.plus({ days: 1 }).toUTC().toISO()
  const eligibleIds = eligibleStaff.map((person) => person.id)

  const [appointmentsResult, timeOffResult] = await Promise.all([
    supabase
      .from('appointments')
      .select('staff_id,starts_at,ends_at')
      .in('staff_id', eligibleIds)
      .in('status', ['booked', 'confirmed'])
      .lt('starts_at', rangeEnd)
      .gt('ends_at', rangeStart),
    supabase
      .from('time_off')
      .select('staff_id,starts_at,ends_at')
      .eq('business_id', business.id)
      .lt('starts_at', rangeEnd)
      .gt('ends_at', rangeStart),
  ])

  if (appointmentsResult.error) throw appointmentsResult.error
  if (timeOffResult.error) throw timeOffResult.error

  return buildAvailableSlots({
    date: parsedDate,
    zone,
    durationMinutes: service.duration_min,
    slotMinutes: business.booking_slot_minutes || 15,
    minimumNoticeMinutes: business.minimum_notice_minutes || 0,
    staff: eligibleStaff,
    workingHours: business.workingHours,
    appointments: appointmentsResult.data,
    timeOff: timeOffResult.data,
  })
}

export async function createPublicBooking({ business, input }) {
  const payload = bookingRequestSchema.parse(input)
  const service = business.services.find((item) => item.id === payload.serviceId)
  const staffMember = business.staff.find((item) => item.id === payload.staffId)
  if (!service || !staffMember) throw new Error('Избраната услуга или служител вече не е наличен.')

  const localDate = DateTime.fromISO(payload.startsAt).setZone(business.timezone).toISODate()
  const slots = await getAvailableSlots({ business, serviceId: service.id, staffId: staffMember.id, date: localDate })
  const selectedSlot = slots.find((slot) => slot.staffId === staffMember.id && slot.startsAt === DateTime.fromISO(payload.startsAt).toUTC().toISO())
  if (!selectedSlot) {
    const conflict = new Error('Този час вече не е свободен. Избери друг час.')
    conflict.code = 'SLOT_UNAVAILABLE'
    throw conflict
  }

  const supabase = getSupabaseAdmin()
  const normalizedPhone = payload.customer.phone.replace(/\s+/g, ' ')
  let customer

  const { data: existingCustomer, error: findCustomerError } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', business.id)
    .eq('phone', normalizedPhone)
    .limit(1)
    .maybeSingle()
  if (findCustomerError) throw findCustomerError

  if (existingCustomer) {
    const { data, error } = await supabase
      .from('customers')
      .update({ name: payload.customer.name, email: payload.customer.email || null, last_seen_at: new Date().toISOString() })
      .eq('id', existingCustomer.id)
      .select()
      .single()
    if (error) throw error
    customer = data
  } else {
    const { data, error } = await supabase
      .from('customers')
      .insert({ business_id: business.id, name: payload.customer.name, phone: normalizedPhone, email: payload.customer.email || null, channel: payload.source === 'bot' ? 'web-chat' : 'web', last_seen_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    customer = data
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      business_id: business.id,
      staff_id: staffMember.id,
      service_id: service.id,
      customer_id: customer.id,
      starts_at: selectedSlot.startsAt,
      ends_at: selectedSlot.endsAt,
      notes: payload.notes || null,
      source: payload.source,
    })
    .select('id,starts_at,ends_at,status,cancellation_token')
    .single()

  if (appointmentError?.code === '23P01') {
    const conflict = new Error('Този час току-що беше резервиран. Избери друг час.')
    conflict.code = 'SLOT_UNAVAILABLE'
    throw conflict
  }
  if (appointmentError) throw appointmentError

  return { appointment, customer, service, staff: staffMember }
}
