import type { PropsWithChildren } from 'react';

type BadgeProps = PropsWithChildren<{
  tone?: 'green' | 'neutral' | 'gold';
}>;

export default function Badge({ children, tone = 'green' }: BadgeProps) {
  const toneClasses = {
    green: 'border-brand/30 bg-brand/10 text-brand-text',
    neutral: 'border-border bg-muted text-content-secondary',
    gold: 'border-warning/30 bg-warning/10 text-warning',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
