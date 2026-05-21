import type { Category } from '../../types';
import CategoryCard from './CategoryCard';

type CatalogGridProps = {
  categories: Category[];
};

export default function CatalogGrid({ categories }: CatalogGridProps) {
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
