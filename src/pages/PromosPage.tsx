import { TimerReset } from 'lucide-react';
import PromoOffers from '../components/promos/PromoOffers';

export default function PromosPage() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <div className="max-w-3xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-400/10 text-brand-text">
            <TimerReset className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-content sm:text-5xl">
            Promociones ContactHub
          </h1>
          <p className="mt-5 text-lg leading-8 text-content-secondary">
            Las promos se activan lunes, miércoles y viernes. Si hoy aparece activa, aprovéchala antes de que el contador llegue a cero.
          </p>
        </div>
        <div className="mt-8">
          <PromoOffers />
        </div>
      </div>
    </section>
  );
}
