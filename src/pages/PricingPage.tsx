import PromoSection from '../components/landing/PromoSection';
import PricingCard from '../components/pricing/PricingCard';
import SectionHeading from '../components/ui/SectionHeading';
import { APP_CONFIG } from '../config/app';
import { pricingPlans } from '../data/pricing';

export default function PricingPage() {
  return (
    <>
      <section className="section-pad bg-ink-950">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Precios"
            title="Elige un acceso según tu objetivo"
            description="Puedes explorar gratis primero. Si decides avanzar, el chat te orienta y el admin activa tus carpetas después de validar pago o recompensa."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
          <p className="mt-6 rounded-lg border border-line bg-white/5 p-4 text-sm leading-6 text-gray-300">
            {APP_CONFIG.promo}
          </p>
        </div>
      </section>
      <PromoSection />
    </>
  );
}
