// The complete, owner-authorized G Point upload is a logo on white, not a
// landscape venue photograph. Fit this exact media revision without cropping;
// a replacement upload gets a different src and returns to the normal layout.
const containedLogos = new Set([
  '/api/catalogue-media/eebc21d3-2f13-42cd-9f81-877eb6bc5736',
])

export function businessPhotoStyle(photo) {
  const contain = photo?.fit === 'contain' || containedLogos.has(photo?.src)
  return {
    objectFit: contain ? 'contain' : 'cover',
    objectPosition: typeof photo?.position === 'string' && photo.position.length <= 100 ? photo.position : 'center',
    ...(contain ? { backgroundColor: '#fff' } : {}),
  }
}
