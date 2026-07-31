import { Link } from 'react-router-dom';
import { pricingPlans } from '../../data/pricing';
import PricingCard from '../pricing/PricingCard';
import SectionHeading from '../ui/SectionHeading';

const homePlanIds = ['individual', 'fast-track', 'elite-total'];
const homePlans = homePlanIds.map((id) => pricingPlans.find((plan) => plan.id === id)).filter(Boolean) as typeof pricingPlans;

export default function PricingPreview() {
  return (
    <section className="section-pad section-band">
      <div className="container-shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading eyebrow="Precios" title="Elige tu plan" />
          <Link to="/precios" className="text-sm font-bold text-brand-text transition hover:text-content">
            Ver todos los planes
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {homePlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} compact />
          ))}
        </div>
      </div>
    </section>
  );
}
