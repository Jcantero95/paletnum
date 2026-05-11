import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLibros, getMarcas, getModelosByMarca } from '@/lib/queries'
import { Navbar } from '@/components/ui/Navbar'
import { ContribuirForm } from '@/components/contribute/ContribuirForm'
import type { Marca, Modelo } from '@/types'

const ADMIN_EMAIL = 'jcantero95@gmail.com'

export default async function ContribuirPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/contribuir')

  const { data: usuario } = await supabase
    .from('usuarios').select('*').eq('id', user.id).single()

  const [libros, marcas] = await Promise.all([getLibros(), getMarcas()])

  const modelosByMarca: Record<string, Modelo[]> = {}
  await Promise.all(
    (marcas as Marca[]).map(async m => {
      modelosByMarca[m.id] = await getModelosByMarca(m.id)
    })
  )

  let pendientesCount = 0
  if (user?.email === ADMIN_EMAIL) {
    const [{ count: lp }, { count: mp }, { count: mop }] = await Promise.all([
      supabase.from('libros_propuestos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('marcas_propuestas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('modelos_propuestos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    ])
    pendientesCount = (lp ?? 0) + (mp ?? 0) + (mop ?? 0)
  }

  return (
    <>
      <Navbar
        usuario={usuario}
        pendientes={pendientesCount}
        userEmail={user?.email ?? ''}
      />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-normal">Subí tu resultado</h1>
          <p className="text-ink2 mt-1.5 text-sm">
            Compartí tu versión terminada con la lista de colores que usaste. Ayudás a la comunidad y sumás puntos al ranking.
          </p>
        </div>
        <ContribuirForm libros={libros} marcas={marcas} modelosByMarca={modelosByMarca} />
      </main>
    </>
  )
}
