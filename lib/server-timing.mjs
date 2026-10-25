export function createServerTiming(now = () => performance.now()) {
  const measurements = []
  return {
    async measure(name, run) {
      const started = now()
      try { return await run() }
      finally { measurements.push(`${name};dur=${Math.max(0, now() - started).toFixed(1)}`) }
    },
    headers() { return { 'Server-Timing': measurements.join(', ') } },
  }
}
