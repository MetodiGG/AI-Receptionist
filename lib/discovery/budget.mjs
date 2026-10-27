import { PROVIDER_COST_MICROUSD } from './config.mjs'

export function createBudgetGuard(db, config, log = () => {}) {
  return async (provider, method) => {
    const limits = config[provider], cost = PROVIDER_COST_MICROUSD[method]
    if (!limits || !Number.isInteger(cost)) return false
    try {
      const { data, error } = await db.rpc('claim_discovery_budget', {
        p_environment: config.environment, p_provider: provider, p_daily_limit: limits.daily, p_monthly_limit: limits.monthly,
        p_daily_cost_limit: limits.dailyCost, p_monthly_cost_limit: limits.monthlyCost, p_cost_microusd: cost,
      })
      if (error || data !== true) { log({ provider, method, status: error ? 'budget_unavailable' : 'quota' }); return false }
      log({ provider, method, status: 'reserved', reservedMicroUsd: cost })
      return true
    } catch { log({ provider, method, status: 'budget_unavailable' }); return false }
  }
}
// Whitelist logging at the sink too. Never log raw prompts, coordinates,
// provider payloads, contacts, IPs, API keys, or provider error messages.
export function logDiscoveryUsage(event) {
  const allowed = ['provider', 'method', 'status', 'durationMs', 'reservedMicroUsd', 'inputTokens', 'outputTokens']
  console.info(JSON.stringify({ event: 'discovery_usage', ...Object.fromEntries(allowed.filter(key => event[key] !== undefined).map(key => [key, event[key]])) }))
}
