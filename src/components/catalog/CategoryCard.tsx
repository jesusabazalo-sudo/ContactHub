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
      className={`card-hover dopamine-card neon-edge group relative overflow-hidden rounded-2xl border p-5 transition duration-200 hover:-translate-y-1 ${
        isPremium ? 'border-amber-300/35 bg-amber-300/10 shadow-[0_0_34px_rgba(250,204,21,0.16)]' : 'border-line hover:border-brand-400/40 hover:bg-white/[0.06]'
      }`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 font-display text-sm font-bold ${isPremium ? 'border-amber-300/30 bg-amber-300/15 text-amber-200' : 'border-brand-400/25 bg-brand-400/10 text-brand-200 shadow-[0_0_18px_rgba(34,197,94,0.12)]'}`}>
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

      <div className="relative mt-5 min-h-20">
        <h3 className="text-xl font-extrabold leading-7 text-white">{display.displayTitle}</h3>
        {display.displaySubtitle ? (
          <span className="mt-2 inline-flex rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-brand-200">
            {display.displaySubtitle}
          </span>
        ) : null}
      </div>
      <p className="relative mt-3 min-h-16 text-sm font-medium leading-6 text-gray-300">{category.shortDescription || category.description}</p>

      <div className="relative mt-5 rounded-xl border border-brand-400/15 bg-ink-950/45 p-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          Qué puedes encontrar
        </p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="premium-chip rounded-full px-3 py-1 text-xs font-semibold">
              {item}
            </span>
          ))}
        </div>
      </div>

      {previewContacts.length ? (
        <div className="relative mt-4 rounded-xl border border-accent-cyan/15 bg-white/[0.03] p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Muestra de contactos</p>
          <div className="grid gap-2">
            {previewContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between gap-3 rounded-lg bg-ink-950/45 px-3 py-2 ring-1 ring-white/5">
                <span className="min-w-0 truncate text-xs font-semibold text-gray-200">{contact.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-gray-500">
                  {contact.countryFlag ? `${contact.countryFlag} ` : ''}
                  {getPhoneDisplay(contact.phone ?? contact.phoneMasked, accessLevel)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
          className="focus-ring btn-primary-glow inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-400 to-accent-cyan px-4 py-2 text-sm font-bold text-ink-950 transition group-hover:bg-white"
          aria-label={`Ver ${display.displayTitle}`}
        >
          Ver muestra
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
