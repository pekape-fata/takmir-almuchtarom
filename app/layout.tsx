import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Navbar } from '@/components/Navbar'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Takmir Langgar Waqaf Al Muchtarom',
  description: 'Dashboard informasi, keuangan, kegiatan, jadwal sholat & konsultasi Takmir Langgar Waqaf Al Muchtarom',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
