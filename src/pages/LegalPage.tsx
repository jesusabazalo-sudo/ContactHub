import SectionHeading from '../components/ui/SectionHeading';

export default function LegalPage() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <SectionHeading eyebrow="Legal" title="Política de uso, privacidad y términos" />
        <div className="mt-10 grid gap-4">
          <article className="rounded-lg border border-line bg-panel p-6">
            <h2 className="text-lg font-bold text-white">Uso permitido</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              ContactHub organiza información comercial y recursos digitales. No se permite publicar ni vender contactos relacionados con fraude,
              falsificación, espionaje, doxeo, malware, acceso no autorizado, sustancias reguladas o actividades ilegales.
            </p>
          </article>
          <article className="rounded-lg border border-line bg-panel p-6">
            <h2 className="text-lg font-bold text-white">Acceso privado</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Los teléfonos completos deben vivir en Supabase con RLS. El frontend público solo debe recibir datos seguros, previews y teléfonos
              ocultos cuando el usuario no tenga acceso.
            </p>
          </article>
          <article className="rounded-lg border border-line bg-panel p-6">
            <h2 className="text-lg font-bold text-white">Activación manual</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              En esta primera versión, la compra se coordina por WhatsApp/Yape y el acceso se otorga manualmente desde administración después de
              confirmar el pago.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
