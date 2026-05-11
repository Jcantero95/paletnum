'use client'

import { useState, useTransition } from 'react'
import {
  adminAprobarLibro, adminRechazarLibro,
  adminAprobarMarca, adminRechazarMarca,
  adminAprobarModelo, adminRechazarModelo,
} from '@/lib/propuestas-actions'

type Tab = 'libros' | 'marcas' | 'modelos'

interface Propuesta {
  id: string
  nombre: string
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  usuario_nombre: string
  usuario_social: string
  created_at: string
  notas?: string
  motivo_rechazo?: string
  editorial?: string
  paginas_total?: number
  cantidad?: number
  marca_nombre?: string
}

interface Props {
  propuestas: { libros: Propuesta[]; marcas: Propuesta[]; modelos: Propuesta[] }
}

export function AdminPanel({ propuestas }: Props) {
  const [tab,         setTab]         = useState<Tab>('libros')
  const [rechazando,  setRechazando]  = useState<string | null>(null)
  const [editando,    setEditando]    = useState<string | null>(null)
  const [motivo,      setMotivo]      = useState('')
  const [editData,    setEditData]    = useState<Partial<Propuesta>>({})
  const [isPending,   startTransition] = useTransition()

  const pendientes = {
    libros:  propuestas.libros?.filter(p => p.estado === 'pendiente')  ?? [],
    marcas:  propuestas.marcas?.filter(p => p.estado === 'pendiente')  ?? [],
    modelos: propuestas.modelos?.filter(p => p.estado === 'pendiente') ?? [],
  }
  const historial = {
    libros:  propuestas.libros?.filter(p => p.estado !== 'pendiente')  ?? [],
    marcas:  propuestas.marcas?.filter(p => p.estado !== 'pendiente')  ?? [],
    modelos: propuestas.modelos?.filter(p => p.estado !== 'pendiente') ?? [],
  }

  const totalPendiente = pendientes.libros.length + pendientes.marcas.length + pendientes.modelos.length

  function iniciarEdicion(p: Propuesta) {
    setEditando(p.id)
    setEditData({
      nombre:       p.nombre,
      editorial:    p.editorial,
      paginas_total: p.paginas_total,
      cantidad:     p.cantidad,
    })
    setRechazando(null)
  }

  function aprobar(tipo: Tab, id: string) {
    startTransition(async () => {
      if (tipo === 'libros')  await adminAprobarLibro(id)
      if (tipo === 'marcas')  await adminAprobarMarca(id)
      if (tipo === 'modelos') await adminAprobarModelo(id)
    })
  }

  function rechazar(tipo: Tab, id: string) {
    startTransition(async () => {
      if (tipo === 'libros')  await adminRechazarLibro(id, motivo)
      if (tipo === 'marcas')  await adminRechazarMarca(id, motivo)
      if (tipo === 'modelos') await adminRechazarModelo(id, motivo)
      setRechazando(null)
      setMotivo('')
    })
  }

  function aprobarConEdicion(tipo: Tab, id: string) {
    // Actualizamos los datos en la propuesta antes de aprobar
    startTransition(async () => {
      await adminEditarYAprobar(tipo, id, editData)
      setEditando(null)
      setEditData({})
    })
  }

  async function adminEditarYAprobar(tipo: Tab, id: string, data: Partial<Propuesta>) {
    const res = await fetch('/api/admin/editar-propuesta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, id, data }),
    })
    if (!res.ok) throw new Error('Error al editar')
  }

  function PropuestaCard({ p, tipo }: { p: Propuesta; tipo: Tab }) {
    const fecha = new Date(p.created_at).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
    const estaEditando  = editando  === p.id
    const estaRechazando = rechazando === p.id

    return (
      <div className={`bg-white border rounded-xl p-4 ${
        p.estado === 'pendiente' ? 'border-paper3' :
        p.estado === 'aprobado'  ? 'border-accent3/40 bg-green-50/30' :
        'border-red-200 bg-red-50/30'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-medium text-base">{p.nombre}</h3>
            {tipo === 'libros' && p.editorial && (
              <p className="text-xs text-ink2">{p.editorial} · {p.paginas_total} páginas</p>
            )}
            {tipo === 'modelos' && p.marca_nombre && (
              <p className="text-xs text-ink2">Marca: {p.marca_nombre}{p.cantidad ? ` · ${p.cantidad} colores` : ''}</p>
            )}
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
            p.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
            p.estado === 'aprobado'  ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            {p.estado === 'pendiente' ? 'Pendiente' : p.estado === 'aprobado' ? '✓ Aprobado' : '✗ Rechazado'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink2 mb-2">
          <span>👤 {p.usuario_nombre}</span>
          {p.usuario_social && <span>· {p.usuario_social}</span>}
          <span className="ml-auto">{fecha}</span>
        </div>

        {p.notas && (
          <p className="text-xs text-ink2 bg-paper2 rounded-lg px-3 py-2 mb-3">
            💬 {p.notas}
          </p>
        )}

        {p.motivo_rechazo && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
            Motivo: {p.motivo_rechazo}
          </p>
        )}

        {/* MODO EDICIÓN */}
        {p.estado === 'pendiente' && estaEditando && (
          <div className="border border-accent2/40 bg-amber-50/30 rounded-lg p-3 mb-3 space-y-2">
            <p className="text-xs font-medium text-ink2 mb-2">✏️ Editando antes de aprobar</p>
            <div>
              <label className="text-xs text-ink2 block mb-1">Nombre</label>
              <input
                className="input text-sm"
                value={editData.nombre ?? ''}
                onChange={e => setEditData(d => ({ ...d, nombre: e.target.value }))}
              />
            </div>
            {tipo === 'libros' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-ink2 block mb-1">Editorial</label>
                  <input
                    className="input text-sm"
                    value={editData.editorial ?? ''}
                    onChange={e => setEditData(d => ({ ...d, editorial: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-ink2 block mb-1">Páginas</label>
                  <input
                    className="input text-sm"
                    type="number"
                    min={1}
                    value={editData.paginas_total ?? ''}
                    onChange={e => setEditData(d => ({ ...d, paginas_total: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            )}
            {tipo === 'modelos' && (
              <div>
                <label className="text-xs text-ink2 block mb-1">Cantidad de colores</label>
                <input
                  className="input text-sm"
                  type="number"
                  min={1}
                  value={editData.cantidad ?? ''}
                  onChange={e => setEditData(d => ({ ...d, cantidad: parseInt(e.target.value) }))}
                />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setEditando(null); setEditData({}) }}
                className="btn-secondary flex-1 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => aprobarConEdicion(tipo, p.id)}
                disabled={isPending}
                className="flex-1 text-xs bg-accent3 text-white px-3 py-2 rounded-lg font-medium hover:opacity-90"
              >
                ✓ Guardar y aprobar
              </button>
            </div>
          </div>
        )}

        {/* MODO RECHAZO */}
        {p.estado === 'pendiente' && estaRechazando && (
          <div className="space-y-2">
            <textarea
              className="w-full border border-paper3 rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
              placeholder="Motivo del rechazo (opcional)..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setRechazando(null); setMotivo('') }}
                className="btn-secondary flex-1 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => rechazar(tipo, p.id)}
                disabled={isPending}
                className="flex-1 text-xs bg-red-500 text-white px-3 py-2 rounded-lg font-medium hover:opacity-90"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        )}

        {/* ACCIONES PRINCIPALES */}
        {p.estado === 'pendiente' && !estaEditando && !estaRechazando && (
          <div className="flex gap-2">
            <button
              onClick={() => setRechazando(p.id)}
              className="flex-1 text-xs border border-red-200 text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              ✗ Rechazar
            </button>
            <button
              onClick={() => iniciarEdicion(p)}
              className="flex-1 text-xs border border-accent2/50 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => aprobar(tipo, p.id)}
              disabled={isPending}
              className="flex-1 text-xs bg-accent3 text-white px-3 py-2 rounded-lg font-medium hover:opacity-90"
            >
              ✓ Aprobar
            </button>
          </div>
        )}
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'libros',  label: 'Libros'  },
    { key: 'marcas',  label: 'Marcas'  },
    { key: 'modelos', label: 'Modelos' },
  ]

  return (
    <div>
      {totalPendiente > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-medium text-amber-800">
              {totalPendiente} propuesta{totalPendiente > 1 ? 's' : ''} pendiente{totalPendiente > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-700">Revisalas para mantener el catálogo limpio</p>
          </div>
        </div>
      )}

      <div className="flex border-b border-paper3 mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors flex items-center gap-2
              ${tab === t.key ? 'text-accent border-accent font-medium' : 'text-ink2 border-transparent'}`}
          >
            {t.label}
            {pendientes[t.key].length > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {pendientes[t.key].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {pendientes[tab].length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-ink2 mb-3">Pendientes</h3>
          <div className="space-y-3">
            {pendientes[tab].map(p => <PropuestaCard key={p.id} p={p} tipo={tab} />)}
          </div>
        </div>
      )}

      {pendientes[tab].length === 0 && (
        <div className="text-center py-8 text-ink2">
          <div className="text-3xl mb-2 opacity-30">✅</div>
          <p className="text-sm">No hay {tab} pendientes de revisión</p>
        </div>
      )}

      {historial[tab].length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-ink2 mb-3">Historial</h3>
          <div className="space-y-3">
            {historial[tab].map(p => <PropuestaCard key={p.id} p={p} tipo={tab} />)}
          </div>
        </div>
      )}
    </div>
  )
}