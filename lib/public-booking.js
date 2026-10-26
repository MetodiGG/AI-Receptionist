import 'server-only'

import { DateTime } from 'luxon'
import { z } from 'zod'
import { buildAvailableSlots } from './availability.mjs'
import { trackEvent } from './analytics'
import { processPendingNotifications } from './notifications'
import { notificationAvailability } from './notification-copy.mjs'
import { getSupabaseAdmin } from './supabase-admin'
import { buildBookingNotes } from './booking-intake.mjs'
import { sameCustomerContact } from './booking-safety.mjs'
import { businessAddress } from './business-location.mjs'
import { bookingCustomerSchema } from './booking-contact.mjs'
import { readBookableBusiness } from './public-business-query.mjs'
import { getBusinessPhotos } from './business-photos.mjs'
import { publicProfileDetails } from './business-profile.mjs'

const slugSchema = z.string().trim().min(2).max(64).regex(/^[a-z0-9-]+$/)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const bookingRequestSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  customer: bookingCustomerSchema,
  notes: z.string().trim().max(600).optional().default(''),
  intake: z.record(z.string().max(40), z.string().max(300)).optional().default({}),
  locale: z.enum(['bg', 'en']).optional().default('bg'),
  consent: z.literal(true),
  source: z.enum(['web', 'bot', 'manual']).optional().default('web'),
})

export function normalizeSlug(value) {
  return slugSchema.parse(value)
}

export function toPublicBusiness(business) {
  const {
    contact_email: _contactEmail,
    privacy_contact_email: _privacyEmail,
    email_notifications_enabled: _emailNotifications,
    ...safeBusiness
  } = business
  return { ...safeBusiness, public_profile: publicProfileDetails(business), photos: getBusinessPhotos(business), notifications: notificationAvailability(process.env, business) }
}

export async function getPublicBusiness(slug) {
  const supabase = getSupabaseAdmin()
  const normalizedSlug = normalizeSlug(slug)
  const business = await readBookableBusiness(supabase, normalizedSlug)
  if (!business) return null
  return {
    ...business,
    address: businessAddress(business),
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

export async function createPublicBooking({ business, input, existingCustomerId }) {
  const payload = bookingRequestSchema.parse(input)
  const appointmentNotes = buildBookingNotes(business.industry, payload.intake, payload.notes, payload.locale)
  const service = business.services.find((item) => item.id === payload.serviceId)
  const staffMember = business.staff.find((item) => item.id === payload.staffId)
  if (!service || !staffMember) {
    const error = new Error('Избраната услуга или служител вече не е наличен.')
    error.code = 'VALIDATION_ERROR'
    throw error
  }

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
  let createdCustomer = false

  let customerQuery = supabase
    .from('customers')
    .select('id,name,phone,email,channel')
    .eq('business_id', business.id)
    .limit(1)

  customerQuery = existingCustomerId
    ? customerQuery.eq('id', existingCustomerId)
    : customerQuery.eq('phone', normalizedPhone).eq('name', payload.customer.name)
  if (!existingCustomerId) {
    customerQuery = payload.customer.email ? customerQuery.eq('email', payload.customer.email) : customerQuery.is('email', null)
  }

  const { data: existingCustomer, error: findCustomerError } = await customerQuery.maybeSingle()
  if (findCustomerError) throw findCustomerError

  // Knowing someone's phone number must not let a public visitor overwrite
  // that person's identity on all their earlier appointments.
  const anonymousChatCustomer = existingCustomerId && existingCustomer && !existingCustomer.name && !existingCustomer.phone
  const contact = { ...payload.customer, phone: normalizedPhone }
  if (existingCustomer && (anonymousChatCustomer || sameCustomerContact(existingCustomer, contact))) {
    const { data, error } = await supabase
      .from('customers')
      .update(anonymousChatCustomer ? {
        name: payload.customer.name,
        phone: normalizedPhone,
        email: payload.customer.email || null,
        channel: payload.source === 'bot' ? 'web-chat' : existingCustomer.channel,
        last_seen_at: new Date().toISOString(),
      } : { last_seen_at: new Date().toISOString() })
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
    createdCustomer = true
  }

  const notifications = notificationAvailability(process.env, business)
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      business_id: business.id,
      staff_id: staffMember.id,
      service_id: service.id,
      customer_id: customer.id,
      starts_at: selectedSlot.startsAt,
      ends_at: selectedSlot.endsAt,
      notes: appointmentNotes,
      source: payload.source,
      consent_at: new Date().toISOString(),
      consent_version: '2026-10-13',
      notification_locale: payload.locale,
      email_notifications_requested: notifications.email,
      email_reminders_requested: notifications.reminders,
    })
    .select('id,starts_at,ends_at,status,cancellation_token')
    .single()

  if (appointmentError && createdCustomer) {
    // Only remove the new row created by this failed attempt, never a reused
    // customer. The database exclusion constraint is the final race guard.
    await supabase.from('customers').delete().eq('id', customer.id).eq('business_id', business.id)
  }
  if (appointmentError?.message?.includes('BUSINESS_NOT_BOOKABLE')) {
    const conflict = new Error('Този бизнес временно не приема нови резервации.')
    conflict.code = 'SLOT_UNAVAILABLE'
    throw conflict
  }
  if (appointmentError?.code === '23P01' || appointmentError?.message?.includes('SCHEDULE_UNAVAILABLE')) {
    const conflict = new Error('Този час току-що беше резервиран. Избери друг час.')
    conflict.code = 'SLOT_UNAVAILABLE'
    throw conflict
  }
  if (appointmentError) throw appointmentError

  const booking = { appointment, customer, service, staff: staffMember }
  await Promise.allSettled([
    ...(notifications.email ? [processPendingNotifications({ appointmentId: appointment.id, limit: 3 })] : []),
    trackEvent({ businessId: business.id, eventType: 'booking_created', source: payload.source, metadata: { serviceId: service.id, staffId: staffMember.id } }),
  ])

  return booking
}
