import type { PricingPlan } from '../types';

export const pricingPlans: PricingPlan[] = [
  {
    id: 'individual',
    name: 'Carpeta Individual',
    price: 20,
    folderLimit: 1,
    description: 'Una decisión pequeña. Un resultado que puede cambiar lo que estás buscando.',
    cta: 'Quiero esta carpeta',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 65,
    folderLimit: 4,
    description: 'Para los que ya saben que una sola no alcanza.',
    cta: 'Elegir Starter',
  },
  {
    id: 'fast-track',
    name: 'Fast Track',
    price: 99,
    folderLimit: 7,
    description: 'Las 7 carpetas que más resultados dan. Curadas por mí. Sin adivinar.',
    cta: 'Ir por Fast Track',
    badge: 'Recomendado',
    isRecommended: true,
  },
  {
    id: 'power',
    name: 'Power',
    price: 150,
    folderLimit: 10,
    description: 'Cuando quieres tener opciones de verdad, no solo una.',
    cta: 'Elegir Power',
  },
  {
    id: 'elite-total',
    name: 'Elite Total',
    price: 360,
    folderLimit: 'total',
    description: 'Para los que entienden que la información correcta vale mucho más que lo que cuesta.',
    cta: 'Quiero Elite Total',
    badge: 'Premium',
    isPremium: true,
  },
];
