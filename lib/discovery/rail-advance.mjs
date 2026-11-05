import { railScrollState } from './rail-scroll.mjs'

// A resize, focus change, append, or initial observation is not a request for
// another page. Consume one user advance only once, even if scroll anchoring
// produces additional scroll events after the new cards arrive.
export function createRailAdvanceGate() {
  let armed = false
  return {
    arm() { armed = true },
    reset() { armed = false },
    consume(metrics, { explicit = false } = {}) {
      const { left, max } = railScrollState(metrics)
      const threshold = Math.max(80, Math.min(320, (metrics?.clientWidth || 0) / 2))
      if (!armed || max - left > threshold || (!explicit && left <= 4)) return false
      armed = false
      return true
    },
  }
}
