import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminGetPropuestas } from '@/lib/propuestas-actions'
import { AdminPanel } from '@/components/admin/AdminPanel'
import Link from 'next/link'

const ADMIN_EMAIL = 'jcantero95@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/buscar')

  const propuestas = await adminGetPropuestas()

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-paper px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/buscar" className="font-display text-xl tracking-tight">
            Palet<span className="text-accent2">Num</span>
          </Link>
          <span className="text-xs bg-accent2 text-ink px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        </div>
        <Link href="/buscar" className="text-xs text-paper/60 hover:text-paper transition-colors">
          ← Volver
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-normal">Panel de moderación</h1>
          <p className="text-ink2 text-sm mt-1">
            Revisá y aprobá las propuestas de la comunidad antes de que aparezcan en el catálogo.
          </p>
        </div>
        <AdminPanel propuestas={propuestas} />
      </main>
    </div>
  )
}