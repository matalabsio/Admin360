import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CHATTAM 360 Admin',
  description: 'Curator workspace for law entrance question intelligence',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
