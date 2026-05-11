import { createClient } from '@/lib/supabase/server'
import { getRanking } from '@/lib/queries'
import { Navbar } from '@/components/ui/Navbar'

const ADMIN_EMAIL = 'jcantero95@gmail.com'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let usuario = null
  if (user) {
    const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
    usuario = data
  }

  const ranking = await getRanking(30)

  let pendientesCount = 0
  if (user?.email === ADMIN_EMAIL) {
    const [{ count: lp }, { count: mp }, { count: mop }] = await Promise.all([
      supabase.from('libros_propuestos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('marcas_propuestas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('modelos_propuestos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    ])
    pendientesCount = (lp ?? 0) + (mp ?? 0) + (mop ?? 0)
  }

  const medalColors: Record<number, string> = {
    1: '#C9908A',
    2: '#B59E7D',
    3: '#B59E7D',
  }
  const borderColors: Record<number, string> = {
    1: '#E8C4C0',
    2: '#D9CBBA',
    3: '#D9CBBA',
  }

  return (
    <>
      <Navbar usuario={usuario} pendientes={pendientesCount} userEmail={user?.email ?? ''} />
      <main className="max-w-3xl mx-auto px-4 py-6">

        <div className="mb-6">
          <h1 className="font-display text-3xl mb-1" style={{ color: '#5C5C6E' }}>
            Ranking de la comunidad
          </h1>
          <p className="font-script text-lg" style={{ color: '#C9908A' }}>
            Los usuarios que más aportan ✨
          </p>
        </div>

        {/* Header columnas */}
        <div className="flex items-center px-4 mb-2 text-xs uppercase tracking-wider font-sans"
             style={{ color: '#8A8A9A' }}>
          <div style={{ width: 56 }}>Pos.</div>
          <div className="flex-1">Usuario</div>
          <div>Puntos</div>
        </div>

        <div className="space-y-3">
          {ranking.map((u, i) => {
            const pos = i + 1
            const borderColor = borderColors[pos] ?? 'rgba(92,92,110,0.15)'
            const medalColor  = medalColors[pos]  ?? '#D9CBBA'

            return (
              <div key={u.id}
                className="bg-white rounded-2xl px-4 py-4 flex items-center gap-4 shadow-cozy"
                style={{ border: `1px solid ${borderColor}` }}
              >
                {/* Posición */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center"
                     style={{ width: 56 }}>
                  {pos <= 3 ? (
                    <>
                      <div className="text-3xl leading-none">
                        {pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'}
                      </div>
                    </>
                  ) : (
                    <div className="font-display text-2xl" style={{ color: '#D9CBBA' }}>
                      {pos}
                    </div>
                  )}
                </div>

                {/* Usuario */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-sans font-medium" style={{ color: '#5C5C6E' }}>
                      {u.nombre}
                    </span>
                    {pos === 1 && (
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded-full"
                            style={{ background: '#F5E8E6', color: '#C9908A', border: '1px solid #E8C4C0' }}>
                        ♡ Top 1
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-sans mt-0.5">
                    {u.social ? (
                      <a href={u.social.startsWith('http') ? u.social : `https://${u.social}`}
                         target="_blank" rel="noopener noreferrer"
                         className="hover:underline"
                         style={{ color: '#C9908A' }}>
                        {u.social}
                      </a>
                    ) : (
                      <span style={{ color: '#D9CBBA' }}>Sin red social</span>
                    )}
                    {u.marca_favorita && (
                      <span style={{ color: '#B59E7D' }}> · {u.marca_favorita}</span>
                    )}
                  </div>
                </div>

                {/* Puntos */}
                <div className="text-right flex-shrink-0">
                  <div className="font-display text-2xl" style={{ color: '#5C5C6E' }}>
                    {u.puntos}
                  </div>
                  <div className="text-xs font-sans" style={{ color: '#8A8A9A' }}>
                    puntos
                  </div>
                </div>
              </div>
            )
          })}

          {ranking.length === 0 && (
            <div className="text-center py-12" style={{ color: '#8A8A9A' }}>
              <div className="text-4xl mb-3 opacity-30">🏆</div>
              <p className="font-sans">Todavía no hay participantes en el ranking.</p>
              <a href="/contribuir" className="btn-primary inline-block mt-4">
                Sé el primero →
              </a>
            </div>
          )}
        </div>
      </main>
    </>
  )
}