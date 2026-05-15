'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createSubmission } from '@/lib/actions'
import type { Libro, Marca, Modelo } from '@/types'

type Modo = 'manual' | 'foto'

interface ColorEntry {
  numero_libro: string
  nombre_color: string
  hex: string
  codigo_marcador: string
  modelo_idx: number
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
  const router            = useRouter()
  const supabase          = createClient()
  const fotoRef           = useRef<HTMLInputElement>(null)
  const camaraRef         = useRef<HTMLInputElement>(null)
  const registroRef       = useRef<HTMLInputElement>(null)
  const camaraRegistroRef = useRef<HTMLInputElement>(null)

  const [modo,      setModo]      = useState<Modo>('manual')
  const [libroId,   setLibroId]   = useState('')
  const [pagina,    setPagina]    = useState('')
  const [desc,      setDesc]      = useState('')
  const [publicado, setPublicado] = useState(false)

  const [modelosSeleccionados, setModelosSeleccionados] = useState<ModeloSeleccionado[]>([
    { marca_id: '', modelo_id: '' }
  ])

  const [fotoFile,        setFotoFile]        = useState<File | null>(null)
  const [registroFile,    setRegistroFile]    = useState<File | null>(null)
  const [fotoPreview,     setFotoPreview]     = useState<string | null>(null)
  const [registroPreview, setRegistroPreview] = useState<string | null>(null)

