import { Link } from 'react-router-dom';

export default function ErrorPage() {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-panel p-8 text-center">
          <h1 className="font-display text-3xl font-bold text-white">Algo salió mal.</h1>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            Recarga la página si el problema continúa, o vuelve al inicio para seguir explorando ContactHub.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="focus-ring rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
            >
              Recargar página
            </button>
            <Link to="/" className="focus-ring rounded-full border border-line bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-brand-400/35">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
