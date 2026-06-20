import { ArrowRight, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

function openChat(message?: string) {
  window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message } }));
}

export default function FinalCTA() {
  return (
    <section className="border-y border-border bg-canvas-subtle">
      <div className="container-shell grid lg:grid-cols-2">
        <div className="border-b border-border py-12 lg:border-b-0 lg:border-r lg:py-16 lg:pr-12">
          <p className="professional-kicker w-fit">
            <Send className="h-4 w-4" />
            Publica tu servicio
          </p>
          <h2 className="mt-5 max-w-xl font-display text-3xl font-bold leading-tight text-content sm:text-4xl">
            Haz que otras personas también puedan encontrarte.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-content-secondary">
            Si ofreces un servicio, recurso o solución útil, envíanos tu información. Revisamos cada publicación antes de incorporarla.
          </p>
          <Link to="/publica-tu-servicio" className="focus-ring mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-ink-950 transition hover:bg-emerald-100">
            Publicar mi servicio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="py-12 lg:py-16 lg:pl-12">
          <p className="professional-kicker w-fit">
            <MessageCircle className="h-4 w-4" />
            Orientación
          </p>
          <h2 className="mt-5 max-w-xl font-display text-3xl font-bold leading-tight text-content sm:text-4xl">
            ¿Aún no sabes qué carpeta elegir?
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-content-secondary">
            Cuéntanos qué quieres lograr. El soporte de ContactHub puede orientarte antes de registrarte o pagar.
          </p>
          <button
            type="button"
            onClick={() => openChat('Hola, quiero contar mi meta para que me orienten dentro de ContactHub.')}
            className="focus-ring mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-400/30 bg-brand-400/[0.08] px-5 text-sm font-bold text-brand-text transition hover:bg-brand-400/15"
          >
            Abrir chat de soporte
          </button>
        </div>
      </div>
    </section>
  );
}
