import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono, Newsreader } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
  weight: ['400', '500'],
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
  themeColor: '#2F5237',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Runs before paint: apply the stored theme, or fall back to the OS color
  // scheme. Prevents a flash of the wrong theme and the hydration mismatch.
  const themeScript = `(function(){try{var s=localStorage.getItem('forma-theme');var dark=s==='dark'||(s!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);var t=dark?'dark':'light';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`

  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} ${newsreader.variable}`}>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
