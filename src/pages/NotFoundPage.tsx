import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center sm:p-12">
          <p className="font-display text-7xl font-bold text-brand-text sm:text-8xl">404</p>
          <h1 className="mt-4 font-display text-2xl font-bold text-content sm:text-3xl">Esta página no existe.</h1>
          <p className="mt-4 text-sm leading-6 text-content-secondary">
            Puede que el link esté roto o la página haya sido movida.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-contrast transition hover:bg-brand-hover"
            >
              Volver al inicio
            </Link>
            <Link
              to="/catalogo"
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-muted px-5 py-3 text-sm font-bold text-content transition hover:border-brand/40"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
