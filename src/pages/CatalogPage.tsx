import { useEffect, useMemo, useState } from 'react';
import CatalogGrid from '../components/catalog/CatalogGrid';
import CategoryFilters, { type CatalogFilter } from '../components/catalog/CategoryFilters';
import FriendlyErrorState from '../components/system/FriendlyErrorState';
import LoadingState from '../components/system/LoadingState';
import SectionHeading from '../components/ui/SectionHeading';
import { APP_CONFIG } from '../config/app';
import { useAuth } from '../features/auth/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { getCatalogCategories, getCatalogCategoryPreviews } from '../services/catalogService';
import type { Category } from '../types';

export default function CatalogPage() {
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [purchasedCategoryIds, setPurchasedCategoryIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    setIsLoading(true);
    setError(null);
    try {
      const cats = await getCatalogCategories();
      console.log('Categories loaded:', cats.length, cats[0]);
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
    async function loadPurchasedCategories() {
      if (!user?.id || !supabase) {
        setPurchasedCategoryIds(new Set());
        return;
      }

      const { data, error: accessError } = await supabase.from('user_category_access').select('category_id').eq('user_id', user.id).eq('status', 'active');
      if (accessError) {
        console.error('CatalogPage access error:', accessError);
        setPurchasedCategoryIds(new Set());
        return;
      }

      setPurchasedCategoryIds(new Set((data ?? []).map((access) => access.category_id)));
    }

    void loadPurchasedCategories();
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
    const searchLower = search.toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        searchLower.length === 0 ||
        category.name.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower) ||
        category.shortDescription?.toLowerCase().includes(searchLower) ||
        category.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

      const matchesFilter =
        filter === 'all' ||
        (filter === 'top' && category.isTop) ||
        (filter === 'new' && category.isNew) ||
        (filter === 'featured' && category.isFeatured) ||
        (filter === 'purchased' && purchasedCategoryIds.has(category.id));

      return matchesSearch && matchesFilter;
    });
  }, [categories, filter, purchasedCategoryIds, search]);

  if (isLoading) return <LoadingState title="Cargando catálogo" message="Estamos leyendo categorías y conteos reales desde Supabase." />;
  if (error) return <FriendlyErrorState title="No se pudo cargar el catálogo." message={error} onRetry={loadCategories} />;

  return (
    <section className="section-pad dopamine-surface bg-ink-950">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Catálogo"
          title="Explora oportunidades según lo que quieres lograr"
          description={`${APP_CONFIG.contactsClaim} contactos y oportunidades organizados por intención: aprender, vender, conseguir proveedores, encontrar servicios, mejorar un negocio o resolver una necesidad concreta.`}
        />
        <div className="dopamine-card neon-edge mt-8 rounded-2xl p-4 text-sm leading-6 text-gray-300">
          Puedes registrarte gratis, revisar qué existe en cada carpeta y ver teléfonos ocultos. Los números completos se muestran solo con acceso, prueba o recompensa aprobada.
        </div>
        <div className="mt-8">
          <CategoryFilters search={search} filter={filter} setSearch={setSearch} onFilterChange={setFilter} purchasedDisabled={!user} />
        </div>
        {filter === 'purchased' && user ? (
          <div className="mt-6 rounded-lg border border-brand-400/20 bg-brand-400/10 p-4 text-sm leading-6 text-gray-300">
            Mostrando solo tus carpetas desbloqueadas.
          </div>
        ) : null}
        <div className="mt-8">
          <CatalogGrid
            categories={filteredCategories}
            getAccessLevel={(category) => (isAdmin || purchasedCategoryIds.has(category.id) ? 2 : user ? 1 : 0)}
          />
        </div>
      </div>
    </section>
  );
}
