import { Link } from 'react-router-dom';
import { pricingPlans } from '../../data/pricing';
import PricingCard from '../pricing/PricingCard';
import SectionHeading from '../ui/SectionHeading';

export default function PricingPreview() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Planes"
            title="Elige el nivel de acceso que realmente necesitas"
            description="La compra se confirma por WhatsApp/Yape y el acceso se activa manualmente desde el panel interno."
          />
          <Link to="/precios" className="text-sm font-bold text-brand-400 transition hover:text-white">
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
