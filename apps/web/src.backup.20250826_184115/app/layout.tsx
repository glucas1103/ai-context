import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AIcontext - Context Engineering Software | Améliorez Votre Vélocité Dev',
  description:
    "IA qui analyse votre codebase pour spec les epics et user stories plus rapidement et précisément. Permettez à vos devs et IA de code de shipper plus facilement avec des tâches mieux définies.",
  keywords: 'context engineering, vélocité développement, specs techniques, user stories, epics, AI assistants, développement agile',
  authors: [{ name: 'AIcontext' }],
  openGraph: {
    title: 'AIcontext - Context Engineering Software',
    description: 'Améliorez votre vélocité dev grâce à une plateforme de context engineering',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIcontext - Context Engineering Software',
    description: 'Specs techniques précises + Context automatique pour des IA de code efficaces',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
