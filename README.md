# PaletNum

Comunidad colaborativa de equivalencias de marcadores para pintura por números.

## Setup

### 1. Cloná el repositorio e instalá dependencias

```bash
npm install
```

### 2. Configurá las variables de entorno

Copiá el archivo de ejemplo y completá con tus datos de Supabase:

```bash
cp .env.local.example .env.local
```

Los valores los encontrás en:
**Supabase Dashboard → Settings → API**

```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Configurá Auth en Supabase

En **Supabase Dashboard → Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (en producción: tu dominio)
- Redirect URLs: `http://localhost:3000/auth/callback`

Para habilitar Google OAuth:
**Authentication → Providers → Google** → seguir instrucciones de Supabase.

### 4. Corré el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

---

## Deploy en Vercel

```bash
npm install -g vercel
vercel
```

Agregá las variables de entorno en el dashboard de Vercel y actualizá `NEXT_PUBLIC_SITE_URL` con tu dominio de producción.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── buscar/          # Página principal de búsqueda
│   ├── contribuir/      # Subir resultado
│   ├── ranking/         # Ranking de usuarios
│   └── auth/            # Login y callback OAuth
├── components/
│   ├── ui/              # Navbar y componentes compartidos
│   ├── search/          # Filtros de búsqueda
│   ├── gallery/         # Cards y panel de colores
│   └── contribute/      # Formulario de contribución
├── lib/
│   ├── supabase/        # Clientes browser y server
│   ├── queries.ts       # Consultas a la base de datos
│   └── actions.ts       # Server actions (likes, upload, auth)
└── types/               # Tipos TypeScript del schema
```

## Sistema de puntos

| Acción | Puntos |
|--------|--------|
| Publicar un resultado | +5 |
| Recibir un like | +1 |
| Perder un like | -1 |
| Borrar un resultado | -5 |

Los puntos se actualizan automáticamente vía triggers en Supabase.
