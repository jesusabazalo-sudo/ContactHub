import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';

type AdminPlaceholderPageProps = {
  title: string;
};

export default function AdminPlaceholderPage({ title }: AdminPlaceholderPageProps) {
  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-panel p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-400/10 text-brand-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-white">{title}</h1>
          <p className="mt-4 text-base leading-7 text-gray-300">Ruta admin protegida y lista para la siguiente fase.</p>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            AdminGuard ya valida sesión y rol con Supabase. Esta sección específica queda reservada para fases posteriores.
            El correo administrativo se configura con `VITE_OWNER_ADMIN_EMAIL` y actualmente apunta a `{APP_CONFIG.ownerAdminEmail}`.
          </p>
          <Link
            to="/"
            className="focus-ring mt-8 inline-flex rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
