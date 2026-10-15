import 'server-only'

import { createHash } from 'node:crypto'
import { getSupabaseAdmin } from './supabase-admin'

function getFingerprint(request, includeUserAgent) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const address = forwarded || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = includeUserAgent ? request.headers.get('user-agent') || 'unknown' : ''
  return createHash('sha256').update(`${address}|${userAgent}`).digest('hex').slice(0, 32)
}

export async function consumeRateLimit(request, { scope, limit, windowSeconds, includeUserAgent = true }) {
  const supabase = getSupabaseAdmin()
  const rateKey = `${scope}:${getFingerprint(request, includeUserAgent)}`
  const { data, error } = await supabase.rpc('consume_api_rate_limit', {
    input_key: rateKey,
    request_limit: limit,
    window_seconds: windowSeconds,
  })

  if (error) throw error
  return Boolean(data)
}
