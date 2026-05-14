import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { FeedGallery } from '@/components/feed/FeedGallery'

const ADMIN_EMAIL = 'jcantero95@gmail.com'

interface Props {
  searchParams: Promise<{ page?: string; tab?: string }>
}

export default async function InicioPage({ searchParams }: Props) {
  const params   = await searchParams
  const page     = parseInt(params.page ?? '1')
  const tab      = params.tab ?? 'comunidad'
  const pageSize = 12

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let usuario = null
  if (user) {
    const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
    usuario = data
  }

  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  // Query base
  let query = supabase
    .from('submissions')
    .select(`
      *,
      usuario:usuarios!submissions_usuario_id_fkey(id, nombre, apellido, username, social, puntos, avatar_url, tipo_usuario),
      libro:libros(id, nombre),
      modelos:submission_modelos(
        id, orden, modelo_id,
        modelo:modelos(id, nombre, cantidad, marca:marcas(id, nombre))
      ),
      submission_colores(
        id, numero_libro, nombre_color, hex, codigo_marcador, orden, modelo_id
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  // Si es "mis posts" filtrar por usuario
  if (tab === 'misposts' && user) {
    query = query.eq('usuario_id', user.id)
  }

  const { data: submissions, count } = await query

  // Likes del usuario actual
  let likedIds: string[] = []
  if (user && submissions && submissions.length > 0) {
    const ids = submissions.map(s => s.id)
    const { data: likes } = await supabase
      .from('likes').select('submission_id')
      .eq('usuario_id', user.id).in('submission_id', ids)
    likedIds = likes?.map(l => l.submission_id) ?? []
  }

  let pendientesCount = 0
  if (user?.email === ADMIN_EMAIL) {
    const [{ count: lp }, { count: mp }, { count: mop }] = await Promise.all([
      supabase.from('libros_propuestos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('marcas_propuestas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('modelos_propuestos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    ])
    pendientesCount = (lp ?? 0) + (mp ?? 0) + (mop ?? 0)
  }

  const hayMas = (count ?? 0) > page * pageSize

  return (
    <>
      <Navbar
        usuario={usuario}
        pendientes={pendientesCount}
        userEmail={user?.email ?? ''}
      />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-3xl mb-1" style={{ color: '#5C5C6E' }}>
            {tab === 'misposts' ? 'Mis publicaciones' : 'Últimos resultados'}
          </h1>
          <p className="font-script text-lg" style={{ color: '#C9908A' }}>
            {tab === 'misposts' ? 'Tus dibujos compartidos con la comunidad ✨' : 'Lo que la comunidad está pintando ✨'}
          </p>
        </div>

        <FeedGallery
          submissions={submissions ?? []}
          likedIds={likedIds}
          page={page}
          hayMas={hayMas}
          tab={tab}
          estaLogueado={!!user}
        />
      </main>
    </>
  )
}