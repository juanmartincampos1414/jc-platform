export const metadata = {
  title: "Eliminación de datos — JC AIgency",
}

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Eliminación de datos</h1>
          <p className="text-sm text-gray-500">Instrucciones para solicitar la eliminación de tus datos personales</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Conectaste tu cuenta de Facebook o Instagram con JC AIgency?</h2>
            <p className="text-sm">
              Si autorizaste a nuestra app a acceder a tu cuenta de Meta, podés revocar ese acceso y solicitar la eliminación de tus datos siguiendo los pasos a continuación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Opción 1 — Revocar acceso desde Facebook</h2>
            <p className="mb-3">Para revocar el acceso de JC AIgency a tu cuenta de Facebook e Instagram:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Ingresá a <strong>Facebook</strong> → <strong>Configuración y privacidad</strong> → <strong>Configuración</strong></li>
              <li>En el menú izquierdo seleccioná <strong>"Aplicaciones y sitios web"</strong></li>
              <li>Buscá <strong>"JC Aigency"</strong> en la lista</li>
              <li>Hacé click en <strong>"Eliminar"</strong></li>
              <li>Confirmá la eliminación</li>
            </ol>
            <p className="mt-3 text-sm text-gray-500">
              Esto revoca inmediatamente los permisos de acceso. Tus tokens de acceso almacenados en nuestra plataforma quedan inactivos automáticamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Opción 2 — Solicitar eliminación completa de datos</h2>
            <p className="mb-3">
              Para solicitar la eliminación completa de todos tus datos personales de nuestra plataforma (cuenta, contenido generado, historial de publicaciones), enviá un correo a:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-lg">✉</div>
              <div>
                <div className="font-semibold text-gray-900">hola@jcmarketing.digital</div>
                <div className="text-sm text-gray-500">Asunto: Solicitud de eliminación de datos</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Incluí en el correo el email con el que registraste tu cuenta. Procesamos las solicitudes dentro de los <strong>30 días hábiles</strong> siguientes a la recepción.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Qué datos eliminamos</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Datos de tu cuenta (nombre, email)</li>
              <li>Tokens de acceso a redes sociales</li>
              <li>Perfil de marca configurado</li>
              <li>Historial de posts generados y publicados</li>
              <li>Imágenes generadas vinculadas a tu cuenta</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              Nota: podemos conservar registros de facturación por hasta 5 años según la normativa fiscal argentina, pero estos no incluyen datos de uso de la plataforma ni contenido generado.
            </p>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500">
              Para más información sobre cómo tratamos tus datos, consultá nuestra{" "}
              <a href="/privacy" className="text-blue-600 hover:underline">Política de Privacidad</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
