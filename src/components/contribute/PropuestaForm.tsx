'use client'

import { useState } from 'react'
import { buscarDuplicadosLibro, buscarDuplicadosMarca, proponerLibro, proponerMarca } from '@/lib/propuestas-actions'

type Tipo = 'libro' | 'marca'

interface Props {
  tipo: Tipo
  onClose: () => void
}

interface ModeloPropuesto {
  nombre: string
  cantidad: string
}

export function PropuestaForm({ tipo, onClose }: Props) {
  const [nombre,      setNombre]      = useState('')
  const [editorial,   setEditorial]   = useState('')
  const [paginas,     setPaginas]     = useState('')
  const [notas,       setNotas]       = useState('')
  const [modelos,     setModelos]     = useState<ModeloPropuesto[]>([{ nombre: '', cantidad: '' }])
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

  function addModelo() {
    setModelos(p => [...p, { nombre: '', cantidad: '' }])
  }
  function removeModelo(i: number) {
    if (modelos.length === 1) return
    setModelos(p => p.filter((_, idx) => idx !== i))
  }
  function updateModelo(i: number, field: keyof ModeloPropuesto, value: string) {
    setModelos(p => p.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (duplicados.length > 0 && !confirmando) {
      setConfirmando(true)
      return
    }

    if (tipo === 'marca') {
      const modelosValidos = modelos.filter(m => m.nombre.trim())
      if (modelosValidos.length === 0) {
        setError('Agregá al menos un modelo para esta marca.')
        return
      }
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
        fd.append('modelos', JSON.stringify(modelos.filter(m => m.nombre.trim())))
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
        <p className="text-sm font-sans mb-4" style={{ color: '#8A8A9A' }}>
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
        <div className="rounded-lg px-3 py-2.5 text-sm"
             style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <p className="font-medium mb-1" style={{ color: '#92400E' }}>
            ⚠️ Encontramos coincidencias similares:
          </p>
          <ul className="space-y-0.5">
            {duplicados.map((d, i) => (
              <li key={i} className="text-xs" style={{ color: '#B45309' }}>
                • <strong>{d.nombre}</strong>
                <span className="ml-1 opacity-60">
                  ({d.tipo === 'existente' ? 'ya existe en el catálogo' : 'propuesta pendiente'})
                </span>
              </li>
            ))}
          </ul>
          {confirmando && (
            <p className="text-xs mt-2 font-medium" style={{ color: '#92400E' }}>
              ¿Es diferente a las anteriores? Si es así, enviá igual y lo revisaremos.
            </p>
          )}
        </div>
      )}

      {tipo === 'libro' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Editorial</label>
            <input className="input" type="text" placeholder="Ej: Hachette Heroes"
              value={editorial} onChange={e => setEditorial(e.target.value)} />
          </div>
          <div>
            <label className="label">Cantidad de páginas</label>
            <input className="input" type="number" min={1} placeholder="Ej: 8"
              value={paginas} onChange={e => setPaginas(e.target.value)} />
          </div>
        </div>
      )}

      {tipo === 'marca' && (
        <div>
          <p className="font-script text-base mb-1" style={{ color: '#C9908A' }}>
            Modelos de esta marca *
          </p>
          <p className="text-xs font-sans mb-2" style={{ color: '#8A8A9A' }}>
            Ej: "Set 240 colores punta pincel", "Set 36 colores doble punta"
          </p>
          <div className="space-y-2">
            {modelos.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_32px] gap-2 items-center">
                <input
                  className="input text-sm"
                  type="text"
                  placeholder="Ej: Set 240 colores punta pincel"
                  value={m.nombre}
                  onChange={e => updateModelo(i, 'nombre', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeModelo(i)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ border: '1px solid #EDE0D4', color: '#8A8A9A' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addModelo}
            className="w-full mt-2 py-2 rounded-xl text-sm font-sans"
            style={{ border: '1px dashed #E8C4C0', color: '#C9908A' }}
          >
            + Agregar otro modelo
          </button>
        </div>
      )}

      <div>
        <label className="label">Notas adicionales (opcional)</label>
        <textarea
          className="input" rows={2}
          placeholder={tipo === 'libro'
            ? 'Ej: Libro verde con flores en la tapa'
            : 'Ej: Marcadores acrílicos importados de China'}
          value={notas}
          onChange={e => setNotas(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-xs font-sans rounded-lg px-3 py-2"
           style={{ background: '#F5E8E6', border: '1px solid #E8C4C0', color: '#C9908A' }}>
          {error}
        </p>
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