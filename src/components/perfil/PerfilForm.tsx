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

export function PerfilForm({ usuario, marcas, userEmail, tipoAuth }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [nombre,        setNombre]        = useState(usuario.nombre ?? '')
  const [apellido,      setApellido]      = useState(usuario.apellido ?? '')
  const [username,      setUsername]      = useState(usuario.username ?? '')
  const [social,        setSocial]        = useState(usuario.social ?? '')
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

  async function handleGuardarPerfil(e: React.FormEvent) {
    e.preventDefault()
    setLoadingPerfil(true); setErrorPerfil(null); setOkPerfil(false)

    // Verificar username único si cambió
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
      social:           social || null,
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

    // Verificar contraseña actual
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: passActual,
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

  return (
    <div className="space-y-5">

      {/* Avatar y resumen */}
      <div className="bg-white border border-paper3 rounded-xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-medium flex-shrink-0">
          {usuario.avatar_url
            ? <img src={usuario.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
            : (usuario.nombre?.charAt(0) ?? '?')}
        </div>
        <div>
          <p className="font-medium text-lg">{usuario.nombre} {usuario.apellido}</p>
          {usuario.username && <p className="text-sm text-ink2">@{usuario.username}</p>}
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              usuario.tipo_usuario === 'registrado' ? 'bg-accent3/20 text-accent3' :
              usuario.tipo_usuario === 'google'     ? 'bg-blue-100 text-blue-700' :
              'bg-paper3 text-ink2'
            }`}>
              {usuario.tipo_usuario === 'registrado' ? '✓ Cuenta completa'
                : usuario.tipo_usuario === 'google' ? 'Google'
                : 'Invitado'}
            </span>
            <span className="text-xs text-ink2">{usuario.puntos} puntos</span>
          </div>
        </div>
      </div>

      {/* Datos personales */}
      <form onSubmit={handleGuardarPerfil} className="bg-white border border-paper3 rounded-xl p-5">
        <h2 className="font-display text-lg font-normal mb-4 pb-3 border-b border-paper3">
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
          <label className="label">Nombre de usuario <span className="text-ink2 font-normal normal-case">(visible en el ranking)</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2 text-sm">@</span>
            <input className="input pl-7" type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))} />
          </div>
          <p className="text-[10px] text-ink2 mt-1">Solo letras minúsculas, números, puntos y guiones bajos.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Red social <span className="text-ink2 font-normal normal-case">(aparece en el ranking)</span></label>
            <input className="input" type="text" placeholder="@tu_usuario o URL"
              value={social} onChange={e => setSocial(e.target.value)} />
          </div>
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input className="input" type="date"
              value={fechaNac} onChange={e => setFechaNac(e.target.value)} />
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Marca favorita</label>
          <select className="input" value={marcaFav} onChange={e => setMarcaFav(e.target.value)}>
            <option value="">Seleccionar...</option>
            {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>
        </div>

        {errorPerfil && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{errorPerfil}</p>
        )}
        {okPerfil && (
          <p className="text-xs text-accent3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">✓ Perfil actualizado correctamente</p>
        )}

        <button type="submit" disabled={loadingPerfil} className="btn-primary w-full py-3 rounded-xl">
          {loadingPerfil ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Cambiar contraseña — solo para usuarios con email/contraseña */}
      {!esGoogle && (
        <form onSubmit={handleCambiarPassword} className="bg-white border border-paper3 rounded-xl p-5">
          <h2 className="font-display text-lg font-normal mb-4 pb-3 border-b border-paper3">
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
              <label className="label">Nueva contraseña * <span className="text-ink2 font-normal normal-case">(mínimo 8 caracteres)</span></label>
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
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{errorPass}</p>
          )}
          {okPass && (
            <p className="text-xs text-accent3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">✓ Contraseña actualizada correctamente</p>
          )}

          <button type="submit" disabled={loadingPass} className="btn-primary w-full py-3 rounded-xl">
            {loadingPass ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      )}

      {esGoogle && (
        <div className="bg-paper2 border border-paper3 rounded-xl p-4 text-sm text-ink2 flex items-center gap-3">
          <span className="text-xl">ℹ️</span>
          <p>Tu cuenta está vinculada a Google. Para cambiar tu contraseña hacelo desde tu cuenta de Google.</p>
        </div>
      )}
    </div>
  )
}