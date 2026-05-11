'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'jcantero95@gmail.com'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('No autorizado')
  return { supabase, user }
}

function similitud(a: string, b: string): number {
  const na = a.toLowerCase().trim()
  const nb = b.toLowerCase().trim()
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.8
  if (na.slice(0, 4) === nb.slice(0, 4)) return 0.6
  return 0
}

export async function buscarDuplicadosLibro(nombre: string) {
  const supabase = await createClient()
  const { data: libros } = await supabase.from('libros').select('id, nombre')
  const { data: propuestos } = await supabase
    .from('libros_propuestos').select('id, nombre, estado').eq('estado', 'pendiente')
  return [
    ...(libros ?? []).map(l => ({ ...l, tipo: 'existente' as const })),
    ...(propuestos ?? []).map(l => ({ ...l, tipo: 'propuesto' as const })),
  ].filter(l => similitud(nombre, l.nombre) >= 0.6)
}

export async function buscarDuplicadosMarca(nombre: string) {
  const supabase = await createClient()
  const { data: marcas } = await supabase.from('marcas').select('id, nombre')
  const { data: propuestas } = await supabase
    .from('marcas_propuestas').select('id, nombre, estado').eq('estado', 'pendiente')
  return [
    ...(marcas ?? []).map(m => ({ ...m, tipo: 'existente' as const })),
    ...(propuestas ?? []).map(m => ({ ...m, tipo: 'propuesto' as const })),
  ].filter(m => similitud(nombre, m.nombre) >= 0.6)
}

export async function proponerLibro(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const nombre = (formData.get('nombre') as string).trim()
  if (!nombre) throw new Error('El nombre es obligatorio')
  const { error } = await supabase.from('libros_propuestos').insert({
    usuario_id:    user.id,
    nombre,
    editorial:     (formData.get('editorial') as string) || null,
    paginas_total: parseInt(formData.get('paginas_total') as string) || 1,
    notas:         (formData.get('notas') as string) || null,
  })
  if (error) throw error
  revalidatePath('/admin')
}

export async function proponerMarca(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const nombre = (formData.get('nombre') as string).trim()
  if (!nombre) throw new Error('El nombre es obligatorio')
  const { error } = await supabase.from('marcas_propuestas').insert({
    usuario_id: user.id,
    nombre,
    notas:      (formData.get('notas') as string) || null,
  })
  if (error) throw error
  revalidatePath('/admin')
}

export async function adminAprobarLibro(id: string) {
  const { supabase } = await getAdminUser()
  const { error } = await supabase.rpc('admin_aprobar_libro', { p_id: id })
  if (error) throw error
  revalidatePath('/admin')
}

export async function adminRechazarLibro(id: string, motivo: string) {
  const { supabase } = await getAdminUser()
  const { error } = await supabase.rpc('admin_rechazar_libro', { p_id: id, p_motivo: motivo })
  if (error) throw error
  revalidatePath('/admin')
}

export async function adminAprobarMarca(id: string) {
  const { supabase } = await getAdminUser()
  const { error } = await supabase.rpc('admin_aprobar_marca', { p_id: id })
  if (error) throw error
  revalidatePath('/admin')
}

export async function adminRechazarMarca(id: string, motivo: string) {
  const { supabase } = await getAdminUser()
  const { error } = await supabase.rpc('admin_rechazar_marca', { p_id: id, p_motivo: motivo })
  if (error) throw error
  revalidatePath('/admin')
}

export async function adminAprobarModelo(id: string) {
  const { supabase } = await getAdminUser()
  const { error } = await supabase.rpc('admin_aprobar_modelo', { p_id: id })
  if (error) throw error
  revalidatePath('/admin')
}

export async function adminRechazarModelo(id: string, motivo: string) {
  const { supabase } = await getAdminUser()
  const { error } = await supabase.rpc('admin_rechazar_modelo', { p_id: id, p_motivo: motivo })
  if (error) throw error
  revalidatePath('/admin')
}

export async function adminGetPropuestas() {
  const { supabase } = await getAdminUser()
  const { data, error } = await supabase.rpc('admin_get_propuestas')
  if (error) throw error
  return data as { libros: any[]; marcas: any[]; modelos: any[] }
}