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
// Solo se muestra el nombre comercial, tipo de operador, RUC, ciudad y correo
// de contacto (sin nombre completo, dirección exacta ni teléfono).
// Puedes sobreescribir RUC/domicilio/correo por variables de entorno (VITE_LEGAL_*).
export const LEGAL = {
  titular: 'ContactHub',
  operadoPor: 'Persona natural con negocio registrada en SUNAT',
  ruc: import.meta.env.VITE_LEGAL_RUC || '10713374216',
  domicilio: import.meta.env.VITE_LEGAL_DOMICILIO || 'Callao, Perú',
  email: import.meta.env.VITE_LEGAL_EMAIL || 'jesusabazalo@gmail.com',
  ciudad: 'Lima, Perú',
  updated: '01 de julio de 2026',
} as const;
