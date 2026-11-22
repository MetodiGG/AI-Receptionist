// The complete, owner-authorized G Point upload is a logo on white, not a
// landscape venue photograph. Fit this exact media revision without cropping;
// a replacement upload gets a different src and returns to the normal layout.
const containedLogos = new Set([
  '/api/catalogue-media/eebc21d3-2f13-42cd-9f81-877eb6bc5736',
])

export function businessPhotoStyle(photo, { preview = false } = {}) {
  const contain = photo?.fit === 'contain' || containedLogos.has(photo?.src)
  const position = typeof photo?.position === 'string' && photo.position.length <= 100 ? photo.position.trim() : ''
  // Public previews show the complete original upload. Curated crop metadata
  // stays intact for legacy uses, but cannot crop a preview's edges or faces.
  if (preview) return {
    objectFit: 'contain',
    objectPosition: 'center',
    backgroundColor: contain ? '#fff' : 'var(--photo-preview-surface, #f5f1eb)',
  }
  return {
    objectFit: contain ? 'contain' : 'cover',
    // Preserve the top of ordinary photographs (especially people's faces).
    // Curated focal points and uncropped, centred logos keep their own framing.
    objectPosition: position || (contain ? 'center' : 'center top'),
    ...(contain ? { backgroundColor: '#fff' } : {}),
  }
}
