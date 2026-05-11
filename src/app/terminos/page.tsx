import Link from 'next/link'

export const metadata = {
  title: 'Términos de uso — PaletNum',
  description: 'Términos y condiciones de uso de PaletNum.',
}

export default function TerminosPage() {
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
            Términos de uso
          </h1>
          <p className="font-script text-lg" style={{ color: '#C9908A' }}>
            Última actualización: {fecha}
          </p>
        </div>

        <div className="space-y-6 font-sans text-sm leading-relaxed"
             style={{ color: '#5C5C6E' }}>

          {[
            {
              titulo: '1. Aceptación de los términos',
              texto: 'Al acceder y utilizar PaletNum ("la plataforma", "el servicio"), aceptás estos Términos de uso en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no podés utilizar el servicio. PaletNum es una plataforma comunitaria para compartir equivalencias de marcadores para pintura por números.'
            },
            {
              titulo: '2. Descripción del servicio',
              texto: 'PaletNum permite a los usuarios compartir y consultar equivalencias de colores entre distintas marcas de marcadores acrílicos, organizadas por libro de pintura por números y página. Los contenidos son generados íntegramente por los usuarios de la comunidad.'
            },
            {
              titulo: '3. Responsabilidad del contenido del usuario',
              texto: 'Al publicar contenido en PaletNum (fotos, equivalencias de colores, registros escritos), el usuario declara que es el autor o tiene los derechos necesarios sobre el contenido que sube; que el contenido no infringe derechos de propiedad intelectual de terceros; que las fotografías de dibujos terminados representan su propio trabajo creativo; y que no subirá contenido que reproduzca íntegramente obras con derechos de autor sin autorización. PaletNum no se responsabiliza por el contenido subido por los usuarios.'
            },
            {
              titulo: '4. Propiedad intelectual',
              texto: 'Los libros de pintura por números y sus diseños son propiedad de sus respectivos editores y autores. PaletNum no tiene ninguna afiliación con dichas editoriales y no reproduce ni distribuye sus obras. El código, diseño y funcionalidad de la plataforma PaletNum son propiedad de sus creadores. Los contenidos generados por los usuarios pertenecen a cada usuario, quienes otorgan a PaletNum una licencia no exclusiva para mostrarlos dentro de la plataforma.'
            },
            {
              titulo: '5. Conducta del usuario',
              texto: 'El usuario se compromete a no publicar contenido falso, engañoso o malintencionado; no utilizar la plataforma para actividades comerciales no autorizadas; no intentar acceder a datos de otros usuarios sin autorización; no subir contenido que infrinja derechos de autor; y no publicar contenido ofensivo, discriminatorio o inapropiado.'
            },
            {
              titulo: '6. Sistema de puntos y ranking',
              texto: 'PaletNum otorga puntos a los usuarios por sus contribuciones. Estos puntos determinan el ranking de la comunidad y no tienen valor monetario ni pueden ser canjeados por ningún beneficio fuera de la plataforma. PaletNum se reserva el derecho de modificar el sistema de puntos en cualquier momento.'
            },
            {
              titulo: '7. Eliminación de contenido',
              texto: 'PaletNum se reserva el derecho de eliminar cualquier contenido que viole estos términos, infrinja derechos de terceros, o sea considerado inapropiado para la comunidad, sin previo aviso. Los usuarios pueden eliminar su propio contenido en cualquier momento.'
            },
            {
              titulo: '8. Limitación de responsabilidad',
              texto: 'PaletNum se provee "tal cual" sin garantías de ningún tipo. No garantizamos la exactitud de las equivalencias de colores publicadas por los usuarios, ya que los tonos pueden variar entre lotes de fabricación. PaletNum no será responsable por daños directos o indirectos derivados del uso del servicio.'
            },
            {
              titulo: '9. Modificaciones',
              texto: 'PaletNum puede modificar estos términos en cualquier momento. Los cambios entrarán en vigencia al publicarse en esta página. El uso continuado de la plataforma implica la aceptación de los nuevos términos.'
            },
            {
              titulo: '10. Contacto',
              texto: 'Para consultas relacionadas con estos términos podés contactarnos a través del perfil oficial de PaletNum en redes sociales.'
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
          <Link href="/privacidad" className="hover:underline" style={{ color: '#C9908A' }}>
            Política de privacidad
          </Link>
          <Link href="/buscar" className="hover:underline" style={{ color: '#8A8A9A' }}>
            Volver a PaletNum
          </Link>
        </div>
      </main>
    </div>
  )
}