import PromoSection from '../components/landing/PromoSection';
import PricingCard from '../components/pricing/PricingCard';
import SectionHeading from '../components/ui/SectionHeading';
import { pricingPlans } from '../data/pricing';

export default function PricingPage() {
  return (
    <>
      <section className="section-pad bg-ink-950">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Opciones de acceso"
            title="Elige segun tu objetivo, no por presion"
            description="Puedes explorar gratis primero. Si decides avanzar, el chat te orienta y el admin activa tus carpetas despues de validar pago, prueba o recompensa."
          />
          <div className="mt-6 rounded-2xl border border-brand-400/20 bg-brand-400/10 p-5 text-sm leading-6 text-gray-300">
            <p className="font-bold text-white">Antes de pagar, revisa esto:</p>
            <p className="mt-2">
              Los pagos se revisan manualmente. ContactHub no pide claves bancarias, codigos privados ni contrasenas externas. Si tienes dudas, abre el chat y pide orientacion antes de enviar un comprobante.
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
