export function shouldShowScrollTop(scrollY, viewportHeight) {
  return scrollY >= Math.min(480, Math.max(240, Math.round(viewportHeight * 0.55)))
}

export function scrollTopOptions(reduceMotion) {
  return { top: 0, behavior: reduceMotion ? 'instant' : 'smooth' }
}

export function scrollTopDockInset(viewportHeight, dockTop) {
  return dockTop > 0 && dockTop < viewportHeight ? Math.ceil(viewportHeight - dockTop) + 14 : null
}
