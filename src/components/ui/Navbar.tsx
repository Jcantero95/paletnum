'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions'
import type { Usuario } from '@/types'

const ADMIN_EMAIL = 'jcantero95@gmail.com'

interface NavbarProps {
  usuario: Usuario | null
  stats?: { submissions: number; usuarios: number; likes: number }
  pendientes?: number
  userEmail?: string
}

export function Navbar({ usuario, stats, pendientes = 0, userEmail }: NavbarProps) {
  const path    = usePathname()
  const esAdmin = userEmail === ADMIN_EMAIL

  const links = [
    { href: '/buscar',     label: 'Buscar',  icon: '🔍' },
    { href: '/contribuir', label: 'Subir',   icon: '🖼️' },
    { href: '/ranking',    label: 'Ranking', icon: '🏆' },
  ]

  return (
    <>
      <header style={{ background: '#5C5C6E' }} className="px-5 py-4 flex items-center justify-between">
        <div>
          <Link href="/buscar" className="font-display text-2xl tracking-tight"
                style={{ color: '#FAF6F1' }}>
            Palet<span style={{ color: '#E8C4C0', fontStyle: 'italic' }}>Num</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 mt-0.5">
            <p className="font-script text-sm"
               style={{ color: 'rgba(250,246,241,0.5)', fontFamily: "'Dancing Script', cursive" }}>
              Código de colores para pintar por números
            </p>
            <span className="text-xs" style={{ color: 'rgba(250,246,241,0.25)' }}>·</span>
            <p className="font-script text-sm"
               style={{ color: '#E8C4C0', fontFamily: "'Dancing Script', cursive", opacity: 0.7 }}>
              by La chica de los hobbies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stats && (
            <div className="hidden md:flex gap-5 text-xs mr-2">
              {[
                { val: stats.submissions, label: 'resultados' },
                { val: stats.usuarios,    label: 'usuarios'   },
                { val: stats.likes,       label: 'likes'      },
              ].map(s => (
                <div key={s.label} className="text-center" style={{ color: 'rgba(250,246,241,0.5)' }}>
                  <strong className="font-display font-normal block text-lg"
                          style={{ color: '#E8C4C0' }}>
                    {s.val}
                  </strong>
                  {s.label}
                </div>
              ))}
            </div>
          )}

          {esAdmin && (
            <Link href="/admin"
              className="relative flex items-center justify-center w-8 h-8 rounded-full transition-colors"
              style={{ color: '#FAF6F1' }}
              title="Panel de moderación"
            >
              <span className="text-lg">🔔</span>
              {pendientes > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-[10px] font-bold
                                 min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5"
                      style={{ background: '#C9908A' }}>
                  {pendientes > 99 ? '99+' : pendientes}
                </span>
              )}
            </Link>
          )}

          {usuario ? (
            <div className="flex items-center gap-2">
              <Link href="/perfil"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title="Mi perfil"
              >
                {usuario.avatar_url ? (
                  <img src={usuario.avatar_url} alt="avatar"
                    className="w-7 h-7 rounded-full object-cover"
                    style={{ border: '1px solid rgba(250,246,241,0.2)' }} />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center
                                  text-white text-xs font-display"
                       style={{ background: '#C9908A' }}>
                    {usuario.nombre?.charAt(0) ?? '?'}
                  </div>
                )}
                <span className="text-xs hidden sm:block truncate max-w-[80px] font-sans"
                      style={{ color: 'rgba(250,246,241,0.65)' }}>
                  {usuario.username ? `@${usuario.username}` : usuario.nombre}
                </span>
              </Link>
              <button onClick={() => signOut()}
                className="text-xs px-2.5 py-1.5 rounded-lg transition-colors font-sans"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(250,246,241,0.7)' }}>
                Salir
              </button>
            </div>
          ) : (
            <Link href="/auth/login"
              className="text-xs font-sans font-medium px-4 py-1.5 rounded-full
                         hover:opacity-90 transition-opacity"
              style={{ background: '#C9908A', color: 'white' }}>
              Ingresar
            </Link>
          )}
        </div>
      </header>

      <nav style={{ background: '#F4EDE4', borderBottom: '1px solid rgba(92,92,110,0.15)' }}
           className="flex">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className="flex-1 flex flex-col sm:flex-row items-center justify-center
                       gap-0.5 sm:gap-1.5 py-2.5 sm:py-3 text-[11px] sm:text-sm
                       border-b-2 -mb-px transition-colors font-sans"
            style={{
              color:       path === l.href ? '#C9908A' : '#8A8A9A',
              borderColor: path === l.href ? '#C9908A' : 'transparent',
              fontWeight:  path === l.href ? '500' : '400',
            }}
          >
            <span className="text-base sm:text-sm">{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}