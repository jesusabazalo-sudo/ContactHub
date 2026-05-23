import { useEffect, useMemo, useState } from 'react';
import CatalogGrid from '../components/catalog/CatalogGrid';
import CategoryFilters, { type CatalogFilter } from '../components/catalog/CategoryFilters';
import FriendlyErrorState from '../components/system/FriendlyErrorState';
import LoadingState from '../components/system/LoadingState';
import SectionHeading from '../components/ui/SectionHeading';
import { APP_CONFIG } from '../config/app';
import { useAuth } from '../features/auth/AuthProvider';
import { sanitizeText } from '../lib/sanitize';
import { supabase } from '../lib/supabaseClient';
import { getCatalogCategories } from '../services/catalogService';
import type { Category } from '../types';

export default function CatalogPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [purchasedCategoryIds, setPurchasedCategoryIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    setIsLoading(true);
    setError(null);
    try {
      const [nextCategories, accessResult] = await Promise.all([
        getCatalogCategories(),
        user?.id && supabase
          ? supabase.from('user_category_access').select('category_id').eq('user_id', user.id).eq('status', 'active')
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (accessResult.error) throw accessResult.error;
      setCategories(nextCategories);
      setPurchasedCategoryIds(new Set((accessResult.data ?? []).map((access) => access.category_id)));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudo cargar el catálogo.';
      console.error('Error cargando catálogo:', loadError);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, [user?.id]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = sanitizeText(query, 80).toLowerCase();

    return categories.filter((category) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [category.name, category.description, category.shortDescription, ...category.tags].join(' ').toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'top' && category.isTop) ||
        (filter === 'new' && category.isNew) ||
        (filter === 'featured' && category.isFeatured) ||
        (filter === 'purchased' && purchasedCategoryIds.has(category.id));

      return matchesQuery && matchesFilter && category.isActive;
    });
  }, [categories, filter, purchasedCategoryIds, query]);

  if (isLoading) return <LoadingState title="Cargando catálogo" message="Estamos leyendo categorías y conteos reales desde Supabase." />;
  if (error) return <FriendlyErrorState title="No se pudo cargar el catálogo." message={error} onRetry={loadCategories} />;

  return (
    <section className="section-pad bg-ink-950">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Catálogo"
          title="Explora oportunidades según lo que quieres lograr"
          description={`${APP_CONFIG.contactsClaim} contactos y oportunidades organizados por intención: aprender, vender, conseguir proveedores, encontrar servicios, mejorar un negocio o resolver una necesidad concreta.`}
        />
        <div className="mt-8 rounded-2xl border border-brand-400/20 bg-brand-400/10 p-4 text-sm leading-6 text-gray-300">
          Puedes registrarte gratis, revisar qué existe en cada carpeta y ver teléfonos ocultos. Los números completos se muestran solo con acceso, prueba o recompensa aprobada.
        </div>
        <div className="mt-8">
          <CategoryFilters query={query} filter={filter} onQueryChange={(value) => setQuery(sanitizeText(value, 80))} onFilterChange={setFilter} purchasedDisabled={!user} />
        </div>
        {filter === 'purchased' && user ? (
          <div className="mt-6 rounded-lg border border-brand-400/20 bg-brand-400/10 p-4 text-sm leading-6 text-gray-300">
            Mostrando solo tus carpetas desbloqueadas.
          </div>
        ) : null}
        <div className="mt-8">
          <CatalogGrid categories={filteredCategories} />
        </div>
      </div>
    </section>
  );
}
