export interface Usuario {
  id: string
  nombre: string
  apellido: string | null
  username: string | null
  social: string | null
  marca_favorita: string | null
  puntos: number
  tipo_usuario: 'invitado' | 'registrado' | 'google'
  avatar_url: string | null
  fecha_nacimiento: string | null
  created_at: string
  updated_at: string
}

export interface Libro {
  id: string
  nombre: string
  editorial: string | null
  paginas_total: number
  activo: boolean
  created_at: string
}

export interface Marca {
  id: string
  nombre: string
  created_at: string
}

export interface Modelo {
  id: string
  marca_id: string
  nombre: string
  cantidad: number | null
  created_at: string
  marca?: Marca
}

export interface SubmissionModelo {
  id: string
  submission_id: string
  modelo_id: string
  orden: number
  modelo?: Modelo & { marca: Marca }
}

export interface SubmissionColor {
  id: string
  submission_id: string
  numero_libro: number
  nombre_color: string
  hex: string | null
  codigo_marcador: string
  orden: number
  modelo_id: string | null
  modelo?: Modelo & { marca: Marca }
  created_at: string
}

export interface Submission {
  id: string
  usuario_id: string
  libro_id: string
  pagina: number
  modelo_id: string | null
  descripcion: string | null
  foto_url: string | null
  registro_url: string | null
  likes: number
  created_at: string
  updated_at: string
  // joins
  usuario?: Usuario
  libro?: Libro
  modelos?: SubmissionModelo[]        // múltiples marcas
  submission_colores?: SubmissionColor[]
  liked_by_me?: boolean
}

export interface FiltrosBusqueda {
  libro_id: string
  pagina: number | null
  marca_id: string | null
  modelo_id: string | null
}

export interface ToggleLikeResponse {
  liked: boolean
  likes: number
}