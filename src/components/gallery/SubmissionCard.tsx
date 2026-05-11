'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toggleLike } from '@/lib/actions'
import type { Submission, SubmissionModelo } from '@/types'

// ---- Helper: chips de marcas ----
function MarcasChips({ modelos }: { modelos: SubmissionModelo[] }) {
  if (!modelos || modelos.length === 0) return null

  const sorted  = [...modelos].sort((a, b) => a.orden - b.orden)
  const visibles = sorted.slice(0, 2)
  const extras   = sorted.length - 2

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {visibles.map(sm => (
        <span
          key={sm.id}
          className="text-[10px] font-sans px-2 py-0.5 rounded-full"
          style={{ background: '#F5E8E6', color: '#C9908A', border: '1px solid #E8C4C0' }}
        >
          {sm.modelo?.marca?.nombre} {sm.modelo?.nombre}
        </span>
      ))}
      {extras > 0 && (
        <span
          className="text-[10px] font-sans px-2 py-0.5 rounded-full"
          style={{ background: '#F0EAE0', color: '#B59E7D', border: '1px solid #D9CBBA' }}
        >
          +{extras}
        </span>
      )}
    </div>
  )
}

// ---- Submission Card ----
interface SubmissionCardProps {
  submission: Submission
  likedByMe: boolean
  onSelect: (s: Submission) => void
  isSelected: boolean
}

