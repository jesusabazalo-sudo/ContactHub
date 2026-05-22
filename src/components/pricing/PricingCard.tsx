import { Check, MessageCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config/app';
import type { PricingPlan } from '../../types';
import Badge from '../ui/Badge';

type PricingCardProps = {
  plan: PricingPlan;
  compact?: boolean;
};

export default function PricingCard({ plan, compact = false }: PricingCardProps) {
  const folderText = plan.folderLimit === 'total' ? 'Acceso total' : `${plan.folderLimit} carpeta${plan.folderLimit === 1 ? '' : 's'}`;
  const chatMessages: Record<string, string> = {
    individual: 'Hola, quiero la carpeta de S/20',
    starter: 'Hola, quiero el plan Starter de S/65',
    'fast-track': 'Hola, quiero el Fast Track de S/99',
    power: 'Hola, quiero el Power de S/150',
    'elite-total': 'Hola, quiero el Elite Total de S/360',
  };

  function openChat() {
    window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message: chatMessages[plan.id] ?? `Hola, quiero información sobre ${plan.name}` } }));
  }

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
      <button
        type="button"
        onClick={openChat}
        className="focus-ring btn-primary-glow mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 px-4 py-3 text-sm font-bold text-ink-950 transition hover:bg-white"
      >
        <MessageCircle className="h-4 w-4" />
        {plan.cta}
      </button>
    </article>
  );
}
