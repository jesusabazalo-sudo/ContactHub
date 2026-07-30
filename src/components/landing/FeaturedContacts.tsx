import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface FeaturedContact {
  id: string;
  name: string;
  description: string;
  category_name: string;
  category_icon: string;
  category_slug: string;
  category_id: string;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 60 * 1000; // 5 horas — la rotación real la hace la función de Supabase

function FeaturedContactCard({ contact }: { contact: FeaturedContact }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-brand-400/30 hover:shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs uppercase tracking-wide text-content-muted">
          <span aria-hidden="true">{contact.category_icon}</span>
          <span className="truncate">{contact.category_name}</span>
        </span>
        <span className="flex-shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-text">Destacado</span>
      </div>
      <p className="mt-3 truncate font-semibold text-content">{contact.name}</p>
      <p className="mt-1 line-clamp-2 text-sm text-content-secondary">{contact.description}</p>
      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => navigate(`/catalogo/${contact.category_slug}`)}
          className="focus-ring w-full rounded-lg border border-border px-3 py-2 text-xs font-semibold text-content transition hover:border-brand-400/40 hover:text-brand-text"
        >
          Ver contacto →
        </button>
      </div>
    </div>
  );
}

function FeaturedContactSkeleton() {
  return <div className="h-[164px] animate-pulse rounded-xl border border-border bg-muted" />;
}

export default function FeaturedContacts() {
  const [contacts, setContacts] = useState<FeaturedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedContacts() {
      if (!supabase) {
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }
      try {
        const { data, error } = await supabase.rpc('get_featured_contacts');
        if (cancelled) return;
        if (error) throw error;
        setContacts(data ?? []);
        setHasError(false);
      } catch (error) {
        if (import.meta.env.DEV) console.warn('FeaturedContacts:', error);
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadFeaturedContacts();
    const interval = window.setInterval(() => void loadFeaturedContacts(), REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (hasError) return null;

  return (
    <section className="section-pad bg-canvas-subtle">
      <div className="container-shell">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-text">Contactos destacados</p>
            <h2 className="font-display text-2xl font-bold text-content sm:text-3xl">Lo que puedes encontrar hoy</h2>
            <p className="mt-2 text-sm text-content-secondary">Se actualizan automáticamente cada 5 horas</p>
          </div>
          <Link to="/catalogo" className="hidden flex-shrink-0 items-center gap-1 text-sm text-brand-text hover:underline sm:inline-flex">
            Ver todo el catálogo →
          </Link>
        </div>

        {isLoading ? (
          <>
            <div className="flex gap-3 overflow-x-auto pb-3 sm:hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="min-w-[260px] max-w-[260px] flex-shrink-0">
                  <FeaturedContactSkeleton />
                </div>
              ))}
            </div>
            <div className="hidden grid-cols-2 gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <FeaturedContactSkeleton key={index} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:hidden">
              {contacts.map((contact) => (
                <div key={contact.id} className="min-w-[260px] max-w-[260px] flex-shrink-0 snap-center">
                  <FeaturedContactCard contact={contact} />
                </div>
              ))}
            </div>
            <div className="hidden grid-cols-2 gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-5">
              {contacts.map((contact) => (
                <FeaturedContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          </>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link to="/catalogo" className="text-sm text-brand-text hover:underline">
            Ver todo el catálogo →
          </Link>
        </div>
      </div>
    </section>
  );
}
