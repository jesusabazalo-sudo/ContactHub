import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category } from '../../types';
import Badge from '../ui/Badge';
import Icon from '../ui/Icon';

type CategoryCardProps = {
  category: Category;
};

export default function CategoryCard({ category }: CategoryCardProps) {
  const orderLabel = category.sortOrder ? `${String(category.sortOrder).padStart(2, '0')}. ` : '';

  return (
    <article className="card-hover group rounded-lg border border-line bg-panel p-5 transition duration-200 hover:-translate-y-1 hover:border-brand-400/35 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-400/10 text-brand-400">
          <Icon name={category.icon} className="h-5 w-5" />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {category.isTop ? <Badge tone="gold">Top</Badge> : null}
          {category.isNew ? <Badge>Nuevo</Badge> : null}
        </div>
      </div>
      <h3 className="mt-5 min-h-12 text-lg font-bold leading-6 text-white">
        {orderLabel}
        {category.icon} {category.name}
      </h3>
      <p className="mt-3 min-h-16 text-sm leading-6 text-gray-400">{category.shortDescription}</p>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm font-semibold text-gray-300">{category.contactsCount} contactos</span>
        <Link
          to={`/catalogo/${category.slug}`}
          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-brand-400 transition group-hover:bg-brand-400 group-hover:text-ink-950"
          aria-label={`Ver ${category.name}`}
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
