import { Check, MessageCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config/app';
import type { PricingPlan } from '../../types';
import Badge from '../ui/Badge';

type PricingCardProps = {
  plan: PricingPlan;
  compact?: boolean;
};

export default function PricingCard({ plan, compact = false }: PricingCardProps) {
  const folderText = plan.folderLimit === 'total' ? 'Todas las carpetas' : `${plan.folderLimit} carpeta${plan.folderLimit === 1 ? '' : 's'}`;
  const chatMessages: Record<string, string> = {
    individual: 'Hola, quiero revisar la carpeta de S/20. Mi meta es encontrar una oportunidad concreta.',
    starter: 'Hola, quiero revisar el plan Starter de S/65. Quiero que me orienten segun mi meta.',
    'fast-track': 'Hola, quiero revisar el Fast Track de S/99 antes de pagar.',
    power: 'Hola, quiero revisar el Power de S/150. Quiero explorar varias oportunidades.',
    'elite-total': 'Hola, quiero revisar el acceso completo de S/360. Quiero entender que incluye antes de pagar.',
  };

  function openChat() {
    window.dispatchEvent(new CustomEvent('contacthub:open-chat', { detail: { message: chatMessages[plan.id] ?? `Hola, quiero informacion sobre ${plan.name}` } }));
  }

  return (
    <article
      className={`card-hover professional-card relative p-5 transition duration-200 ${
        plan.isRecommended
          ? 'border-brand-400/45 bg-brand-400/[0.07]'
          : plan.isPremium
            ? 'border-brand-300/25 bg-brand-400/[0.04]'
            : ''
      }`}
    >
      <div className="flex min-h-7 items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
        {plan.badge ? <Badge tone={plan.isPremium ? 'green' : 'green'}>{plan.badge}</Badge> : null}
      </div>
      <div className="mt-5 flex items-end gap-1">
        <span className="text-sm font-semibold text-gray-400">{APP_CONFIG.defaultCurrency}</span>
        <span className="stat-number font-display text-4xl font-bold">{plan.price}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-brand-400">{folderText}</p>
      <p className={`mt-4 text-sm leading-6 text-gray-300 ${compact ? 'min-h-24' : 'min-h-16'}`}>{plan.description}</p>
      <div className="mt-5 grid gap-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand-400" />
          Activacion manual verificada
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand-400" />
          Acceso privado por carpeta
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand-400" />
          Orientacion por chat antes de pagar
        </div>
      </div>
      <div className="mt-5 border-t border-line pt-4 text-xs leading-5 text-gray-400">
        <p className="font-bold text-white">Antes de pagar</p>
        <p className="mt-2">Incluye acceso a las carpetas indicadas y telefonos completos cuando el permiso queda activo.</p>
        <p className="mt-2">No incluye resultados garantizados, claves privadas ni acceso automatico sin revision.</p>
      </div>
      <button
        type="button"
        onClick={openChat}
        className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-400"
      >
        <MessageCircle className="h-4 w-4" />
        {plan.cta}
      </button>
    </article>
  );
}
