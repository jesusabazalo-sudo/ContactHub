import { ArrowRight, CheckCircle2, FolderOpen, Lock, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import { useAuth } from '../../features/auth/AuthProvider';
import { useCountUp } from '../../hooks/useCountUp';
import { supabase } from '../../lib/supabaseClient';
import GlobalSearch from '../search/GlobalSearch';

const TOTAL_FOLDERS = 24;
const CONTACTS_COUNT_TARGET = Number(APP_CONFIG.contactsClaim.replace(/\D/g, '')) || 0;

type HeroFolder = { order: string; name: string; detail: string; count: string };

const fallbackFolders: HeroFolder[] = [
  { order: '01', name: 'Elite Business', detail: 'Negocios y proveedores', count: '42' },
  { order: '02', name: 'IA Masters', detail: 'IA y herramientas digitales', count: '68' },
  { order: '03', name: 'Knowledge Vault', detail: 'Educación y cursos', count: '56' },
];

const contacts = [
  { name: 'Proveedor especializado', phone: '+51 9•• ••• •••', status: 'Protegido' },
  { name: 'Servicio profesional', phone: '+51 9•• ••• •••', status: 'Protegido' },
];

function humanizeSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Formatea con punto de millar (1400 -> "1.400"), sin depender de datos ICU del locale del navegador. */
function formatThousands(value: number) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function Hero() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<HeroFolder[] | null>(null);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const { value: contactsCount, ref: contactsStatRef } = useCountUp<HTMLSpanElement>({
    end: CONTACTS_COUNT_TARGET,
    duration: 1500,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadUnlockedCount() {
      if (!user?.id || !supabase) {
        if (!cancelled) setUnlockedCount(0);
        return;
      }
      const { count, error } = await supabase
        .from('user_category_access')
        .select('category_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) {
        console.error('Hero unlocked count:', error.message);
        return;
      }
      if (!cancelled) setUnlockedCount(count ?? 0);
    }

    void loadUnlockedCount();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadFolders() {
      if (!supabase) {
        if (!cancelled) setFolders(fallbackFolders);
        return;
      }
      try {
        const { data: categories, error } = await supabase
          .from('categories')
          .select('id, name, slug, icon')
          .eq('is_active', true)
          .order('name')
          .limit(3);
        if (error || !categories?.length) throw error ?? new Error('Sin categorías activas');

        const withCounts = await Promise.all(
          categories.map(async (category, index) => {
            const { count } = await supabase!
              .from('contacts')
              .select('category_id', { count: 'exact', head: true })
              .eq('status', 'active')
              .eq('category_id', category.id);
            return {
              order: String(index + 1).padStart(2, '0'),
              name: category.name,
              detail: humanizeSlug(category.slug),
              count: String(count ?? 0),
            };
          }),
        );
        if (!cancelled) setFolders(withCounts);
      } catch (loadError) {
        console.error('Hero folders load:', loadError);
        if (!cancelled) setFolders(fallbackFolders);
      }
    }

    void loadFolders();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="hero-platform relative overflow-hidden border-b border-border">
      <div className="hero-aurora" aria-hidden="true" />
      <div className="hero-dots" aria-hidden="true" />
      <div className="hero-particles" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>
      <div className="container-shell relative z-10 pb-16 pt-16 sm:pt-24 lg:pb-20 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="professional-kicker mx-auto w-fit">
            <ShieldCheck className="h-3.5 w-3.5" />
            Plataforma organizada y acceso verificado
          </div>
          <h1 className="mt-7 font-display text-[2.5rem] font-bold leading-[1.05] tracking-tight text-content sm:text-6xl lg:text-7xl">
            <span className="gradient-heading">Encuentra</span> contactos que te acerquen a tus metas.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-content-secondary">
            Explora categorías, prueba contactos gratis y desbloquea solo la información que realmente necesitas.
          </p>
          <GlobalSearch />
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/catalogo"
              className="btn-primary-glow btn-glow-animated focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-brand-contrast"
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
            <span ref={contactsStatRef}>
              {formatThousands(contactsCount)}
              {contactsCount >= CONTACTS_COUNT_TARGET ? '+' : ''} contactos organizados
            </span>
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
                {folders === null
                  ? [0, 1, 2].map((skeletonIndex) => (
                      <div key={skeletonIndex} className="h-[60px] animate-pulse rounded-lg border border-border bg-muted" />
                    ))
                  : folders.map((folder, index) => (
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
                <span className="rounded-lg border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">
                  {unlockedCount} de {TOTAL_FOLDERS}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${Math.max(4, Math.min(100, Math.round((unlockedCount / TOTAL_FOLDERS) * 100)))}%` }}
                />
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
