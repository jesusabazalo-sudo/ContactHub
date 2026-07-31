import { ArrowRight, Users } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOfficialCategoryDisplayParts } from '../../data/officialCategories';
import type { Category } from '../../types';
import AnimatedNumber from '../ui/AnimatedNumber';

type CategoryCardProps = {
  category: Category;
  accessLevel?: 0 | 1 | 2;
};

function CategoryCard({ category, accessLevel = 0 }: CategoryCardProps) {
  const display = getOfficialCategoryDisplayParts(category);
  const isPremium = category.isPremiumOfficial || category.sortOrder === 25;
  const hasAccess = accessLevel === 2;

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

      <div className="relative flex min-w-0 flex-1 flex-col items-center text-center">
        <span className="shrink-0" style={{ fontSize: '2.75rem', lineHeight: 1 }} aria-hidden="true">
          {category.icon}
        </span>
        <h3 className="mt-4 line-clamp-2 break-words font-display text-xl font-bold leading-7 text-content">{display.displayTitle}</h3>
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-content-secondary">
          <Users className="h-4 w-4 text-content-muted" />
          <AnimatedNumber value={category.contactsCount} duration={900} /> contactos disponibles
        </p>
      </div>

      <div className="relative mt-5 border-t border-border pt-4">
        <Link
          to={`/catalogo/${category.slug}`}
          className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-contrast transition hover:bg-brand-hover"
          aria-label={`Ver ${display.displayTitle}`}
        >
          Ver carpeta
          <ArrowRight className="h-4 w-4" />
        </Link>
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
