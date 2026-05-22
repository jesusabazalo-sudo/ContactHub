import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const yapePlinUrl =
  'https://wa.me/51963187899?text=Hola%2C+quiero+hacer+un+pago+por+Yape%2FPlin+para+acceder+a+ContactHub.';

function openChat() {
  window.dispatchEvent(new Event('contacthub:open-chat'));
  window.setTimeout(() => {
    document.querySelector('[data-contacthub-chat]')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 50);
}

export default function FinalCTA() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell text-center">
        <p className="text-sm font-semibold uppercase text-brand-400">La única pregunta que importa:</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
          ¿Cuánto más vas a esperar para tener lo que ya está aquí listo para ti?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-base leading-7 text-gray-300">
          No te estoy pidiendo que confíes en mí. Te estoy dando 3 contactos gratis para que lo veas tú mismo.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/auth"
            className="focus-ring btn-primary-glow inline-flex items-center justify-center gap-2 rounded-full bg-brand-400 px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
          >
            Quiero acceso ahora
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={yapePlinUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:border-brand-400/50 hover:bg-brand-400/10"
          >
            💜 Pagar por Yape / Plin
          </a>
        </div>
        <p className="mx-auto mt-5 max-w-xl text-xs leading-5 text-gray-500">
          🔒 ¿Prefieres más información antes de pagar?{' '}
          <button type="button" onClick={openChat} className="font-semibold text-brand-400 underline-offset-4 hover:underline">
            Escríbenos por el chat
          </button>{' '}
          — te brindamos nuestro WhatsApp para mayor confianza y seguridad.
        </p>
        <p className="mt-4 text-xs text-gray-500">
          <MessageCircle className="mr-1 inline h-3.5 w-3.5" />
          Desde S/20 por carpeta · S/360 acceso total · Yape / Plin / WhatsApp
        </p>
      </div>
    </section>
  );
}
