'use client'

import { useState } from 'react'
import { SubmissionCard, ColorPanel } from './SubmissionCard'
import type { Submission } from '@/types'

interface GalleryProps {
  submissions: Submission[]
  likedIds: string[]
}

export function Gallery({ submissions, likedIds }: GalleryProps) {
  const [selected, setSelected] = useState<Submission | null>(null)

  function handleSelect(s: Submission) {
    setSelected(prev => prev?.id === s.id ? null : s)
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-16 text-ink2">
        <div className="text-5xl mb-4 opacity-30">🖼️</div>
        <h3 className="font-display text-xl font-normal text-ink mb-2">
          Sin resultados para esta combinación aún
        </h3>
        <p className="mb-5">Sé el primero en subir tu versión terminada.</p>
        <a href="/contribuir" className="btn-primary inline-block">Subir mi resultado →</a>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-xl font-normal">
          {submissions.length} resultado{submissions.length > 1 ? 's' : ''} de la comunidad
        </h2>
        <p className="text-sm text-ink2">Elegí el que más te gusta para ver la lista de colores</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {submissions.map(s => (
          <SubmissionCard
            key={s.id}
            submission={s}
            likedByMe={likedIds.includes(s.id)}
            onSelect={handleSelect}
            isSelected={selected?.id === s.id}
          />
        ))}
      </div>

      {selected && (
        <ColorPanel
          submission={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
