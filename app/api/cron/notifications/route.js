import { processPendingNotifications } from '../../../../lib/notifications'
import { createNotificationCron } from '../../../../lib/notification-cron.mjs'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import { cleanupBusinessMedia } from '../../../../lib/media-cleanup.mjs'

export const maxDuration = 30

export const GET = createNotificationCron({ env: process.env, process: async () => {
  const [notifications,media,referrals] = await Promise.all([
    processPendingNotifications(),
    cleanupBusinessMedia(getSupabaseAdmin()).catch(()=>({unavailable:true})),
    getSupabaseAdmin().rpc('prune_booking_referrals').then(result=>result.error?{unavailable:true}:{ok:true}).catch(()=>({unavailable:true})),
  ])
  return { ...notifications, media,referrals }
} })
export const POST = GET

