'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ToggleLikeResponse } from '@/types'

// ------------------------------------------------------------
// Auth
// ------------------------------------------------------------

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })
  if (error) throw error
  return data
}

export async function signInWithMagicLink(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })
  if (error) throw error
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}

// ------------------------------------------------------------
// Likes
// ------------------------------------------------------------

export async function toggleLike(submission_id: string): Promise<ToggleLikeResponse> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('toggle_like', {
    p_submission_id: submission_id,
  })
  if (error) throw error
  revalidatePath('/buscar')
  return data as ToggleLikeResponse
}

// ------------------------------------------------------------
// Storage
// ------------------------------------------------------------

async function uploadArchivo(
  file: File,
  userId: string,
  prefijo: 'foto' | 'registro'
): Promise<string> {
  const supabase = await createClient()
  const ext  = file.name.split('.').pop()
  const path = `${userId}/${prefijo}_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('submissions-fotos')
    .upload(path, file, { upsert: false })
  if (error) throw error

  const { data } = supabase.storage
    .from('submissions-fotos')
    .getPublicUrl(path)
  return data.publicUrl
}

export async function uploadFoto(file: File, userId: string): Promise<string> {
  return uploadArchivo(file, userId, 'foto')
}

// ------------------------------------------------------------
// Submissions
// ------------------------------------------------------------

export async function createSubmission(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // 1. Subir fotos
  let foto_url:     string | null = null
  let registro_url: string | null = null

  const foto     = formData.get('foto')     as File | null
  const registro = formData.get('registro') as File | null

  if (foto     && foto.size     > 0) foto_url     = await uploadArchivo(foto,     user.id, 'foto')
  if (registro && registro.size > 0) registro_url = await uploadArchivo(registro, user.id, 'registro')

  // 2. Parsear modelos
  const modelosRaw = formData.get('modelos') as string
  const modelos: { marca_id: string; modelo_id: string }[] = modelosRaw
    ? JSON.parse(modelosRaw)
    : []

  const primerModeloId = modelos[0]?.modelo_id ?? null

  // 3. Crear submission
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .insert({
      usuario_id:   user.id,
      libro_id:     formData.get('libro_id')    as string,
      pagina:       parseInt(formData.get('pagina') as string),
      modelo_id:    primerModeloId,              // compatibilidad con campo legacy
      descripcion:  (formData.get('descripcion') as string) || null,
      foto_url,
      registro_url,
    })
    .select('id')
    .single()

  if (subError) throw subError

  // 4. Insertar múltiples modelos en submission_modelos
  if (modelos.length > 0) {
    const { error: modelosError } = await supabase
      .from('submission_modelos')
      .insert(
        modelos.map((m, i) => ({
          submission_id: submission.id,
          modelo_id:     m.modelo_id,
          orden:         i,
        }))
      )
    if (modelosError) throw modelosError
  }

  // 5. Insertar colores
  const coloresRaw = formData.get('colores') as string
  const colores = JSON.parse(coloresRaw) as Array<{
    numero_libro:    number
    nombre_color:    string
    hex:             string
    codigo_marcador: string
    modelo_id:       string | null
    orden:           number
  }>

  if (colores.length > 0) {
    const { error: coloresError } = await supabase
      .from('submission_colores')
      .insert(
        colores.map(c => ({
          submission_id:   submission.id,
          numero_libro:    c.numero_libro,
          nombre_color:    c.nombre_color,
          hex:             c.hex || null,
          codigo_marcador: c.codigo_marcador,
          modelo_id:       c.modelo_id || null,
          orden:           c.orden,
        }))
      )
    if (coloresError) throw coloresError
  }

  revalidatePath('/buscar')
  revalidatePath('/ranking')
  return submission.id
}

// ------------------------------------------------------------
// Perfil
// ------------------------------------------------------------

export async function updatePerfil(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('usuarios')
    .update({
      nombre:         formData.get('nombre')         as string,
      social:         (formData.get('social')         as string) || null,
      marca_favorita: (formData.get('marca_favorita') as string) || null,
    })
    .eq('id', user.id)

  if (error) throw error
  revalidatePath('/ranking')
}