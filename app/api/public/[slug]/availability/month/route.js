import { getSafeError } from '../../../../../../lib/api-response'
import { createMonthlyAvailabilityHandler } from '../../../../../../lib/monthly-availability.mjs'
import { getMonthlyAvailableSlots, getPublicBusiness } from '../../../../../../lib/public-booking'
import { consumeRateLimit } from '../../../../../../lib/rate-limit'

const handleMonthlyAvailability = createMonthlyAvailabilityHandler({
  getPublicBusiness,
  getMonthlyAvailableSlots,
  consumeRateLimit,
  getSafeError,
})

export async function GET(request, context) {
  return handleMonthlyAvailability(request, context)
}
