import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PaletNum — Código de colores para pintar por números',
  description: 'Encontrá los códigos exactos de tus marcadores para cada dibujo. Comunidad colaborativa de pintura por números.',
  keywords: ['pintura por números', 'marcadores', 'equivalencias', 'Guangna', 'Copic', 'Posca'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Dancing+Script:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
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