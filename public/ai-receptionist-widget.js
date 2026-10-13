(() => {
  const script = document.currentScript
  if (!script || script.dataset.loaded) return
  script.dataset.loaded = 'true'
  const slug = script.dataset.business
  if (!slug) return
  const source = new URL(script.src)
  const origin = source.origin
  const label = script.dataset.label || 'Запази час'
  const color = script.dataset.color || '#173e2a'

  const root = document.createElement('div')
  root.style.cssText = 'position:fixed;z-index:2147483000;right:20px;bottom:20px;font-family:Inter,system-ui,sans-serif'
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = `✦ ${label}`
  button.style.cssText = `border:0;border-radius:999px;padding:15px 20px;background:${color};color:#fff;font:700 15px/1 system-ui;box-shadow:0 16px 50px rgba(0,0,0,.22);cursor:pointer`
  const panel = document.createElement('div')
  panel.style.cssText = 'display:none;position:absolute;right:0;bottom:62px;width:min(440px,calc(100vw - 24px));height:min(720px,calc(100vh - 100px));background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.28);border:1px solid rgba(0,0,0,.1)'
  const frame = document.createElement('iframe')
  frame.title = 'Онлайн резервация'
  frame.src = `${origin}/book/${encodeURIComponent(slug)}?embed=1`
  frame.style.cssText = 'width:100%;height:100%;border:0'
  panel.appendChild(frame)
  button.addEventListener('click', () => { panel.style.display = panel.style.display === 'none' ? 'block' : 'none' })
  root.append(panel, button)
  document.body.appendChild(root)
})()

