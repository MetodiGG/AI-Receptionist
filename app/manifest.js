export default function manifest() {
  return {
    name: 'GoRez',
    short_name: 'GoRez',
    description: 'Резервации, клиенти и онлайн асистент в едно приложение.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f4f6f0',
    theme_color: '#173e2a',
    lang: 'bg',
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
  }
}

