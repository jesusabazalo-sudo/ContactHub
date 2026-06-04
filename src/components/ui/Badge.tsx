import type { PropsWithChildren } from 'react';

type BadgeProps = PropsWithChildren<{
  tone?: 'green' | 'neutral' | 'gold';
}>;

export default function Badge({ children, tone = 'green' }: BadgeProps) {
  const toneClasses = {
    green: 'border-brand-400/30 bg-brand-400/10 text-brand-300 shadow-[0_0_18px_rgba(34,197,94,0.08)]',
    neutral: 'border-white/10 bg-white/5 text-gray-200',
    gold: 'border-amber-300/30 bg-amber-300/10 text-amber-200 shadow-[0_0_18px_rgba(250,204,21,0.08)]',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
