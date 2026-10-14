import { DateTime } from 'luxon'
import { z } from 'zod'
import { apiError, getSafeError } from '../../../../../lib/api-response'
import { buildGuidedReply, describeDate, detectGuidedTopic, getEligibleStaff } from '../../../../../lib/guided-assistant.mjs'
import { createPublicBooking, getAvailableSlots, getPublicBusiness } from '../../../../../lib/public-booking'
import { consumeRateLimit } from '../../../../../lib/rate-limit'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { trackEvent } from '../../../../../lib/analytics'

const conversationField = { conversationId: z.string().uuid().optional() }
const localeField = { locale: z.enum(['bg', 'en']).optional().default('bg') }
const serviceField = { serviceId: z.string().uuid() }
const staffField = { staffId: z.string().uuid().nullable() }

const chatRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('ask'), message: z.string().trim().min(1).max(500), ...localeField, ...conversationField }),
  z.object({ action: z.literal('faq'), topic: z.enum(['services', 'hours', 'contact', 'cancellation', 'rules']), ...localeField, ...conversationField }),
  z.object({ action: z.literal('start_booking'), ...localeField, ...conversationField }),
  z.object({ action: z.literal('select_service'), ...serviceField, ...localeField, ...conversationField }),
  z.object({ action: z.literal('select_staff'), ...serviceField, ...staffField, ...localeField, ...conversationField }),
  z.object({ action: z.literal('select_date'), ...serviceField, ...staffField, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), ...localeField, ...conversationField }),
  z.object({ action: z.literal('select_slot'), ...serviceField, staffId: z.string().uuid(), startsAt: z.string().datetime({ offset: true }), ...localeField, ...conversationField }),
  z.object({
    action: z.literal('book'),
    ...serviceField,
    staffId: z.string().uuid(),
    startsAt: z.string().datetime({ offset: true }),
    customer: z.object({
      name: z.string().trim().min(2).max(100),
      phone: z.string().trim().min(6).max(32),
      email: z.string().trim().email().max(180).optional().or(z.literal('')),
    }),
    notes: z.string().trim().max(600).optional().default(''),
    consent: z.literal(true),
    ...localeField,
    ...conversationField,
  }),
])

const FAQ_LABELS = {
  services: 'Какви услуги и цени предлагате?',
  hours: 'Какво е работното ви време?',
  contact: 'Къде се намирате и как да се свържа с вас?',
  cancellation: 'Как мога да отменя резервация?',
  rules: 'Имате ли допълнителни правила?',
}

function validationError(message) {
  const error = new Error(message)
  error.code = 'VALIDATION_ERROR'
  return error
}

function findService(business, serviceId) {
  const service = business.services.find((item) => item.id === serviceId)
  if (!service) throw validationError('Тази услуга вече не е налична. Избери друга.')
  return service
}

function findStaff(business, serviceId, staffId) {
  if (!staffId) return null
  const person = getEligibleStaff(business, serviceId).find((item) => item.id === staffId)
  if (!person) throw validationError('Този специалист не предлага избраната услуга. Избери друг.')
  return person
}

async function ensureConversation(businessId, conversationId) {
  const supabase = getSupabaseAdmin()

  if (conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('id,customer_id,status')
      .eq('id', conversationId)
      .eq('business_id', businessId)
      .maybeSingle()
    if (error) throw error
    if (data) return data
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({ business_id: businessId, channel: 'web-chat', external_id: crypto.randomUUID(), last_seen_at: new Date().toISOString() })
    .select('id')
    .single()
  if (customerError) throw customerError

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({ business_id: businessId, customer_id: customer.id, channel: 'guided-web' })
    .select('id,customer_id,status')
    .single()
  if (conversationError) throw conversationError
  return conversation
}

async function appendExchange({ businessId, conversation, userText, reply, action }) {
  const supabase = getSupabaseAdmin()
  const rows = [
    { business_id: businessId, customer_id: conversation.customer_id, conversation_id: conversation.id, role: 'customer', content: userText, metadata: { action } },
    { business_id: businessId, customer_id: conversation.customer_id, conversation_id: conversation.id, role: 'bot', content: reply, metadata: { action } },
  ]
  const { error: messageError } = await supabase.from('messages').insert(rows)
  if (messageError) throw messageError

  const { error: conversationError } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversation.id)
    .eq('business_id', businessId)
  if (conversationError) throw conversationError
}

function compactSlots(slots, hasPreferredStaff) {
  if (hasPreferredStaff) return slots.slice(0, 24)

  const seen = new Set()
  return slots.filter((slot) => {
    if (seen.has(slot.startsAt)) return false
    seen.add(slot.startsAt)
    return true
  }).slice(0, 24)
}

