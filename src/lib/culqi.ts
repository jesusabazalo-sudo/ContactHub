// Integración con Culqi Checkout (v4) en el cliente.
// Solo se activa si existe VITE_CULQI_PUBLIC_KEY (pk_test_... en sandbox).
// Tokeniza la tarjeta/Yape en el navegador; el cobro real lo hace la Edge
// Function `culqi-charge` con la llave secreta (el front nunca ve dinero).

export const CULQI_PUBLIC_KEY = import.meta.env.VITE_CULQI_PUBLIC_KEY?.trim() ?? '';
export const isCulqiEnabled = Boolean(CULQI_PUBLIC_KEY);

const CULQI_SCRIPT = 'https://js.culqi.com/checkout-js';

type CulqiToken = { id: string; email?: string };
type CulqiGlobal = {
  publicKey: string;
  token?: CulqiToken;
  order?: unknown;
  error?: { user_message?: string; merchant_message?: string };
  settings: (opts: Record<string, unknown>) => void;
  options?: (opts: Record<string, unknown>) => void;
  open: () => void;
  close?: () => void;
};

function getCulqi(): CulqiGlobal | null {
  return (window as unknown as { Culqi?: CulqiGlobal }).Culqi ?? null;
}

let scriptPromise: Promise<void> | null = null;

function loadCulqiScript(): Promise<void> {
  if (getCulqi()) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = CULQI_SCRIPT;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error('No se pudo cargar Culqi.'));
    document.head.appendChild(el);
  });
  return scriptPromise;
}

export type CheckoutParams = {
  title: string;
  amountCents: number; // monto en céntimos (S/20.00 -> 2000)
  description?: string;
};

/**
 * Abre el checkout de Culqi y resuelve con el token (y email) cuando el usuario
 * completa el formulario. Rechaza si hay error o lo cierra.
 */
export async function openCulqiCheckout({ title, amountCents, description }: CheckoutParams): Promise<CulqiToken> {
  if (!isCulqiEnabled) throw new Error('Culqi no está configurado.');
  await loadCulqiScript();
  const Culqi = getCulqi();
  if (!Culqi) throw new Error('Culqi no disponible.');

  Culqi.publicKey = CULQI_PUBLIC_KEY;
  Culqi.settings({
    title,
    currency: 'PEN',
    amount: amountCents,
    description: description ?? title,
  });
  if (Culqi.options) {
    Culqi.options({
      lang: 'es',
      installments: false,
      paymentMethods: { tarjeta: true, yape: true, billetera: true, bancaMovil: false, agente: false, cuotealo: false },
    });
  }

  return new Promise<CulqiToken>((resolve, reject) => {
    (window as unknown as { culqi: () => void }).culqi = () => {
      const c = getCulqi();
      if (c?.token?.id) resolve({ id: c.token.id, email: c.token.email });
      else reject(new Error(c?.error?.user_message ?? 'Pago cancelado o no completado.'));
    };
    Culqi.open();
  });
}
