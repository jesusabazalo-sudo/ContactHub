import PromoSection from '../components/landing/PromoSection';
import PricingCard from '../components/pricing/PricingCard';
import SectionHeading from '../components/ui/SectionHeading';
import { pricingPlans } from '../data/pricing';

export default function PricingPage() {
  return (
    <>
      <section className="section-pad section-band">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Opciones de acceso"
            title="Accesos claros para necesidades distintas"
            description="Explora primero y elige después. Cada opción indica cuántas carpetas incluye y el acceso se activa tras una verificación."
          />
          <div className="mt-6 rounded-lg border border-brand-400/15 bg-brand-400/[0.05] p-5 text-sm leading-6 text-gray-300">
            <p className="font-bold text-white">Proceso transparente</p>
            <p className="mt-2">
              Los pagos se revisan manualmente. ContactHub no pide claves bancarias, codigos privados ni contrasenas externas. Si tienes dudas, abre el chat y pide orientacion antes de enviar un comprobante.
            </p>
            <p className="mt-2 font-semibold text-brand-400">
              Paga solo si ya tienes claro qué carpeta o acceso quieres. Si tienes dudas, usa el chat antes.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>
      <PromoSection />
    </>
  );
}
