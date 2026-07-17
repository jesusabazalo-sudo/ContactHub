import { ArrowRight, TimerReset } from 'lucide-react';
import { Link } from 'react-router-dom';
import PromoOffers from '../promos/PromoOffers';

export default function PromoSection() {
  return (
    <section className="bg-surface py-12">
      <div className="container-shell">
        <div className="grid gap-6 rounded-2xl border border-brand-400/20 bg-brand-400/10 p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-400 text-ink-950">
            <TimerReset className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-content">Hoy los precios son estos.</h2>
            <p className="mt-2 text-sm leading-6 text-content-secondary">Mañana no prometo nada.</p>
          </div>
          <Link to="/promos" className="focus-ring btn-primary-glow inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-contrast transition hover:bg-brand-hover">
            Ver promociones
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6">
          <PromoOffers compact />
        </div>
      </div>
    </section>
  );
}
