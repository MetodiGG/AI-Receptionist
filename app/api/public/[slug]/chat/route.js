import OpenAI from 'openai'
import { DateTime } from 'luxon'
import { z } from 'zod'
import { apiError, getSafeError } from '../../../../../lib/api-response'
import { createPublicBooking, getAvailableSlots, getPublicBusiness } from '../../../../../lib/public-booking'
import { getSupabaseAdmin } from '../../../../../lib/supabase-admin'
import { consumeRateLimit } from '../../../../../lib/rate-limit'

const chatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(1200),
  })).min(1).max(20),
})

function getTools() {
  return [
    {
      type: 'function',
      name: 'get_available_slots',
      description: 'Проверява реалните свободни часове за конкретна услуга и дата.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string', description: 'UUID на услугата от предоставения бизнес контекст.' },
          date: { type: 'string', description: 'Дата във формат YYYY-MM-DD в часовата зона на бизнеса.' },
          staff_id: { type: ['string', 'null'], description: 'UUID на предпочитан служител или null.' },
        },
        required: ['service_id', 'date', 'staff_id'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'create_booking',
      description: 'Създава резервация само след изрично потвърждение от клиента за услугата, служителя, датата и часа.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          service_id: { type: 'string' },
          staff_id: { type: 'string' },
          starts_at: { type: 'string', description: 'ISO 8601 дата и час с timezone offset.' },
          customer_name: { type: 'string' },
          customer_phone: { type: 'string' },
          customer_email: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
        },
        required: ['service_id', 'staff_id', 'starts_at', 'customer_name', 'customer_phone', 'customer_email', 'notes'],
        additionalProperties: false,
      },
    },
  ]
}

function getInstructions(business) {
  const services = business.services.map((service) => `${service.name} [${service.id}] — ${service.duration_min} мин., ${service.price} ${service.currency}`).join('\n')
  const staff = business.staff.map((person) => `${person.name} [${person.id}]`).join('\n')
  const today = DateTime.now().setZone(business.timezone).toFormat('yyyy-MM-dd, cccc')

  return `Ти си внимателният AI рецепционист на ${business.name}. Отговаряй на български, кратко, топло и конкретно.
Днешна дата в часовата зона ${business.timezone}: ${today}.

УСЛУГИ:
${services || 'Няма активни услуги.'}

ЕКИП:
${staff || 'Няма активни служители.'}

АДРЕС: ${business.address || 'Не е посочен'}
ТЕЛЕФОН: ${business.phone || 'Не е посочен'}
ДОПЪЛНИТЕЛНИ ИНСТРУКЦИИ: ${business.bot_instructions || 'Няма.'}

Правила:
- Никога не измисляй свободни часове. Използвай get_available_slots.
- Преди create_booking събери име и телефон и повтори услугата, служителя и точния час за потвърждение.
- Не създавай резервация без ясно „да“ или равностойно потвърждение.
- При неясен избор за служител предложи най-ранния свободен час.
- Не показвай вътрешни UUID идентификатори на клиента.
- Ако клиентът не иска чат, насочи го към формата за резервация на същата страница.`
}

