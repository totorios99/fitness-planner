import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Newsreader } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
  weight: ['400', '600'],
})

export const metadata: Metadata = {
  title: 'Forma',
  description: 'Training tracker — exercise library, Strong import, progress analytics.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1E3A5F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${newsreader.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
