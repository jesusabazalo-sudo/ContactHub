import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ContactCard from '../components/contacts/ContactCard';
import Badge from '../components/ui/Badge';
import Icon from '../components/ui/Icon';
import SkeletonCard from '../components/ui/SkeletonCard';
import { useAuth } from '../features/auth/AuthProvider';
import { useRipple } from '../hooks/useRipple';
import { withTimeout } from '../lib/supabaseClient';
import { getCategoryDetail, type CatalogContact } from '../services/catalogService';
import type { Category } from '../types';

type CategoryDetailState = {
  category: Category;
  contacts: CatalogContact[];
  hasAccess: boolean;
};

export default function CategoryDetailPage() {
  const { slug } = useParams();
  const { user, isAdmin, isLoading, isAdminLoading } = useAuth();
  const [detail, setDetail] = useState<CategoryDetailState | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const unlockButtonRipple = useRipple<HTMLButtonElement>();

  function openChatForCategory() {
    if (!category) return;
    window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message: `Hola, quiero desbloquear la carpeta ${category.name}` } }));
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      if (!slug || isLoading || (isAdminLoading && !isAdmin)) return;

      setIsLoadingDetail(true);
      setError(null);

      try {
        const nextDetail = await withTimeout(getCategoryDetail({ slug, userId: user?.id, isAdmin }));

        if (!nextDetail) {
          if (isMounted) setDetail(null);
          return;
        }

        if (!isMounted) return;

        // Diagnóstico solo en desarrollo. NUNCA registrar contactos/teléfonos en
        // producción: la consola del navegador es visible para cualquiera.
        if (import.meta.env.DEV) {
          console.debug('CONTACTHUB_CATEGORY_DEBUG', {
            slug,
            categoryId: nextDetail.category.id,
            categoryName: nextDetail.category.name,
            contactsCount: nextDetail.contacts.length,
          });
        }

        setDetail(nextDetail);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : 'No se pudo cargar esta carpeta.';
        console.error('Error cargando carpeta:', loadError);
        setError(message);
      } finally {
        if (isMounted) setIsLoadingDetail(false);
      }
    }

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, isAdminLoading, isLoading, retryKey, slug, user?.id]);

  if (isLoading || (isAdminLoading && !isAdmin) || isLoadingDetail) {
    return (
      <section className="section-pad bg-canvas">
        <div className="container-shell">
          <div className="skeleton-block h-6 w-40" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="skeleton-block h-14 w-14 rounded-2xl" />
              <div className="skeleton-block mt-5 h-9 w-2/3 rounded-full" />
              <div className="skeleton-block mt-4 h-4 w-full rounded-full" />
              <div className="skeleton-block mt-2 h-4 w-4/5 rounded-full" />
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="skeleton-block h-4 w-24 rounded-full" />
              <div className="skeleton-block mt-3 h-8 w-32 rounded-full" />
              <div className="skeleton-block mt-6 h-12 w-full rounded-full" />
            </div>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} variant="contact" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!detail && !error) {
    return (
      <section className="section-pad bg-canvas">
        <div className="container-shell">
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <h1 className="font-display text-3xl font-bold text-content">Esta carpeta no existe o cambió de enlace.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-content-secondary">Vuelve al catálogo para elegir una carpeta activa.</p>
            <Link to="/catalogo" className="mt-6 inline-flex rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950">
              Volver al catálogo
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-pad bg-canvas">
        <div className="container-shell">
          <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-8 text-center">
            <h1 className="font-display text-3xl font-bold text-content">No se pudo cargar esta carpeta.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-amber-100">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsLoadingDetail(true);
                setRetryKey((value) => value + 1);
              }}
              className="mt-6 inline-flex rounded-full bg-brand-400 px-5 py-3 text-sm font-bold text-ink-950"
            >
              Reintentar
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!detail) return null;

  const { category, contacts, hasAccess } = detail;
  const canViewFullCategory = Boolean(isAdmin || hasAccess);
  const accessLevel: 0 | 1 | 2 = canViewFullCategory ? 2 : user ? 1 : 0;

  return (
    <section className="section-pad bg-canvas">
      <div className="container-shell">
        <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm font-semibold text-content-secondary transition hover:text-content">
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-400/10 text-2xl text-brand-text">
                <Icon name={category.icon} className="h-7 w-7" />
              </div>
              {category.isTop ? <Badge tone="gold">Top</Badge> : null}
              {category.isNew ? <Badge>Nuevo</Badge> : null}
            </div>
            <h1 className="mt-5 min-w-0 break-words font-display text-3xl font-bold leading-tight text-content sm:text-5xl">
              {category.sortOrder ? `${String(category.sortOrder).padStart(2, '0')}. ` : ''}
              {category.icon} {category.name}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-content-secondary">{category.description}</p>
            <div className="mt-5 flex min-w-0 flex-wrap gap-2">
              {category.tags.map((tag) => (
                <span key={tag} className="max-w-[160px] truncate whitespace-nowrap rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-content-secondary">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm font-semibold text-brand-text">{isAdmin ? 'Vista admin' : hasAccess ? 'Acceso activo' : 'Carpeta bloqueada'}</p>
            <p className="mt-3 text-3xl font-bold text-content">
              {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
            </p>
            <p className="mt-3 text-sm leading-6 text-content-secondary">
              {canViewFullCategory
                ? 'Puedes ver los teléfonos completos de esta carpeta.'
                : 'Puedes explorar la carpeta. Los números completos se muestran solo al desbloquear.'}
            </p>
            {!canViewFullCategory ? (
              <div className="mt-6 grid gap-3">
                <button
                  ref={unlockButtonRipple.ref}
                  type="button"
                  onPointerDown={unlockButtonRipple.onPointerDown}
                  onClick={openChatForCategory}
                  className="ripple-container focus-ring inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-brand-400 px-4 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  Desbloquear carpeta
                </button>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="mt-10">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-bold text-content">Contactos disponibles</h2>
            <p className="mt-2 text-sm text-content-secondary">
              {canViewFullCategory ? 'Puedes ver los teléfonos completos de esta carpeta.' : 'Puedes explorar la carpeta. Los números completos se muestran solo al desbloquear.'}
            </p>
          </div>

          {contacts.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {contacts.map((contact, index) => {
                const canSeeFullPhone = accessLevel === 2;
                return (
                  <div key={contact.id} className="float-in h-full w-full min-w-0 overflow-hidden" style={{ animationDelay: `${Math.min(index, 11) * 40}ms` }}>
                    <ContactCard
                      contact={contact}
                      canSeeFullPhone={canSeeFullPhone}
                      canContactDirect={accessLevel === 2}
                      accessLevel={accessLevel}
                      isAdmin={isAdmin}
                      categoryName={category.name}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <h3 className="font-display text-2xl font-bold text-content">Esta carpeta todavía no tiene contactos cargados.</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-content-secondary">Cuando agregues contactos activos desde el panel admin, aparecerán aquí automáticamente.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
