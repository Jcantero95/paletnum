'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSubmission } from '@/lib/actions'
import type { Libro, Marca, Modelo } from '@/types'

type Modo = 'manual' | 'foto'

interface ColorEntry {
  numero_libro: string
  nombre_color: string
  hex: string
  codigo_marcador: string
  modelo_idx: number  // índice del modelo en el array de modelos seleccionados
}

interface ModeloSeleccionado {
  marca_id: string
  modelo_id: string
}

interface Props {
  libros: Libro[]
  marcas: Marca[]
  modelosByMarca: Record<string, Modelo[]>
}

export function ContribuirForm({ libros, marcas, modelosByMarca }: Props) {
  const router      = useRouter()
  const fotoRef     = useRef<HTMLInputElement>(null)
  const registroRef = useRef<HTMLInputElement>(null)

  const [modo,      setModo]      = useState<Modo>('manual')
  const [libroId,   setLibroId]   = useState('')
  const [pagina,    setPagina]    = useState('')
  const [desc,      setDesc]      = useState('')

  // Múltiples marcas/modelos
  const [modelosSeleccionados, setModelosSeleccionados] = useState<ModeloSeleccionado[]>([
    { marca_id: '', modelo_id: '' }
  ])

  const [fotoPreview,     setFotoPreview]     = useState<string | null>(null)
  const [registroPreview, setRegistroPreview] = useState<string | null>(null)

  const [colores, setColores] = useState<ColorEntry[]>([
    { numero_libro: '', nombre_color: '', hex: '#E8C4C0', codigo_marcador: '', modelo_idx: 0 }
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setFotoPreview(URL.createObjectURL(file))
  }
  function handleRegistro(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setRegistroPreview(URL.createObjectURL(file))
  }

  // Modelos
  function updateModelo(idx: number, field: keyof ModeloSeleccionado, value: string) {
    setModelosSeleccionados(prev => prev.map((m, i) =>
      i === idx ? { ...m, [field]: value, ...(field === 'marca_id' ? { modelo_id: '' } : {}) } : m
    ))
  }
  function addModelo() {
    setModelosSeleccionados(prev => [...prev, { marca_id: '', modelo_id: '' }])
  }
  function removeModelo(idx: number) {
    if (modelosSeleccionados.length === 1) return
    setModelosSeleccionados(prev => prev.filter((_, i) => i !== idx))
    // Reasignar colores que apuntaban a este modelo al primero
    setColores(prev => prev.map(c =>
      c.modelo_idx === idx ? { ...c, modelo_idx: 0 } :
      c.modelo_idx > idx   ? { ...c, modelo_idx: c.modelo_idx - 1 } : c
    ))
  }

  // Colores
  function addColor() {
    setColores(p => [...p, {
      numero_libro: '', nombre_color: '', hex: '#E8C4C0',
      codigo_marcador: '', modelo_idx: 0
    }])
  }
  function removeColor(i: number) {
    setColores(p => p.filter((_, idx) => idx !== i))
  }
  function updateColor(i: number, field: keyof ColorEntry, value: string | number) {
    setColores(p => p.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!libroId || !pagina) {
      setError('Completá libro y página.')
      return
    }
    const modelosValidos = modelosSeleccionados.filter(m => m.marca_id && m.modelo_id)
    if (modelosValidos.length === 0) {
      setError('Seleccioná al menos una marca y modelo.')
      return
    }
    if (modo === 'manual') {
      if (!colores.some(c => c.numero_libro && c.codigo_marcador)) {
        setError('Agregá al menos un color con número y código.')
        return
      }
    } else {
      if (!registroRef.current?.files?.[0]) {
        setError('Subí la foto de tu registro escrito.')
        return
      }
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('libro_id',   libroId)
      fd.append('pagina',     pagina)
      fd.append('modelo_id',  modelosValidos[0].modelo_id) // compatibilidad
      fd.append('descripcion', desc)
      fd.append('modelos', JSON.stringify(modelosValidos))

      if (fotoRef.current?.files?.[0])     fd.append('foto',     fotoRef.current.files[0])
      if (registroRef.current?.files?.[0]) fd.append('registro', registroRef.current.files[0])

      const coloresFinales = modo === 'manual'
        ? colores.filter(c => c.numero_libro && c.codigo_marcador).map((c, i) => ({
            numero_libro:    parseInt(c.numero_libro),
            nombre_color:    c.nombre_color,
            hex:             c.hex,
            codigo_marcador: c.codigo_marcador,
            modelo_id:       modelosValidos[c.modelo_idx]?.modelo_id ?? null,
            orden:           i,
          }))
        : []
      fd.append('colores', JSON.stringify(coloresFinales))

      await createSubmission(fd)
      router.push('/buscar?libro_id=' + libroId + '&pagina=' + pagina)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.')
    } finally {
      setSubmitting(false)
    }
  }

  const hayVariosModelos = modelosSeleccionados.length > 1

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Datos del dibujo */}
      <div className="card">
        <h2 className="font-display text-xl mb-4 pb-3" style={{ borderBottom: '1px solid #EDE0D4', color: '#5C5C6E' }}>
          Nueva versión de dibujo
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="sm:col-span-2">
            <label className="label">Libro / Serie</label>
            <select className="input" value={libroId} onChange={e => setLibroId(e.target.value)} required>
              <option value="">Seleccionar...</option>
              {libros.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Página</label>
            <input className="input" type="number" min={1} placeholder="Ej: 4"
              value={pagina} onChange={e => setPagina(e.target.value)} required />
          </div>
          <div>
            <label className="label">Descripción (opcional)</label>
            <input className="input" type="text"
              placeholder="Ej: Elegí tonos más cálidos..."
              value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
        </div>

        {/* Marcas/modelos — múltiples */}
        <div className="mb-4">
          <p className="font-script text-base mb-2" style={{ color: '#C9908A' }}>
            Marcadores que usaste
          </p>
          <div className="space-y-2">
            {modelosSeleccionados.map((m, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end
                                        p-3 rounded-xl"
                   style={{ background: '#F4EDE4', border: '1px solid rgba(92,92,110,0.1)' }}>
                <div>
                  <label className="label">Marca {modelosSeleccionados.length > 1 ? idx + 1 : ''}</label>
                  <select className="input" value={m.marca_id}
                    onChange={e => updateModelo(idx, 'marca_id', e.target.value)}>
                    <option value="">Marca...</option>
                    {marcas.map(ma => <option key={ma.id} value={ma.id}>{ma.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Modelo</label>
                  <select className="input" value={m.modelo_id}
                    onChange={e => updateModelo(idx, 'modelo_id', e.target.value)}
                    disabled={!m.marca_id}>
                    <option value="">Modelo...</option>
                    {(modelosByMarca[m.marca_id] ?? []).map(mo =>
                      <option key={mo.id} value={mo.id}>{mo.nombre}</option>
                    )}
                  </select>
                </div>
                {modelosSeleccionados.length > 1 && (
                  <button type="button" onClick={() => removeModelo(idx)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors"
                    style={{ border: '1px solid #E8C4C0', color: '#C9908A', background: 'white' }}>
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addModelo}
            className="w-full mt-2 py-2 rounded-xl text-sm font-sans transition-colors"
            style={{ border: '1px dashed #E8C4C0', color: '#C9908A', background: 'transparent' }}>
            + Usé otra marca también
          </button>
        </div>

        {/* Foto del dibujo */}
        <div>
          <label className="label">Foto del resultado terminado</label>
          <div
            className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors"
            style={{ borderColor: '#EDE0D4', color: '#8A8A9A' }}
            onClick={() => fotoRef.current?.click()}
          >
            {fotoPreview
              ? <img src={fotoPreview} alt="preview" className="max-h-40 mx-auto rounded-xl" />
              : <>
                  <div className="text-3xl mb-2 opacity-40">📷</div>
                  <p className="font-sans text-sm font-medium">Tocá para subir tu foto</p>
                  <p className="font-sans text-xs mt-1 opacity-50">JPG, PNG — máx. 10MB</p>
                </>
            }
          </div>
          <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
        </div>
      </div>

      {/* Lista de colores */}
      <div className="card">
        <p className="font-script text-lg mb-4" style={{ color: '#C9908A' }}>
          Lista de colores usados
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {(['manual', 'foto'] as Modo[]).map(m => (
            <button key={m} type="button" onClick={() => setModo(m)}
              className="py-3 rounded-xl border text-sm font-sans transition-all"
              style={modo === m
                ? { background: '#5C5C6E', color: '#FAF6F1', borderColor: '#5C5C6E' }
                : { background: 'white', color: '#8A8A9A', borderColor: 'rgba(92,92,110,0.15)' }
              }>
              {m === 'manual' ? '✏️ Cargar a mano' : '📋 Foto del registro'}
            </button>
          ))}
        </div>

        {modo === 'manual' && (
          <div className="space-y-2">
            {/* Headers */}
            <div className={`grid gap-1.5 text-[10px] uppercase tracking-wide font-sans px-1 mb-1`}
                 style={{
                   gridTemplateColumns: hayVariosModelos ? '36px 1fr 1fr 80px 32px' : '36px 1fr 1fr 32px',
                   color: '#8A8A9A'
                 }}>
              <span>Color</span>
              <span>N°</span>
              <span>Código</span>
              {hayVariosModelos && <span>Marca</span>}
              <span />
            </div>

            {colores.map((c, i) => (
              <div key={i}
                className="grid gap-1.5 items-center"
                style={{ gridTemplateColumns: hayVariosModelos ? '36px 1fr 1fr 80px 32px' : '36px 1fr 1fr 32px' }}>
                <input type="color" value={c.hex}
                  onChange={e => updateColor(i, 'hex', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer p-0.5 bg-white"
                  style={{ border: '1px solid #EDE0D4' }} />
                <input className="input text-sm" type="number" min={1} placeholder="N°"
                  value={c.numero_libro}
                  onChange={e => updateColor(i, 'numero_libro', e.target.value)} />
                <input className="input text-sm" type="text" placeholder="Código"
                  value={c.codigo_marcador}
                  onChange={e => updateColor(i, 'codigo_marcador', e.target.value)} />
                {hayVariosModelos && (
                  <select className="input text-xs" value={c.modelo_idx}
                    onChange={e => updateColor(i, 'modelo_idx', parseInt(e.target.value))}>
                    {modelosSeleccionados.map((m, idx) => {
                      const marca = marcas.find(ma => ma.id === m.marca_id)
                      return (
                        <option key={idx} value={idx}>
                          {marca?.nombre ?? `Marca ${idx + 1}`}
                        </option>
                      )
                    })}
                  </select>
                )}
                <button type="button" onClick={() => removeColor(i)}
                  className="w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors"
                  style={{ border: '1px solid #EDE0D4', color: '#8A8A9A' }}>
                  ×
                </button>
              </div>
            ))}

            <button type="button" onClick={addColor}
              className="w-full py-2.5 rounded-xl text-sm font-sans transition-colors mt-1"
              style={{ border: '1px dashed #EDE0D4', color: '#8A8A9A' }}>
              + Agregar color
            </button>
          </div>
        )}

        {modo === 'foto' && (
          <div>
            <div
              className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors"
              style={{ borderColor: '#EDE0D4', color: '#8A8A9A' }}
              onClick={() => registroRef.current?.click()}
            >
              {registroPreview
                ? <img src={registroPreview} alt="registro" className="max-h-48 mx-auto rounded-xl" />
                : <>
                    <div className="text-4xl mb-3 opacity-40">📋</div>
                    <p className="font-sans font-medium text-sm mb-1">Foto de tu registro escrito</p>
                    <p className="font-sans text-xs opacity-60">Papel, cuaderno o anotación con tus equivalencias</p>
                  </>
              }
            </div>
            <input ref={registroRef} type="file" accept="image/*"
              className="hidden" onChange={handleRegistro} />
            {registroPreview && (
              <p className="text-xs mt-2 text-center font-sans" style={{ color: '#8FAF8F' }}>
                ✓ Foto cargada correctamente
              </p>
            )}
            <div className="mt-3 rounded-xl px-4 py-3 text-xs font-sans"
                 style={{ background: '#F4EDE4', color: '#8A8A9A' }}>
              💡 En una próxima versión extraeremos los colores automáticamente de tu foto.
            </div>
          </div>
        )}
      </div>

      {/* Puntos */}
      <div className="rounded-xl px-4 py-3 flex items-center justify-between text-sm"
           style={{ background: '#F5E8E6', border: '1px solid #E8C4C0' }}>
        <p className="font-sans" style={{ color: '#C9908A' }}>
          <span className="font-medium">Puntos que ganás:</span>
          {' '}+5 por publicar · +1 por cada like ♡
        </p>
      </div>

      {error && (
        <p className="text-sm font-sans rounded-xl px-4 py-3"
           style={{ background: '#F5E8E6', border: '1px solid #E8C4C0', color: '#C9908A' }}>
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-base">
        {submitting ? 'Publicando...' : 'Publicar mi resultado →'}
      </button>

    </form>
  )
}