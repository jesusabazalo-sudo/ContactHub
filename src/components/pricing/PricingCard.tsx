import { Check, MessageCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config/app';
import { createWhatsAppUrl, planWhatsAppMessage } from '../../lib/whatsapp';
import type { PricingPlan } from '../../types';
import Badge from '../ui/Badge';

type PricingCardProps = {
  plan: PricingPlan;
  compact?: boolean;
};

export default function PricingCard({ plan, compact = false }: PricingCardProps) {
  const folderText = plan.folderLimit === 'total' ? 'Acceso total' : `${plan.folderLimit} carpeta${plan.folderLimit === 1 ? '' : 's'}`;

  return (
    <article
      className={`card-hover relative rounded-lg border p-5 transition duration-200 hover:-translate-y-1 ${
        plan.isRecommended
          ? 'border-brand-400/55 bg-brand-400/10 shadow-glow'
          : plan.isPremium
            ? 'border-amber-300/30 bg-amber-300/10'
            : 'border-line bg-panel'
      }`}
    >
      <div className="flex min-h-7 items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
        {plan.badge ? <Badge tone={plan.isPremium ? 'gold' : 'green'}>{plan.badge}</Badge> : null}
      </div>
      <div className="mt-5 flex items-end gap-1">
        <span className="text-sm font-semibold text-gray-400">{APP_CONFIG.defaultCurrency}</span>
        <span className="font-display text-4xl font-bold text-white">{plan.price}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-brand-400">{folderText}</p>
      <p className={`mt-4 text-sm leading-6 text-gray-300 ${compact ? 'min-h-24' : 'min-h-16'}`}>{plan.description}</p>
      <div className="mt-5 grid gap-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand-400" />
          Activación manual verificada
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand-400" />
          Acceso privado por carpeta
        </div>
      </div>
      <a
        href={createWhatsAppUrl(planWhatsAppMessage(plan.name))}
        target="_blank"
        rel="noreferrer"
        className="focus-ring btn-primary-glow mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 px-4 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
      >
        <MessageCircle className="h-4 w-4" />
        {plan.cta}
      </a>
    </article>
  );
}
