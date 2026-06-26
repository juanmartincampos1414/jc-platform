export const metadata = {
  title: "Política de Privacidad — JC AIgency",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
          <p className="text-sm text-gray-500">Última actualización: junio de 2025</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Quiénes somos</h2>
            <p>
              JC AIgency ("nosotros", "nuestro") es una agencia de marketing digital con sede en Argentina, operada por Juan Campos Ventures. Brindamos servicios de marketing digital, gestión de redes sociales y publicación automatizada de contenido a través de nuestra plataforma JClaude, accesible en <strong>aigency.jcmarketing.digital</strong>.
            </p>
            <p className="mt-2">
              Correo de contacto: <a href="mailto:hola@jcmarketing.digital" className="text-blue-600 hover:underline">hola@jcmarketing.digital</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Qué información recopilamos</h2>
            <p>Recopilamos la siguiente información cuando usás nuestra plataforma:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li><strong>Datos de cuenta:</strong> nombre, dirección de correo electrónico y contraseña cifrada.</li>
              <li><strong>Datos de redes sociales:</strong> tokens de acceso de Facebook e Instagram que vos autorizás expresamente para permitir la publicación de contenido en tu nombre. No accedemos a tus mensajes privados ni a información no autorizada.</li>
              <li><strong>Contenido generado:</strong> textos, hashtags e imágenes creados por nuestra herramienta de IA, junto con las fechas y horarios de publicación que configurás.</li>
              <li><strong>Datos de uso:</strong> páginas visitadas, acciones realizadas dentro de la plataforma e información técnica del dispositivo (IP, navegador).</li>
              <li><strong>Datos de facturación:</strong> información de suscripción procesada por MercadoPago. No almacenamos datos de tarjetas de crédito.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cómo usamos tu información</h2>
            <p>Usamos tu información exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Operar y mejorar los servicios de la plataforma JClaude.</li>
              <li>Publicar contenido en tus redes sociales únicamente cuando vos lo aprobás.</li>
              <li>Generar contenido con inteligencia artificial basado en el perfil de marca que configurás.</li>
              <li>Procesar pagos y gestionar tu suscripción.</li>
              <li>Enviarte notificaciones relacionadas con tu cuenta y el estado de tus publicaciones.</li>
              <li>Cumplir con obligaciones legales aplicables.</li>
            </ul>
            <p className="mt-2">No vendemos, alquilamos ni compartimos tu información personal con terceros con fines publicitarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Integración con Meta (Facebook e Instagram)</h2>
            <p>
              Nuestra plataforma se integra con la API de Meta para publicar contenido en tu cuenta de Instagram y/o página de Facebook. Al conectar tu cuenta:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Autorizás expresamente a JC AIgency a publicar contenido en tu nombre usando los permisos que otorgás.</li>
              <li>Podés revocar este acceso en cualquier momento desde la configuración de tu cuenta de Facebook (<strong>Configuración → Seguridad → Apps y sitios web</strong>).</li>
              <li>Los tokens de acceso se almacenan de forma cifrada y se usan exclusivamente para las publicaciones que vos aprobás.</li>
              <li>No accedemos a tu bandeja de entrada, mensajes directos ni información privada más allá de lo estrictamente necesario para publicar.</li>
            </ul>
            <p className="mt-2">
              El uso de datos de Meta se rige también por la <a href="https://www.facebook.com/policy.php" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Política de datos de Meta</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Almacenamiento y seguridad</h2>
            <p>
              Tus datos se almacenan en servidores seguros provistos por Supabase (infraestructura en AWS). Implementamos medidas técnicas y organizativas para proteger tu información, incluyendo cifrado en tránsito (TLS) y en reposo, control de acceso por roles y auditoría de accesos.
            </p>
            <p className="mt-2">
              Sin embargo, ningún sistema es 100% seguro. Te recomendamos usar contraseñas fuertes y no compartir tus credenciales de acceso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Retención de datos</h2>
            <p>
              Conservamos tu información mientras tu cuenta esté activa. Si cancelás tu suscripción o solicitás la eliminación de tu cuenta, eliminaremos tus datos personales dentro de los 30 días siguientes, salvo que la ley exija conservarlos por más tiempo (ej: registros de facturación por 5 años según normativa fiscal argentina).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Tus derechos</h2>
            <p>De acuerdo con la Ley 25.326 de Protección de Datos Personales de Argentina, tenés derecho a:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Acceder a los datos personales que tenemos sobre vos.</li>
              <li>Rectificar datos inexactos o incompletos.</li>
              <li>Solicitar la eliminación de tus datos ("derecho al olvido").</li>
              <li>Oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
              <li>Revocar el consentimiento otorgado para el uso de tu información.</li>
            </ul>
            <p className="mt-2">
              Para ejercer cualquiera de estos derechos, escribinos a <a href="mailto:hola@jcmarketing.digital" className="text-blue-600 hover:underline">hola@jcmarketing.digital</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies</h2>
            <p>
              Usamos cookies de sesión estrictamente necesarias para mantener tu sesión iniciada. No usamos cookies de seguimiento ni publicitarias de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Te notificaremos por correo electrónico ante cambios significativos. El uso continuado de la plataforma después de los cambios implica tu aceptación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contacto</h2>
            <p>
              Para consultas sobre esta política o tus datos personales, contactanos en:<br />
              <strong>JC AIgency</strong> · <a href="mailto:hola@jcmarketing.digital" className="text-blue-600 hover:underline">hola@jcmarketing.digital</a> · Buenos Aires, Argentina
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
