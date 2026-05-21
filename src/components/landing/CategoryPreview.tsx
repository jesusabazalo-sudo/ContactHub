import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCatalogCategories } from '../../services/catalogService';
import type { Category } from '../../types';
import CategoryCard from '../catalog/CategoryCard';
import SectionHeading from '../ui/SectionHeading';

export default function CategoryPreview() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const nextCategories = await getCatalogCategories();
        if (isMounted) {
          setCategories(nextCategories);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('No se pudo cargar el preview real de categorías:', error);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredCategories = useMemo(
    () => categories.filter((category) => category.isFeatured || category.isTop).slice(0, 9),
    [categories],
  );

  return (
    <section className="section-pad bg-ink-900">
      <div className="container-shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Catálogo privado"
            title="Carpetas organizadas para encontrar lo que sí te sirve"
            description="La muestra pública enseña la estructura. Los datos completos viven en Supabase y solo se desbloquean con acceso activo."
          />
          <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm font-bold text-brand-400 transition hover:text-white">
            Ver catálogo completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featuredCategories.length ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
