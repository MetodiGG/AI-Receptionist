export function localizedApiMessage(error, locale = 'bg') {
  if (locale !== 'en') return error?.message || 'Опитай отново.'
  const messages = {
    VALIDATION_ERROR: 'Check the required fields and try again.',
    SLOT_UNAVAILABLE: 'This time is no longer available. Choose another time.',
    RATE_LIMITED: 'Too many attempts. Please wait a few minutes and try again.',
    CHAT_LIMIT: 'This conversation reached its limit. Start a new conversation.',
    NOT_FOUND: 'We could not find this page or booking.',
    UNAUTHORIZED: 'Please sign in again.',
    FORBIDDEN: 'You do not have access to this business.',
    CANNOT_CANCEL: 'This booking can no longer be cancelled online.',
    CANCELLATION_WINDOW_CLOSED: 'The online cancellation deadline has passed. Contact the business directly.',
    STATE_CHANGED: 'This booking has changed. Refresh the page and try again.',
    SERVICE_NOT_CONFIGURED: 'This service is temporarily unavailable.',
  }
  return messages[error?.code] || 'Something went wrong. Please try again.'
}
