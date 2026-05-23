import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

function openChat(message?: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
  window.setTimeout(() => {
    document.querySelector('[data-contacthub-chat]')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 50);
}

export default function FinalCTA() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell text-center">
        <p className="text-sm font-semibold uppercase text-brand-400">Empieza con claridad</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
          Dime qué quieres lograr y te ayudamos a encontrar por dónde empezar.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-300">
          No tienes que comprar algo a ciegas. Puedes crear tu cuenta gratis, explorar categorías, probar contactos y ganar recompensas con misiones.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/auth"
            className="focus-ring btn-primary-glow inline-flex items-center justify-center gap-2 rounded-full bg-brand-400 px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
          >
            Crear cuenta gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => openChat('Hola, quiero contar mi meta para que me orienten dentro de ContactHub.')}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:border-brand-400/50 hover:bg-brand-400/10"
          >
            <MessageCircle className="h-4 w-4" />
            Hablar por chat
          </button>
        </div>
        <p className="mx-auto mt-5 max-w-xl text-xs leading-5 text-gray-500">
          Si ahora no puedes pagar, igual puedes empezar: explora el catálogo y completa misiones para ganar contactos extra.
        </p>
      </div>
    </section>
  );
}
