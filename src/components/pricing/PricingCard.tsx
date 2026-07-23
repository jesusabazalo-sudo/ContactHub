import { Check, CreditCard, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { APP_CONFIG } from '../../config/app';
import { useAuth } from '../../features/auth/AuthProvider';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { isStripeEnabled } from '../../lib/stripe';
import type { PricingPlan } from '../../types';
import Badge from '../ui/Badge';

type PricingCardProps = {
  plan: PricingPlan;
  compact?: boolean;
};

export default function PricingCard({ plan, compact = false }: PricingCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
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

  async function handleStripeCheckout() {
    if (!user) {
      navigate('/auth?redirect=/precios');
      return;
    }
    if (!supabase || !isSupabaseConfigured) {
      toast.error('El pago con tarjeta no está disponible en este momento.');
      return;
    }
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          plan_id: plan.id,
          user_id: user.id,
          success_url: `${window.location.origin}/mis-contactos?pago=exitoso`,
          cancel_url: `${window.location.origin}/precios`,
        },
      });
      if (error) throw new Error(error.message);
      const result = data as { url?: string; error?: string } | null;
      if (!result?.url) throw new Error(result?.error ?? 'No se pudo iniciar el pago.');
      window.location.href = result.url;
    } catch (checkoutError) {
      toast.error(checkoutError instanceof Error ? checkoutError.message : 'No se pudo iniciar el pago con tarjeta.');
      setIsCheckingOut(false);
    }
  }

  return (
    <article
      className={`card-hover professional-card relative flex h-full flex-col p-6 transition duration-200 ${
        plan.isRecommended ? 'border-brand/50 ring-1 ring-brand/30' : ''
      }`}
    >
      {plan.isRecommended ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-contrast shadow-card-sm">
          Recomendado
        </span>
      ) : null}
      <div className="flex min-h-7 items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-content">{plan.name}</h3>
        {plan.badge && !plan.isRecommended ? <Badge tone={plan.isPremium ? 'gold' : 'green'}>{plan.badge}</Badge> : null}
      </div>
      <div className="mt-5 flex items-end gap-1">
        <span className="text-sm font-semibold text-content-secondary">{APP_CONFIG.defaultCurrency}</span>
        <span className="font-display text-5xl font-bold tracking-tight text-content">{plan.price}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-brand-text">{folderText}</p>
      <p className={`mt-4 text-sm leading-6 text-content-secondary ${compact ? 'min-h-24' : 'min-h-16'}`}>{plan.description}</p>
      <div className="mt-5 grid gap-2.5 text-sm text-content-secondary">
        {['Activación manual verificada', 'Acceso privado por carpeta', 'Orientación por chat antes de pagar'].map((feature) => (
          <div key={feature} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand/15 text-brand-text">
              <Check className="h-3 w-3" />
            </span>
            {feature}
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-border pt-4 text-xs leading-5 text-content-secondary">
        <p className="font-semibold text-content">Antes de pagar</p>
        <p className="mt-2">Incluye acceso a las carpetas indicadas y teléfonos completos cuando el permiso queda activo.</p>
        <p className="mt-2">No incluye resultados garantizados, claves privadas ni acceso automático sin revisión.</p>
      </div>
      {isStripeEnabled ? (
        <>
          <button
            type="button"
            onClick={() => void handleStripeCheckout()}
            disabled={isCheckingOut}
            className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-contrast transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CreditCard className="h-4 w-4" />
            {isCheckingOut ? 'Redirigiendo...' : 'Pagar con tarjeta'}
          </button>
          <button
            type="button"
            onClick={openChat}
            className="focus-ring mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-content transition hover:border-brand/40"
          >
            <MessageCircle className="h-4 w-4" />
            Pagar por Yape/Plin (sin comisión)
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={openChat}
          className={`focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
            plan.isRecommended
              ? 'bg-brand text-brand-contrast hover:bg-brand-hover'
              : 'border border-border bg-surface text-content hover:border-brand/40'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          {plan.cta}
        </button>
      )}
    </article>
  );
}
