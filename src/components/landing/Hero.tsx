import { ArrowRight, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import Badge from '../ui/Badge';

const stats = [
  { label: 'Contactos', value: APP_CONFIG.contactsClaim },
  { label: 'Categorías', value: APP_CONFIG.categoriesClaim },
  { label: 'Desde', value: APP_CONFIG.startingPrice },
];

export default function Hero() {
  return (
    <section className="hero-gradient relative overflow-hidden bg-radial-grid">
      <div className="container-shell grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-[1fr_0.9fr] lg:py-20">
        <div className="max-w-4xl">
          <Badge>La información que otros no comparten</Badge>
          <h1 className="mt-7 font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-7xl">
            La mayoría pierde semanas buscando <span className="text-brand-400">lo que tú encontrarás en 5 minutos.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            Hay personas que llevan meses buscando exactamente lo que está aquí organizado. No tienen que saberlo — pero tú ya lo sabes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/catalogo" className="focus-ring btn-primary-glow inline-flex items-center justify-center gap-2 rounded-full bg-brand-400 px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-white">
              Déjame ver qué hay
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => window.dispatchEvent(new Event('contacthub:open-trial'))} className="focus-ring inline-flex items-center justify-center rounded-full border border-line bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:border-brand-400/40 hover:bg-brand-400/10">
              Quiero ver si esto me sirve
            </button>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-line bg-white/5 p-4 count-up">
                <div className="stat-number font-display text-2xl font-bold">{stat.value}</div>
                <div className="mt-1 text-xs font-medium uppercase text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-brand-400/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-900/88 shadow-glow backdrop-blur-xl">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Vista de catálogo</p>
                  <p className="text-xs text-gray-500">Acceso privado preparado con Supabase</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-brand-400" />
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.03] px-4 py-3">
                <Search className="h-4 w-4 text-brand-400" />
                <span className="text-sm text-gray-400">Buscar proveedores, cursos, IA, importación...</span>
              </div>
              {['IA & Tech', 'Marketing Digital', 'Importación & Mayoristas', 'Recursos para Emprendedores'].map((item, index) => (
                <div key={item} className="flex items-center justify-between border-b border-line pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-400/10 text-brand-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item}</p>
                      <p className="text-xs text-gray-500">Preview visible, teléfonos protegidos</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-gray-300">{28 + index}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
