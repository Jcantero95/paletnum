import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getLibros, getMarcas, getModelosByMarca, getSubmissions } from '@/lib/queries'
import { Navbar } from '@/components/ui/Navbar'
import { SearchFilters } from '@/components/search/SearchFilters'
import { Gallery } from '@/components/gallery/Gallery'
import type { FiltrosBusqueda, Libro, Marca, Modelo } from '@/types'

const ADMIN_EMAIL = 'jcantero95@gmail.com'

interface BuscarPageProps {
  searchParams: Promise<{
    libro_id?: string
    pagina?: string
    marca_id?: string
    modelo_id?: string
  }>
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let usuario = null
  if (user) {
    const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
    usuario = data
  }

  const [libros, marcas]: [Libro[], Marca[]] = await Promise.all([getLibros(), getMarcas()])

  const modelosByMarca: Record<string, Modelo[]> = {}
  await Promise.all(marcas.map(async m => {
    modelosByMarca[m.id] = await getModelosByMarca(m.id)
  }))

  const [{ count: totalSubs }, { count: totalUsers }] = await Promise.all([
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
    supabase.from('usuarios').select('id', { count: 'exact', head: true }),
  ])
  const { data: likesSum } = await supabase.from('submissions').select('likes')
  const totalLikes = likesSum?.reduce((acc, s) => acc + (s.likes ?? 0), 0) ?? 0

  // Contar pendientes para admin
  let pendientesCount = 0
  if (user?.email === ADMIN_EMAIL) {
    const [{ count: lp }, { count: mp }, { count: mop }] = await Promise.all([
      supabase.from('libros_propuestos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('marcas_propuestas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('modelos_propuestos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    ])
    pendientesCount = (lp ?? 0) + (mp ?? 0) + (mop ?? 0)
  }

  let submissions: any[] = []
  let likedIds: string[] = []

  if (params.libro_id) {
    const filtros: FiltrosBusqueda = {
      libro_id:  params.libro_id,
      pagina:    params.pagina ? parseInt(params.pagina) : null,
      marca_id:  params.marca_id ?? null,
      modelo_id: params.modelo_id ?? null,
    }
    submissions = await getSubmissions(filtros)

    if (user && submissions.length > 0) {
      const ids = submissions.map((s: { id: string }) => s.id)
      const { data: likes } = await supabase
        .from('likes').select('submission_id')
        .eq('usuario_id', user.id).in('submission_id', ids)
      likedIds = likes?.map((l: { submission_id: string }) => l.submission_id) ?? []
    }
  }

  const libroNombre = libros.find(l => l.id === params.libro_id)?.nombre
  const marcaNombre = marcas.find(m => m.id === params.marca_id)?.nombre
  const modeloNombre = params.modelo_id
    ? Object.values(modelosByMarca).flat().find(m => m.id === params.modelo_id)?.nombre
    : null

  return (
    <>
      <Navbar
        usuario={usuario}
        stats={{ submissions: totalSubs ?? 0, usuarios: totalUsers ?? 0, likes: totalLikes }}
        pendientes={pendientesCount}
        userEmail={user?.email ?? ''}
      />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-center py-4 mb-2 px-4">
          <h1 className="font-display text-2xl sm:text-3xl font-normal mb-2">¿Con qué querés pintar?</h1>
          <p className="text-ink2 text-sm max-w-md mx-auto">
            Filtrá por tu libro, página y marcadores. Elegí el resultado que más te gusta y obtené los códigos exactos.
          </p>
        </div>

        <SearchFilters libros={libros} marcas={marcas} modelosByMarca={modelosByMarca} />

        {params.libro_id && (
          <div className="flex gap-2 flex-wrap mb-5">
            {libroNombre && <span className="pill bg-ink text-paper">{libroNombre}</span>}
            {params.pagina && <span className="pill bg-ink2 text-paper">Página {params.pagina}</span>}
            {marcaNombre  && <span className="pill bg-accent text-white">{marcaNombre}</span>}
            {modeloNombre && <span className="pill bg-accent2 text-ink">{modeloNombre}</span>}
          </div>
        )}

        {params.libro_id ? (
          <Suspense fallback={<div className="text-ink2 text-sm">Cargando resultados...</div>}>
            <Gallery submissions={submissions} likedIds={likedIds} />
          </Suspense>
        ) : (
          <div className="text-center py-12 text-ink2">
            <div className="text-5xl mb-4 opacity-20">🎨</div>
            <p>Seleccioná un libro para ver los resultados de la comunidad.</p>
          </div>
        )}
      </main>
    </>
  )
}
