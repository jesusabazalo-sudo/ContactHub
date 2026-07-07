import { Link } from 'react-router-dom';
import LegalLayout, { LegalIdentity, LegalSection } from '../components/legal/LegalLayout';
import { LEGAL } from '../config/app';

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacidad"
      title="Política de Privacidad"
      intro="Explicamos qué datos personales tratamos, con qué finalidad, con quién se comparten y cómo puedes ejercer tus derechos. Cumplimos la Ley N.° 29733 de Protección de Datos Personales (Perú)."
    >
      <LegalSection title="Responsable del tratamiento">
        <LegalIdentity />
      </LegalSection>

      <LegalSection title="Datos que recopilamos">
        <ul>
          <li><strong>Cuenta:</strong> correo electrónico y, si lo proporcionas, nombre.</li>
          <li><strong>Contacto:</strong> teléfono/WhatsApp si decides guardarlo.</li>
          <li><strong>Pagos:</strong> comprobantes que subes y el registro de tus compras. Los datos de tu tarjeta los procesa la pasarela; ContactHub <strong>no almacena números de tarjeta</strong>.</li>
          <li><strong>Uso:</strong> mensajes de soporte, accesos activados y datos técnicos básicos (analítica).</li>
        </ul>
      </LegalSection>

      <LegalSection title="Finalidad y base legal">
        <p>Usamos tus datos para: crear y gestionar tu cuenta, activar accesos, procesar pagos, brindar soporte y cumplir obligaciones legales. La base legal es la ejecución del servicio que contratas y tu consentimiento.</p>
      </LegalSection>

      <LegalSection title="Con quién se comparten">
        <p>Trabajamos con encargados de tratamiento que solo procesan datos para prestarnos su servicio:</p>
        <ul>
          <li><strong>Supabase</strong> — base de datos y autenticación.</li>
          <li><strong>Vercel</strong> — alojamiento del sitio.</li>
          <li><strong>Google Analytics</strong> — estadísticas de uso agregadas.</li>
        </ul>
        <p>No vendemos ni cedemos tus datos personales a terceros con fines comerciales.</p>
      </LegalSection>

      <LegalSection title="Tus derechos (ARCO)">
        <p>
          Puedes solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos, así como revocar tu
          consentimiento, escribiendo a <strong>{LEGAL.email}</strong>. Atenderemos tu solicitud en los plazos de ley.
        </p>
      </LegalSection>

      <LegalSection title="Conservación y seguridad">
        <p>Conservamos los datos mientras tu cuenta esté activa o sea necesario para cumplir obligaciones legales. Aplicamos medidas de seguridad razonables; los teléfonos completos solo son visibles para usuarios con acceso pagado o autorizado.</p>
      </LegalSection>

      <LegalSection title="Cookies y analítica">
        <p>Usamos almacenamiento local para recordar tu sesión y preferencias (por ejemplo, el tema claro/oscuro) y Google Analytics para medir el uso de forma agregada. Puedes limitarlo desde la configuración de tu navegador.</p>
      </LegalSection>

      <LegalSection title="Contacto y reclamos">
        <p>
          Para consultas sobre privacidad escribe a {LEGAL.email}. Si deseas presentar un reclamo formal, usa nuestro{' '}
          <Link to="/reclamaciones">Libro de Reclamaciones</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
