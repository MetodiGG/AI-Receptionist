import { z } from 'zod'

// Required only when making a new appointment. Existing clients, chat visitors
// and anonymised records can still have a null email in the database.
export const bookingCustomerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(32).regex(/^\+?[\d\s().-]+$/).refine((value) => value.replace(/\D/g, '').length >= 6),
  email: z.string().trim().email().max(180),
})
