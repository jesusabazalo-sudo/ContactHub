export const APP_CONFIG = {
  name: 'ContactHub',
  internalSlogan: 'Encuentra contactos y oportunidades que te acerquen a tus metas.',
  headline: 'No todos buscan un contacto. Algunos buscan una oportunidad.',
  whatsappNumber: '+51963187899',
  defaultCurrency: 'S/',
  contactsClaim: '800+',
  categoriesClaim: '25',
  startingPrice: 'S/20',
  promo: 'Explora, elige según tu meta y desbloquea solo lo que te sirve.',
  ownerAdminEmail: import.meta.env.VITE_OWNER_ADMIN_EMAIL || 'tu_correo_admin@ejemplo.com',
  trialCtaText: 'Quiero ver si esto me sirve',
  buyCtaText: 'Ya entendí — quiero avanzar',
  qrYapeUrl: '/qr-yape.png',
  welcomeChatMessage:
    'Hola 👋 Soy el asistente de ContactHub. Antes de mostrarte algo: ¿qué estás buscando lograr?',
} as const;
