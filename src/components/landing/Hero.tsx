import { ArrowRight, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import Badge from '../ui/Badge';

const stats = [
  { label: 'Contactos y oportunidades', value: APP_CONFIG.contactsClaim },
  { label: 'Categorías', value: APP_CONFIG.categoriesClaim },
  { label: 'Desde', value: APP_CONFIG.startingPrice },
];

export default function Hero() {
  return (
    <section className="hero-gradient dopamine-surface relative overflow-hidden bg-radial-grid">
      <div className="pointer-events-none absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-violet/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-64 w-64 rounded-full bg-accent-cyan/10 blur-3xl" />
      <div className="container-shell grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-[1fr_0.9fr] lg:py-20">
        <div className="float-in max-w-4xl">
          <Badge>Contactos organizados por metas reales</Badge>
          <h1 className="mt-7 font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-7xl">
            Encuentra contactos y oportunidades que <span className="neon-text">te acerquen a tus metas.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            Tu meta puede necesitar una persona, una clase, un proveedor, un cliente o una oportunidad. Explora lo que necesitas, desbloquea lo que te sirve y empieza a moverte.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/catalogo" className="focus-ring btn-primary-glow inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-400 via-accent-cyan to-brand-500 px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-white">
              Explorar oportunidades
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => window.dispatchEvent(new Event('contacthub:open-trial'))} className="focus-ring inline-flex items-center justify-center rounded-full border border-brand-400/25 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-brand-400/55 hover:bg-brand-400/10 hover:shadow-[0_0_26px_rgba(34,197,94,0.16)]">
              Probar contactos gratis
            </button>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-gray-400">
            Si ahora no puedes pagar, igual puedes crear tu cuenta gratis, explorar el catálogo y ganar contactos extra con misiones revisadas manualmente.
          </p>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="count-up dopamine-card neon-edge rounded-xl p-4">
                <div className="stat-number font-display text-2xl font-bold">{stat.value}</div>
                <div className="mt-1 text-xs font-medium uppercase text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-brand-400/10 blur-3xl" />
          <div className="dopamine-card neon-edge relative overflow-hidden rounded-3xl shadow-glow backdrop-blur-xl">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Dime qué quieres lograr</p>
                  <p className="text-xs text-gray-500">La plataforma te ayuda a ubicar por dónde empezar</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-brand-400" />
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="shimmer-soft flex items-center gap-3 rounded-2xl border border-brand-400/20 bg-white/[0.04] px-4 py-3">
                <Search className="h-4 w-4 text-brand-400" />
                <span className="text-sm text-gray-400">Buscar cursos, proveedores, servicios, ventas...</span>
              </div>
              {['Aprender algo', 'Buscar proveedores', 'Vender más', 'Explorar oportunidades'].map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.025] p-3 transition hover:border-brand-400/25 hover:bg-brand-400/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400/20 to-accent-violet/20 text-brand-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item}</p>
                      <p className="text-xs text-gray-500">Teléfonos protegidos hasta desbloquear</p>
                    </div>
                  </div>
                  <span className="premium-chip rounded-full px-3 py-1 text-xs font-semibold">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
