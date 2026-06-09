import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProvider } from '@/context/app-context'
import { AuthProvider } from '@/context/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/context/language-context'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono"
})

export const metadata: Metadata = {
  title: 'Building Dreams | Find Construction Professionals',
  description: 'Connect with skilled construction workers, architects, engineers, and material suppliers. Your one-stop platform for all construction needs.',
  keywords: ['construction', 'workers', 'contractors', 'architects', 'engineers', 'materials', 'plumbing', 'electrical'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#d97706',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background light" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <AppProvider>
              <LanguageProvider>
                {children}
                {process.env.NODE_ENV === 'production' && <Analytics />}
              </LanguageProvider>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
