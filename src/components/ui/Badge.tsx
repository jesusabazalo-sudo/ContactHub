import type { PropsWithChildren } from 'react';

type BadgeProps = PropsWithChildren<{
  tone?: 'green' | 'neutral' | 'gold';
}>;

export default function Badge({ children, tone = 'green' }: BadgeProps) {
  const toneClasses = {
    green: 'border-brand-400/25 bg-brand-400/10 text-brand-400',
    neutral: 'border-white/10 bg-white/5 text-gray-200',
    gold: 'border-amber-300/25 bg-amber-300/10 text-amber-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
