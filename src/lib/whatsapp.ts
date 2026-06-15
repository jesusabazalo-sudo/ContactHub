import { APP_CONFIG } from '../config/app';

export function normalizeWhatsAppPhone(phone?: string | null): string {
  if (!phone) return '';

  const raw = phone.trim();
  if (!raw || /[•*]/.test(raw)) return '';

  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15 || /^0{4,}/.test(digits)) return '';

  if (raw.startsWith('+')) return digits;
  if (/^9\d{8}$/.test(digits)) return `51${digits}`;

  return digits;
}

export function buildWhatsAppLink(phone: string | null | undefined, message: string): string {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  const cleanMessage = message.trim();
  if (!cleanPhone || !cleanMessage) return '';

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(cleanMessage)}`;
}

export function buildContactWhatsAppMessage(contactName: string, categoryName: string): string {
  const safeContactName = contactName.trim() || 'este servicio';
  const safeCategoryName = categoryName.trim() || 'ContactHub';
  const normalizedCategory = safeCategoryName.toLocaleLowerCase('es');

  if (/negocio|empresa|proveedor|elite business|cash flow|corporate/.test(normalizedCategory)) {
    return `Hola, vengo desde ContactHub. Vi tu contacto en la categoría Negocios, empresas y proveedores. Me interesa saber más sobre ${safeContactName}. ¿Podrías brindarme información?`;
  }

  if (/educaci|curso|libro|knowledge vault/.test(normalizedCategory)) {
    return `Hola, vengo desde ContactHub. Vi tu contacto en Educación, cursos y libros. Me interesa consultar sobre ${safeContactName}. ¿Me podrías enviar detalles?`;
  }

  if (/fitness|salud|nutrici|fit kingdom|warrior fit/.test(normalizedCategory)) {
    return `Hola, vengo desde ContactHub. Vi tu contacto en Fitness, salud y nutrición. Me interesa saber más sobre ${safeContactName}. ¿Me brindas información?`;
  }

  if (/marketing|scale up|crecimiento/.test(normalizedCategory)) {
    return `Hola, vengo desde ContactHub. Vi tu contacto en Marketing digital y crecimiento. Me interesa consultar sobre ${safeContactName}. ¿Podrías darme más detalles?`;
  }

  return `Hola, vengo desde ContactHub. Vi tu contacto en la categoría ${safeCategoryName} y me interesa consultar sobre: ${safeContactName}. ¿Podrías darme más información, por favor?`;
}

export function createWhatsAppUrl(message: string) {
  return buildWhatsAppLink(APP_CONFIG.whatsappNumber, message);
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
