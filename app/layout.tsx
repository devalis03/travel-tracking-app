import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'
import { SettingsProvider } from '@/components/settings/settings-provider'
import { ProfileProvider } from '@/components/profile/profile-provider'
import { ChallengesProvider } from '@/components/challenges/challenges-provider'

import { ExperienceApplier } from '@/components/settings/experience-applier'

// Applies the saved theme before first paint so a light-theme user never sees
// a dark flash while the app hydrates.
const THEME_BOOT_SCRIPT = `try{var s=JSON.parse(localStorage.getItem('wayfarer:settings')||'{}');var t=s.theme||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.classList.toggle('light',!d);r.style.colorScheme=d?'dark':'light';if(s.reduceMotion)r.dataset.reduceMotion='true'}catch(e){}`

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600'],
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Wayfarer — Your personal map of the world',
  description: 'A personal travel journal: track the places you have been, your trips, memories, and stats.',
  generator: 'v0.app',
  applicationName: 'Wayfarer',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wayfarer',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: '#0e1a24',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark bg-background ${fraunces.variable} ${plusJakarta.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased font-sans">
        <SettingsProvider>
          <ExperienceApplier />
          <ProfileProvider>
            <ChallengesProvider>
              <AppShell>{children}</AppShell>
              <Toaster position="top-center" />
            </ChallengesProvider>
          </ProfileProvider>
        </SettingsProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
