import { CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthProvider';
import { isCulqiEnabled, openCulqiCheckout } from '../../lib/culqi';
import { supabase } from '../../lib/supabaseClient';
import type { PricingPlan } from '../../types';

type Props = {
  plan: PricingPlan;
  /** Carpetas elegidas (obligatorio para planes no-totales). */
  categoryIds?: string[];
};

/**
 * Botón de pago automático con Culqi. Inerte si no hay VITE_CULQI_PUBLIC_KEY:
 * en ese caso no se renderiza y el usuario sigue con el flujo manual (Yape + chat).
 * El cobro y la activación los hace la Edge Function `culqi-charge` (servidor).
 */
export default function CulqiPayButton({ plan, categoryIds }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!isCulqiEnabled || !supabase) return null;

  async function pay() {
    if (!user) {
      toast.info('Crea tu cuenta para pagar y activar tu acceso al instante.');
      navigate('/auth?redirect=/precios');
      return;
    }
    setLoading(true);
    try {
      // Resolver el plan real (id + precio) desde la BD; nunca confiar en el front.
      const { data: dbPlans, error: planErr } = await supabase!
        .from('plans').select('id, price').eq('price', plan.price);
      if (planErr || !dbPlans?.length) throw new Error('No se pudo cargar el plan.');
      const dbPlan = dbPlans[0];

      const token = await openCulqiCheckout({
        title: 'ContactHub',
        amountCents: Math.round(Number(dbPlan.price) * 100),
        description: plan.name,
      });

      const { data, error } = await supabase!.functions.invoke('culqi-charge', {
        body: { token: token.id, planId: dbPlan.id, categoryIds, email: token.email ?? user.email },
      });
      if (error) throw new Error(error.message);
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      toast.success('¡Pago confirmado! Tu acceso quedó activo.');
      navigate('/mis-contactos');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo completar el pago.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void pay()}
      disabled={loading}
      className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-contrast transition hover:bg-brand-hover disabled:opacity-60"
    >
      <CreditCard className="h-4 w-4" />
      {loading ? 'Procesando…' : 'Pagar con tarjeta o Yape'}
    </button>
  );
}
