import { ArrowRight, CheckCircle2, Clock, Sparkles, Users } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import { getOfficialCategoryDisplayParts } from '../../data/officialCategories';
import type { Category } from '../../types';
import AnimatedNumber from '../ui/AnimatedNumber';
import Badge from '../ui/Badge';

type CategoryCardProps = {
  category: Category;
  accessLevel?: 0 | 1 | 2;
};

// No existe un campo "cupo esperado" en la base de datos (y agregar uno
// implicaría tocar Supabase, fuera de alcance en esta fase). Se usa un techo
// fijo razonable solo para dar sentido visual a la barra de completitud.
const COMPLETENESS_TARGET = 150;

function getStatusBadge(category: Category): { label: string; tone: 'green' | 'gold' | 'blue' } | null {
  if (category.isTop) return { label: 'Top', tone: 'gold' };
  if (category.isNew) return { label: 'Nuevo', tone: 'green' };
  if (category.isFeatured) return { label: 'Actualizado', tone: 'blue' };
  return null;
}

function daysSince(dateString: string): number | null {
  if (!dateString) return null;
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
}

function CategoryCard({ category, accessLevel = 0 }: CategoryCardProps) {
  const display = getOfficialCategoryDisplayParts(category);
  const order = category.sortOrder ?? 0;
  const orderLabel = order ? String(order).padStart(2, '0') : '--';
  const items = (category.whatYouCanFind?.length ? category.whatYouCanFind : category.tags).slice(0, 3);
  const isPremium = category.isPremiumOfficial || category.sortOrder === 25;
  const previewContacts = (category.previewContacts ?? []).slice(0, 3);
  const statusBadge = getStatusBadge(category);
  const completenessPct = Math.max(4, Math.min(100, Math.round((category.contactsCount / COMPLETENESS_TARGET) * 100)));
  const hasAccess = accessLevel === 2;

  const updatedDays = daysSince(category.updatedAt);
  const updateTone = updatedDays === null ? null : updatedDays < 7 ? 'text-brand-text' : updatedDays < 30 ? 'text-warning' : 'text-content-muted';

  const previousAccessLevelRef = useRef(accessLevel);
  const [isUnlockCelebrating, setIsUnlockCelebrating] = useState(false);

  useEffect(() => {
    if (previousAccessLevelRef.current < 2 && accessLevel === 2) {
      setIsUnlockCelebrating(true);
      const timeout = window.setTimeout(() => setIsUnlockCelebrating(false), 1500);
      previousAccessLevelRef.current = accessLevel;
      return () => window.clearTimeout(timeout);
    }
    previousAccessLevelRef.current = accessLevel;
    return undefined;
  }, [accessLevel]);

  return (
    <article
      className={`card-hover card-top-shimmer professional-card stable-card group relative flex h-full min-w-0 flex-col overflow-hidden p-5 transition duration-200 ${
        isPremium ? 'border-warning/30 bg-warning/[0.05]' : 'hover:border-brand/40'
      } ${isUnlockCelebrating ? 'animate-card-breathe' : ''}`}
    >
      {isUnlockCelebrating ? <span className="unlock-flash" aria-hidden="true" /> : null}
      {isUnlockCelebrating ? (
        <div className="unlock-celebration" aria-hidden="true">
          <LockOpenIcon />
          <span className="text-sm font-bold">¡Acceso activado!</span>
        </div>
      ) : null}

      <div className="relative flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0" style={{ fontSize: '2.5rem', lineHeight: 1 }} aria-hidden="true">
            {category.icon}
          </span>
          <span className="font-mono text-xs font-semibold text-content-muted">{orderLabel}</span>
        </div>
        <div className="flex min-w-0 flex-wrap justify-end gap-2">
          {statusBadge ? (
            <span
              key={hasAccess ? 'unlocked' : statusBadge.label}
              className={`animate-badge-flip inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                statusBadge.tone === 'gold'
                  ? 'border-warning/30 bg-warning/10 text-warning'
                  : statusBadge.tone === 'blue'
                    ? 'border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan'
                    : 'border-brand/30 bg-brand/10 text-brand-text'
              }`}
            >
              {statusBadge.label}
            </span>
          ) : null}
          {isPremium ? <Badge tone="gold">Acceso amplio</Badge> : null}
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
      <p className="relative mt-3 min-h-[48px] break-words text-sm leading-6 text-content-secondary line-clamp-2">
        {category.shortDescription || category.description}
      </p>

      {items.length ? (
        <div className="relative mt-3 flex min-w-0 flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="premium-chip max-w-full break-words rounded-md px-2.5 py-1 text-xs font-medium">
              {item}
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative mt-3 min-w-0">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="progress-fill h-full rounded-full bg-brand" style={{ width: `${completenessPct}%` }} />
        </div>
      </div>

      {previewContacts.length ? (
        <div className="relative mt-4 min-w-0 rounded-lg border border-border bg-muted p-3">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-content-muted">
            <Sparkles className="h-3.5 w-3.5 text-brand-text" />
            Muestra de contactos
          </p>
          <div className="flex flex-wrap gap-2">
            {previewContacts.map((contact) => {
              const dotColors = ['bg-brand', 'bg-accent-violet', 'bg-accent-cyan'];
              const dotColor = dotColors[previewContacts.indexOf(contact) % dotColors.length];
              return (
                <span
                  key={contact.id}
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
                  {hasAccess ? (
                    <span className="truncate font-semibold text-content">{contact.name}</span>
                  ) : (
                    <span className="truncate text-content-muted blur-[2.5px] select-none">{contact.name}</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="relative mt-auto flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-content">
            <Users className="h-3.5 w-3.5 text-content-muted" />
            <AnimatedNumber value={category.contactsCount} duration={900} /> contactos disponibles
          </span>
          <span className="text-sm font-bold text-brand-text">Desde {APP_CONFIG.startingPrice}</span>
        </div>
        {updatedDays !== null ? (
          <span className={`flex items-center gap-1.5 text-xs font-medium ${updateTone}`}>
            <Clock className="h-3 w-3" />
            Actualizado hace {updatedDays === 0 ? 'hoy' : `${updatedDays} día${updatedDays === 1 ? '' : 's'}`}
          </span>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          {hasAccess ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand-text">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Acceso activo
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-content-muted">Números protegidos</span>
          )}
          <Link
            to={`/catalogo/${category.slug}`}
            className={`focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition group-hover:bg-brand group-hover:text-brand-contrast ${
              hasAccess ? 'bg-brand text-brand-contrast hover:bg-brand-hover' : 'border border-border bg-surface text-content hover:border-brand/40'
            }`}
            aria-label={`Ver ${display.displayTitle}`}
          >
            {hasAccess ? 'Explorar' : 'Ver carpeta'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function LockOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 0 1 7.5-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default memo(CategoryCard);
