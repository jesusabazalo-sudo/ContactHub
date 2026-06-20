import { Link } from 'react-router-dom';

export default function ErrorPage() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 text-center">
          <h1 className="font-display text-3xl font-bold text-content">Algo salio mal.</h1>
          <p className="mt-4 text-sm leading-6 text-content-secondary">
            Puedes volver al inicio o seguir explorando el catalogo sin recargar toda la app.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="focus-ring rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
            >
              Volver al inicio
            </Link>
            <Link
              to="/catalogo"
              className="focus-ring rounded-full border border-border bg-muted px-5 py-3 text-sm font-bold text-content transition hover:border-brand-400/35"
            >
              Ir al catalogo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
