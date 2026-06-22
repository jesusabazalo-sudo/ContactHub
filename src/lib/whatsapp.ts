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

/**
 * Limpia la descripción del contacto para insertarla en el mensaje:
 * - convierte letras "estilizadas" (𝐈𝐀) a ASCII normal (sin tocar acentos)
 * - quita emojis/pictogramas y prefijos de fecha tipo "14/04/2026"
 * - colapsa espacios y recorta a ~80 caracteres en límite de palabra
 */
function cleanContactDescription(raw: string): string {
  let s = (raw ?? '').normalize('NFC');
  s = s.replace(/[\u{1D400}-\u{1D7FF}]/gu, (ch) => ch.normalize('NFKD'));
  s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu, '');
  s = s.replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*/, '');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/[\s.;:,\-–—]+$/u, '').trim();
  if (s.length > 80) {
    s = s.slice(0, 80);
    const lastSpace = s.lastIndexOf(' ');
    if (lastSpace > 40) s = s.slice(0, lastSpace);
    s = s.trim();
  }
  return s;
}

/** minúsculas sin acentos, solo para comparar palabras clave. */
function foldForMatch(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Índice estable (mismo contacto → misma variante; distintos contactos varían). */
function stableIndex(seed: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return mod > 0 ? hash % mod : 0;
}

type MessageBucket = { test: RegExp; variants: Array<(x: string) => string> };

// Orden por prioridad: la primera que coincide gana. Sin mención a la plataforma:
// el mensaje suena como si el cliente respondiera al anuncio del propio proveedor.
const MESSAGE_BUCKETS: MessageBucket[] = [
  {
    // Redes / marketing / crecimiento
    test: /seguidor|\blikes?\b|marketing|publicidad|monetiz|alcance|engagement|\bsmm\b|viral|tiktok|reels?|redes/,
    variants: [
      (x) => `Hola 👋 Me interesa lo de ${x}. ¿Cómo funciona y qué precios manejas?`,
      (x) => `Hola, vi lo de ${x}. ¿Qué planes tienes y cuánto cuestan?`,
    ],
  },
  {
    // Curso / formación
    test: /curso|clase|aprend|taller|diplomad|capacit|ebook|e-book|libro|\bguia\b|tutor|ensen|leccion|formacion|maestria|certificac|megapack/,
    variants: [
      (x) => `Hola 👋 Vi lo de ${x}. Me interesa llevarlo, ¿sigue disponible? ¿Me pasas el temario y el precio?`,
      (x) => `Hola, me interesó ${x}. ¿Sigue abierto el cupo? ¿Qué incluye y cuánto cuesta?`,
    ],
  },
  {
    // Servicio
    test: /servicio|asesor|soporte|reparaci|dise[nñ]|edicion|gestion|instalaci|mantenimiento|consultor|\bhago\b|realizo|ofrezco/,
    variants: [
      (x) => `Hola, vi tu anuncio de ${x}. ¿Me das más información de cómo trabajas y los costos?`,
      (x) => `Hola 👋 Me interesa el servicio de ${x}. ¿Cómo es el proceso y qué precio manejas?`,
    ],
  },
  {
    // Producto / venta
    test: /venta|vendo|\bpack\b|combo|producto|disponible|stock|oferta|compra|iphone|celular|suministr|mayorista|minorista/,
    variants: [
      (x) => `Hola, ¿tienes disponible ${x}? Quisiera saber el precio y cómo hacer el pedido.`,
      (x) => `Hola 👋 Me interesa ${x}. ¿Está disponible? ¿Cuál es el precio?`,
    ],
  },
];

// Genérico (membresía/acceso/suscripción/cuenta/plataforma y todo lo demás).
const GENERIC_VARIANTS: Array<(x: string) => string> = [
  (x) => `Hola, vi tu publicación sobre ${x} y me interesó. ¿Me cuentas más detalles y el precio?`,
  (x) => `Hola 👋 Me interesó ${x}. ¿Me pasas más información, por favor?`,
];

const GENERIC_NO_DESC = 'Hola 👋 Vi tu publicación y me interesó. ¿Me cuentas más detalles y el precio?';

/**
 * Mensaje de WhatsApp para contactar a un proveedor. Varía según palabras clave
 * de la descripción del contacto y NO menciona la plataforma: suena como si el
 * cliente respondiera directamente al anuncio del proveedor.
 * El segundo parámetro se conserva por compatibilidad, pero ya no se usa.
 */
export function buildContactWhatsAppMessage(contactName: string, _categoryName?: string): string {
  const description = cleanContactDescription(contactName);
  if (!description) return GENERIC_NO_DESC;

  const match = foldForMatch(description);
  const bucket = MESSAGE_BUCKETS.find((candidate) => candidate.test.test(match));
  const variants = bucket?.variants ?? GENERIC_VARIANTS;
  const pick = variants[stableIndex(description, variants.length)];
  return pick(description);
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
