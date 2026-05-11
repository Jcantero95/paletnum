'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/buscar'

  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const supabase = createClient()

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    })
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">

      {/* Header con volver */}
      <header className="bg-ink text-paper px-4 py-3 flex items-center justify-between flex-shrink-0">
        <Link href="/buscar" className="font-display text-xl tracking-tight">
          Palet<span className="text-accent2">Num</span>
        </Link>
        <Link
          href="/buscar"
          className="text-xs text-paper/60 hover:text-paper transition-colors flex items-center gap-1"
        >
          ← Volver
        </Link>
      </header>

      {/* Contenido centrado */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">

          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎨</div>
            <h1 className="font-display text-2xl font-normal mb-1">
              Iniciá sesión
            </h1>
            <p className="text-ink2 text-sm">Para contribuir a la comunidad PaletNum</p>
          </div>

          <div className="bg-white border border-paper3 rounded-2xl p-5">
            {sent ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">📬</div>
                <h2 className="font-display text-xl font-normal mb-2">Revisá tu email</h2>
                <p className="text-sm text-ink2 leading-relaxed">
                  Te enviamos un link mágico a <strong>{email}</strong>.
                  Tocá el link para ingresar.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-4 text-xs text-ink2 underline"
                >
                  Usar otro email
                </button>
              </div>
            ) : (
              <>
                {/* Google */}
                <button
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-2.5 border border-paper3 rounded-xl py-3 text-sm font-medium active:bg-paper2 transition-colors mb-4"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <span className="flex-1 h-px bg-paper3" />
                  <span className="text-xs text-ink2">o con email</span>
                  <span className="flex-1 h-px bg-paper3" />
                </div>

                <form onSubmit={handleMagicLink}>
                  <label className="label">Email</label>
                  <input
                    className="input mb-3 py-3 text-base"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    required
                  />
                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3.5 text-base rounded-xl"
                  >
                    {loading ? 'Enviando...' : 'Enviarme un link mágico'}
                  </button>
                </form>

                <p className="text-xs text-ink2 text-center mt-4">
                  Sin contraseña. Te enviamos un link por email.
                </p>
              </>
            )}
          </div>

          {/* Links legales */}
          <p className="text-xs text-ink2/50 text-center mt-4 leading-relaxed px-2">
            Al ingresar aceptás nuestros{' '}
            <a href="/terminos" className="underline hover:text-accent">Términos de uso</a>
            {' '}y la{' '}
            <a href="/privacidad" className="underline hover:text-accent">Política de privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
