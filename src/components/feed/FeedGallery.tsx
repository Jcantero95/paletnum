'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SubmissionCard, ColorPanel } from '@/components/gallery/SubmissionCard'
import { EditSubmissionModal } from './EditSubmissionModal'
import { deleteSubmission } from '@/lib/actions'
import type { Submission, Marca, Modelo } from '@/types'

interface Props {
  submissions: Submission[]
  likedIds: string[]
  page: number
  hayMas: boolean
  tab: string
  estaLogueado: boolean
}

export function FeedGallery({ submissions, likedIds, page, hayMas, tab, estaLogueado }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [selected,       setSelected]       = useState<Submission | null>(null)
  const [editando,       setEditando]       = useState<Submission | null>(null)
  const [confirmDelete,  setConfirmDelete]  = useState<Submission | null>(null)
  const [userId,         setUserId]         = useState<string | null>(null)
  const [deletingId,     setDeletingId]     = useState<string | null>(null)
  const [marcas,         setMarcas]         = useState<Marca[]>([])
  const [modelosByMarca, setModelosByMarca] = useState<Record<string, Modelo[]>>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    supabase.from('marcas').select('*').order('nombre').then(({ data }) => setMarcas(data ?? []))
  }, [])

  useEffect(() => {
    if (marcas.length === 0) return
    Promise.all(
      marcas.map(m =>
        supabase.from('modelos').select('*, marca:marcas(*)').eq('marca_id', m.id)
          .then(({ data }) => ({ [m.id]: data ?? [] }))
      )
    ).then(results => setModelosByMarca(Object.assign({}, ...results)))
  }, [marcas])

  function handleSelect(s: Submission) {
    setSelected(prev => prev?.id === s.id ? null : s)
  }

  function handleTabChange(newTab: string) {
    if (newTab === 'misposts' && !estaLogueado) {
      router.push('/auth/login?next=/inicio?tab=misposts')
      return
    }
    router.push(`/inicio?tab=${newTab}&page=1`)
  }

  async function handleDelete(s: Submission) {
    setDeletingId(s.id)
    try {
      await deleteSubmission(s.id)
      setConfirmDelete(null)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex mb-6" style={{ borderBottom: '1px solid rgba(92,92,110,0.15)' }}>
        <button
          onClick={() => handleTabChange('comunidad')}
          className="px-5 py-3 text-sm font-sans border-b-2 -mb-px transition-colors"
          style={{
            color:       tab === 'comunidad' ? '#C9908A' : '#8A8A9A',
            borderColor: tab === 'comunidad' ? '#C9908A' : 'transparent',
            fontWeight:  tab === 'comunidad' ? '500' : '400',
          }}
        >
          🌸 Comunidad
        </button>
        <button
          onClick={() => handleTabChange('misposts')}
          className="px-5 py-3 text-sm font-sans border-b-2 -mb-px transition-colors"
          style={{
            color:       tab === 'misposts' ? '#C9908A' : '#8A8A9A',
            borderColor: tab === 'misposts' ? '#C9908A' : 'transparent',
            fontWeight:  tab === 'misposts' ? '500' : '400',
          }}
        >
          🖼️ Mis posts
        </button>
      </div>

      {/* Empty states */}
      {submissions.length === 0 && tab === 'comunidad' && (
        <div className="text-center py-20" style={{ color: '#8A8A9A' }}>
          <div className="text-5xl mb-4 opacity-30">🎨</div>
          <p className="font-sans">Todavía no hay resultados publicados.</p>
          <a href="/contribuir" className="btn-primary inline-block mt-4">
            Sé el primero en publicar →
          </a>
        </div>
      )}

      {submissions.length === 0 && tab === 'misposts' && (
        <div className="text-center py-20" style={{ color: '#8A8A9A' }}>
          <div className="text-5xl mb-4 opacity-30">🖼️</div>
          <p className="font-sans mb-2">Todavía no publicaste ningún resultado.</p>
          <a href="/contribuir" className="btn-primary inline-block mt-2">
            Publicar mi primer resultado →
          </a>
        </div>
      )}

      {/* Grid de cards */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {submissions.map(s => (
            <div key={s.id} className="relative">
              <SubmissionCard
                submission={s}
                likedByMe={likedIds.includes(s.id)}
                onSelect={handleSelect}
                isSelected={selected?.id === s.id}
              />

              {/* Menú tres puntos — solo para el creador */}
              {userId === s.usuario_id && (
                <div className="absolute top-2 left-2 z-10">
                  <div className="relative group">
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow"
                      style={{ background: 'rgba(0,0,0,0.5)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      ···
                    </button>
                    <div className="absolute left-0 top-9 hidden group-focus-within:block bg-white rounded-xl shadow-cozy-md overflow-hidden z-20"
                         style={{ border: '1px solid rgba(92,92,110,0.15)', minWidth: '130px' }}>
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm font-sans hover:bg-crema2 transition-colors"
                        style={{ color: '#5C5C6E' }}
                        onClick={e => { e.stopPropagation(); setEditando(s) }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm font-sans hover:bg-red-50 transition-colors"
                        style={{ color: '#C9908A' }}
                        onClick={e => { e.stopPropagation(); setConfirmDelete(s) }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Panel de colores */}
      {selected && (
        <ColorPanel submission={selected} onClose={() => setSelected(null)} />
      )}

      {/* Paginación */}
      {submissions.length > 0 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          {page > 1 && (
            <button
              onClick={() => router.push(`/inicio?tab=${tab}&page=${page - 1}`)}
              className="btn-secondary px-5 py-2.5"
            >
              ← Anteriores
            </button>
          )}
          <span className="text-sm font-sans" style={{ color: '#8A8A9A' }}>
            Página {page}
          </span>
          {hayMas && (
            <button
              onClick={() => router.push(`/inicio?tab=${tab}&page=${page + 1}`)}
              className="btn-primary px-5 py-2.5"
            >
              Ver más →
            </button>
          )}
        </div>
      )}

      {/* Modal de edición */}
      {editando && (
        <EditSubmissionModal
          submission={editando}
          marcas={marcas}
          modelosByMarca={modelosByMarca}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); router.refresh() }}
        />
      )}

      {/* Modal confirmación eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
             style={{ background: 'rgba(92,92,110,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-cozy-md text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-display text-xl mb-2" style={{ color: '#5C5C6E' }}>
              ¿Eliminar publicación?
            </h3>
            <p className="font-sans text-sm mb-5" style={{ color: '#8A8A9A' }}>
              Esta acción no se puede deshacer. Se eliminarán también las fotos y la lista de colores.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary flex-1 py-3"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deletingId}
                className="flex-1 py-3 rounded-xl text-sm font-sans font-medium"
                style={{ background: '#C9908A', color: 'white' }}
              >
                {deletingId ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}