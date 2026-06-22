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
        <div className="mt-10 grid gap-4 lg:grid-cols-5">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} compact />
          ))}
        </div>
      </div>
    </section>
  );
}
