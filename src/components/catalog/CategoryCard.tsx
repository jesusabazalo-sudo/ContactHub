import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category } from '../../types';
import Badge from '../ui/Badge';

type CategoryCardProps = {
  category: Category;
};

function statusLabel(category: Category) {
  if (category.isPremiumOfficial || category.sortOrder === 25) return 'Premium';
  if (category.isTop) return 'Destacada';
  if (category.isNew) return 'Nueva';
  return category.contactsCount > 0 ? 'Disponible' : 'Preparando';
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const order = category.sortOrder ?? 0;
  const orderLabel = order ? String(order).padStart(2, '0') : '--';
  const items = (category.whatYouCanFind?.length ? category.whatYouCanFind : category.tags).slice(0, 4);
  const isPremium = category.isPremiumOfficial || category.sortOrder === 25;

  return (
    <article
      className={`card-hover group relative overflow-hidden rounded-2xl border p-5 transition duration-200 hover:-translate-y-1 ${
        isPremium ? 'border-amber-300/35 bg-amber-300/10 shadow-[0_0_28px_rgba(245,158,11,0.12)]' : 'border-line bg-panel hover:border-brand-400/40 hover:bg-white/[0.06]'
      }`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 font-display text-sm font-bold ${isPremium ? 'border-amber-300/30 bg-amber-300/15 text-amber-200' : 'border-brand-400/25 bg-brand-400/10 text-brand-200'}`}>
            {orderLabel}
          </span>
          <span className="text-2xl" aria-hidden="true">
            {category.icon}
          </span>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone={isPremium ? 'gold' : 'green'}>{statusLabel(category)}</Badge>
          {category.isNew ? <Badge>Nuevo</Badge> : null}
        </div>
      </div>

      <h3 className="relative mt-5 min-h-14 text-lg font-bold leading-6 text-white">{category.name}</h3>
      <p className="relative mt-3 min-h-16 text-sm leading-6 text-gray-400">{category.shortDescription || category.description}</p>

      <div className="relative mt-5 rounded-xl border border-line bg-ink-950/45 p-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          Qué puedes encontrar
        </p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="rounded-full border border-line bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
        <div>
          <span className="block text-sm font-semibold text-gray-300">{category.contactsCount} contactos</span>
          <span className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <LockKeyhole className="h-3 w-3" />
            Números protegidos
          </span>
        </div>
        <Link
          to={`/catalogo/${category.slug}`}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950 transition group-hover:bg-white"
          aria-label={`Ver ${category.name}`}
        >
          Ver muestra
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
