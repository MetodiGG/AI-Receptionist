import { z } from 'zod'
import { PARTNER_CATEGORY_KEYS, normalizeLeadText } from './partner-leads.mjs'
import { safeWebsite } from './product-config.mjs'

const optionalText = max => z.string().trim().max(max).refine(value => !value || value.length >= 2).optional().default('')
export const leadSubmissionSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(32).regex(/^[+()\d .-]+$/).refine(value => {const digits=value.replace(/\D/g,'');return digits.length>=7&&digits.length<=15}),
  email: z.string().trim().email().max(180).transform(value=>value.toLowerCase()),
  category: z.enum(PARTNER_CATEGORY_KEYS),
  contactName: optionalText(100), city: optionalText(100),
  websiteUrl: z.string().trim().max(300).refine(value => !value || Boolean(safeWebsite(value))).optional().default(''),
  locale: z.enum(['bg','en']).optional().default('bg'),
  company: z.string().max(0).optional().default(''),
}).strict()
export function leadDatabaseRecord(input,fingerprint) {
  return {business_name:normalizeLeadText(input.businessName),contact_name:normalizeLeadText(input.contactName)||null,phone:normalizeLeadText(input.phone),email:input.email,category:input.category,city:normalizeLeadText(input.city)||null,website_url:input.websiteUrl||null,locale:input.locale,fingerprint}
}
