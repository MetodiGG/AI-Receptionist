import 'server-only'

import { DateTime } from 'luxon'
import { getSupabaseAdmin } from './supabase-admin'

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])
}

function emailFrame(title, content) {
  return `<!doctype html><html lang="bg"><body style="margin:0;background:#f4f6f0;font-family:Arial,sans-serif;color:#122019"><div style="max-width:620px;margin:0 auto;padding:32px 16px"><div style="background:#173e2a;color:#fff;border-radius:20px 20px 0 0;padding:24px 28px"><strong style="font-size:20px">GoRez</strong></div><div style="background:#fff;border:1px solid #dde4dc;border-top:0;border-radius:0 0 20px 20px;padding:30px 28px"><h1 style="font-size:26px;margin:0 0 18px">${escapeHtml(title)}</h1>${content}<p style="margin:28px 0 0;color:#6d786f;font-size:13px">Това съобщение е изпратено автоматично за управление на резервация.</p></div></div></body></html>`
}

function bookingDetails({ business, booking }) {
  const starts = DateTime.fromISO(booking.appointment.starts_at).setZone(business.timezone).setLocale('bg')
  const manageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ai-receptionist-beta-six.vercel.app'}/booking/${booking.appointment.cancellation_token}`
  return `<p>Здравей, ${escapeHtml(booking.customer.name)}!</p><p>Резервацията ти при <strong>${escapeHtml(business.name)}</strong> е потвърдена.</p><div style="margin:22px 0;padding:18px;background:#f4f6f0;border-radius:14px;line-height:1.8"><strong>${escapeHtml(booking.service.name)}</strong><br>${escapeHtml(starts.toFormat('cccc, d LLLL yyyy'))} · ${escapeHtml(starts.toFormat('HH:mm'))}<br>${escapeHtml(booking.staff.name)}${business.address ? `<br>${escapeHtml(business.address)}` : ''}</div><a href="${manageUrl}" style="display:inline-block;background:#173e2a;color:#fff;text-decoration:none;padding:13px 20px;border-radius:12px;font-weight:bold">Преглед и управление</a>`
}

async function deliver(row) {
  const supabase = getSupabaseAdmin()
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [row.recipient], subject: row.subject, html: row.html_body }),
  })
  const sentAt = new Date().toISOString()
  if (response.ok) {
    await supabase.from('notification_outbox').update({ status: 'sent', sent_at: sentAt, attempts: row.attempts + 1, last_error: null }).eq('id', row.id)
    return
  }
  const detail = await response.text()
  await supabase.from('notification_outbox').update({ status: 'failed', attempts: row.attempts + 1, last_error: detail.slice(0, 1000) }).eq('id', row.id)
}

async function enqueue(row) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('notification_outbox').upsert(row, { onConflict: 'idempotency_key', ignoreDuplicates: true }).select('*').maybeSingle()
  if (error) throw error
  if (data && new Date(data.scheduled_for).getTime() <= Date.now()) await deliver(data)
}

export async function sendBookingNotifications({ business, booking }) {
  if (!business.email_notifications_enabled) return
  const tasks = []
  if (booking.customer.email) {
    tasks.push(enqueue({
      business_id: business.id,
      appointment_id: booking.appointment.id,
      kind: 'booking_confirmation',
      recipient: booking.customer.email,
      subject: `Потвърдена резервация при ${business.name}`,
      html_body: emailFrame('Резервацията е потвърдена', bookingDetails({ business, booking })),
      idempotency_key: `confirmation:${booking.appointment.id}:${booking.customer.email}`,
    }))
    const reminderAt = DateTime.fromISO(booking.appointment.starts_at).minus({ hours: 24 })
    if (reminderAt > DateTime.now()) tasks.push(enqueue({
      business_id: business.id,
      appointment_id: booking.appointment.id,
      kind: 'booking_reminder',
      recipient: booking.customer.email,
      subject: `Напомняне за часа ти при ${business.name}`,
      html_body: emailFrame('Напомняне за предстоящ час', bookingDetails({ business, booking })),
      scheduled_for: reminderAt.toUTC().toISO(),
      idempotency_key: `reminder:${booking.appointment.id}:${booking.customer.email}`,
    }))
  }
  if (business.contact_email) {
    const starts = DateTime.fromISO(booking.appointment.starts_at).setZone(business.timezone).setLocale('bg')
    tasks.push(enqueue({
      business_id: business.id,
      appointment_id: booking.appointment.id,
      kind: 'owner_new_booking',
      recipient: business.contact_email,
      subject: `Нова резервация: ${booking.customer.name}`,
      html_body: emailFrame('Нова онлайн резервация', `<p><strong>${escapeHtml(booking.customer.name)}</strong> запази ${escapeHtml(booking.service.name)} за ${escapeHtml(starts.toFormat('d LLLL, HH:mm'))} при ${escapeHtml(booking.staff.name)}.</p><p>Телефон: ${escapeHtml(booking.customer.phone)}</p>`),
      idempotency_key: `owner-new:${booking.appointment.id}:${business.contact_email}`,
    }))
  }
  await Promise.allSettled(tasks)
}

export async function sendCancellationNotification({ appointment }) {
  const supabase = getSupabaseAdmin()
  await supabase.from('notification_outbox').update({ status: 'skipped', last_error: 'Appointment cancelled' }).eq('appointment_id', appointment.id).eq('kind', 'booking_reminder').eq('status', 'pending')
  const recipient = appointment.customer?.email
  if (!recipient) return
  await enqueue({
    business_id: appointment.business_id,
    appointment_id: appointment.id,
    kind: 'booking_cancelled',
    recipient,
    subject: `Отменена резервация при ${appointment.business.name}`,
    html_body: emailFrame('Резервацията е отменена', `<p>Часът ти за <strong>${escapeHtml(appointment.service.name)}</strong> при ${escapeHtml(appointment.business.name)} е отменен.</p>`),
    idempotency_key: `cancelled:${appointment.id}:${recipient}`,
  })
}

export async function processPendingNotifications(limit = 50) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('notification_outbox').select('*').in('status', ['pending', 'failed']).lte('scheduled_for', new Date().toISOString()).lt('attempts', 3).order('scheduled_for').limit(limit)
  if (error) throw error
  await Promise.allSettled((data || []).map(deliver))
  return data?.length || 0
}

