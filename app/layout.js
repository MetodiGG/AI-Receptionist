import './globals.css'

export const metadata = {
  title: 'AI Рецепционист',
  description: 'Умен асистент, който поема запитванията и записва часове денонощно.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  )
}
