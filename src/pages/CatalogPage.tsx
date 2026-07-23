import { LayoutGrid, List } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import CatalogGrid from '../components/catalog/CatalogGrid';
import CategoryFilters, { type CatalogFilter } from '../components/catalog/CategoryFilters';
import FriendlyErrorState from '../components/system/FriendlyErrorState';
import SectionHeading from '../components/ui/SectionHeading';
import SkeletonCard from '../components/ui/SkeletonCard';
import { APP_CONFIG } from '../config/app';
import { useAuth } from '../features/auth/AuthProvider';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { searchCategories } from '../lib/searchUtils';
import { supabase } from '../lib/supabaseClient';
import { getCatalogCategories, getCatalogCategoryPreviews } from '../services/catalogService';
import type { Category } from '../types';

const CATALOG_VIEW_STORAGE_KEY = 'contacthub_catalog_view';

export default function CatalogPage() {
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [purchasedCategoryIds, setPurchasedCategoryIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>(
    () => (window.localStorage.getItem(CATALOG_VIEW_STORAGE_KEY) === 'list' ? 'list' : 'grid'),
  );
  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    window.localStorage.setItem(CATALOG_VIEW_STORAGE_KEY, view);
  }, [view]);

  async function loadCategories() {
    setIsLoading(true);
    setError(null);
    try {
      const cats = await getCatalogCategories();
      if (import.meta.env.DEV) console.info('Categories loaded:', cats.length);
      setCategories(cats);
    } catch (loadError) {
      console.error('CatalogPage error:', loadError);
      setError('Error al cargar el catálogo.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPurchasedCategories() {
      if (!user?.id || !supabase) {
        if (!cancelled) setPurchasedCategoryIds(new Set());
        return;
      }

      const { data, error: accessError } = await supabase.from('user_category_access').select('category_id').eq('user_id', user.id).eq('status', 'active');
      if (cancelled) return; // usuario cambió mientras cargaba: descarta respuesta obsoleta
      if (accessError) {
        console.error('CatalogPage access error:', accessError);
        setPurchasedCategoryIds(new Set());
        return;
      }

      setPurchasedCategoryIds(new Set((data ?? []).map((access) => access.category_id)));
    }

    void loadPurchasedCategories();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const categoryIdsKey = useMemo(() => categories.map((category) => category.id).join('|'), [categories]);
  const purchasedIdsKey = useMemo(() => Array.from(purchasedCategoryIds).sort().join('|'), [purchasedCategoryIds]);

  useEffect(() => {
    async function loadPreviews() {
      if (!categories.length) return;

      const fullAccessCategoryIds = new Set(isAdmin ? categories.map((category) => category.id) : Array.from(purchasedCategoryIds));
      const previewsByCategory = await getCatalogCategoryPreviews({
        categoryIds: categories.map((category) => category.id),
        isRegistered: Boolean(user),
        fullAccessCategoryIds,
      });

      setCategories((current) =>
        current.map((category) => ({
          ...category,
          previewContacts: previewsByCategory.get(category.id) ?? [],
        })),
      );
    }

    void loadPreviews();
  }, [categoryIdsKey, isAdmin, purchasedIdsKey, user]);

  const filteredCategories = useMemo(() => {
    return searchCategories(debouncedSearch, categories).filter((category) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'top' && category.isTop) ||
        (filter === 'new' && category.isNew) ||
        (filter === 'featured' && category.isFeatured) ||
        (filter === 'purchased' && purchasedCategoryIds.has(category.id));

      return matchesFilter;
    });
  }, [categories, debouncedSearch, filter, purchasedCategoryIds]);

  if (error) return <FriendlyErrorState title="No se pudo cargar el catálogo." message={error} onRetry={loadCategories} />;

  return (
    <section className="section-pad section-band min-h-screen">
      <div className="container-shell">
        <div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <SectionHeading
            eyebrow="Catálogo"
            title="Explora por lo que quieres lograr"
            description={`${APP_CONFIG.contactsClaim} contactos y oportunidades organizados para aprender, vender, conseguir proveedores, encontrar servicios o resolver una necesidad concreta.`}
          />
          <div className="rounded-lg border border-brand-400/15 bg-brand-400/[0.05] p-5 text-sm leading-6 text-content-secondary">
            Puedes explorar sin cuenta. Los números completos solo se muestran cuando tienes una prueba o un acceso activo.
          </div>
        </div>
        <div className="mt-8">
          <CategoryFilters search={search} filter={filter} setSearch={setSearch} onFilterChange={setFilter} purchasedDisabled={!user} />
          {search !== debouncedSearch ? <p className="mt-3 text-xs font-semibold text-brand-text">Buscando...</p> : null}
        </div>
        {filter === 'purchased' && user ? (
          <div className="mt-6 rounded-lg border border-brand-400/20 bg-brand-400/[0.06] p-4 text-sm leading-6 text-content-secondary">
            Mostrando solo tus carpetas desbloqueadas.
          </div>
        ) : null}
        {isLoading ? null : (
          <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-content-secondary sm:flex-row sm:items-center sm:justify-between">
            <span>
              {filteredCategories.length} carpeta(s) encontradas{debouncedSearch ? ` para "${debouncedSearch}"` : ''}.
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs font-semibold text-content-muted sm:block">Busca por nombre, descripción, tags o casos de uso.</span>
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  aria-label="Vista grid"
                  aria-pressed={view === 'grid'}
                  className={`focus-ring flex h-8 w-8 items-center justify-center rounded-md transition ${
                    view === 'grid' ? 'bg-brand text-brand-contrast' : 'text-content-muted hover:text-content'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  aria-label="Vista lista"
                  aria-pressed={view === 'list'}
                  className={`focus-ring flex h-8 w-8 items-center justify-center rounded-md transition ${
                    view === 'list' ? 'bg-brand text-brand-contrast' : 'text-content-muted hover:text-content'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} variant="category" />
              ))}
            </div>
          ) : (
            <CatalogGrid
              categories={filteredCategories}
              view={view}
              getAccessLevel={(category) => (isAdmin || purchasedCategoryIds.has(category.id) ? 2 : user ? 1 : 0)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
