import { createClient } from '@/lib/supabase/server'
import type { FiltrosBusqueda, Submission, Libro, Marca, Modelo } from '@/types'

// ------------------------------------------------------------
// Catálogo
// ------------------------------------------------------------

export async function getLibros(): Promise<Libro[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('libros')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data
}

export async function getMarcas(): Promise<Marca[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marcas')
    .select('*')
    .order('nombre')
  if (error) throw error
  return data
}

export async function getModelosByMarca(marca_id: string): Promise<Modelo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modelos')
    .select('*, marca:marcas(*)')
    .eq('marca_id', marca_id)
    .order('cantidad', { ascending: true })
  if (error) throw error
  return data
}

// ------------------------------------------------------------
// Submissions
// ------------------------------------------------------------

export async function getSubmissions(filtros: FiltrosBusqueda): Promise<Submission[]> {
  const supabase = await createClient()

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
    `)
    .eq('libro_id', filtros.libro_id)
    .order('likes', { ascending: false })

  if (filtros.pagina) {
    query = query.eq('pagina', filtros.pagina)
  }

  // Filtrar por marca o modelo
  if (filtros.modelo_id) {
    // Buscar submissions que tengan ese modelo en submission_modelos
    const { data: smIds } = await supabase
      .from('submission_modelos')
      .select('submission_id')
      .eq('modelo_id', filtros.modelo_id)
    const ids = smIds?.map(s => s.submission_id) ?? []
    if (ids.length > 0) query = query.in('id', ids)
    else return []
  } else if (filtros.marca_id) {
    const modelos = await getModelosByMarca(filtros.marca_id)
    const modeloIds = modelos.map(m => m.id)
    if (modeloIds.length > 0) {
      const { data: smIds } = await supabase
        .from('submission_modelos')
        .select('submission_id')
        .in('modelo_id', modeloIds)
      const ids = [...new Set(smIds?.map(s => s.submission_id) ?? [])]
      if (ids.length > 0) query = query.in('id', ids)
      else return []
    }
  }

  const { data, error } = await query
  if (error) throw error

  return (data as Submission[]).map(s => ({
    ...s,
    modelos: s.modelos?.sort((a, b) => a.orden - b.orden),
    submission_colores: s.submission_colores?.sort((a, b) => a.orden - b.orden),
  }))
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
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
    `)
    .eq('id', id)
    .single()
  if (error) return null
  return {
    ...data,
    modelos: data.modelos?.sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden),
    submission_colores: data.submission_colores?.sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden),
  } as Submission
}

// ------------------------------------------------------------
// Ranking
// ------------------------------------------------------------

export async function getRanking(limit = 20) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, apellido, username, social, marca_favorita, puntos, avatar_url')
    .order('puntos', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}