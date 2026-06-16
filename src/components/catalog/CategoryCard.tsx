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
        isPremium ? 'border-amber-300/30 bg-amber-300/[0.06]' : 'hover:border-brand-400/35'
      }`}
    >
      <div className="relative flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border px-3 font-display text-sm font-bold ${isPremium ? 'border-amber-300/30 bg-amber-300/10 text-amber-200' : 'border-brand-400/20 bg-brand-400/[0.07] text-brand-200'}`}>
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
        <h3 className="line-clamp-2 break-words text-xl font-extrabold leading-7 text-white">{display.displayTitle}</h3>
        {display.displaySubtitle ? (
          <span className="mt-2 inline-flex max-w-full rounded-lg border border-brand-400/20 bg-brand-400/[0.07] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-brand-200">
            <span className="truncate">
            {display.displaySubtitle}
            </span>
          </span>
        ) : null}
      </div>
      <p className="relative mt-3 min-h-[72px] break-words text-sm font-medium leading-6 text-gray-300 line-clamp-3">{category.shortDescription || category.description}</p>

      <div className="relative mt-5 min-w-0 border-t border-line pt-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          Qué puedes encontrar
        </p>
        <div className="flex min-w-0 flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="premium-chip max-w-full break-words rounded-lg px-3 py-1 text-xs font-semibold">
              {item}
            </span>
          ))}
        </div>
      </div>

      {previewContacts.length ? (
        <div className="relative mt-4 min-w-0 rounded-lg border border-white/[0.08] bg-black/15 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Muestra de contactos</p>
          <div className="grid gap-2">
            {previewContacts.map((contact) => (
              <div key={contact.id} className="grid min-w-0 gap-1 rounded-lg bg-ink-950/45 px-3 py-2 ring-1 ring-white/5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3">
                <span className="min-w-0 truncate text-xs font-semibold text-gray-200">{contact.name}</span>
                <span className="min-w-0 truncate font-mono text-[11px] text-gray-500 sm:text-right">
                  {contact.countryFlag ? `${contact.countryFlag} ` : ''}
                  {getPhoneDisplay(contact.phone ?? contact.phoneMasked, accessLevel)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative mt-auto flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="block text-sm font-semibold text-gray-300">{category.contactsCount} contactos</span>
          <span className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <LockKeyhole className="h-3 w-3" />
            Números protegidos
          </span>
        </div>
        <Link
          to={`/catalogo/${category.slug}`}
          className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-400"
          aria-label={`Ver ${display.displayTitle}`}
        >
          Explorar
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
