// Short-lived, in-memory public catalogue cache. Never use for sessions,
// availability, bookings or authorization. Nothing is persisted to storage.
export function createReadCache({ maxAgeMs = 30000, now = Date.now } = {}) {
  let value, expiresAt = 0, pending = null, generation = 0
  return {
    peek() { return now() < expiresAt ? value : undefined },
    read(load, { force = false } = {}) {
      if (pending) return pending
      if (!force && now() < expiresAt) return Promise.resolve(value)
      const version = generation
      const task = Promise.resolve().then(load).then(result => {
        if (version === generation) { value = result; expiresAt = now() + maxAgeMs }
        return result
      }).finally(() => { if (pending === task) pending = null })
      pending = task
      return task
    },
    clear() { generation++; value = undefined; expiresAt = 0; pending = null },
  }
}
