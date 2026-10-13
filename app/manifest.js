export default function manifest() {
  return {
    name: 'AI Рецепционист',
    short_name: 'AI Рецепция',
    description: 'Резервации, клиенти и онлайн рецепция в едно приложение.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f4f6f0',
    theme_color: '#173e2a',
    lang: 'bg',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  }
}

