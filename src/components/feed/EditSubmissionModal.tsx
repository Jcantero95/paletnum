'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateSubmission } from '@/lib/actions'
import type { Submission, Marca, Modelo } from '@/types'

interface Props {
  submission: Submission
  marcas: Marca[]
  modelosByMarca: Record<string, Modelo[]>
  onClose: () => void
  onSaved: () => void
}

interface ColorEntry {
  id?: string
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

export function EditSubmissionModal({ submission, marcas, modelosByMarca, onClose, onSaved }: Props) {
  const supabase    = createClient()
  const fotoRef     = useRef<HTMLInputElement>(null)
  const registroRef = useRef<HTMLInputElement>(null)

  const [desc, setDesc] = useState(submission.descripcion ?? '')

  const [modelosSeleccionados, setModelosSeleccionados] = useState<ModeloSeleccionado[]>(
    submission.modelos && submission.modelos.length > 0
      ? submission.modelos.map(sm => ({
          marca_id:  sm.modelo?.marca?.id ?? '',
          modelo_id: sm.modelo_id,
        }))
      : [{ marca_id: '', modelo_id: '' }]
  )

  const [colores, setColores] = useState<ColorEntry[]>(
    submission.submission_colores && submission.submission_colores.length > 0
      ? submission.submission_colores.map(c => ({
          id:              c.id,
          numero_libro:    String(c.numero_libro),
          nombre_color:    c.nombre_color,
          hex:             c.hex ?? '#E8C4C0',
          codigo_marcador: c.codigo_marcador,
          modelo_idx:      0,
        }))
      : [{ numero_libro: '', nombre_color: '', hex: '#E8C4C0', codigo_marcador: '', modelo_idx: 0 }]
  )

  const [fotoPreview,     setFotoPreview]     = useState<string | null>(submission.foto_url ?? null)
  const [registroPreview, setRegistroPreview] = useState<string | null>(submission.registro_url ?? null)
  const [fotoFile,        setFotoFile]        = useState<File | null>(null)
  const [registroFile,    setRegistroFile]    = useState<File | null>(null)

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
            blob => resolve(blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : file),
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
      const c = await comprimirImagen(file)
      setFotoFile(c); setFotoPreview(URL.createObjectURL(c))
    }
  }

  async function handleRegistro(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const c = await comprimirImagen(file)
      setRegistroFile(c); setRegistroPreview(URL.createObjectURL(c))
    }
  }

  function updateModelo(idx: number, field: keyof ModeloSeleccionado, value: string) {
    setModelosSeleccionados(prev => prev.map((m, i) =>
      i === idx ? { ...m, [field]: value, ...(field === 'marca_id' ? { modelo_id: '' } : {}) } : m
    ))
  }
  function addModelo() { setModelosSeleccionados(p => [...p, { marca_id: '', modelo_id: '' }]) }
  function removeModelo(idx: number) {
    if (modelosSeleccionados.length === 1) return
    setModelosSeleccionados(p => p.filter((_, i) => i !== idx))
  }

  function addColor() {
    setColores(p => [...p, { numero_libro: '', nombre_color: '', hex: '#E8C4C0', codigo_marcador: '', modelo_idx: 0 }])
  }
  function removeColor(i: number) { setColores(p => p.filter((_, idx) => idx !== i)) }
  function updateColor(i: number, field: keyof ColorEntry, value: string | number) {
    setColores(p => p.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      let foto_url     = submission.foto_url
      let registro_url = submission.registro_url

      if (fotoFile)     foto_url     = await uploadFoto(fotoFile,     'foto',     user.id)
      if (registroFile) registro_url = await uploadFoto(registroFile, 'registro', user.id)

      const modelosValidos = modelosSeleccionados.filter(m => m.marca_id && m.modelo_id)

      const fd = new FormData()
      fd.append('descripcion',  desc)
      if (foto_url)     fd.append('foto_url',     foto_url)
      if (registro_url) fd.append('registro_url', registro_url)
      fd.append('modelos', JSON.stringify(modelosValidos))

      const coloresFinales = colores
        .filter(c => c.numero_libro && c.codigo_marcador)
        .map((c, i) => ({
          numero_libro:    parseInt(c.numero_libro),
          nombre_color:    c.nombre_color,
          hex:             c.hex,
          codigo_marcador: c.codigo_marcador,
          modelo_id:       modelosValidos[c.modelo_idx]?.modelo_id ?? null,
          orden:           i,
        }))
      fd.append('colores', JSON.stringify(coloresFinales))

      await updateSubmission(submission.id, fd)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const hayVariosModelos = modelosSeleccionados.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4"
         style={{ background: 'rgba(92,92,110,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-cozy-md my-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4"
             style={{ borderBottom: '1px solid #EDE0D4' }}>
          <h2 className="font-display text-xl" style={{ color: '#5C5C6E' }}>
            Editar publicación
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ background: '#F4EDE4', color: '#8A8A9A' }}>
            ×
          </button>
        </div>

        <form onSubmit={handleGuardar} className="p-5 space-y-4">

          {/* Info no editable */}
          <div className="rounded-xl px-4 py-3 text-sm font-sans"
               style={{ background: '#F4EDE4', color: '#8A8A9A' }}>
            📖 {submission.libro?.nombre} · Página {submission.pagina}
          </div>

          {/* Descripción */}
          <div>
            <label className="label">Descripción</label>
            <input className="input" type="text" placeholder="Ej: Elegí tonos más cálidos..."
              value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          {/* Marcas */}
          <div>
            <p className="font-script text-base mb-2" style={{ color: '#C9908A' }}>Marcadores</p>
            <div className="space-y-2">
              {modelosSeleccionados.map((m, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end p-3 rounded-xl"
                     style={{ background: '#F4EDE4' }}>
                  <div>
                    <label className="label">Marca</label>
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
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ border: '1px solid #E8C4C0', color: '#C9908A', background: 'white' }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addModelo}
              className="w-full mt-2 py-2 rounded-xl text-sm font-sans"
              style={{ border: '1px dashed #E8C4C0', color: '#C9908A' }}>
              + Usé otra marca también
            </button>
          </div>

          {/* Foto del dibujo */}
          <div>
            <label className="label">Foto del resultado</label>
            {fotoPreview ? (
              <div className="relative">
                <img src={fotoPreview} alt="preview"
                  className="w-full max-h-48 object-cover rounded-xl" />
                <button type="button"
                  onClick={() => { setFotoPreview(null); setFotoFile(null) }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow"
                  style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                  ×
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer"
                   style={{ borderColor: '#EDE0D4', color: '#8A8A9A' }}
                   onClick={() => fotoRef.current?.click()}>
                <p className="font-sans text-sm">Tocá para cambiar la foto</p>
              </div>
            )}
            <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
          </div>

          {/* Colores */}
          <div>
            <p className="font-script text-base mb-2" style={{ color: '#C9908A' }}>Colores</p>
            <div className="space-y-2">
              <div className="grid gap-1.5 text-[10px] uppercase tracking-wide font-sans px-1"
                   style={{ gridTemplateColumns: hayVariosModelos ? '36px 1fr 1fr 80px 32px' : '36px 1fr 1fr 32px', color: '#8A8A9A' }}>
                <span>Color</span><span>N°</span><span>Código</span>
                {hayVariosModelos && <span>Marca</span>}
                <span />
              </div>
              {colores.map((c, i) => (
                <div key={i} className="grid gap-1.5 items-center"
                     style={{ gridTemplateColumns: hayVariosModelos ? '36px 1fr 1fr 80px 32px' : '36px 1fr 1fr 32px' }}>
                  <input type="color" value={c.hex}
                    onChange={e => updateColor(i, 'hex', e.target.value)}
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
                className="w-full py-2 rounded-xl text-sm font-sans"
                style={{ border: '1px dashed #EDE0D4', color: '#8A8A9A' }}>
                + Agregar color
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm font-sans rounded-xl px-4 py-3"
               style={{ background: '#F5E8E6', border: '1px solid #E8C4C0', color: '#C9908A' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3">
              {submitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}