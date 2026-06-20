import SectionHeading from '../components/ui/SectionHeading';

export default function LegalPage() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <SectionHeading eyebrow="Legal" title="Política de uso, privacidad y términos" />
        <div className="mt-10 grid gap-4">
          <article className="rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-content">Uso permitido</h2>
            <p className="mt-3 text-sm leading-6 text-content-secondary">
              ContactHub organiza información comercial y recursos digitales. No se permite publicar ni vender contactos relacionados con fraude,
              falsificación, espionaje, doxeo, malware, acceso no autorizado, sustancias reguladas o actividades ilegales.
            </p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-content">Acceso privado</h2>
            <p className="mt-3 text-sm leading-6 text-content-secondary">
              Los teléfonos completos deben vivir en Supabase con RLS. El frontend público solo debe recibir datos seguros, previews y teléfonos
              ocultos cuando el usuario no tenga acceso.
            </p>
          </article>
          <article id="privacidad" className="scroll-mt-28 rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-content">Privacidad</h2>
            <p className="mt-3 text-sm leading-6 text-content-secondary">
              Usamos tu correo solo para gestionar tu cuenta, guardar tus accesos, asociar comprobantes de pago y darte soporte. No vendemos tu información,
              no compartimos tu correo y no publicamos tus datos personales.
            </p>
          </article>
          <article id="uso-de-datos" className="scroll-mt-28 rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-content">Uso de datos</h2>
            <p className="mt-3 text-sm leading-6 text-content-secondary">
              Tu correo funciona como una llave de acceso: permite saber qué carpetas tienes desbloqueadas, guardar tu prueba gratis, revisar comprobantes y
              proteger lo que desbloqueas dentro de ContactHub.
            </p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-content">Activación manual</h2>
            <p className="mt-3 text-sm leading-6 text-content-secondary">
              En esta primera versión, la compra se coordina por el chat de ContactHub y el acceso se otorga manualmente desde administración después de
              confirmar el pago.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
