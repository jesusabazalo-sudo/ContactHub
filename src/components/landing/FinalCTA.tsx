import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell text-center">
        <p className="text-sm font-semibold uppercase text-brand-400">La única pregunta que importa:</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
          ¿Cuánto más vas a esperar para tener lo que ya está aquí listo para ti?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-base leading-7 text-gray-300">
          {'No te estoy pidiendo que confíes en mí. Te estoy dando 3 contactos gratis para que lo veas tú mismo.'}
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('contacthub:open-trial'))}
          className="focus-ring mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-brand-400 px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
        >
          Ver mis 3 contactos gratis
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-4 text-xs text-gray-500">Desde S/20 por carpeta · S/360 acceso total · Yape / Plin / WhatsApp</p>
      </div>
    </section>
  );
}
