export function apiError(message, status = 400, code = 'BAD_REQUEST') {
  return Response.json({ error: { code, message } }, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } })
}

export function getSafeError(error) {
  if (error?.code === 'EXTERNAL_BOOKING') return {message:error.message,status:409,code:'EXTERNAL_BOOKING'}
  if (error?.name === 'ZodError' || error instanceof SyntaxError) return { message: 'Провери въведените данни и опитай отново.', status: 422, code: 'VALIDATION_ERROR' }
  if (error?.code === 'VALIDATION_ERROR') return { message: error.message, status: 422, code: error.code }
  if (error?.code === 'SLOT_UNAVAILABLE') return { message: error.message, status: 409, code: error.code }
  if (error?.message?.includes('server-side Supabase')) return { message: 'Услугата временно не е конфигурирана.', status: 503, code: 'SERVICE_NOT_CONFIGURED' }
  return { message: 'Възникна неочаквана грешка. Опитай отново.', status: 500, code: 'INTERNAL_ERROR' }
}
