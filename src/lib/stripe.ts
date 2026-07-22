// Flag de activación del checkout con Stripe. Solo si VITE_STRIPE_PUBLIC_KEY
// está definida se muestra el botón de "Pagar con tarjeta"; si no, el flujo
// sigue siendo Yape/Plin manual como hasta ahora.
export const isStripeEnabled = Boolean(import.meta.env.VITE_STRIPE_PUBLIC_KEY?.trim());
