// Espejo de src/data/pricing.ts para las Edge Functions.
//
// Deno no puede importar directamente desde src/ al desplegar (cada función
// se empaqueta de forma aislada), así que esta lista se mantiene sincronizada
// a mano con src/data/pricing.ts. Si cambian precios o folderLimit ahí,
// actualízalos aquí también.

export type StripePlan = {
  id: string;
  name: string;
  price: number; // en soles (PEN), igual que src/data/pricing.ts
  folderLimit: number | 'total';
};

export const STRIPE_PLANS: StripePlan[] = [
  { id: 'individual', name: 'Carpeta Individual', price: 20, folderLimit: 1 },
  { id: 'starter', name: 'Starter', price: 65, folderLimit: 4 },
  { id: 'fast-track', name: 'Fast Track', price: 99, folderLimit: 7 },
  { id: 'power', name: 'Power', price: 150, folderLimit: 10 },
  { id: 'elite-total', name: 'Acceso completo', price: 360, folderLimit: 'total' },
];

export function getPlanById(planId: string): StripePlan | null {
  return STRIPE_PLANS.find((plan) => plan.id === planId) ?? null;
}