  const [colores, setColores] = useState<ColorEntry[]>([
    { numero_libro: '', nombre_color: '', hex: '#E8C4C0', codigo_marcador: '', modelo_idx: 0 }
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function comprimirImagen(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          const maxDim = 1920
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = (height * maxDim) / width; width = maxDim }
            else { width = (width * maxDim) / height; height = maxDim }
          }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
              else resolve(file)
            },
            'image/jpeg', 0.82
          )
        }
      }
    })
  }

  async function uploadFoto(file: File, tipo: 'foto' | 'registro', userId: string): Promise<string> {
    const path = `${userId}/${tipo}_${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('submissions-fotos').upload(path, file, { upsert: false, contentType: 'image/jpeg' })
    if (error) throw new Error(error.message)
    return supabase.storage.from('submissions-fotos').getPublicUrl(path).data.publicUrl
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const comprimida = await comprimirImagen(file)
      setFotoFile(comprimida); setFotoPreview(URL.createObjectURL(comprimida))
    }
  }

  async function handleRegistro(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const comprimida = await comprimirImagen(file)
      setRegistroFile(comprimida); setRegistroPreview(URL.createObjectURL(comprimida))
    }
  }

  function limpiarFoto() {
    setFotoFile(null); setFotoPreview(null)
    if (fotoRef.current)   fotoRef.current.value = ''
    if (camaraRef.current) camaraRef.current.value = ''
  }

  function limpiarRegistro() {
    setRegistroFile(null); setRegistroPreview(null)
    if (registroRef.current)       registroRef.current.value = ''
    if (camaraRegistroRef.current) camaraRegistroRef.current.value = ''
  }

  function updateModelo(idx: number, field: keyof ModeloSeleccionado, value: string) {
    setModelosSeleccionados(prev => prev.map((m, i) =>
      i === idx ? { ...m, [field]: value, ...(field === 'marca_id' ? { modelo_id: '' } : {}) } : m
    ))
  }
  function addModelo() { setModelosSeleccionados(prev => [...prev, { marca_id: '', modelo_id: '' }]) }
  function removeModelo(idx: number) {
    if (modelosSeleccionados.length === 1) return
    setModelosSeleccionados(prev => prev.filter((_, i) => i !== idx))
    setColores(prev => prev.map(c =>
      c.modelo_idx === idx ? { ...c, modelo_idx: 0 } :
      c.modelo_idx > idx   ? { ...c, modelo_idx: c.modelo_idx - 1 } : c
    ))
  }

  function addColor() {
    setColores(p => [...p, { numero_libro: '', nombre_color: '', hex: '#E8C4C0', codigo_marcador: '', modelo_idx: 0 }])
  }
  function removeColor(i: number) { setColores(p => p.filter((_, idx) => idx !== i)) }
  function updateColor(i: number, field: keyof ColorEntry, value: string | number) {
    setColores(p => p.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!libroId || !pagina) { setError('Completá libro y página.'); return }
    const modelosValidos = modelosSeleccionados.filter(m => m.marca_id && m.modelo_id)
    if (modelosValidos.length === 0) { setError('Seleccioná al menos una marca y modelo.'); return }
    if (modo === 'manual') {
      if (!colores.some(c => c.numero_libro && c.codigo_marcador)) {
        setError('Agregá al menos un color con número y código.'); return
      }
    } else {
      if (!registroFile) { setError('Subí la foto de tu registro escrito.'); return }
    }
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      let foto_url:     string | null = null
      let registro_url: string | null = null
      if (fotoFile)     foto_url     = await uploadFoto(fotoFile,     'foto',     user.id)
      if (registroFile) registro_url = await uploadFoto(registroFile, 'registro', user.id)

      const fd = new FormData()
      fd.append('libro_id',    libroId)
      fd.append('pagina',      pagina)
      fd.append('modelo_id',   modelosValidos[0].modelo_id)
      fd.append('descripcion', desc)
      fd.append('modelos',     JSON.stringify(modelosValidos))
      if (foto_url)     fd.append('foto_url',     foto_url)
      if (registro_url) fd.append('registro_url', registro_url)

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
      setPublicado(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.')
    } finally {
      setSubmitting(false)
    }
  }

  if (publicado) {
    return (
      <div className="bg-white border border-borde rounded-2xl p-8 text-center shadow-cozy">
        <div className="text-6xl mb-4">🎨</div>
        <h2 className="font-display text-2xl mb-2" style={{ color: '#5C5C6E' }}>
          ¡Gracias por colaborar!
        </h2>
        <p className="font-sans text-sm mb-2" style={{ color: '#8A8A9A' }}>
          Tu resultado fue publicado exitosamente.
        </p>
        <p className="font-script text-lg mb-6" style={{ color: '#C9908A' }}>
          La comunidad te lo agradece ✨
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => router.push('/buscar?libro_id=' + libroId + '&pagina=' + pagina)}
            className="btn-primary px-6 py-3">
            Ver resultados →
          </button>
          <button onClick={() => {
            setPublicado(false)
            setLibroId(''); setPagina(''); setDesc('')
            setFotoFile(null); setFotoPreview(null)
            setRegistroFile(null); setRegistroPreview(null)
            setColores([{ numero_libro: '', nombre_color: '', hex: '#E8C4C0', codigo_marcador: '', modelo_idx: 0 }])
            setModelosSeleccionados([{ marca_id: '', modelo_id: '' }])
          }} className="btn-secondary px-6 py-3">
            Publicar otro resultado
          </button>
        </div>
      </div>
    )
  }

  const hayVariosModelos = modelosSeleccionados.length > 1

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

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
            <input className="input" type="text" placeholder="Ej: Elegí tonos más cálidos..."
              value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
        </div>

        {/* Marcas */}
        <div className="mb-4">
          <p className="font-script text-base mb-2" style={{ color: '#C9908A' }}>Marcadores que usaste</p>
          <div className="space-y-2">
            {modelosSeleccionados.map((m, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end p-3 rounded-xl"
                   style={{ background: '#F4EDE4', border: '1px solid rgba(92,92,110,0.1)' }}>
                <div>
                  <label className="label">Marca {modelosSeleccionados.length > 1 ? idx + 1 : ''}</label>
                  <select className="input" value={m.marca_id} onChange={e => updateModelo(idx, 'marca_id', e.target.value)}>
                    <option value="">Marca...</option>
                    {marcas.map(ma => <option key={ma.id} value={ma.id}>{ma.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Modelo</label>
                  <select className="input" value={m.modelo_id}
                    onChange={e => updateModelo(idx, 'modelo_id', e.target.value)} disabled={!m.marca_id}>
                    <option value="">Modelo...</option>
                    {(modelosByMarca[m.marca_id] ?? []).map(mo =>
                      <option key={mo.id} value={mo.id}>{mo.nombre}</option>
                    )}
                  </select>
                </div>
                {modelosSeleccionados.length > 1 && (
                  <button type="button" onClick={() => removeModelo(idx)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                    style={{ border: '1px solid #E8C4C0', color: '#C9908A', background: 'white' }}>
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addModelo}
            className="w-full mt-2 py-2 rounded-xl text-sm font-sans"
            style={{ border: '1px dashed #E8C4C0', color: '#C9908A', background: 'transparent' }}>
            + Usé otra marca también
          </button>
        </div>

        {/* Foto del dibujo */}
        <div>
          <label className="label">Foto del resultado terminado</label>
          {fotoPreview ? (
            <div className="relative">
              <img src={fotoPreview} alt="preview" className="w-full max-h-52 object-cover rounded-2xl" />
              <button type="button" onClick={limpiarFoto}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                ×
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => fotoRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed transition-colors"
                style={{ borderColor: '#EDE0D4', color: '#8A8A9A' }}>
                <span className="text-2xl">🖼️</span>
                <span className="font-sans text-xs font-medium">Subir de galería</span>
              </button>
              <button type="button" onClick={() => camaraRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed transition-colors"
                style={{ borderColor: '#E8C4C0', color: '#C9908A' }}>
                <span className="text-2xl">📷</span>
                <span className="font-sans text-xs font-medium">Sacar foto</span>
              </button>
            </div>
          )}
          <input ref={fotoRef}    type="file" accept="image/*"                    className="hidden" onChange={handleFoto} />
          <input ref={camaraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
        </div>
      </div>

      {/* Lista de colores */}
      <div className="card">
        <p className="font-script text-lg mb-4" style={{ color: '#C9908A' }}>Lista de colores usados</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {(['manual', 'foto'] as Modo[]).map(m => (
            <button key={m} type="button" onClick={() => setModo(m)}
              className="py-3 rounded-xl border text-sm font-sans transition-all"
              style={modo === m
                ? { background: '#5C5C6E', color: '#FAF6F1', borderColor: '#5C5C6E' }
                : { background: 'white', color: '#8A8A9A', borderColor: 'rgba(92,92,110,0.15)' }}>
              {m === 'manual' ? '✏️ Cargar a mano' : '📋 Foto del registro'}
            </button>
          ))}
        </div>

        {modo === 'manual' && (
          <div className="space-y-2">
            <div className="grid gap-1.5 text-[10px] uppercase tracking-wide font-sans px-1 mb-1"
                 style={{ gridTemplateColumns: hayVariosModelos ? '36px 1fr 1fr 80px 32px' : '36px 1fr 1fr 32px', color: '#8A8A9A' }}>
              <span>Color</span><span>N°</span><span>Código</span>
              {hayVariosModelos && <span>Marca</span>}
              <span />
            </div>
            {colores.map((c, i) => (
              <div key={i} className="grid gap-1.5 items-center"
                   style={{ gridTemplateColumns: hayVariosModelos ? '36px 1fr 1fr 80px 32px' : '36px 1fr 1fr 32px' }}>
                <input type="color" value={c.hex} onChange={e => updateColor(i, 'hex', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer p-0.5 bg-white"
                  style={{ border: '1px solid #EDE0D4' }} />
                <input className="input text-sm" type="number" min={1} placeholder="N°"
                  value={c.numero_libro} onChange={e => updateColor(i, 'numero_libro', e.target.value)} />
                <input className="input text-sm" type="text" placeholder="Código"
                  value={c.codigo_marcador} onChange={e => updateColor(i, 'codigo_marcador', e.target.value)} />
                {hayVariosModelos && (
                  <select className="input text-xs" value={c.modelo_idx}
                    onChange={e => updateColor(i, 'modelo_idx', parseInt(e.target.value))}>
                    {modelosSeleccionados.map((m, idx) => {
                      const marca = marcas.find(ma => ma.id === m.marca_id)
                      return <option key={idx} value={idx}>{marca?.nombre ?? `Marca ${idx + 1}`}</option>
                    })}
                  </select>
                )}
                <button type="button" onClick={() => removeColor(i)}
                  className="w-8 h-8 rounded-lg text-lg flex items-center justify-center"
                  style={{ border: '1px solid #EDE0D4', color: '#8A8A9A' }}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addColor}
              className="w-full py-2.5 rounded-xl text-sm font-sans mt-1"
              style={{ border: '1px dashed #EDE0D4', color: '#8A8A9A' }}>
              + Agregar color
            </button>
          </div>
        )}

        {modo === 'foto' && (
          <div>
            {registroPreview ? (
              <div className="relative">
                <img src={registroPreview} alt="registro" className="w-full max-h-52 object-cover rounded-2xl" />
                <button type="button" onClick={limpiarRegistro}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
                  style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                  ×
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => registroRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed transition-colors"
                  style={{ borderColor: '#EDE0D4', color: '#8A8A9A' }}>
                  <span className="text-2xl">🖼️</span>
                  <span className="font-sans text-xs font-medium">Subir de galería</span>
                </button>
                <button type="button" onClick={() => camaraRegistroRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed transition-colors"
                  style={{ borderColor: '#E8C4C0', color: '#C9908A' }}>
                  <span className="text-2xl">📷</span>
                  <span className="font-sans text-xs font-medium">Sacar foto</span>
                </button>
              </div>
            )}
            <input ref={registroRef}       type="file" accept="image/*"                    className="hidden" onChange={handleRegistro} />
            <input ref={camaraRegistroRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleRegistro} />
            <div className="mt-3 rounded-xl px-4 py-3 text-xs font-sans"
                 style={{ background: '#F4EDE4', color: '#8A8A9A' }}>
              💡 En una próxima versión extraeremos los colores automáticamente de tu foto.
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#F5E8E6', border: '1px solid #E8C4C0' }}>
        <p className="font-sans" style={{ color: '#C9908A' }}>
          <span className="font-medium">Puntos que ganás:</span> +5 por publicar · +1 por cada like ♡
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
