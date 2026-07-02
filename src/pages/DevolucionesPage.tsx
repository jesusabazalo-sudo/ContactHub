import { Link } from 'react-router-dom';
import LegalLayout, { LegalSection } from '../components/legal/LegalLayout';
import { LEGAL } from '../config/app';

export default function DevolucionesPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Política de Devoluciones"
      intro="ContactHub ofrece un servicio digital de acceso inmediato a información de contacto. Esta política explica cuándo procede o no una devolución."
    >
      <LegalSection title="Servicio digital de consumo inmediato">
        <p>
          Al desbloquear una carpeta o contacto, el <strong>teléfono completo se revela de inmediato</strong>. En ese momento
          el servicio se considera <strong>prestado y consumido</strong>, ya que el valor que compras es el acceso a esa
          información.
        </p>
      </LegalSection>

      <LegalSection title="Regla general">
        <p>
          Por la naturaleza del servicio, <strong>no procede la devolución del dinero una vez revelado el teléfono</strong>.
          Recomendamos usar la <strong>prueba gratuita</strong> y revisar la información disponible antes de comprar.
        </p>
      </LegalSection>

      <LegalSection title="Excepciones (sí procede devolución)">
        <p>Devolvemos o corregimos el cobro cuando exista un <strong>error comprobable</strong>, por ejemplo:</p>
        <ul>
          <li>Cobro duplicado por el mismo acceso.</li>
          <li>Pago realizado pero el acceso no se activó y no pudimos resolverlo.</li>
          <li>Falla técnica que impidió mostrar el contenido pagado.</li>
          <li>Cobro por un monto distinto al del plan elegido.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Cómo solicitar una devolución">
        <ul>
          <li>Escríbenos a <strong>{LEGAL.email}</strong> o por el chat de soporte dentro de las <strong>48 horas</strong> del cobro.</li>
          <li>Indica tu correo de la cuenta, la fecha del pago y el comprobante o número de operación.</li>
          <li>Responderemos tu solicitud y, si corresponde, procesaremos la devolución por el mismo medio de pago en un plazo razonable.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Tus derechos como consumidor">
        <p>
          Esta política respeta el Código de Protección y Defensa del Consumidor (Perú). Si no estás conforme con la
          respuesta, puedes registrar tu caso en nuestro{' '}
          <Link to="/reclamaciones">Libro de Reclamaciones</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
