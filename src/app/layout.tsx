import type { Metadata } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PaletNum — Equivalencias de marcadores para pintura por números',
  description: 'Encontrá los códigos exactos de tus marcadores para cada dibujo. Comunidad colaborativa de pintura por números.',
  keywords: ['pintura por números', 'marcadores', 'equivalencias', 'Guangna', 'Copic', 'Posca'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="bg-paper text-ink font-sans min-h-screen flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-paper3 bg-paper2 px-6 py-4 mt-auto">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-ink2">
            <span>© {new Date().getFullYear()} PaletNum — Comunidad de pintura por números</span>
            <div className="flex gap-4">
              <a href="/terminos" className="hover:text-accent transition-colors">Términos de uso</a>
              <a href="/privacidad" className="hover:text-accent transition-colors">Privacidad</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
