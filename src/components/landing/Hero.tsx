import { ArrowRight, CheckCircle2, FolderOpen, Search, ShieldCheck } from 'lucide-react';
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
    <section className="hero-platform relative overflow-hidden border-b border-line">
      <div className="container-shell relative z-10 pb-12 pt-16 sm:pt-20 lg:pb-16 lg:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="professional-kicker mx-auto w-fit">
            <ShieldCheck className="h-4 w-4" />
            Plataforma organizada y acceso verificado
          </div>
          <h1 className="mt-7 font-display text-4xl font-bold leading-[1.06] text-white sm:text-5xl lg:text-7xl">
            Encuentra contactos que te acerquen a tus metas.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Explora categorías, prueba contactos gratis y desbloquea solo la información que realmente necesitas.
          </p>
          <GlobalSearch />
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/catalogo" className="focus-ring btn-primary-glow inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-400">
              Explorar catálogo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#como-funciona" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-6 text-sm font-bold text-white transition hover:border-brand-400/40 hover:bg-white/[0.07]">
              Cómo funciona
            </a>
            <button type="button" onClick={() => window.dispatchEvent(new Event('contacthub:open-trial'))} className="focus-ring inline-flex min-h-12 items-center justify-center rounded-lg border border-brand-400/25 bg-brand-400/[0.07] px-6 text-sm font-bold text-brand-400 transition hover:border-brand-400/50 hover:bg-brand-400/10">
              Probar 3 contactos gratis
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
            <span>{APP_CONFIG.contactsClaim} contactos organizados</span>
            <span>{APP_CONFIG.categoriesClaim} categorías</span>
            <span>Acceso desde {APP_CONFIG.startingPrice}</span>
          </div>
        </div>

        <div className="platform-frame mx-auto mt-12 max-w-6xl">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-400/20 bg-brand-400/10 text-brand-400">
                <FolderOpen className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Vista previa de ContactHub</p>
                <p className="text-xs text-slate-500">Información orientativa; los teléfonos siguen protegidos.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              Catálogo disponible
            </div>
          </div>

          <div className="grid lg:grid-cols-[0.95fr_1.3fr]">
            <div className="border-b border-line p-4 lg:border-b-0 lg:border-r lg:p-6">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-500">
                <Search className="h-4 w-4 text-brand-400" />
                Buscar por meta, servicio o categoría
              </div>
              <div className="mt-4 grid gap-2">
                {folders.map((folder, index) => (
                  <div key={folder.order} className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${index === 0 ? 'border-brand-400/30 bg-brand-400/[0.08]' : 'border-white/[0.07] bg-white/[0.025]'}`}>
                    <span className="font-mono text-xs font-bold text-brand-400">{folder.order}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{folder.name}</p>
                      <p className="truncate text-xs text-slate-500">{folder.detail}</p>
                    </div>
                    <span className="text-xs text-slate-500">{folder.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-400">Tu progreso de acceso</p>
                  <p className="mt-2 text-xl font-bold text-white">Empieza explorando con tranquilidad</p>
                </div>
                <span className="rounded-lg border border-brand-400/20 bg-brand-400/10 px-3 py-1 text-xs font-bold text-brand-400">0 de 24</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full w-[8%] rounded-full bg-brand-500" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {contacts.map((contact) => (
                  <div key={contact.name} className="rounded-lg border border-white/[0.08] bg-black/15 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-white">{contact.name}</p>
                      <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    </div>
                    <p className="mt-3 font-mono text-sm text-slate-400">{contact.phone}</p>
                    <p className="mt-2 text-xs text-slate-500">{contact.status} hasta activar acceso</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4 text-xs text-slate-500">
                <span>Sin datos privados expuestos</span>
                <span className="font-semibold text-brand-400">Ver catálogo completo →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
