import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOfficialCategoryDisplayParts } from '../../data/officialCategories';
import type { Category } from '../../types';
import { getPhoneDisplay } from '../../utils/phone';
import Badge from '../ui/Badge';

type CategoryCardProps = {
  category: Category;
  accessLevel?: 0 | 1 | 2;
};

function statusLabel(category: Category) {
  if (category.isPremiumOfficial || category.sortOrder === 25) return 'Acceso amplio';
  if (category.isTop) return 'Destacada';
  if (category.isNew) return 'Nueva';
  return category.contactsCount > 0 ? 'Disponible' : 'Preparando';
}

export default function CategoryCard({ category, accessLevel = 0 }: CategoryCardProps) {
  const display = getOfficialCategoryDisplayParts(category);
  const order = category.sortOrder ?? 0;
  const orderLabel = order ? String(order).padStart(2, '0') : '--';
  const items = (category.whatYouCanFind?.length ? category.whatYouCanFind : category.tags).slice(0, 4);
  const isPremium = category.isPremiumOfficial || category.sortOrder === 25;
  const previewContacts = (category.previewContacts ?? []).slice(0, 3);

  return (
    <article
      className={`card-hover professional-card stable-card group relative flex h-full min-w-0 flex-col overflow-hidden p-5 transition duration-200 ${
        isPremium ? 'border-warning/30 bg-warning/[0.05]' : 'hover:border-brand/40'
      }`}
    >
      <div className="relative flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border px-3 font-display text-sm font-bold ${
              isPremium ? 'border-warning/30 bg-warning/10 text-warning' : 'border-brand/20 bg-brand/[0.08] text-brand-text'
            }`}
          >
            {orderLabel}
          </span>
          <span className="shrink-0 text-2xl" aria-hidden="true">
            {category.icon}
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap justify-end gap-2">
          <Badge tone={isPremium ? 'gold' : 'green'}>{statusLabel(category)}</Badge>
          {category.isNew ? <Badge>Nuevo</Badge> : null}
        </div>
      </div>

      <div className="relative mt-5 min-h-[96px] min-w-0">
        <h3 className="line-clamp-2 break-words font-display text-xl font-bold leading-7 text-content">{display.displayTitle}</h3>
        {display.displaySubtitle ? (
          <span className="mt-2 inline-flex max-w-full rounded-md border border-brand/20 bg-brand/[0.08] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-text">
            <span className="truncate">{display.displaySubtitle}</span>
          </span>
        ) : null}
      </div>
      <p className="relative mt-3 min-h-[72px] break-words text-sm leading-6 text-content-secondary line-clamp-3">
        {category.shortDescription || category.description}
      </p>

      <div className="relative mt-5 min-w-0 border-t border-border pt-4">
        <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-content-muted">
          <Sparkles className="h-3.5 w-3.5 text-brand-text" />
          Qué puedes encontrar
        </p>
        <div className="flex min-w-0 flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="premium-chip max-w-full break-words rounded-md px-2.5 py-1 text-xs font-medium">
              {item}
            </span>
          ))}
        </div>
      </div>

      {previewContacts.length ? (
        <div className="relative mt-4 min-w-0 rounded-lg border border-border bg-muted p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-content-muted">Muestra de contactos</p>
          <div className="grid gap-2">
            {previewContacts.map((contact) => (
              <div
                key={contact.id}
                className="grid min-w-0 gap-1 rounded-md border border-border bg-surface px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3"
              >
                <span className="min-w-0 truncate text-xs font-semibold text-content">{contact.name}</span>
                <span className="min-w-0 truncate font-mono text-[11px] text-content-muted sm:text-right">
                  {contact.countryFlag ? `${contact.countryFlag} ` : ''}
                  {getPhoneDisplay(contact.phone ?? contact.phoneMasked, accessLevel)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative mt-auto flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="block text-sm font-semibold text-content">{category.contactsCount} contactos</span>
          <span className="mt-1 flex items-center gap-1 text-xs text-content-muted">
            <LockKeyhole className="h-3 w-3" />
            Números protegidos
          </span>
        </div>
        <Link
          to={`/catalogo/${category.slug}`}
          className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-contrast transition hover:bg-brand-hover"
          aria-label={`Ver ${display.displayTitle}`}
        >
          Explorar
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
