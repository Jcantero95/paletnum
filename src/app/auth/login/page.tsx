'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Vista = 'opciones' | 'magic' | 'password' | 'registro'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const next         = searchParams.get('next') ?? '/buscar'

  const [vista,     setVista]     = useState<Vista>('opciones')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [nombre,    setNombre]    = useState('')
  const [apellido,  setApellido]  = useState('')
  const [username,  setUsername]  = useState('')
  const [fechaNac,  setFechaNac]  = useState('')
  const [sent,      setSent]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const supabase = createClient()

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    })
  }

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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos.')
    } else {
      router.push(next)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)

    const { data: existing } = await supabase
      .from('usuarios').select('id').eq('username', username).single()
    if (existing) {
      setError('Ese nombre de usuario ya está en uso. Elegí otro.')
      setLoading(false); return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, apellido, username },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false); return
    }

    if (data.user) {
      await supabase.from('usuarios').update({
        nombre, apellido, username,
        fecha_nacimiento: fechaNac || null,
        tipo_usuario: 'registrado',
      }).eq('id', data.user.id)
    }

    router.push(next)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF6F1' }}>

      {/* Header idéntico al Navbar */}
      <header style={{ background: '#5C5C6E' }}
              className="px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <Link href="/buscar" className="font-display text-2xl tracking-tight"
                style={{ color: '#FAF6F1' }}>
            Palet<span style={{ color: '#E8C4C0', fontStyle: 'italic' }}>Num</span>
          </Link>
          <p className="font-script text-sm hidden sm:block mt-0.5"
             style={{ color: 'rgba(250,246,241,0.5)', fontFamily: "'Dancing Script', cursive" }}>
            Código de colores para pintar por números
          </p>
        </div>
        <Link href="/buscar"
              className="text-xs font-sans transition-colors"
              style={{ color: 'rgba(250,246,241,0.6)' }}>
          ← Volver
        </Link>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">

          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎨</div>
            <h1 className="font-display text-2xl mb-1" style={{ color: '#5C5C6E' }}>
              {vista === 'registro' ? 'Crear cuenta' : 'Bienvenida'}
            </h1>
            <p className="font-sans text-sm" style={{ color: '#8A8A9A' }}>
              {vista === 'registro'
                ? 'Completá tus datos para unirte a PaletNum'
                : 'Ingresá a PaletNum'}
            </p>
          </div>

          <div className="rounded-2xl p-5 shadow-cozy"
               style={{ background: 'white', border: '1px solid rgba(92,92,110,0.15)' }}>

            {/* OPCIONES */}
            {vista === 'opciones' && (
              <div className="space-y-3">
                <button onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl
                             py-3 text-sm font-sans font-medium hover:opacity-90 transition-opacity"
                  style={{ border: '1px solid rgba(92,92,110,0.15)', background: '#FAF6F1' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </button>

                <button onClick={() => setVista('password')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl
                             py-3 text-sm font-sans font-medium hover:opacity-90 transition-opacity"
                  style={{ border: '1px solid rgba(92,92,110,0.15)', background: '#FAF6F1' }}>
                  🔑 Ingresar con email y contraseña
                </button>

                <button onClick={() => setVista('magic')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl
                             py-3 text-sm font-sans hover:opacity-90 transition-opacity"
                  style={{ border: '1px solid rgba(92,92,110,0.15)', background: '#FAF6F1', color: '#8A8A9A' }}>
                  ✉️ Ingresar como invitado (link mágico)
                </button>

                <div className="pt-2 border-t text-center"
                     style={{ borderColor: 'rgba(92,92,110,0.15)' }}>
                  <button onClick={() => setVista('registro')}
                    className="text-sm font-sans hover:underline"
                    style={{ color: '#C9908A' }}>
                    ¿No tenés cuenta? Registrate
                  </button>
                </div>
              </div>
            )}

            {/* LOGIN CON CONTRASEÑA */}
            {vista === 'password' && (
              <>
                <button onClick={() => { setVista('opciones'); setError(null) }}
                  className="text-xs font-sans mb-4 flex items-center gap-1"
                  style={{ color: '#8A8A9A' }}>
                  ← Volver
                </button>
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="label">Email</label>
                    <input className="input py-3" type="email" placeholder="tu@email.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      autoComplete="email" inputMode="email" required />
                  </div>
                  <div>
                    <label className="label">Contraseña</label>
                    <input className="input py-3" type="password" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password" required />
                  </div>
                  {error && (
                    <p className="text-xs font-sans rounded-lg px-3 py-2"
                       style={{ background: '#F5E8E6', border: '1px solid #E8C4C0', color: '#C9908A' }}>
                      {error}
                    </p>
                  )}
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                    {loading ? 'Ingresando...' : 'Ingresar'}
                  </button>
                  <div className="text-center">
                    <button type="button" onClick={() => { setVista('magic'); setError(null) }}
                      className="text-xs font-sans hover:underline"
                      style={{ color: '#8A8A9A' }}>
                      ¿Olvidaste tu contraseña? Usá el link mágico
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* MAGIC LINK */}
            {vista === 'magic' && (
              <>
                <button onClick={() => { setVista('opciones'); setError(null); setSent(false) }}
                  className="text-xs font-sans mb-4 flex items-center gap-1"
                  style={{ color: '#8A8A9A' }}>
                  ← Volver
                </button>
                {sent ? (
                  <div className="text-center py-4">
                    <div className="text-5xl mb-4">📬</div>
                    <h2 className="font-display text-xl mb-2">Revisá tu email</h2>
                    <p className="text-sm font-sans leading-relaxed" style={{ color: '#8A8A9A' }}>
                      Te enviamos un link mágico a <strong>{email}</strong>.
                    </p>
                    <button onClick={() => setSent(false)}
                      className="mt-4 text-xs font-sans underline"
                      style={{ color: '#8A8A9A' }}>
                      Usar otro email
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-3">
                    <div className="rounded-lg px-3 py-2.5 text-xs font-sans mb-2"
                         style={{ background: '#F4EDE4', color: '#8A8A9A' }}>
                      ✉️ Ingresás como <strong>invitado</strong> — podés buscar y dar likes,
                      pero para subir resultados necesitás una cuenta completa.
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input className="input py-3" type="email" placeholder="tu@email.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                        autoComplete="email" inputMode="email" required />
                    </div>
                    {error && (
                      <p className="text-xs font-sans rounded-lg px-3 py-2"
                         style={{ background: '#F5E8E6', border: '1px solid #E8C4C0', color: '#C9908A' }}>
                        {error}
                      </p>
                    )}
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                      {loading ? 'Enviando...' : 'Enviarme un link mágico'}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* REGISTRO */}
            {vista === 'registro' && (
              <>
                <button onClick={() => { setVista('opciones'); setError(null) }}
                  className="text-xs font-sans mb-4 flex items-center gap-1"
                  style={{ color: '#8A8A9A' }}>
                  ← Volver
                </button>
                <form onSubmit={handleRegistro} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Nombre *</label>
                      <input className="input" type="text" placeholder="María"
                        value={nombre} onChange={e => setNombre(e.target.value)} required />
                    </div>
                    <div>
                      <label className="label">Apellido *</label>
                      <input className="input" type="text" placeholder="García"
                        value={apellido} onChange={e => setApellido(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      Usuario * <span className="normal-case font-normal" style={{ color: '#8A8A9A' }}>
                        (único, visible en el ranking)
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                            style={{ color: '#8A8A9A' }}>@</span>
                      <input className="input pl-7" type="text" placeholder="mariag"
                        value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                        required />
                    </div>
                    <p className="text-[10px] mt-1 font-sans" style={{ color: '#8A8A9A' }}>
                      Solo letras minúsculas, números, puntos y guiones bajos.
                    </p>
                  </div>
                  <div>
                    <label className="label">Fecha de nacimiento</label>
                    <input className="input" type="date"
                      value={fechaNac} onChange={e => setFechaNac(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input className="input" type="email" placeholder="tu@email.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      autoComplete="email" inputMode="email" required />
                  </div>
                  <div>
                    <label className="label">
                      Contraseña * <span className="normal-case font-normal" style={{ color: '#8A8A9A' }}>
                        (mínimo 8 caracteres)
                      </span>
                    </label>
                    <input className="input" type="password" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password" minLength={8} required />
                  </div>
                  {error && (
                    <p className="text-xs font-sans rounded-lg px-3 py-2"
                       style={{ background: '#F5E8E6', border: '1px solid #E8C4C0', color: '#C9908A' }}>
                      {error}
                    </p>
                  )}
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
                    {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
                  </button>
                </form>
              </>
            )}

          </div>

          <p className="text-xs text-center mt-4 leading-relaxed px-2 font-sans"
             style={{ color: 'rgba(92,92,110,0.5)' }}>
            Al ingresar aceptás nuestros{' '}
            <a href="/terminos" className="underline hover:opacity-80" style={{ color: '#C9908A' }}>
              Términos de uso
            </a>{' '}y la{' '}
            <a href="/privacidad" className="underline hover:opacity-80" style={{ color: '#C9908A' }}>
              Política de privacidad
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}