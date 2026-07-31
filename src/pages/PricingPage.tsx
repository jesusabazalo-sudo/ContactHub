import PromoSection from '../components/landing/PromoSection';
import PricingCard from '../components/pricing/PricingCard';
import PricingFAQ from '../components/pricing/PricingFAQ';
import PricingSteps from '../components/pricing/PricingSteps';
import TrustBadges from '../components/pricing/TrustBadges';
import SectionHeading from '../components/ui/SectionHeading';
import { pricingPlans } from '../data/pricing';

function openSupport(message: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

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
          <div className="mt-8">
            <TrustBadges />
          </div>
          <PricingSteps />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {pricingPlans.map((plan, index) => (
              <div key={plan.id} className="float-in h-full" style={{ animationDelay: `${index * 70}ms` }}>
                <PricingCard plan={plan} />
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-content-secondary">¿Tienes dudas sobre qué elegir?</p>
            <button
              type="button"
              onClick={() => openSupport('Hola, quiero consultar antes de pagar en ContactHub.')}
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-6 text-sm font-bold text-content transition hover:bg-brand-400"
            >
              Consultar antes de pagar
            </button>
          </div>
        </div>
      </section>
      <PricingFAQ />
      <PromoSection />
    </>
  );
}
