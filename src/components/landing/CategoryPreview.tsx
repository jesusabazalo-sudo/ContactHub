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
    () => {
      const highlighted = categories.filter((category) => category.isFeatured || category.isTop);
      return (highlighted.length >= 6 ? highlighted : categories).slice(0, 6);
    },
    [categories],
  );

  return (
    <section className="section-pad section-band">
      <div className="container-shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Categorías principales"
            title="Empieza por el área que más se acerca a tu meta"
            description="Cada carpeta explica qué puedes encontrar y protege los datos privados hasta que tengas un acceso activo."
          />
          <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm font-bold text-brand-text transition hover:text-content">
            Explorar todas las categorías
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