export async function POST(request, context) {
  try {
    const { slug } = await context.params
    if (!await consumeRateLimit(request, { scope: `guided-chat:${slug}`, limit: 40, windowSeconds: 600 })) {
      return apiError('Твърде много действия. Опитай отново след няколко минути.', 429, 'RATE_LIMITED')
    }

    const business = await getPublicBusiness(slug)
    if (!business) return apiError('Този бизнес не е открит.', 404, 'NOT_FOUND')

    const input = chatRequestSchema.parse(await request.json())
    const conversation = await ensureConversation(business.id, input.conversationId)
    const supabase = getSupabaseAdmin()
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversation.id)
    if (countError) throw countError
    if ((count || 0) >= 60) return apiError('Този разговор достигна лимита си. Започни нов разговор.', 429, 'CHAT_LIMIT')

    let userText = ''
    let reply = ''
    let responseData = {}
    let bookingSucceeded = false

    if (input.action === 'ask') {
      const topic = detectGuidedTopic(input.message)
      userText = input.message
      reply = buildGuidedReply(business, topic, input.locale)
      responseData = { topic }
    }

    if (input.action === 'faq') {
      userText = input.locale === 'en' ? `Question: ${input.topic}` : FAQ_LABELS[input.topic]
      reply = buildGuidedReply(business, input.topic, input.locale)
    }

    if (input.action === 'start_booking') {
      userText = input.locale === 'en' ? 'I would like to book an appointment.' : 'Искам да резервирам час.'
      reply = buildGuidedReply(business, 'booking', input.locale)
    }

    if (input.action === 'select_service') {
      const service = findService(business, input.serviceId)
      userText = `Избирам „${service.name}“.`
      reply = input.locale === 'en' ? `Great choice. ${service.name} takes ${service.duration_min} minutes. Who would you prefer?` : `Чудесен избор. ${service.name} е с продължителност ${service.duration_min} минути. При кого предпочиташ да бъде часът?`
    }

    if (input.action === 'select_staff') {
      const service = findService(business, input.serviceId)
      const person = findStaff(business, service.id, input.staffId)
      userText = person ? `Предпочитам ${person.name}.` : 'Нямам предпочитание за специалист.'
      reply = input.locale === 'en' ? 'Choose a convenient date and I will check live availability.' : 'Добре. Избери удобна дата и ще проверя реално свободните часове.'
    }

    if (input.action === 'select_date') {
      const service = findService(business, input.serviceId)
      findStaff(business, service.id, input.staffId)
      const slots = compactSlots(await getAvailableSlots({
        business,
        serviceId: service.id,
        staffId: input.staffId || undefined,
        date: input.date,
      }), Boolean(input.staffId))
      const readableDate = describeDate(input.date, business.timezone, input.locale)
      userText = `Проверка за ${readableDate}.`
      reply = slots.length
        ? (input.locale === 'en' ? `There are ${slots.length} available times on ${readableDate}. Choose the one that suits you.` : `Имаме ${slots.length} подходящи часа за ${readableDate}. Избери най-удобния.`)
        : (input.locale === 'en' ? `There are no available times on ${readableDate}. Choose another date.` : `За ${readableDate} няма свободни часове. Избери друга дата.`)
      responseData = { slots }
    }

    if (input.action === 'select_slot') {
      const service = findService(business, input.serviceId)
      const person = findStaff(business, service.id, input.staffId)
      const localStart = DateTime.fromISO(input.startsAt).setZone(business.timezone)
      const slots = await getAvailableSlots({
        business,
        serviceId: service.id,
        staffId: person.id,
        date: localStart.toISODate(),
      })
      const slot = slots.find((item) => item.staffId === person.id && item.startsAt === localStart.toUTC().toISO())
      if (!slot) {
        const error = new Error('Този час вече не е свободен. Избери друг час.')
        error.code = 'SLOT_UNAVAILABLE'
        throw error
      }
      userText = `Избирам ${slot.localTime} при ${person.name}.`
      reply = input.locale === 'en' ? 'All that remains is to enter your name and phone number for confirmation.' : 'Остава само да въведеш име и телефон за потвърждение на резервацията.'
      responseData = { slot }
    }

    if (input.action === 'book') {
      if (!await consumeRateLimit(request, { scope: `guided-booking:${slug}`, limit: 10, windowSeconds: 600 })) {
        return apiError('Твърде много опити за резервация. Изчакай няколко минути.', 429, 'RATE_LIMITED')
      }
      const result = await createPublicBooking({
        business,
        existingCustomerId: conversation.customer_id,
        input: {
          serviceId: input.serviceId,
          staffId: input.staffId,
          startsAt: input.startsAt,
          customer: input.customer,
          notes: input.notes,
          consent: input.consent,
          source: 'bot',
        },
      })
      const localStart = DateTime.fromISO(result.appointment.starts_at).setZone(business.timezone).setLocale(input.locale)
      userText = 'Потвърждавам резервацията.'
      reply = input.locale === 'en' ? `Done! ${result.service.name} is booked for ${localStart.toFormat('cccc, d LLLL')} at ${localStart.toFormat('HH:mm')} with ${result.staff.name}.` : `Готово! Запазих ${result.service.name} за ${localStart.toFormat('cccc, d LLLL')} в ${localStart.toFormat('HH:mm')} при ${result.staff.name}.`
      responseData = {
        booking: {
          appointment: result.appointment,
          service: result.service,
          staff: result.staff,
          localTime: localStart.toFormat('HH:mm'),
          localDate: localStart.toISODate(),
        },
      }
      bookingSucceeded = true
      const { error: conversationError } = await supabase
        .from('conversations')
        .update({ customer_id: result.customer.id, status: 'resolved', updated_at: new Date().toISOString() })
        .eq('id', conversation.id)
        .eq('business_id', business.id)
      if (conversationError) console.error('Неуспешно обновяване на разговора след създадена резервация.', conversationError)
      conversation.customer_id = result.customer.id
    }

    try {
      await appendExchange({ businessId: business.id, conversation, userText, reply, action: input.action })
    } catch (messageError) {
      // След успешно записан час не връщаме подвеждаща грешка, която може да
      // накара клиента да повтори заявката и да създаде дублиращ опит.
      if (!bookingSucceeded) throw messageError
      console.error('Неуспешно записване на съобщенията след създадена резервация.', messageError)
    }
    await trackEvent({
      businessId: business.id,
      eventType: input.action === 'start_booking' ? 'chat_started' : 'chat_message',
      source: 'guided',
      sessionKey: conversation.id,
      metadata: { action: input.action },
    })
    return Response.json({ conversationId: conversation.id, message: reply, mode: 'guided', ...responseData })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
