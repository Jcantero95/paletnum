import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { PerfilForm } from '@/components/perfil/PerfilForm'

const ADMIN_EMAIL = 'jcantero95@gmail.com'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/perfil')

  const { data: usuario } = await supabase
    .from('usuarios').select('*').eq('id', user.id).single()

  const { data: marcas } = await supabase
    .from('marcas').select('*').order('nombre')

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
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-3xl mb-1" style={{ color: '#5C5C6E' }}>
            Mi perfil
          </h1>
          <p className="font-script text-lg" style={{ color: '#C9908A' }}>
            Tus datos y preferencias ✨
          </p>
        </div>
        <PerfilForm
          usuario={usuario}
          marcas={marcas ?? []}
          userEmail={user?.email ?? ''}
          tipoAuth={user?.app_metadata?.provider ?? 'email'}
        />
      </main>
    </>
  )
}