import { Search } from 'lucide-react';

export type CatalogFilter = 'all' | 'top' | 'new' | 'featured' | 'purchased';

type CategoryFiltersProps = {
  search: string;
  filter: CatalogFilter;
  setSearch: (search: string) => void;
  onFilterChange: (filter: CatalogFilter) => void;
  purchasedDisabled?: boolean;
};

const filters: Array<{ label: string; value: CatalogFilter }> = [
  { label: 'Todo', value: 'all' },
  { label: 'Top', value: 'top' },
  { label: 'Nuevo', value: 'new' },
  { label: 'Destacado', value: 'featured' },
  { label: 'Comprado', value: 'purchased' },
];

export default function CategoryFilters({ search, filter, setSearch, onFilterChange, purchasedDisabled = false }: CategoryFiltersProps) {
  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-surface p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <label className="relative block">
        <span className="sr-only">Buscar categorías</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, descripción o tags"
          className="focus-ring h-12 w-full rounded-full border border-border bg-canvas/70 pl-11 pr-4 text-sm text-content placeholder:text-content-muted"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              if (item.value !== 'purchased' || !purchasedDisabled) {
                onFilterChange(item.value);
              }
            }}
            disabled={item.value === 'purchased' && purchasedDisabled}
            title={item.value === 'purchased' && purchasedDisabled ? 'Inicia sesión para filtrar tus carpetas' : undefined}
            className={`focus-ring rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filter === item.value
                ? 'border-brand-400 bg-brand-400 text-ink-950'
                : 'border-border bg-muted text-content-secondary hover:border-brand-400/35 hover:text-content disabled:cursor-not-allowed disabled:opacity-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
