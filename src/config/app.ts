export const APP_CONFIG = {
  name: 'ContactHub',
  internalSlogan: 'Encuentra contactos y oportunidades que te acerquen a tus metas.',
  headline: 'No todos buscan un contacto. Algunos buscan una oportunidad.',
  whatsappNumber: '+51963187899',
  defaultCurrency: 'S/',
  contactsClaim: '800+',
  categoriesClaim: '24',
  startingPrice: 'S/20',
  promo: 'Explora, elige según tu meta y desbloquea solo lo que te sirve.',
  ownerAdminEmail: import.meta.env.VITE_OWNER_ADMIN_EMAIL || 'tu_correo_admin@ejemplo.com',
  trialCtaText: 'Quiero ver si esto me sirve',
  buyCtaText: 'Ya entendí — quiero avanzar',
  qrYapeUrl: '/qr-yape.png',
  welcomeChatMessage:
    'Hola 👋 Soy el asistente de ContactHub. Antes de mostrarte algo: ¿qué estás buscando lograr?',
} as const;

// Datos legales para Términos, Privacidad, Devoluciones y Libro de Reclamaciones.
// ⚠️ COMPLETA razón social, RUC y domicilio antes de la revisión de Culqi/INDECOPI.
// Puedes sobreescribir por variables de entorno (VITE_LEGAL_*) sin tocar código.
export const LEGAL = {
  razonSocial: import.meta.env.VITE_LEGAL_RAZON_SOCIAL || '[Razón social o titular — COMPLETAR]',
  ruc: import.meta.env.VITE_LEGAL_RUC || '[RUC — COMPLETAR]',
  domicilio: import.meta.env.VITE_LEGAL_DOMICILIO || '[Domicilio fiscal — COMPLETAR]',
  email: import.meta.env.VITE_LEGAL_EMAIL || '[correo de contacto — COMPLETAR]',
  telefono: import.meta.env.VITE_LEGAL_TELEFONO || APP_CONFIG.whatsappNumber,
  ciudad: 'Lima, Perú',
  updated: '01 de julio de 2026',
} as const;
