'use client'

import { useState } from 'react'
import { buscarDuplicadosLibro, buscarDuplicadosMarca, proponerLibro, proponerMarca } from '@/lib/propuestas-actions'

type Tipo = 'libro' | 'marca'

interface Props {
  tipo: Tipo
  onClose: () => void
}

export function PropuestaForm({ tipo, onClose }: Props) {
  const [nombre,      setNombre]      = useState('')
  const [editorial,   setEditorial]   = useState('')
  const [paginas,     setPaginas]     = useState('')
  const [notas,       setNotas]       = useState('')
  const [duplicados,  setDuplicados]  = useState<any[]>([])
  const [confirmando, setConfirmando] = useState(false)
  const [enviado,     setEnviado]     = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleNombreBlur() {
    if (nombre.length < 3) return
    const dupes = tipo === 'libro'
      ? await buscarDuplicadosLibro(nombre)
      : await buscarDuplicadosMarca(nombre)
    setDuplicados(dupes)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (duplicados.length > 0 && !confirmando) {
      setConfirmando(true)
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('nombre', nombre)
      fd.append('notas', notas)
      if (tipo === 'libro') {
        fd.append('editorial', editorial)
        fd.append('paginas_total', paginas || '1')
        await proponerLibro(fd)
      } else {
        await proponerMarca(fd)
      }
      setEnviado(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  if (enviado) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-display text-lg font-normal mb-2">¡Propuesta enviada!</h3>
        <p className="text-sm text-ink2 mb-4">
          La revisaremos pronto. Cuando esté aprobada aparecerá en el catálogo.
        </p>
        <button onClick={onClose} className="btn-primary px-6">Cerrar</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">
          {tipo === 'libro' ? 'Nombre del libro' : 'Nombre de la marca'} *
        </label>
        <input
          className="input"
          type="text"
          placeholder={tipo === 'libro' ? 'Ej: Botánica Vol. 2' : 'Ej: Guangna'}
          value={nombre}
          onChange={e => { setNombre(e.target.value); setConfirmando(false); setDuplicados([]) }}
          onBlur={handleNombreBlur}
          required
        />
      </div>

      {duplicados.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-sm">
          <p className="font-medium text-amber-800 mb-1">⚠️ Encontramos coincidencias similares:</p>
          <ul className="space-y-0.5">
            {duplicados.map((d, i) => (
              <li key={i} className="text-amber-700 text-xs">
                • <strong>{d.nombre}</strong>
                <span className="ml-1 opacity-60">
                  ({d.tipo === 'existente' ? 'ya existe en el catálogo' : 'propuesta pendiente'})
                </span>
              </li>
            ))}
          </ul>
          {confirmando && (
            <p className="text-amber-800 text-xs mt-2 font-medium">
              ¿Es diferente a las anteriores? Si es así, enviá igual y lo revisaremos.
            </p>
          )}
        </div>
      )}

      {tipo === 'libro' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Editorial</label>
            <input className="input" type="text" placeholder="Ej: Editorial XYZ"
              value={editorial} onChange={e => setEditorial(e.target.value)} />
          </div>
          <div>
            <label className="label">Cantidad de páginas</label>
            <input className="input" type="number" min={1} placeholder="Ej: 8"
              value={paginas} onChange={e => setPaginas(e.target.value)} />
          </div>
        </div>
      )}

      <div>
        <label className="label">Notas adicionales (opcional)</label>
        <textarea
          className="input" rows={2}
          placeholder={tipo === 'libro'
            ? 'Ej: Libro verde con flores en la tapa'
            : 'Ej: Marcadores acrílicos, viene en sets de 168 colores'}
          value={notas}
          onChange={e => setNotas(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? 'Enviando...' : confirmando ? 'Enviar igual →' : 'Enviar propuesta →'}
        </button>
      </div>
    </form>
  )
}