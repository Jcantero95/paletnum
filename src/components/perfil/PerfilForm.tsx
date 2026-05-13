'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Usuario, Marca } from '@/types'

interface Props {
  usuario: Usuario
  marcas: Marca[]
  userEmail: string
  tipoAuth: string
}

const REDES = [
  { value: 'instagram', label: 'Instagram', prefix: 'https://instagram.com/', placeholder: 'tu_usuario' },
  { value: 'tiktok',    label: 'TikTok',    prefix: 'https://tiktok.com/@',   placeholder: 'tu_usuario' },
  { value: 'youtube',   label: 'YouTube',   prefix: 'https://youtube.com/@',  placeholder: 'tu_canal'   },
]

function parsearRedSocial(social: string | null) {
  if (!social) return { red: '', usuario: '' }
  for (const r of REDES) {
    if (social.startsWith(r.prefix)) {
      return { red: r.value, usuario: social.replace(r.prefix, '') }
    }
  }
  return { red: 'instagram', usuario: social.replace(/^@/, '') }
}

export function PerfilForm({ usuario, marcas, userEmail, tipoAuth }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const socialParsed = parsearRedSocial(usuario.social)

  const [nombre,        setNombre]        = useState(usuario.nombre ?? '')
  const [apellido,      setApellido]      = useState(usuario.apellido ?? '')
  const [username,      setUsername]      = useState(usuario.username ?? '')
  const [redSocial,     setRedSocial]     = useState(socialParsed.red)
  const [usuarioRed,    setUsuarioRed]    = useState(socialParsed.usuario)
  const [marcaFav,      setMarcaFav]      = useState(usuario.marca_favorita ?? '')
  const [fechaNac,      setFechaNac]      = useState(usuario.fecha_nacimiento ?? '')
  const [passActual,    setPassActual]    = useState('')
  const [passNueva,     setPassNueva]     = useState('')
  const [passConfirm,   setPassConfirm]   = useState('')

  const [loadingPerfil, setLoadingPerfil] = useState(false)
  const [loadingPass,   setLoadingPass]   = useState(false)
  const [errorPerfil,   setErrorPerfil]   = useState<string | null>(null)
  const [errorPass,     setErrorPass]     = useState<string | null>(null)
  const [okPerfil,      setOkPerfil]      = useState(false)
  const [okPass,        setOkPass]        = useState(false)

  function getSocialUrl() {
    if (!redSocial || !usuarioRed) return null
    const red = REDES.find(r => r.value === redSocial)
    return red ? `${red.prefix}${usuarioRed}` : null
  }

  async function handleGuardarPerfil(e: React.FormEvent) {
    e.preventDefault()
    setLoadingPerfil(true); setErrorPerfil(null); setOkPerfil(false)

    if (username !== usuario.username) {
      const { data: existing } = await supabase
        .from('usuarios').select('id').eq('username', username).single()
      if (existing) {
        setErrorPerfil('Ese nombre de usuario ya está en uso. Elegí otro.')
        setLoadingPerfil(false); return
      }
    }

    const { error } = await supabase.from('usuarios').update({
      nombre,
      apellido,
      username,
      social:           getSocialUrl(),
      marca_favorita:   marcaFav || null,
      fecha_nacimiento: fechaNac || null,
    }).eq('id', usuario.id)

    if (error) {
      setErrorPerfil('Error al guardar. Intentá de nuevo.')
    } else {
      setOkPerfil(true)
      router.refresh()
      setTimeout(() => setOkPerfil(false), 3000)
    }
    setLoadingPerfil(false)
  }

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoadingPass(true); setErrorPass(null); setOkPass(false)

    if (passNueva !== passConfirm) {
      setErrorPass('Las contraseñas nuevas no coinciden.')
      setLoadingPass(false); return
    }
    if (passNueva.length < 8) {
      setErrorPass('La contraseña debe tener al menos 8 caracteres.')
      setLoadingPass(false); return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail, password: passActual,
    })
    if (signInError) {
      setErrorPass('La contraseña actual es incorrecta.')
      setLoadingPass(false); return
    }

    const { error } = await supabase.auth.updateUser({ password: passNueva })
    if (error) {
      setErrorPass('Error al cambiar la contraseña. Intentá de nuevo.')
    } else {
      setOkPass(true)
      setPassActual(''); setPassNueva(''); setPassConfirm('')
      setTimeout(() => setOkPass(false), 3000)
    }
    setLoadingPass(false)
  }

  const esGoogle = tipoAuth === 'google'
  const redSeleccionada = REDES.find(r => r.value === redSocial)

  return (
    <div className="space-y-5">

      {/* Avatar y resumen */}
      <div className="bg-white border border-borde rounded-xl p-5 flex items-center gap-4 shadow-cozy">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-display flex-shrink-0"
             style={{ background: '#C9908A' }}>
          {usuario.avatar_url
            ? <img src={usuario.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
            : (usuario.nombre?.charAt(0) ?? '?')}
        </div>
        <div>
          <p className="font-medium text-lg" style={{ color: '#5C5C6E' }}>
            {usuario.nombre} {usuario.apellido}
          </p>
          {usuario.username && (
            <p className="text-sm" style={{ color: '#8A8A9A' }}>@{usuario.username}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-sans"
                  style={{
                    background: usuario.tipo_usuario === 'registrado' ? '#D4E8D4' :
                                usuario.tipo_usuario === 'google'     ? '#DBEAFE' : '#F4EDE4',
                    color:      usuario.tipo_usuario === 'registrado' ? '#5a7f5a' :
                                usuario.tipo_usuario === 'google'     ? '#1d4ed8' : '#8A8A9A',
                  }}>
              {usuario.tipo_usuario === 'registrado' ? '✓ Cuenta completa'
                : usuario.tipo_usuario === 'google' ? 'Google'
                : 'Invitado'}
            </span>
            <span className="text-xs font-sans" style={{ color: '#8A8A9A' }}>{usuario.puntos} puntos</span>
          </div>
        </div>
      </div>

      {/* Datos personales */}
      <form onSubmit={handleGuardarPerfil} className="bg-white border border-borde rounded-xl p-5 shadow-cozy">
        <h2 className="font-display text-lg mb-4 pb-3" style={{ borderBottom: '1px solid #EDE0D4', color: '#5C5C6E' }}>
          Datos personales
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" type="text" value={nombre}
              onChange={e => setNombre(e.target.value)} required />
          </div>
          <div>
            <label className="label">Apellido</label>
            <input className="input" type="text" value={apellido}
              onChange={e => setApellido(e.target.value)} />
          </div>
        </div>

        <div className="mb-3">
          <label className="label">Nombre de usuario <span className="normal-case font-normal" style={{ color: '#8A8A9A' }}>(visible en el ranking)</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#8A8A9A' }}>@</span>
            <input className="input pl-7" type="text" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))} />
          </div>
        </div>

        {/* Red social con selector */}
        <div className="mb-3">
          <label className="label">Red social <span className="normal-case font-normal" style={{ color: '#8A8A9A' }}>(aparece en el ranking)</span></label>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <select className="input" value={redSocial} onChange={e => setRedSocial(e.target.value)}>
              <option value="">Sin red social</option>
              {REDES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <div className="relative">
              {redSeleccionada && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-sans"
                      style={{ color: '#8A8A9A' }}>@</span>
              )}
              <input
                className="input"
                style={{ paddingLeft: redSeleccionada ? '28px' : '12px' }}
                type="text"
                placeholder={redSeleccionada?.placeholder ?? 'Elegí una red primero'}
                value={usuarioRed}
                onChange={e => setUsuarioRed(e.target.value.replace(/^@/, ''))}
                disabled={!redSocial}
              />
            </div>
          </div>
          {getSocialUrl() && (
            <a href={getSocialUrl()!} target="_blank" rel="noopener noreferrer"
               className="text-xs mt-1.5 block hover:underline"
               style={{ color: '#C9908A' }}>
              ↗ Ver perfil: {getSocialUrl()}
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Marca favorita</label>
            <select className="input" value={marcaFav} onChange={e => setMarcaFav(e.target.value)}>
              <option value="">Seleccionar...</option>
              {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input className="input" type="date" value={fechaNac}
              onChange={e => setFechaNac(e.target.value)} />
          </div>
        </div>

        {errorPerfil && (
          <p className="text-xs font-sans rounded-lg px-3 py-2 mb-3"
             style={{ background: '#F5E8E6', border: '1px solid #E8C4C0', color: '#C9908A' }}>
            {errorPerfil}
          </p>
        )}
        {okPerfil && (
          <p className="text-xs font-sans rounded-lg px-3 py-2 mb-3"
             style={{ background: '#D4E8D4', border: '1px solid #b8d4b8', color: '#5a7f5a' }}>
            ✓ Perfil actualizado correctamente
          </p>
        )}

        <button type="submit" disabled={loadingPerfil} className="btn-primary w-full py-3 rounded-xl">
          {loadingPerfil ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Cambiar contraseña */}
      {!esGoogle && (
        <form onSubmit={handleCambiarPassword} className="bg-white border border-borde rounded-xl p-5 shadow-cozy">
          <h2 className="font-display text-lg mb-4 pb-3" style={{ borderBottom: '1px solid #EDE0D4', color: '#5C5C6E' }}>
            Cambiar contraseña
          </h2>
          <div className="space-y-3 mb-4">
            <div>
              <label className="label">Contraseña actual *</label>
              <input className="input" type="password" placeholder="••••••••"
                value={passActual} onChange={e => setPassActual(e.target.value)}
                autoComplete="current-password" required />
            </div>
            <div>
              <label className="label">Nueva contraseña * <span className="normal-case font-normal" style={{ color: '#8A8A9A' }}>(mínimo 8 caracteres)</span></label>
              <input className="input" type="password" placeholder="••••••••"
                value={passNueva} onChange={e => setPassNueva(e.target.value)}
                autoComplete="new-password" minLength={8} required />
            </div>
            <div>
              <label className="label">Confirmar nueva contraseña *</label>
              <input className="input" type="password" placeholder="••••••••"
                value={passConfirm} onChange={e => setPassConfirm(e.target.value)}
                autoComplete="new-password" required />
            </div>
          </div>
          {errorPass && (
            <p className="text-xs font-sans rounded-lg px-3 py-2 mb-3"
               style={{ background: '#F5E8E6', border: '1px solid #E8C4C0', color: '#C9908A' }}>
              {errorPass}
            </p>
          )}
          {okPass && (
            <p className="text-xs font-sans rounded-lg px-3 py-2 mb-3"
               style={{ background: '#D4E8D4', border: '1px solid #b8d4b8', color: '#5a7f5a' }}>
              ✓ Contraseña actualizada correctamente
            </p>
          )}
          <button type="submit" disabled={loadingPass} className="btn-primary w-full py-3 rounded-xl">
            {loadingPass ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      )}

      {esGoogle && (
        <div className="rounded-xl p-4 text-sm font-sans flex items-center gap-3"
             style={{ background: '#F4EDE4', border: '1px solid rgba(92,92,110,0.15)', color: '#8A8A9A' }}>
          <span className="text-xl">ℹ️</span>
          <p>Tu cuenta está vinculada a Google. Para cambiar tu contraseña hacelo desde tu cuenta de Google.</p>
        </div>
      )}
    </div>
  )
}