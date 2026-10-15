import { processPendingNotifications } from '../../../../lib/notifications'
import { createNotificationCron } from '../../../../lib/notification-cron.mjs'

export const maxDuration = 30

export const GET = createNotificationCron({ env: process.env, process: processPendingNotifications })
export const POST = GET

