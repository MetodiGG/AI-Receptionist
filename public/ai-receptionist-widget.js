(() => {
  const script = document.currentScript
  if (!script || script.dataset.loaded) return
  script.dataset.loaded = 'true'
  const slug = script.dataset.business
  if (!slug) return
  const source = new URL(script.src)
  const origin = source.origin
  const locale = script.dataset.lang === 'en' ? 'en' : 'bg'
  const label = script.dataset.label || (locale === 'en' ? 'Book now' : 'Запази час')
  const color = script.dataset.color || '#ff762f'
  const textColor = script.dataset.color ? '#fff' : '#382014'

  const root = document.createElement('div')
  root.style.cssText = 'position:fixed;z-index:2147483000;right:20px;bottom:20px;font-family:Inter,system-ui,sans-serif'
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = `✦ ${label}`
  button.setAttribute('aria-expanded', 'false')
  button.style.cssText = `border:1px solid rgba(255,255,255,.3);border-radius:14px;padding:16px 22px;background:${color};color:${textColor};font:750 16px/1.2 system-ui;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 4px 0 rgba(75,30,12,.35),0 12px 30px rgba(0,0,0,.18);cursor:pointer`
  const panel = document.createElement('div')
  panel.style.cssText = 'display:none;position:absolute;right:0;bottom:62px;width:min(440px,calc(100vw - 24px));height:min(720px,calc(100vh - 100px));background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.28);border:1px solid rgba(0,0,0,.1)'
  const frame = document.createElement('iframe')
  frame.title = locale === 'en' ? 'Online booking' : 'Онлайн резервация'
  frame.src = `${origin}/book/${encodeURIComponent(slug)}?embed=1&lang=${locale}`
  frame.style.cssText = 'width:100%;height:100%;border:0'
  panel.appendChild(frame)
  button.addEventListener('click', () => {
    const open = panel.style.display === 'none'
    panel.style.display = open ? 'block' : 'none'
    button.setAttribute('aria-expanded', String(open))
  })
  root.append(panel, button)
  document.body.appendChild(root)
})()

