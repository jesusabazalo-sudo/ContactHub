import { MessageCircle, TimerReset } from 'lucide-react';
import { APP_CONFIG } from '../config/app';
import { createWhatsAppUrl } from '../lib/whatsapp';

export default function PromosPage() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <div className="max-w-3xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-400/10 text-brand-400">
            <TimerReset className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Hoy los precios son estos. Mañana no prometo nada.
          </h1>
          <p className="mt-5 text-lg leading-8 text-gray-300">
            {APP_CONFIG.promo} Las condiciones cambian. Lo que hay hoy es lo que hay hoy.
          </p>
          <a
            href={createWhatsAppUrl('Hola, quiero aprovechar la promoción de ContactHub.')}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-8 inline-flex items-center gap-2 rounded-full bg-brand-400 px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
          >
            <MessageCircle className="h-4 w-4" />
            Preguntar por la promo
          </a>
        </div>
      </div>
    </section>
  );
}
