'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ToggleLikeResponse } from '@/types'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}

export async function toggleLike(submission_id: string): Promise<ToggleLikeResponse> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('toggle_like', { p_submission_id: submission_id })
  if (error) throw error
  revalidatePath('/buscar')
  return data as ToggleLikeResponse
}

export async function createSubmission(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const foto_url     = (formData.get('foto_url')     as string) || null
  const registro_url = (formData.get('registro_url') as string) || null

  const modelosRaw   = formData.get('modelos') as string
  const modelos: { marca_id: string; modelo_id: string }[] = modelosRaw ? JSON.parse(modelosRaw) : []
  const primerModeloId = modelos[0]?.modelo_id ?? null

  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .insert({
      usuario_id:   user.id,
      libro_id:     formData.get('libro_id') as string,
      pagina:       parseInt(formData.get('pagina') as string),
      modelo_id:    primerModeloId,
      descripcion:  (formData.get('descripcion') as string) || null,
      foto_url,
      registro_url,
    })
    .select('id')
    .single()

  if (subError) throw subError

  if (modelos.length > 0) {
    const { error: modelosError } = await supabase
      .from('submission_modelos')
      .insert(modelos.map((m, i) => ({
        submission_id: submission.id,
        modelo_id:     m.modelo_id,
        orden:         i,
      })))
    if (modelosError) throw modelosError
  }

  const coloresRaw = formData.get('colores') as string
  const colores = JSON.parse(coloresRaw) as Array<{
    numero_libro: number; nombre_color: string; hex: string
    codigo_marcador: string; modelo_id: string | null; orden: number
  }>

  if (colores.length > 0) {
    const { error: coloresError } = await supabase
      .from('submission_colores')
      .insert(colores.map(c => ({
        submission_id:   submission.id,
        numero_libro:    c.numero_libro,
        nombre_color:    c.nombre_color,
        hex:             c.hex || null,
        codigo_marcador: c.codigo_marcador,
        modelo_id:       c.modelo_id || null,
        orden:           c.orden,
      })))
    if (coloresError) throw coloresError
  }

  revalidatePath('/buscar')
  revalidatePath('/ranking')
  return submission.id
}

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

export async function updatePerfil(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { error } = await supabase.from('usuarios').update({
    nombre:         formData.get('nombre') as string,
    social:         (formData.get('social') as string) || null,
    marca_favorita: (formData.get('marca_favorita') as string) || null,
  }).eq('id', user.id)
  if (error) throw error
  revalidatePath('/ranking')
}

// ------------------------------------------------------------
// Submissions — editar y eliminar
// ------------------------------------------------------------

export async function deleteSubmission(submission_id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Verificar que el post pertenece al usuario
  const { data: submission } = await supabase
    .from('submissions').select('usuario_id, foto_url, registro_url')
    .eq('id', submission_id).single()

  if (!submission || submission.usuario_id !== user.id) {
    throw new Error('No autorizado')
  }

  // Eliminar fotos del storage
  const paths: string[] = []
  if (submission.foto_url) {
    const path = submission.foto_url.split('/submissions-fotos/')[1]
    if (path) paths.push(path)
  }
  if (submission.registro_url) {
    const path = submission.registro_url.split('/submissions-fotos/')[1]
    if (path) paths.push(path)
  }
  if (paths.length > 0) {
    await supabase.storage.from('submissions-fotos').remove(paths)
  }

  const { error } = await supabase
    .from('submissions').delete().eq('id', submission_id)
  if (error) throw error

  revalidatePath('/inicio')
  revalidatePath('/buscar')
}

export async function updateSubmission(submission_id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: submission } = await supabase
    .from('submissions').select('usuario_id')
    .eq('id', submission_id).single()

  if (!submission || submission.usuario_id !== user.id) {
    throw new Error('No autorizado')
  }

  const foto_url     = (formData.get('foto_url')     as string) || null
  const registro_url = (formData.get('registro_url') as string) || null
  const descripcion  = (formData.get('descripcion')  as string) || null

  // Actualizar submission
  const updateData: any = { descripcion }
  if (foto_url)     updateData.foto_url     = foto_url
  if (registro_url) updateData.registro_url = registro_url

  const { error } = await supabase
    .from('submissions').update(updateData).eq('id', submission_id)
  if (error) throw error

  // Actualizar colores si se enviaron
  const coloresRaw = formData.get('colores') as string
  if (coloresRaw) {
    const colores = JSON.parse(coloresRaw)

    // Eliminar colores existentes y reinsertar
    await supabase.from('submission_colores').delete().eq('submission_id', submission_id)

    if (colores.length > 0) {
      await supabase.from('submission_colores').insert(
        colores.map((c: any) => ({
          submission_id,
          numero_libro:    c.numero_libro,
          nombre_color:    c.nombre_color,
          hex:             c.hex || null,
          codigo_marcador: c.codigo_marcador,
          modelo_id:       c.modelo_id || null,
          orden:           c.orden,
        }))
      )
    }
  }

  // Actualizar modelos si se enviaron
  const modelosRaw = formData.get('modelos') as string
  if (modelosRaw) {
    const modelos = JSON.parse(modelosRaw)
    await supabase.from('submission_modelos').delete().eq('submission_id', submission_id)
    if (modelos.length > 0) {
      await supabase.from('submission_modelos').insert(
        modelos.map((m: any, i: number) => ({
          submission_id,
          modelo_id: m.modelo_id,
          orden:     i,
        }))
      )
    }
  }

  revalidatePath('/inicio')
  revalidatePath('/buscar')
}