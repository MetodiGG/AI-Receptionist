import { z } from 'zod'

export const MEDIA_BUCKET = 'business-media'
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
export const MAX_APPLICATION_BYTES = 4 * 1024 * 1024
export const MEDIA_FIELDS = 'id,staff_id,width,height,alt_text,sort_order,active,curated_src'
export const mediaMutationSchema = z.object({ revision: z.number().int().nonnegative(), action: z.enum(['hide', 'restore', 'cover']), mediaId: z.string().uuid() }).strict()
export const mediaUrl = id => `/api/business-media/${id}`
export function publicMedia(rows, staffId = null) {
  return (rows || []).filter(row => row.active && (row.staff_id || null) === staffId && z.string().uuid().safeParse(row.id).success)
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    .map(row => ({ src: mediaUrl(row.id), width: row.width, height: row.height, alt: { bg: row.alt_text || '', en: row.alt_text || '' }, caption: { bg: '', en: '' } }))
}
export function mediaErrorText(code, locale = 'bg') {
  const en = locale === 'en'
  const labels = {
    INVALID_IMAGE: ['Избери валидна JPG, PNG или WebP снимка. Без анимации, до 40 мегапиксела.', 'Choose a valid JPG, PNG or WebP photo. No animations; up to 40 megapixels.'],
    IMAGE_TOO_LARGE: ['Снимката е твърде голяма. Избери по-малък файл.', 'The photo is too large. Choose a smaller file.'],
    MEDIA_LIMIT: ['Достигнат е лимитът за снимки. Скрий ненужна снимка или се свържи с GoRez.', 'Photo limit reached. Hide an unused photo or contact GoRez.'],
    CONTENT_CHANGED: ['Междувременно има друга промяна. Обнови данните и опитай отново.', 'Another change was saved. Refresh the data and try again.'],
    FORBIDDEN: ['Нямаш достъп до този бизнес.', 'You do not have access to this business.'],
    RATE_LIMITED: ['Твърде много качвания. Изчакай и опитай по-късно.', 'Too many uploads. Wait and try later.'],
    MEDIA_UNAVAILABLE: ['Снимките временно не са достъпни. Опитай отново.', 'Photos are temporarily unavailable. Try again.'],
    CONTENT_UNAVAILABLE: ['Снимките временно не са достъпни. Опитай отново.', 'Photos are temporarily unavailable. Try again.'],
    UNAUTHORIZED: ['Влез отново, за да управляваш снимките.', 'Sign in again to manage photos.'],
    RESTORE_FIRST: ['Първо възстанови бизнеса от кошчето.', 'Restore the business from trash first.'],
    VALIDATION_ERROR: ['Провери снимката, описанието и съгласието за публикуване.', 'Check the photo, description and publishing consent.'],
  }
  return (labels[code] || labels.MEDIA_UNAVAILABLE)[en ? 1 : 0]
}
