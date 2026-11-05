import { estimateGoogleCardCosts } from '../lib/discovery/google-card-costs.mjs'
const scenarios = [
  ['100 visits, 3 visible cards, no contact panels', { visibleCards: 300, nearbySearches: 100 }],
  ['100 visits, 3 cards + 1 contact panel per visit', { visibleCards: 300, contactOpens: 100, nearbySearches: 100 }],
  ['100 visits/day for 30 days, 3 cards', { visibleCards: 9000, nearbySearches: 3000 }],
  ['100 visits/day for 30 days, 3 cards + 1 contact panel', { visibleCards: 9000, contactOpens: 3000, nearbySearches: 3000 }],
]
console.log(JSON.stringify({ warning: 'Scenarios assume all SKU free caps unused. Not a bill guarantee, live quota or current Production configuration. Existing app count/cost limits can stop this volume earlier.', scenarios: scenarios.map(([name, input]) => ({ name, ...estimateGoogleCardCosts(input) })) }, null, 2))