async function ensureConversation(businessId, conversationId) {
  const supabase = getSupabaseAdmin()

  if (conversationId) {
    const { data, error } = await supabase.from('conversations').select('id,customer_id').eq('id', conversationId).eq('business_id', businessId).maybeSingle()
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
    .insert({ business_id: businessId, customer_id: customer.id, channel: 'web' })
    .select('id,customer_id')
    .single()
  if (conversationError) throw conversationError
  return conversation
}

async function runTool({ call, business, conversation }) {
  const args = JSON.parse(call.arguments)

  if (call.name === 'get_available_slots') {
    const slots = await getAvailableSlots({
      business,
      serviceId: args.service_id,
      staffId: args.staff_id || undefined,
      date: args.date,
    })
    return { slots: slots.slice(0, 16), timezone: business.timezone }
  }

  if (call.name === 'create_booking') {
    const result = await createPublicBooking({
      business,
      input: {
        serviceId: args.service_id,
        staffId: args.staff_id,
        startsAt: args.starts_at,
        customer: {
          name: args.customer_name,
          phone: args.customer_phone,
          email: args.customer_email || '',
        },
        notes: args.notes || '',
        source: 'bot',
      },
    })

    const supabase = getSupabaseAdmin()
    const { error: conversationError } = await supabase
      .from('conversations')
      .update({ customer_id: result.customer.id, updated_at: new Date().toISOString() })
      .eq('id', conversation.id)
    if (conversationError) throw conversationError
    conversation.customer_id = result.customer.id

    return {
      success: true,
      appointment_id: result.appointment.id,
      service: result.service.name,
      staff: result.staff.name,
      starts_at: result.appointment.starts_at,
      timezone: business.timezone,
    }
  }

  return { error: 'Unknown tool.' }
}

export async function POST(request, context) {
  try {
    const { slug } = await context.params
    if (!await consumeRateLimit(request, { scope: `chat:${slug}`, limit: 30, windowSeconds: 600 })) {
      return apiError('Твърде много съобщения. Опитай отново след няколко минути.', 429, 'RATE_LIMITED')
    }
    const business = await getPublicBusiness(slug)
    if (!business) return apiError('Този бизнес не е открит.', 404, 'NOT_FOUND')

    const input = chatRequestSchema.parse(await request.json())
    const conversation = await ensureConversation(business.id, input.conversationId)
    const supabase = getSupabaseAdmin()
    const lastUserMessage = [...input.messages].reverse().find((message) => message.role === 'user')

    const { count, error: countError } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', conversation.id)
    if (countError) throw countError
    if ((count || 0) >= 40) return apiError('Този разговор достигна лимита си. Започни нов разговор.', 429, 'CHAT_LIMIT')

    const { error: userMessageError } = await supabase.from('messages').insert({
      business_id: business.id,
      customer_id: conversation.customer_id,
      conversation_id: conversation.id,
      role: 'customer',
      content: lastUserMessage.content,
    })
    if (userMessageError) throw userMessageError

    if (!process.env.OPENAI_API_KEY) {
      const reply = 'AI асистентът се конфигурира в момента. Можеш да използваш формата „Резервирай час“ на тази страница.'
      const { error: fallbackMessageError } = await supabase.from('messages').insert({ business_id: business.id, customer_id: conversation.customer_id, conversation_id: conversation.id, role: 'bot', content: reply })
      if (fallbackMessageError) throw fallbackMessageError
      return Response.json({ conversationId: conversation.id, message: reply, configured: false })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const tools = getTools()
    const messages = input.messages.slice(-12).map((message) => ({ role: message.role, content: message.content }))
    let response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-6-luna',
      instructions: getInstructions(business),
      input: messages,
      tools,
      max_output_tokens: 500,
    })

    for (let iteration = 0; iteration < 4; iteration += 1) {
      const calls = response.output.filter((item) => item.type === 'function_call')
      if (!calls.length) break

      const toolOutputs = []
      for (const call of calls) {
        try {
          const result = await runTool({ call, business, conversation })
          toolOutputs.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) })
        } catch (toolError) {
          toolOutputs.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify({ error: toolError.message }) })
        }
      }

      response = await openai.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-6-luna',
        instructions: getInstructions(business),
        previous_response_id: response.id,
        input: toolOutputs,
        tools,
        max_output_tokens: 500,
      })
    }

    const reply = response.output_text?.trim() || 'Не успях да подготвя отговор. Опитай отново.'
    const { error: botMessageError } = await supabase.from('messages').insert({ business_id: business.id, customer_id: conversation.customer_id, conversation_id: conversation.id, role: 'bot', content: reply })
    if (botMessageError) throw botMessageError
    const { error: updatedConversationError } = await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id)
    if (updatedConversationError) throw updatedConversationError

    return Response.json({ conversationId: conversation.id, message: reply, configured: true })
  } catch (error) {
    const safe = getSafeError(error)
    return apiError(safe.message, safe.status, safe.code)
  }
}
