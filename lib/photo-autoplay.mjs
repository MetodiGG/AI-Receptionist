export const PHOTO_ROTATION_MS = 5000

export function createPhotoAutoplay(advance, { schedule = setInterval, cancel = clearInterval } = {}) {
  let timer = null, disposed = false
  return {
    setEnabled(enabled) {
      if (disposed) return
      if (!enabled && timer !== null) { cancel(timer); timer = null }
      if (enabled && timer === null) timer = schedule(() => { if (!disposed && timer !== null) advance() }, PHOTO_ROTATION_MS)
    },
    dispose() { if (timer !== null) cancel(timer); timer = null; disposed = true },
  }
}
