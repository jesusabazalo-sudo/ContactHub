import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCatalogCategories } from '../../services/catalogService';
import type { Category } from '../../types';
import SectionHeading from '../ui/SectionHeading';

// Card compacta solo para este preview de home: la carpeta completa
// (CategoryCard, usada en CatalogPage) trae descripción, tags y progreso —
// demasiado contenido para un grid 2x2 en móvil.
function CategoryPreviewCard({ category }: { category: Category }) {
  return (
    <Link
      to={`/catalogo/${category.slug}`}
      className="professional-card flex h-28 flex-col items-center justify-center gap-1.5 p-3 text-center transition hover:border-brand/40 sm:h-36 sm:gap-2"
    >
      <span className="text-3xl" aria-hidden="true">
        {category.icon}
      </span>
      <span className="line-clamp-2 text-xs font-semibold leading-tight text-content sm:text-sm">{category.name}</span>
      <span className="hidden line-clamp-1 text-xs text-content-secondary sm:block">{category.shortDescription}</span>
      <span className="hidden text-[11px] font-semibold text-brand-text sm:inline">{category.contactsCount} contactos</span>
    </Link>
  );
}

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
          <SectionHeading eyebrow="¿Qué hay dentro?" title="Elige la categoría que necesitas" />
          <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm font-bold text-brand-text transition hover:text-content">
            Ver todas las carpetas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featuredCategories.length ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featuredCategories.map((category) => (
              <CategoryPreviewCard key={category.id} category={category} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
