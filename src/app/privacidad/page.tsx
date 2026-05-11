import Link from 'next/link'

export const metadata = {
  title: 'Política de privacidad — PaletNum',
  description: 'Política de privacidad y tratamiento de datos de PaletNum.',
}

export default function PrivacidadPage() {
  const fecha = '10 de mayo de 2026'

  return (
    <div className="min-h-screen" style={{ background: '#FAF6F1' }}>

      <header style={{ background: '#5C5C6E' }}
              className="px-5 py-4 flex items-center justify-between">
        <div>
          <Link href="/buscar" className="font-display text-2xl tracking-tight"
                style={{ color: '#FAF6F1' }}>
            Palet<span style={{ color: '#E8C4C0', fontStyle: 'italic' }}>Num</span>
          </Link>
          <p className="font-script text-sm hidden sm:block mt-0.5"
             style={{ color: 'rgba(250,246,241,0.5)', fontFamily: "'Dancing Script', cursive" }}>
            Código de colores para pintar por números
          </p>
        </div>
        <Link href="/buscar" className="text-xs font-sans"
              style={{ color: 'rgba(250,246,241,0.6)' }}>
          ← Volver
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl mb-2" style={{ color: '#5C5C6E' }}>
            Política de privacidad
          </h1>
          <p className="font-script text-lg" style={{ color: '#C9908A' }}>
            Última actualización: {fecha}
          </p>
        </div>

        <div className="space-y-4 font-sans text-sm leading-relaxed">

          {/* Datos que recopilamos */}
          <div className="bg-white rounded-2xl p-5 shadow-cozy"
               style={{ border: '1px solid rgba(92,92,110,0.15)' }}>
            <h2 className="font-display text-lg mb-3" style={{ color: '#5C5C6E' }}>
              1. Información que recopilamos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { titulo: 'Información de cuenta', texto: 'Dirección de email. Si usás Google OAuth, también tu nombre y foto de perfil.' },
                { titulo: 'Perfil público', texto: 'Nombre, usuario, red social y marca favorita que completás de forma voluntaria.' },
                { titulo: 'Contenido que publicás', texto: 'Fotos de tus dibujos, registros escritos y listas de equivalencias.' },
                { titulo: 'Actividad', texto: 'Likes que das y recibís, publicaciones realizadas y puntos acumulados.' },
              ].map(item => (
                <div key={item.titulo} className="rounded-xl p-3"
                     style={{ background: '#F4EDE4' }}>
                  <p className="font-medium text-sm mb-1" style={{ color: '#5C5C6E' }}>
                    {item.titulo}
                  </p>
                  <p className="text-xs" style={{ color: '#8A8A9A' }}>{item.texto}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Datos públicos vs privados */}
          <div className="bg-white rounded-2xl p-5 shadow-cozy"
               style={{ border: '1px solid rgba(92,92,110,0.15)' }}>
            <h2 className="font-display text-lg mb-3" style={{ color: '#5C5C6E' }}>
              2. Datos públicos y privados
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3"
                   style={{ background: '#F4EDE4', border: '1px solid rgba(92,92,110,0.15)' }}>
                <p className="font-medium text-xs mb-2" style={{ color: '#8FAF8F' }}>
                  ✓ Visible para todos
                </p>
                <ul className="text-xs space-y-1" style={{ color: '#8A8A9A' }}>
                  <li>Tu nombre visible y @usuario</li>
                  <li>Tu red social (si la cargaste)</li>
                  <li>Tus resultados publicados</li>
                  <li>Tu posición en el ranking</li>
                  <li>Tus puntos</li>
                </ul>
              </div>
              <div className="rounded-xl p-3"
                   style={{ background: '#F5E8E6', border: '1px solid #E8C4C0' }}>
                <p className="font-medium text-xs mb-2" style={{ color: '#C9908A' }}>
                  ✗ Solo vos lo ves
                </p>
                <ul className="text-xs space-y-1" style={{ color: '#8A8A9A' }}>
                  <li>Tu dirección de email</li>
                  <li>Tu fecha de nacimiento</li>
                  <li>Tu historial de likes dados</li>
                  <li>Datos de sesión</li>
                </ul>
              </div>
            </div>
          </div>

          {[
            {
              titulo: '3. Cómo usamos tu información',
              texto: 'Usamos tu información exclusivamente para gestionar tu cuenta, mostrar tu perfil y contribuciones a la comunidad, calcular el ranking, enviarte el link mágico de acceso y mejorar el funcionamiento de la plataforma. No vendemos ni compartimos tu información personal con terceros con fines comerciales o publicitarios.'
            },
            {
              titulo: '4. Almacenamiento de datos',
              texto: 'Tus datos se almacenan en servidores de Supabase, un proveedor de infraestructura con sede en los Estados Unidos, que cumple con estándares de seguridad SOC 2. Las fotos que subís se almacenan en el servicio de almacenamiento de Supabase. La plataforma puede estar alojada en servidores de Vercel con infraestructura distribuida globalmente.'
            },
            {
              titulo: '5. Cookies y sesiones',
              texto: 'PaletNum utiliza cookies de sesión estrictamente necesarias para mantener tu sesión iniciada. No utilizamos cookies de seguimiento, publicidad ni analítica de terceros. Las cookies de sesión se eliminan al cerrar sesión o al limpiar los datos del navegador.'
            },
            {
              titulo: '6. Tus derechos',
              texto: 'Tenés derecho a acceder a los datos personales que tenemos sobre vos; corregir tu información de perfil en cualquier momento; eliminar tus publicaciones y contenido; solicitar la eliminación completa de tu cuenta contactándonos directamente; y exportar tu información solicitando una copia de tus datos.'
            },
            {
              titulo: '7. Menores de edad',
              texto: 'PaletNum no está dirigida a menores de 13 años. Si tenés conocimiento de que un menor ha creado una cuenta, contactanos para eliminarla.'
            },
            {
              titulo: '8. Seguridad',
              texto: 'Implementamos medidas de seguridad estándar incluyendo Row Level Security (RLS) en la base de datos, HTTPS en todas las comunicaciones y autenticación sin contraseña mediante links mágicos. Sin embargo, ningún sistema es 100% seguro.'
            },
            {
              titulo: '9. Cambios en esta política',
              texto: 'Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos mediante un aviso en la plataforma. El uso continuado del servicio implica tu aceptación de la política actualizada.'
            },
            {
              titulo: '10. Contacto',
              texto: 'Para ejercer tus derechos o consultas sobre privacidad, contactanos a través del perfil oficial de PaletNum en redes sociales.'
            },
          ].map(s => (
            <div key={s.titulo} className="bg-white rounded-2xl p-5 shadow-cozy"
                 style={{ border: '1px solid rgba(92,92,110,0.15)' }}>
              <h2 className="font-display text-lg mb-2" style={{ color: '#5C5C6E' }}>
                {s.titulo}
              </h2>
              <p style={{ color: '#8A8A9A' }}>{s.texto}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 flex gap-6 text-sm font-sans"
             style={{ borderTop: '1px solid rgba(92,92,110,0.15)' }}>
          <Link href="/terminos" className="hover:underline" style={{ color: '#C9908A' }}>
            Términos de uso
          </Link>
          <Link href="/buscar" className="hover:underline" style={{ color: '#8A8A9A' }}>
            Volver a PaletNum
          </Link>
        </div>
      </main>
    </div>
  )
}