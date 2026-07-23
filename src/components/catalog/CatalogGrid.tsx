import { ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import { getOfficialCategoryDisplayParts } from '../../data/officialCategories';
import type { Category } from '../../types';
import CategoryCard from './CategoryCard';

type CatalogGridProps = {
  categories: Category[];
  getAccessLevel?: (category: Category) => 0 | 1 | 2;
  view?: 'grid' | 'list';
};

function CategoryListRow({ category, accessLevel }: { category: Category; accessLevel: 0 | 1 | 2 }) {
  const display = getOfficialCategoryDisplayParts(category);
  const hasAccess = accessLevel === 2;

  return (
    <Link
      to={`/catalogo/${category.slug}`}
      className="card-hover professional-card stable-card group flex min-w-0 items-center gap-4 p-4 transition duration-200 hover:border-brand/40"
    >
      <span className="shrink-0 text-2xl" aria-hidden="true">
        {category.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-bold text-content">{display.displayTitle}</p>
        <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-content-secondary">{category.shortDescription || category.description}</p>
      </div>
      <span className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold text-content-muted sm:flex">
        <Users className="h-3.5 w-3.5" />
        {category.contactsCount}
      </span>
      <span className="hidden shrink-0 text-sm font-bold text-brand-text sm:block">Desde {APP_CONFIG.startingPrice}</span>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition group-hover:bg-brand group-hover:text-brand-contrast ${
          hasAccess ? 'bg-brand/15 text-brand-text' : 'border border-border text-content'
        }`}
      >
        {hasAccess ? 'Explorar' : 'Ver'}
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

export default function CatalogGrid({ categories, getAccessLevel, view = 'grid' }: CatalogGridProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <h3 className="font-display text-2xl font-bold text-content">No apareció una carpeta con ese filtro.</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-content-secondary">
          Puede que esté con otro nombre o que todavía falte clasificarla. Prueba con un término más amplio como marketing, cursos, proveedores o IA.
        </p>
      </div>
    );
  }

  const orderedCategories = [...categories].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name));
  const premiumCategory = orderedCategories.find((category) => category.sortOrder === 25 || category.isPremiumOfficial);
  const regularCategories = orderedCategories.filter((category) => category.id !== premiumCategory?.id);

  if (view === 'list') {
    return (
      <div className="space-y-3">
        {orderedCategories.map((category, index) => (
          <div key={category.id} className="float-in" style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}>
            <CategoryListRow category={category} accessLevel={getAccessLevel?.(category) ?? 0} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:1920px)]:gap-6">
        {regularCategories.map((category, index) => (
          <div key={category.id} className="float-in h-full" style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}>
            <CategoryCard category={category} accessLevel={getAccessLevel?.(category) ?? 0} />
          </div>
        ))}
      </div>
      {premiumCategory ? (
        <div className="pt-2">
          <CategoryCard category={premiumCategory} accessLevel={getAccessLevel?.(premiumCategory) ?? 0} />
        </div>
      ) : null}
    </div>
  );
}
