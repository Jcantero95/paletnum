'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PropuestaForm } from '@/components/contribute/PropuestaForm'
import type { Libro, Marca, Modelo } from '@/types'

interface SearchFiltersProps {
  libros: Libro[]
  marcas: Marca[]
  modelosByMarca: Record<string, Modelo[]>
}

export function SearchFilters({ libros, marcas, modelosByMarca }: SearchFiltersProps) {
  const router = useRouter()

  const [libroId,   setLibroId]   = useState('')
  const [pagina,    setPagina]    = useState('')
  const [marcaId,   setMarcaId]   = useState('')
  const [modeloId,  setModeloId]  = useState('')
  const [modalTipo, setModalTipo] = useState<'libro' | 'marca' | null>(null)

  const libroSeleccionado  = libros.find(l => l.id === libroId)
  const modelosDisponibles = marcaId ? (modelosByMarca[marcaId] ?? []) : []

  function handleLibro(id: string) {
    setLibroId(id); setPagina(''); setMarcaId(''); setModeloId('')
  }
  function handleMarca(id: string) {
    setMarcaId(id); setModeloId('')
  }
  function handleBuscar() {
    if (!libroId) return
    const params = new URLSearchParams({ libro_id: libroId })
    if (pagina)   params.set('pagina', pagina)
    if (marcaId)  params.set('marca_id', marcaId)
    if (modeloId) params.set('modelo_id', modeloId)
    router.push(`/buscar?${params.toString()}`)
  }

  const stepCls = (val: string) =>
    `inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-sans mr-1.5 flex-shrink-0 transition-colors
    ${val ? 'bg-sage' : 'bg-pizarra2'}`

  return (
    <>
      <div className="bg-white border border-borde rounded-2xl p-5 mb-5 shadow-cozy">

        {/* Libro */}
        <p className="font-script text-rosa text-base mb-3 flex items-center gap-2">
          Libro que vas a pintar
          <span className="flex-1 h-px bg-borde block" />
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div>
            <label className="label flex items-center">
              <span className={stepCls(libroId)}>1</span>Libro / Serie
            </label>
            <select className="input" value={libroId} onChange={e => handleLibro(e.target.value)}>
              <option value="">Seleccioná tu libro...</option>
              {libros.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setModalTipo('libro')}
              className="text-xs text-rosa mt-1.5 hover:underline text-left block font-sans"
            >
              + ¿No está tu libro? Proponelo
            </button>
          </div>
          <div>
            <label className="label flex items-center">
              <span className={stepCls(pagina)}>2</span>Página
            </label>
            <select className="input" value={pagina} onChange={e => setPagina(e.target.value)} disabled={!libroId}>
              <option value="">Todas las páginas</option>
              {libroSeleccionado &&
                Array.from({ length: libroSeleccionado.paginas_total }, (_, i) => i + 1).map(p => (
                  <option key={p} value={p}>Página {p}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Marcadores */}
        <p className="font-script text-rosa text-base mb-3 flex items-center gap-2">
          Tus marcadores
          <span className="flex-1 h-px bg-borde block" />
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label flex items-center">
              <span className={stepCls(marcaId)}>3</span>Marca
            </label>
            <select className="input" value={marcaId} onChange={e => handleMarca(e.target.value)} disabled={!libroId}>
              <option value="">Todas las marcas</option>
              {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setModalTipo('marca')}
              className="text-xs text-rosa mt-1.5 hover:underline text-left block font-sans"
            >
              + ¿No está tu marca? Proponela
            </button>
          </div>
          <div>
            <label className="label flex items-center">
              <span className={stepCls(modeloId)}>4</span>Modelo
            </label>
            <select className="input" value={modeloId} onChange={e => setModeloId(e.target.value)} disabled={!marcaId}>
              <option value="">Todos los modelos</option>
              {modelosDisponibles.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="btn-primary w-full py-3 text-base"
          onClick={handleBuscar}
          disabled={!libroId}
        >
          Ver resultados →
        </button>
      </div>

      {/* Modal */}
      {modalTipo && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
             style={{ background: 'rgba(92,92,110,0.4)' }}>
          <div className="bg-crema rounded-2xl p-5 w-full max-w-md shadow-cozy-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-borde">
              <h2 className="font-display text-lg">
                Proponer {modalTipo === 'libro' ? 'nuevo libro' : 'nueva marca'}
              </h2>
              <button
                onClick={() => setModalTipo(null)}
                className="text-pizarra2 hover:text-pizarra text-xl leading-none"
              >
                ×
              </button>
            </div>
            <PropuestaForm tipo={modalTipo} onClose={() => setModalTipo(null)} />
          </div>
        </div>
      )}
    </>
  )
}