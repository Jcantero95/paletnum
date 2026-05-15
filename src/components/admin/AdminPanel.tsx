'use client'

import { useState, useTransition } from 'react'
import {
  adminAprobarLibro, adminRechazarLibro,
  adminAprobarMarca, adminRechazarMarca,
  adminAprobarModelo, adminRechazarModelo,
} from '@/lib/propuestas-actions'

type Tab = 'libros' | 'marcas' | 'modelos'

interface ModeloPropuesto {
  id: string
  nombre: string
  cantidad: number | null
  estado: string
}

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
  modelos_propuestos?: ModeloPropuesto[]
}

interface Props {
  propuestas: { libros: Propuesta[]; marcas: Propuesta[]; modelos: Propuesta[] }
}

export function AdminPanel({ propuestas }: Props) {
  const [tab,         setTab]          = useState<Tab>('libros')
  const [rechazando,  setRechazando]   = useState<string | null>(null)
  const [editando,    setEditando]     = useState<string | null>(null)
  const [motivo,      setMotivo]       = useState('')
  const [editData,    setEditData]     = useState<Partial<Propuesta>>({})
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
      nombre:        p.nombre,
      editorial:     p.editorial,
      paginas_total: p.paginas_total,
      cantidad:      p.cantidad,
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
      setRechazando(null); setMotivo('')
    })
  }

  function aprobarConEdicion(tipo: Tab, id: string) {
    startTransition(async () => {
      await adminEditarYAprobar(tipo, id, editData)
      setEditando(null); setEditData({})
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
    const estaEditando   = editando   === p.id
    const estaRechazando = rechazando === p.id

    return (
      <div className="bg-white rounded-xl p-4"
           style={{
             border: p.estado === 'pendiente' ? '1px solid rgba(92,92,110,0.15)' :
                     p.estado === 'aprobado'  ? '1px solid #b8d4b8' :
                     '1px solid #E8C4C0',
             background: p.estado === 'aprobado' ? '#f0faf0' :
                         p.estado === 'rechazado' ? '#FFF5F5' : 'white'
           }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-medium text-base" style={{ color: '#5C5C6E' }}>{p.nombre}</h3>
            {tipo === 'libros' && p.editorial && (
              <p className="text-xs font-sans" style={{ color: '#8A8A9A' }}>
                {p.editorial} · {p.paginas_total} páginas
              </p>
            )}
            {tipo === 'modelos' && p.marca_nombre && (
              <p className="text-xs font-sans" style={{ color: '#8A8A9A' }}>
                Marca: {p.marca_nombre}{p.cantidad ? ` · ${p.cantidad} colores` : ''}
              </p>
            )}
          </div>
          <span className="text-[10px] font-sans px-2 py-0.5 rounded-full flex-shrink-0"
                style={{
                  background: p.estado === 'pendiente' ? '#FEF3C7' :
                              p.estado === 'aprobado'  ? '#D4E8D4' : '#F5E8E6',
                  color:      p.estado === 'pendiente' ? '#92400E' :
                              p.estado === 'aprobado'  ? '#5a7f5a' : '#C9908A',
                }}>
            {p.estado === 'pendiente' ? 'Pendiente' : p.estado === 'aprobado' ? '✓ Aprobado' : '✗ Rechazado'}
          </span>
        </div>

        {/* Usuario y fecha */}
        <div className="flex items-center gap-2 text-xs font-sans mb-2" style={{ color: '#8A8A9A' }}>
          <span>👤 {p.usuario_nombre}</span>
          {p.usuario_social && <span>· {p.usuario_social}</span>}
          <span className="ml-auto">{fecha}</span>
        </div>

        {/* Modelos propuestos — solo para marcas */}
        {tipo === 'marcas' && p.modelos_propuestos && p.modelos_propuestos.length > 0 && (
          <div className="mb-3 rounded-lg px-3 py-2"
               style={{ background: '#F4EDE4', border: '1px solid rgba(92,92,110,0.1)' }}>
            <p className="text-[10px] uppercase tracking-wider font-sans mb-1.5"
               style={{ color: '#8A8A9A' }}>
              Modelos propuestos
            </p>
            <div className="space-y-1">
              {p.modelos_propuestos.map(m => (
                <div key={m.id} className="flex items-center justify-between">
                  <span className="text-xs font-sans" style={{ color: '#5C5C6E' }}>
                    {m.nombre}
                  </span>
                  {m.cantidad && (
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded-full"
                          style={{ background: '#F5E8E6', color: '#C9908A', border: '1px solid #E8C4C0' }}>
                      {m.cantidad} colores
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] font-sans mt-1.5" style={{ color: '#B59E7D' }}>
              ✓ Se aprobarán automáticamente junto con la marca
            </p>
          </div>
        )}

        {/* Notas */}
        {p.notas && (
          <p className="text-xs font-sans rounded-lg px-3 py-2 mb-3"
             style={{ background: '#F4EDE4', color: '#8A8A9A' }}>
            💬 {p.notas}
          </p>
        )}

        {/* Motivo rechazo */}
        {p.motivo_rechazo && (
          <p className="text-xs font-sans rounded-lg px-3 py-2 mb-3"
             style={{ background: '#F5E8E6', color: '#C9908A' }}>
            Motivo: {p.motivo_rechazo}
          </p>
        )}

        {/* Modo edición */}
        {p.estado === 'pendiente' && estaEditando && (
          <div className="rounded-lg p-3 mb-3 space-y-2"
               style={{ border: '1px solid #E8C4C0', background: '#FFF5F5' }}>
            <p className="text-xs font-medium" style={{ color: '#8A8A9A' }}>✏️ Editando antes de aprobar</p>
            <div>
              <label className="text-xs font-sans block mb-1" style={{ color: '#8A8A9A' }}>Nombre</label>
              <input className="input text-sm" value={editData.nombre ?? ''}
                onChange={e => setEditData(d => ({ ...d, nombre: e.target.value }))} />
            </div>
            {tipo === 'libros' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-sans block mb-1" style={{ color: '#8A8A9A' }}>Editorial</label>
                  <input className="input text-sm" value={editData.editorial ?? ''}
                    onChange={e => setEditData(d => ({ ...d, editorial: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-sans block mb-1" style={{ color: '#8A8A9A' }}>Páginas</label>
                  <input className="input text-sm" type="number" min={1} value={editData.paginas_total ?? ''}
                    onChange={e => setEditData(d => ({ ...d, paginas_total: parseInt(e.target.value) }))} />
                </div>
              </div>
            )}
            {tipo === 'modelos' && (
              <div>
                <label className="text-xs font-sans block mb-1" style={{ color: '#8A8A9A' }}>Cantidad de colores</label>
                <input className="input text-sm" type="number" min={1} value={editData.cantidad ?? ''}
                  onChange={e => setEditData(d => ({ ...d, cantidad: parseInt(e.target.value) }))} />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setEditando(null); setEditData({}) }}
                className="btn-secondary flex-1 text-xs">
                Cancelar
              </button>
              <button onClick={() => aprobarConEdicion(tipo, p.id)} disabled={isPending}
                className="btn-primary flex-1 text-xs">
                ✓ Guardar y aprobar
              </button>
            </div>
          </div>
        )}

        {/* Modo rechazo */}
        {p.estado === 'pendiente' && estaRechazando && (
          <div className="space-y-2">
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm font-sans resize-none"
              style={{ borderColor: 'rgba(92,92,110,0.15)' }}
              rows={2}
              placeholder="Motivo del rechazo (opcional)..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => { setRechazando(null); setMotivo('') }}
                className="btn-secondary flex-1 text-xs">
                Cancelar
              </button>
              <button onClick={() => rechazar(tipo, p.id)} disabled={isPending}
                className="flex-1 text-xs py-2 rounded-lg font-sans font-medium"
                style={{ background: '#C9908A', color: 'white' }}>
                Confirmar rechazo
              </button>
            </div>
          </div>
        )}

        {/* Acciones principales */}
        {p.estado === 'pendiente' && !estaEditando && !estaRechazando && (
          <div className="flex gap-2">
            <button onClick={() => setRechazando(p.id)}
              className="flex-1 text-xs py-2 rounded-lg font-sans hover:opacity-90 transition-opacity"
              style={{ border: '1px solid #E8C4C0', color: '#C9908A' }}>
              ✗ Rechazar
            </button>
            <button onClick={() => iniciarEdicion(p)}
              className="flex-1 text-xs py-2 rounded-lg font-sans hover:opacity-90 transition-opacity"
              style={{ border: '1px solid #D9CBBA', color: '#B59E7D' }}>
              ✏️ Editar
            </button>
            <button onClick={() => aprobar(tipo, p.id)} disabled={isPending}
              className="flex-1 text-xs py-2 rounded-lg font-sans font-medium hover:opacity-90"
              style={{ background: '#8FAF8F', color: 'white' }}>
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
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
             style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-medium" style={{ color: '#92400E' }}>
              {totalPendiente} propuesta{totalPendiente > 1 ? 's' : ''} pendiente{totalPendiente > 1 ? 's' : ''}
            </p>
            <p className="text-xs font-sans" style={{ color: '#B45309' }}>
              Revisalas para mantener el catálogo limpio
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex mb-5" style={{ borderBottom: '1px solid rgba(92,92,110,0.15)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-sans border-b-2 -mb-px transition-colors flex items-center gap-2"
            style={{
              color:       tab === t.key ? '#C9908A' : '#8A8A9A',
              borderColor: tab === t.key ? '#C9908A' : 'transparent',
              fontWeight:  tab === t.key ? '500' : '400',
            }}>
            {t.label}
            {pendientes[t.key].length > 0 && (
              <span className="text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#C9908A' }}>
                {pendientes[t.key].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pendientes */}
      {pendientes[tab].length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest font-sans mb-3" style={{ color: '#8A8A9A' }}>
            Pendientes
          </h3>
          <div className="space-y-3">
            {pendientes[tab].map(p => <PropuestaCard key={p.id} p={p} tipo={tab} />)}
          </div>
        </div>
      )}

      {pendientes[tab].length === 0 && (
        <div className="text-center py-8" style={{ color: '#8A8A9A' }}>
          <div className="text-3xl mb-2 opacity-30">✅</div>
          <p className="text-sm font-sans">No hay {tab} pendientes de revisión</p>
        </div>
      )}

      {/* Historial */}
      {historial[tab].length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-widest font-sans mb-3" style={{ color: '#8A8A9A' }}>
            Historial
          </h3>
          <div className="space-y-3">
            {historial[tab].map(p => <PropuestaCard key={p.id} p={p} tipo={tab} />)}
          </div>
        </div>
      )}
    </div>
  )
}