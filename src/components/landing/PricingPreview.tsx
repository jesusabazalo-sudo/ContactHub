import { Link } from 'react-router-dom';
import { pricingPlans } from '../../data/pricing';
import PricingCard from '../pricing/PricingCard';
import SectionHeading from '../ui/SectionHeading';

export default function PricingPreview() {
  return (
    <section className="section-pad section-band">
      <div className="container-shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Planes"
            title="Opciones transparentes para avanzar a tu ritmo"
            description="Compara con calma, pregunta por chat y activa solo las carpetas que realmente encajan con tu objetivo."
          />
          <Link to="/precios" className="text-sm font-bold text-brand-text transition hover:text-content">
            Comparar todos los planes
          </Link>
        </div>
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:grid sm:snap-none sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
          {pricingPlans.map((plan) => (
            <div key={plan.id} className="min-w-[280px] flex-shrink-0 snap-center sm:min-w-0">
              <PricingCard plan={plan} compact />
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-content-muted sm:hidden">← desliza para ver más →</p>
      </div>
    </section>
  );
}
