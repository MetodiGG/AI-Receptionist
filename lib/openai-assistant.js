import 'server-only'

import { getSupabaseAdmin } from './supabase-admin'

const MODEL_PRICES = {
  'gpt-6-luna': { input: 0.1, output: 0.5 },
}

function monthStart() {
  const date = new Date()
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString()
}

function buildContext(business) {
  const services = business.services.map((service) => `${service.name}: ${service.duration_min} мин., ${service.price} ${service.currency}`).join('\n')
  const staff = business.staff.map((person) => person.name).join(', ')
  const hours = business.workingHours.map((row) => `ден ${row.weekday}: ${row.open_time.slice(0, 5)}-${row.close_time.slice(0, 5)}`).join('\n')
  return [
    `Бизнес: ${business.name}`,
    `Категория: ${business.industry || 'other'}`,
    business.address ? `Адрес: ${business.address}` : null,
    business.phone ? `Телефон: ${business.phone}` : null,
    `Услуги:\n${services || 'Няма публикувани услуги.'}`,
    `Екип: ${staff || 'Няма публикуван екип.'}`,
    `Работно време:\n${hours || 'Няма публикувано работно време.'}`,
    business.bot_instructions ? `Правила:\n${business.bot_instructions}` : null,
  ].filter(Boolean).join('\n\n')
}

function estimatedCostMicrousd(model, inputTokens, outputTokens) {
  const price = MODEL_PRICES[model] || MODEL_PRICES['gpt-6-luna']
  return Math.ceil((inputTokens * price.input) + (outputTokens * price.output))
}

export async function createGroundedAnswer({ business, conversationId, message }) {
  if (!business.ai_enabled || !process.env.OPENAI_API_KEY) return null

  const supabase = getSupabaseAdmin()
  const { data: usageRows, error: usageError } = await supabase
    .from('ai_usage_events')
    .select('estimated_cost_microusd')
    .eq('business_id', business.id)
    .gte('created_at', monthStart())
  if (usageError) throw usageError

  const usedMicrousd = (usageRows || []).reduce((sum, row) => sum + Number(row.estimated_cost_microusd || 0), 0)
  const budgetMicrousd = Number(business.ai_monthly_budget_cents || 0) * 10000
  if (budgetMicrousd <= 0 || usedMicrousd >= budgetMicrousd) return null

  const model = business.ai_model || 'gpt-6-luna'
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 220,
      instructions: [
        'Ти си онлайн рецепционист на български език.',
        'Отговаряй кратко, приветливо и само с факти от предоставения бизнес контекст.',
        'Никога не измисляй цена, услуга, свободен час, служител, политика или адрес.',
        'Не твърди, че си създал, променил или отменил резервация.',
        'Когато клиентът иска резервация, насочи го да натисне бутона „Запази час“.',
        'Ако информацията липсва, кажи го ясно и предложи директен контакт с бизнеса.',
        '',
        buildContext(business),
      ].join('\n'),
      input: message,
    }),
  })

  if (!response.ok) throw new Error(`OpenAI request failed with status ${response.status}`)
  const result = await response.json()
  const answer = (result.output_text || result.output?.flatMap((item) => item.content || []).filter((item) => item.type === 'output_text').map((item) => item.text).join('') || '').trim()
  if (!answer) return null

  const inputTokens = Number(result.usage?.input_tokens || 0)
  const outputTokens = Number(result.usage?.output_tokens || 0)
  const { error: insertError } = await supabase.from('ai_usage_events').insert({
    business_id: business.id,
    conversation_id: conversationId,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost_microusd: estimatedCostMicrousd(model, inputTokens, outputTokens),
  })
  if (insertError) console.error('AI usage was not recorded.', insertError)

  return answer
}

