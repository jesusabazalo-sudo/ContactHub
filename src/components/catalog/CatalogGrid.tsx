import type { Category } from '../../types';
import CategoryCard from './CategoryCard';

type CatalogGridProps = {
  categories: Category[];
  getAccessLevel?: (category: Category) => 0 | 1 | 2;
};

export default function CatalogGrid({ categories, getAccessLevel }: CatalogGridProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-panel p-10 text-center">
        <h3 className="font-display text-2xl font-bold text-white">No apareció una carpeta con ese filtro.</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-400">
          Puede que esté con otro nombre o que todavía falte clasificarla. Prueba con un término más amplio como marketing, cursos, proveedores o IA.
        </p>
      </div>
    );
  }

  const orderedCategories = [...categories].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name));
  const premiumCategory = orderedCategories.find((category) => category.sortOrder === 25 || category.isPremiumOfficial);
  const regularCategories = orderedCategories.filter((category) => category.id !== premiumCategory?.id);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {regularCategories.map((category) => (
          <CategoryCard key={category.id} category={category} accessLevel={getAccessLevel?.(category) ?? 0} />
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
