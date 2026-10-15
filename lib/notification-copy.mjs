export function notificationAvailability(env, business = {}) {
  const email = env.EMAIL_NOTIFICATIONS_ENABLED === 'true' && Boolean(env.RESEND_API_KEY && env.EMAIL_FROM) && business.email_notifications_enabled === true
  return { email, reminders: email && env.EMAIL_REMINDERS_ENABLED === 'true' && String(env.CRON_SECRET || '').length >= 32 }
}

// Availability is not a delivery receipt. The booking page is the source of truth.
export function notificationNotice(notifications, locale = 'bg') {
  const en = locale === 'en'
  if (!notifications?.email) return en
    ? 'Confirmation is shown here. Email notifications are not enabled for this booking. Save your private link. No SMS or Viber messages are sent.'
    : 'Потвърждението се показва тук. Имейл известията не са включени за тази резервация. Запази личния линк. Не се изпращат SMS или Viber съобщения.'
  return (en
    ? 'We attempt to send booking updates by email. Check Spam too, and save your private link in case delivery is delayed.'
    : 'Ще опитаме да изпратим известията за резервацията на имейла ти. Провери и „Спам“ и запази личния линк при забавена доставка.') + (notifications.reminders ? (en
    ? ' For bookings made more than 24 hours ahead, a reminder is scheduled around 24 hours before the appointment.'
    : ' За резервации, направени повече от 24 часа предварително, е планирано напомняне около 24 часа преди посещението.') : '') + (en ? ' No SMS or Viber messages are sent.' : ' Не се изпращат SMS или Viber съобщения.')
}
