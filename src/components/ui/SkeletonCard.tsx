type SkeletonCardProps = {
  variant?: 'category' | 'contact';
};

/** Refleja la estructura visual de CategoryCard/ContactCard mientras cargan los datos reales. */
export default function SkeletonCard({ variant = 'category' }: SkeletonCardProps) {
  if (variant === 'contact') {
    return (
      <div className="stable-card flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card-sm" aria-hidden="true">
        <div className="flex items-start gap-3">
          <div className="skeleton-block h-11 w-11 flex-none rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton-block h-2.5 w-1/3 rounded-full" />
            <div className="skeleton-block h-4 w-2/3 rounded-full" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="skeleton-block h-3 w-full rounded-full" />
          <div className="skeleton-block h-3 w-4/5 rounded-full" />
        </div>
        <div className="mt-auto pt-4">
          <div className="skeleton-block h-16 w-full rounded-xl" />
          <div className="skeleton-block mt-3 h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="stable-card professional-card relative flex h-full min-w-0 flex-col overflow-hidden p-5" aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="skeleton-block h-10 w-10 rounded-lg" />
          <div className="skeleton-block h-4 w-8 rounded-full" />
        </div>
        <div className="skeleton-block h-5 w-14 rounded-full" />
      </div>
      <div className="mt-5 space-y-2">
        <div className="skeleton-block h-5 w-4/5 rounded-full" />
        <div className="skeleton-block h-5 w-1/2 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="skeleton-block h-3 w-full rounded-full" />
        <div className="skeleton-block h-3 w-3/4 rounded-full" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="skeleton-block h-6 w-16 rounded-md" />
        <div className="skeleton-block h-6 w-20 rounded-md" />
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="skeleton-block h-4 w-24 rounded-full" />
        <div className="skeleton-block h-11 w-24 rounded-lg" />
      </div>
    </div>
  );
}
