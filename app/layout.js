export const metadata = {
  title: 'AI Рецепционист',
  description: 'AI бот, който записва часове за вашия бизнес',
}

export default function RootLayout({ children }) {
  return (
    <html lang="bg">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
          background: '#f5f5f7',
          color: '#1d1d1f',
        }}
      >
        {children}
      </body>
    </html>
  )
}
