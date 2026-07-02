import { Link } from 'react-router-dom';
import LegalLayout, { LegalIdentity, LegalSection } from '../components/legal/LegalLayout';
import { APP_CONFIG } from '../config/app';

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Términos y Condiciones de uso"
      intro="Estos Términos regulan el uso de la plataforma ContactHub. Al registrarte o usar el servicio, aceptas estas condiciones. Léelas con atención."
    >
      <LegalSection title="1. Identificación del titular">
        <p>El servicio {APP_CONFIG.name} es operado por:</p>
        <LegalIdentity />
      </LegalSection>

      <LegalSection title="2. Qué es ContactHub">
        <p>
          ContactHub es un <strong>directorio digital</strong> que organiza contactos y oportunidades comerciales por
          categorías. El usuario puede explorar categorías de forma gratuita con los teléfonos <strong>parcialmente
          enmascarados</strong>, y desbloquear el contacto completo mediante un plan de acceso, una prueba gratuita o una
          recompensa.
        </p>
        <p>
          ContactHub <strong>no garantiza</strong> respuestas, ventas, disponibilidad ni resultados. Es un servicio de
          organización y acceso a información de contacto, no un intermediario ni responsable de lo que ofrezca cada
          contacto listado.
        </p>
      </LegalSection>

      <LegalSection title="3. Cuenta de usuario">
        <ul>
          <li>El registro requiere un correo válido. Eres responsable de la seguridad de tu cuenta.</li>
          <li>Debes ser mayor de edad o contar con autorización de tu representante legal.</li>
          <li>Los datos que proporciones deben ser veraces.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Planes, precios y pagos">
        <ul>
          <li>Los precios se muestran en Soles (S/) e incluyen los impuestos aplicables.</li>
          <li>El pago puede realizarse con tarjeta o Yape a través de la pasarela <strong>Culqi</strong>, o por Yape/Plin
            manual enviando el comprobante por el chat.</li>
          <li>La activación con pasarela es automática; la activación por comprobante manual se realiza tras verificación.</li>
          <li>El acceso otorga la visualización del teléfono completo de las carpetas indicadas mientras el permiso esté activo.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Naturaleza digital del servicio y devoluciones">
        <p>
          El acceso a un contacto es un <strong>servicio digital de consumo inmediato</strong>: una vez revelado el teléfono,
          el servicio se considera prestado. Por ello, por regla general <strong>no procede la devolución</strong>, salvo error
          comprobable. Revisa el detalle en nuestra{' '}
          <Link to="/devoluciones">Política de Devoluciones</Link>.
        </p>
      </LegalSection>

      <LegalSection title="6. Uso permitido y prohibido">
        <ul>
          <li>Está prohibido el uso para spam, fraude, acoso, suplantación o cualquier fin ilícito.</li>
          <li>No se permite revender, redistribuir masivamente ni raspar (scraping) la base de contactos.</li>
          <li>El incumplimiento puede derivar en la suspensión o cierre de la cuenta sin reembolso.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Protección de datos personales">
        <p>
          Tratamos tus datos conforme a la Ley N.° 29733 (Perú). Consulta nuestra{' '}
          <Link to="/privacidad">Política de Privacidad</Link> para saber qué datos recopilamos, con qué finalidad y cómo
          ejercer tus derechos.
        </p>
      </LegalSection>

      <LegalSection title="8. Responsabilidad">
        <p>
          ContactHub no se responsabiliza por acuerdos, transacciones o comunicaciones entre el usuario y los contactos
          listados. El uso de la información es bajo responsabilidad del usuario.
        </p>
      </LegalSection>

      <LegalSection title="9. Modificaciones">
        <p>
          Podemos actualizar estos Términos. Los cambios se publican en esta página con su fecha de actualización. El uso
          continuado del servicio implica la aceptación de la versión vigente.
        </p>
      </LegalSection>

      <LegalSection title="10. Ley aplicable y reclamos">
        <p>
          Estos Términos se rigen por las leyes del Perú. Ante cualquier disconformidad puedes registrar tu reclamo en
          nuestro <Link to="/reclamaciones">Libro de Reclamaciones</Link>, conforme al Código de Protección y Defensa del
          Consumidor y las normas de INDECOPI.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
