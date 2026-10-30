import { z } from 'zod'

export const MEDIA_BUCKET = 'business-media'
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
export const MAX_APPLICATION_BYTES = 4 * 1024 * 1024
export const APPLICATION_PHOTO_BUDGET = MAX_APPLICATION_BYTES - 100000
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
    INVALID_IMAGE: ['Не успяхме да прочетем снимката. Опитай с JPG, PNG или WebP.', 'We could not read this photo. Try JPG, PNG or WebP.'],
    IMAGE_TOO_LARGE: ['Снимката е твърде голяма. Избери по-малък файл.', 'The photo is too large. Choose a smaller file.'],
    SOURCE_IMAGE_TOO_LARGE: ['Избери снимка до 50 MB. Намаляваме размера автоматично преди качване.', 'Choose a photo up to 50 MB. We reduce its size automatically before upload.'],
    IMAGE_PROCESSING_FAILED: ['Не успяхме да подготвим тази снимка. Опитай отново или избери JPG.', 'We could not prepare this photo. Try again or choose a JPG.'],
    HEIC_UNSUPPORTED: ['Този браузър не може да прочете HEIC снимката. Отвори със Safari или избери JPG.', 'This browser cannot read this HEIC photo. Open with Safari or choose a JPG.'],
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
