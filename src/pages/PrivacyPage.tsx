import SectionHeading from '../components/ui/SectionHeading';

const items = [
  ['Datos que recopilamos', 'Correo, nombre si lo proporcionas, teléfono/WhatsApp si lo guardas, comprobantes que subes y mensajes de soporte necesarios para gestionar tu cuenta.'],
  ['Para qué se usan', 'Tu correo guarda accesos, prueba gratis, comprobantes y soporte. No usamos estos datos para publicarlos ni venderlos.'],
  ['Pagos y comprobantes', 'Los comprobantes se revisan manualmente para activar accesos. Nunca pedimos claves bancarias, códigos privados ni contraseñas externas.'],
  ['Privacidad', 'No vendemos información personal. Los datos privados se usan solo para operar ContactHub y proteger lo que desbloqueas.'],
];

export default function PrivacyPage() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <SectionHeading eyebrow="Privacidad" title="Uso claro de tus datos" description="Tu correo funciona como llave para guardar tus accesos. Esta página resume qué usamos y por qué." />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map(([title, text]) => (
            <article key={title} className="professional-card p-6">
              <h2 className="text-lg font-bold text-content">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-content-secondary">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
