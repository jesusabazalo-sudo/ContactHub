import { ArrowRight, CheckCircle2, FolderOpen, Lock, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import GlobalSearch from '../search/GlobalSearch';

const folders = [
  { order: '01', name: 'Elite Business', detail: 'Negocios y proveedores', count: '42' },
  { order: '02', name: 'IA Masters', detail: 'IA y herramientas digitales', count: '68' },
  { order: '03', name: 'Knowledge Vault', detail: 'Educación y cursos', count: '56' },
];

const contacts = [
  { name: 'Proveedor especializado', phone: '+51 9•• ••• •••', status: 'Protegido' },
  { name: 'Servicio profesional', phone: '+51 9•• ••• •••', status: 'Protegido' },
];

export default function Hero() {
  return (
    <section className="hero-platform relative overflow-hidden border-b border-border">
      <div className="container-shell relative z-10 pb-16 pt-16 sm:pt-24 lg:pb-20 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="professional-kicker mx-auto w-fit">
            <ShieldCheck className="h-3.5 w-3.5" />
            Plataforma organizada y acceso verificado
          </div>
          <h1 className="mt-7 font-display text-[2.5rem] font-bold leading-[1.05] tracking-tight text-content sm:text-6xl lg:text-7xl">
            Encuentra contactos que te acerquen a tus metas.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-content-secondary">
            Explora categorías, prueba contactos gratis y desbloquea solo la información que realmente necesitas.
          </p>
          <GlobalSearch />
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/catalogo"
              className="btn-primary-glow focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-brand-contrast"
            >
              Explorar catálogo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('contacthub:open-trial'))}
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-surface px-6 text-sm font-semibold text-content transition hover:border-brand/40"
            >
              Probar 3 contactos gratis
            </button>
            <a
              href="#como-funciona"
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-lg px-6 text-sm font-semibold text-content-secondary transition hover:text-content"
            >
              Cómo funciona
            </a>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-content-muted">
            <span>{APP_CONFIG.contactsClaim} contactos organizados</span>
            <span className="hidden h-1 w-1 rounded-full bg-content-muted sm:block" />
            <span>{APP_CONFIG.categoriesClaim} categorías</span>
            <span className="hidden h-1 w-1 rounded-full bg-content-muted sm:block" />
            <span>Acceso desde {APP_CONFIG.startingPrice}</span>
          </div>
        </div>

        <div className="platform-frame mx-auto mt-14 max-w-6xl">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand-text">
                <FolderOpen className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-content">Vista previa de ContactHub</p>
                <p className="text-xs text-content-muted">Información orientativa; los teléfonos siguen protegidos.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-text">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Catálogo disponible
            </div>
          </div>

          <div className="grid lg:grid-cols-[0.95fr_1.3fr]">
            <div className="border-b border-border p-4 lg:border-b-0 lg:border-r lg:p-6">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-content-muted">
                <Search className="h-4 w-4 text-brand-text" />
                Buscar por meta, servicio o categoría
              </div>
              <div className="mt-4 grid gap-2">
                {folders.map((folder, index) => (
                  <div
                    key={folder.order}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-3 transition ${
                      index === 0 ? 'border-brand/30 bg-brand/[0.07]' : 'border-border bg-surface'
                    }`}
                  >
                    <span className="font-mono text-xs font-semibold text-brand-text">{folder.order}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-content">{folder.name}</p>
                      <p className="truncate text-xs text-content-muted">{folder.detail}</p>
                    </div>
                    <span className="text-xs text-content-muted">{folder.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">Tu progreso de acceso</p>
                  <p className="mt-2 text-xl font-semibold text-content">Empieza explorando con tranquilidad</p>
                </div>
                <span className="rounded-lg border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">0 de 24</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[8%] rounded-full bg-brand" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {contacts.map((contact) => (
                  <div key={contact.name} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-content">{contact.name}</p>
                      <CheckCircle2 className="h-4 w-4 text-brand-text" />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-content-muted" />
                      <p className="font-mono text-sm text-content-secondary">{contact.phone}</p>
                    </div>
                    <p className="mt-2 text-xs text-content-muted">{contact.status} hasta activar acceso</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4 text-xs text-content-muted">
                <span>Sin datos privados expuestos</span>
                <Link to="/catalogo" className="font-semibold text-brand-text transition hover:opacity-80">
                  Ver catálogo completo →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
