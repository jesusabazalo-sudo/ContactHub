import type { PricingPlan } from '../types';

export const pricingPlans: PricingPlan[] = [
  {
    id: 'individual',
    name: 'Carpeta Individual',
    price: 20,
    folderLimit: 1,
    description: 'Para cuando tienes una meta concreta y solo necesitas empezar con una carpeta útil.',
    cta: 'Explorar esta opción',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 65,
    folderLimit: 4,
    description: 'Una base práctica para comparar caminos, probar ideas y avanzar sin comprar de más.',
    cta: 'Elegir Starter',
  },
  {
    id: 'fast-track',
    name: 'Fast Track',
    price: 99,
    folderLimit: 7,
    description: 'Para quienes quieren moverse más rápido con varias oportunidades relacionadas a su objetivo.',
    cta: 'Ir por Fast Track',
    badge: 'Recomendado',
    isRecommended: true,
  },
  {
    id: 'power',
    name: 'Power',
    price: 150,
    folderLimit: 10,
    description: 'Más alternativas, más ángulos y más posibilidades para negocio, aprendizaje o proveedores.',
    cta: 'Elegir Power',
  },
  {
    id: 'elite-total',
    name: 'Acceso completo',
    price: 360,
    folderLimit: 'total',
    description: 'Acceso amplio para personas que quieren explorar ContactHub como una base completa de oportunidades.',
    cta: 'Revisar acceso completo',
    badge: 'Acceso amplio',
    isPremium: true,
  },
];