export function SubmissionCard({ submission, likedByMe, onSelect, isSelected }: SubmissionCardProps) {
  const [liked,   setLiked]   = useState(likedByMe)
  const [likes,   setLikes]   = useState(submission.likes)
  const [loading, setLoading] = useState(false)

  const palette = submission.submission_colores ?? []
  const modelos = submission.modelos ?? []

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const res = await toggleLike(submission.id)
      setLiked(res.liked)
      setLikes(res.likes)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div
      onClick={() => onSelect(submission)}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98] shadow-cozy hover:shadow-cozy-md"
      style={{ border: isSelected ? '2px solid #C9908A' : '1px solid rgba(92,92,110,0.15)' }}
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: '#F4EDE4' }}>
        {submission.foto_url ? (
          <Image
            src={submission.foto_url}
            alt={`Resultado de ${submission.usuario?.nombre}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">
            🎨
          </div>
        )}
        {likes >= 30 && (
          <span className="absolute top-2 right-2 text-[10px] font-sans px-2 py-0.5 rounded-full"
                style={{ background: '#F5E8E6', color: '#C9908A', border: '1px solid #E8C4C0' }}>
            ♡ Más gustado
          </span>
        )}
        {isSelected && (
          <span className="absolute top-2 left-2 text-[10px] font-sans px-2 py-0.5 rounded-full"
                style={{ background: '#C9908A', color: 'white' }}>
            ✓ Seleccionado
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col gap-2">

        {/* Usuario */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center
                          text-white text-sm font-display flex-shrink-0"
               style={{ background: '#C9908A' }}>
            {submission.usuario?.nombre?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-medium text-sm leading-tight truncate"
               style={{ color: '#5C5C6E' }}>
              {submission.usuario?.nombre}
            </p>
            <p className="text-[11px] truncate font-sans" style={{ color: '#8A8A9A' }}>
              {submission.usuario?.social}
            </p>
          </div>
        </div>

        {/* Marcas — pills con máx 2 visibles */}
        <MarcasChips modelos={modelos} />

        {/* Descripción */}
        {submission.descripcion && (
          <p className="text-xs leading-relaxed line-clamp-2 font-sans italic"
             style={{ color: '#8A8A9A' }}>
            "{submission.descripcion}"
          </p>
        )}

        {/* Paleta de colores */}
        <div className="flex items-center gap-1 flex-wrap">
          {palette.slice(0, 8).map(c => (
            <div
              key={c.id}
              title={c.nombre_color}
              style={{ background: c.hex ?? '#ccc' }}
              className="w-5 h-5 rounded-md flex-shrink-0"
              style={{ background: c.hex ?? '#ccc', border: '1px solid rgba(0,0,0,0.05)' }}
            />
          ))}
          {palette.length > 8 && (
            <span className="text-[11px] ml-0.5 font-sans" style={{ color: '#8A8A9A' }}>
              +{palette.length - 8}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1.5"
             style={{ borderTop: '1px solid #EDE0D4' }}>
          <button
            onClick={handleLike}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-sans transition-all"
            style={liked
              ? { background: '#F5E8E6', color: '#C9908A', border: '1px solid #E8C4C0' }
              : { background: '#F4EDE4', color: '#8A8A9A', border: '1px solid rgba(92,92,110,0.15)' }
            }
          >
            ♡ {likes}
          </button>
          <span className="font-script text-sm" style={{ color: '#C9908A' }}>
            Ver colores →
          </span>
        </div>
      </div>
    </div>
  )
}

// ---- Color Panel ----
interface ColorPanelProps {
  submission: Submission
  onClose: () => void
}

export function ColorPanel({ submission, onClose }: ColorPanelProps) {
  const [copied, setCopied] = useState(false)
  const palette  = submission.submission_colores ?? []
  const modelos  = submission.modelos ?? []

  async function copyList() {
    const marcasStr = modelos
      .map(sm => `${sm.modelo?.marca?.nombre} ${sm.modelo?.nombre}`)
      .join(' + ')

    const text = [
      `PaletNum — Lista de colores de ${submission.usuario?.nombre}`,
      `${submission.libro?.nombre} · Página ${submission.pagina}`,
      `Marca${modelos.length > 1 ? 's' : ''}: ${marcasStr}`,
      '',
      ...palette.map(c => {
        const marcaNombre = c.modelo_id
          ? modelos.find(sm => sm.modelo_id === c.modelo_id)?.modelo?.marca?.nombre ?? ''
          : ''
        return `N°${String(c.numero_libro).padStart(2, '0')} ${c.nombre_color} → ${c.codigo_marcador}${marcaNombre ? ` (${marcaNombre})` : ''}`
      }),
    ].join('\n')

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl p-5 mt-4 shadow-cozy"
         style={{ border: '1px solid rgba(92,92,110,0.15)' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-3"
           style={{ borderBottom: '1px solid #EDE0D4' }}>
        <div>
          <h3 className="font-display text-lg" style={{ color: '#5C5C6E' }}>
            Lista de <span style={{ color: '#C9908A', fontStyle: 'italic' }}>
              {submission.usuario?.nombre}
            </span>
          </h3>
          <div className="mt-1.5">
            <MarcasChips modelos={modelos} />
          </div>
          <p className="text-xs font-sans mt-1" style={{ color: '#8A8A9A' }}>
            {palette.length} colores
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-sans px-3 py-1.5 rounded-xl transition-colors ml-3"
          style={{ background: '#F4EDE4', color: '#8A8A9A', border: '1px solid rgba(92,92,110,0.15)' }}
        >
          Cerrar
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm min-w-[300px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider font-sans"
                style={{ color: '#8A8A9A', borderBottom: '1px solid #EDE0D4' }}>
              <th className="text-left pb-2 font-normal pl-1">Color</th>
              <th className="text-center pb-2 font-normal w-12">N°</th>
              <th className="text-left pb-2 font-normal">Código</th>
              {modelos.length > 1 && (
                <th className="text-left pb-2 font-normal">Marca</th>
              )}
            </tr>
          </thead>
          <tbody>
            {palette.map(c => {
              const marcaColor = c.modelo_id
                ? modelos.find(sm => sm.modelo_id === c.modelo_id)?.modelo?.marca?.nombre
                : null

              return (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(237,224,212,0.6)' }}
                    className="hover:bg-crema2">
                  <td className="py-2 pr-2 pl-1">
                    <div className="flex items-center gap-2">
                      <div style={{ background: c.hex ?? '#ccc', border: '1px solid rgba(0,0,0,0.06)' }}
                           className="w-6 h-6 rounded-md flex-shrink-0" />
                      <span className="font-sans text-xs" style={{ color: '#5C5C6E' }}>
                        {c.nombre_color}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 text-center text-xs font-sans" style={{ color: '#8A8A9A' }}>
                    {String(c.numero_libro).padStart(2, '0')}
                  </td>
                  <td className="py-2">
                    <span className="text-xs font-sans px-2 py-0.5 rounded-md"
                          style={{ background: '#F5E8E6', color: '#C9908A', border: '1px solid #E8C4C0' }}>
                      {c.codigo_marcador}
                    </span>
                  </td>
                  {modelos.length > 1 && (
                    <td className="py-2">
                      {marcaColor && (
                        <span className="text-[10px] font-sans px-2 py-0.5 rounded-full"
                              style={{ background: '#F0EAE0', color: '#B59E7D', border: '1px solid #D9CBBA' }}>
                          {marcaColor}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Botón copiar */}
      <button
        onClick={copyList}
        className="w-full mt-4 py-3 rounded-xl text-sm font-sans font-medium transition-all"
        style={copied
          ? { background: '#8FAF8F', color: 'white' }
          : { background: '#5C5C6E', color: '#FAF6F1' }
        }
      >
        {copied ? '✓ Lista copiada' : '📋 Copiar lista completa'}
      </button>
    </div>
  )
}