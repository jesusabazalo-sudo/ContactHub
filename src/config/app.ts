export const APP_CONFIG = {
  name: 'ContactHub',
  internalSlogan: 'No vendo contactos. Vendo oportunidades.',
  headline: 'La mayoría pierde semanas buscando lo que tú encontrarás en los próximos 5 minutos.',
  whatsappNumber: '+51963187899',
  displayWhatsapp: '+51 963 187 899',
  defaultCurrency: 'S/',
  contactsClaim: '695+',
  categoriesClaim: '25',
  startingPrice: 'S/20',
  promo: 'Compra 1 carpeta y recibe 2 más gratis hoy.',
  ownerAdminEmail: import.meta.env.VITE_OWNER_ADMIN_EMAIL || 'tu_correo_admin@ejemplo.com',
  trialCtaText: 'Quiero ver si esto me sirve',
  buyCtaText: 'Ya entendí — quiero entrar',
  welcomeChatMessage:
    'Hola 👋 Soy Jesús — el que armó todo esto. No te voy a vender nada. Pero si tienes una pregunta real, te respondo con la verdad. ¿Qué estás buscando?',
} as const;
