// One request for each result generation/cursor. Intersection events can fire
// repeatedly before React commits the loading state; never fan out requests.
export function createBusinessListAdvanceGate() {
  let requested = null
  return {
    request(key, load) {
      if (typeof load !== 'function' || key === requested) return false
      requested = key
      load()
      return true
    },
  }
}

// Observe the end of the document-flow list, not a nested scrolling container.
// This helper never fetches, moves focus, scrolls the page or changes ordering.
export function observeBusinessListEnd(node, advance, env, { requireScrollIntent = false } = {}) {
  if (!node || typeof advance !== 'function') return () => {}
  let active = true, frame = null
  let visible = false, startY = null, touchY = null, scrolled = false
  const reveal = () => { if (active && visible && (!requireScrollIntent || scrolled)) advance() }
  // Paid/further batches require an intentional downward action followed by
  // real document movement. Initial intersections, layout shifts and a search's
  // programmatic focus/scroll must not spend another provider request.
  const markIntent = event => { if (active && event.isTrusted !== false) startY ??= env.scrollY }
  const onWheel = event => { if (event.deltaY > 0 && !event.ctrlKey) markIntent(event) }
  const onTouchStart = event => { if (active && event.isTrusted !== false) touchY = event.touches[0]?.clientY ?? null }
  const onTouchMove = event => { if (touchY !== null && event.touches[0]?.clientY < touchY) markIntent(event) }
  const onKey = event => {
    if (['PageDown', 'ArrowDown', 'End', ' '].includes(event.key) && !(event.key === ' ' && event.shiftKey)
      && !event.target?.isContentEditable && !event.target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) markIntent(event)
  }
  const noteScroll = () => { scrolled ||= startY !== null && env.scrollY > startY + 120 }
  const listenForIntent = () => {
    if (!requireScrollIntent) return () => {}
    env.addEventListener('wheel', onWheel, { passive: true })
    env.addEventListener('touchstart', onTouchStart, { passive: true })
    env.addEventListener('touchmove', onTouchMove, { passive: true })
    env.addEventListener('keydown', onKey)
    return () => {
      env.removeEventListener('wheel', onWheel); env.removeEventListener('touchstart', onTouchStart)
      env.removeEventListener('touchmove', onTouchMove); env.removeEventListener('keydown', onKey)
    }
  }
  if (typeof env.IntersectionObserver === 'function') {
    const onScroll = () => { if (active) { noteScroll(); reveal() } }
    const observer = new env.IntersectionObserver(entries => {
      if (!active) return
      const relevant = entries.filter(entry => entry.target === node)
      if (relevant.length) { visible = relevant.some(entry => entry.isIntersecting); reveal() }
    }, { root: null, rootMargin: '400px 0px', threshold: 0 })
    const stopIntent = listenForIntent()
    if (requireScrollIntent) env.addEventListener('scroll', onScroll, { passive: true })
    observer.observe(node)
    return () => { active = false; observer.disconnect(); stopIntent(); if (requireScrollIntent) env.removeEventListener('scroll', onScroll) }
  }

  // Older browsers still load by ordinary vertical scrolling. The accessible
  // keyboard action in the component also remains available without observers.
  const measure = () => {
    frame = null
    if (!active) return
    const box = node.getBoundingClientRect()
    visible = box.top <= env.innerHeight + 400 && box.bottom >= 0
    reveal()
  }
  const schedule = () => {
    if (active && frame === null) frame = env.requestAnimationFrame(measure)
  }
  const onScroll = () => { if (active) { if (requireScrollIntent) noteScroll(); schedule() } }
  const stopIntent = listenForIntent()
  env.addEventListener('scroll', onScroll, { passive: true })
  env.addEventListener('resize', schedule)
  schedule()
  return () => {
    active = false
    stopIntent()
    env.removeEventListener('scroll', onScroll)
    env.removeEventListener('resize', schedule)
    if (frame !== null) env.cancelAnimationFrame(frame)
  }
}
