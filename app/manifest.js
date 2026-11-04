export default function manifest() {
  return {
    name: 'GoRez',
    short_name: 'GoRez',
    description: 'Резервации, клиенти и онлайн асистент в едно приложение.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f6f5f2',
    theme_color: '#202126',
    lang: 'bg',
    icons: [{ src: '/brand-icon?size=512&v=4', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
  }
}

