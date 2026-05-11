import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'jcantero95@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { tipo, id, data } = await req.json()

  const tabla = tipo === 'libros' ? 'libros_propuestos'
    : tipo === 'marcas' ? 'marcas_propuestas'
    : 'modelos_propuestos'

  const { error } = await supabase.from(tabla).update(data).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aprobar después de editar
  const fnMap: Record<string, string> = {
    libros:  'admin_aprobar_libro',
    marcas:  'admin_aprobar_marca',
    modelos: 'admin_aprobar_modelo',
  }
  const { error: rpcError } = await supabase.rpc(fnMap[tipo], { p_id: id })
  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}