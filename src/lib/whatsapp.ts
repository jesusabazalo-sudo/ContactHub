import { APP_CONFIG } from '../config/app';

export function createWhatsAppUrl(message: string) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${APP_CONFIG.whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
}

export function planWhatsAppMessage(planName: string) {
  return `Hola, quiero comprar acceso a ContactHub. Me interesa ${planName}.`;
}

export function categoryWhatsAppMessage(categoryName: string) {
  return `Hola, quiero desbloquear la carpeta ${categoryName} de ContactHub.`;
}

export function servicesWhatsAppMessage() {
  return 'Hola, vi ContactHub y quiero hablar sobre un proyecto digital.';
}
