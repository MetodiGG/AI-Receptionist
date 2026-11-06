// Observe actual DOM/layout changes, not React children identity. Typing in the
// search box must not tear down/re-register observers on every business card.
export function observeRailLayout(node, measure, env = globalThis) {
  let active = true, frame = null
  const children = new Set()
  const schedule = () => {
    if (!active || frame !== null) return
    frame = env.requestAnimationFrame(() => { frame = null; if (active) measure() })
  }
  const resize = typeof env.ResizeObserver === 'function' ? new env.ResizeObserver(schedule) : null
  const sync = () => {
    if (!active) return
    const current = new Set(node.children)
    for (const child of children) if (!current.has(child)) { resize?.unobserve(child); children.delete(child) }
    for (const child of current) if (!children.has(child)) { children.add(child); resize?.observe(child) }
    schedule()
  }
  resize?.observe(node)
  const mutations = typeof env.MutationObserver === 'function' ? new env.MutationObserver(sync) : null
  mutations?.observe(node, { childList: true })
  env.addEventListener('resize', schedule)
  sync()
  return () => {
    active = false; resize?.disconnect(); mutations?.disconnect()
    env.removeEventListener('resize', schedule)
    if (frame !== null) env.cancelAnimationFrame(frame)
    children.clear()
  }
}
