import { Copy, MessageCircle, Paperclip, Send, UploadCloud, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { APP_CONFIG } from '../../config/app';
import { officialCategories } from '../../data/officialCategories';
import { useAuth } from '../../features/auth/AuthProvider';
import { useAutofillProfile } from '../../hooks/useAutofillProfile';
import { sanitizeText } from '../../lib/sanitize';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

type ChatMessage = {
  id: string;
  user_id: string | null;
  message: string;
  session_id: string;
  sender: 'user' | 'admin';
  read: boolean;
  created_at: string;
  kind?: 'text' | 'yapeQr';
  has_attachment?: boolean | null;
  attachment_path?: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  comprobante_status?: 'pendiente' | 'verificado' | 'rechazado' | null;
};

type ChatFlow = 'main' | 'prices' | 'promos' | 'folders' | 'folderDetail' | 'payment' | 'paid' | 'qr' | 'help' | 'missions' | 'privacy' | 'newUser' | 'human';

type ChatAction = {
  label: string;
  type:
    | 'main'
    | 'prices'
    | 'promos'
    | 'folders'
    | 'folder'
    | 'payment'
    | 'paid'
    | 'yapeQr'
    | 'help'
    | 'helpTopic'
    | 'missions'
    | 'missionEvidence'
    | 'catalog'
    | 'auth'
    | 'human'
    | 'whatsapp'
    | 'uploadReceipt'
    | 'plan';
  value?: string;
};

type ChatPlan = {
  id: string;
  label: string;
  name: string;
  price: string;
  folderText: string;
  description: string;
};

type ChatCategory = {
  index: number;
  name: string;
  shortName: string;
  description: string;
  finds: string[];
  price?: string;
};

type PaymentMethod = {
  id: 'yape' | 'plin';
  title: string;
  number: string;
  qrUrl: string;
};

type ReceiptPreview = {
  fileName: string;
  fileType: string;
  previewUrl: string | null;
  status: 'ready' | 'uploaded' | 'fallback';
};

function dynamicSupabase() {
  return supabase as unknown as {
    from: (table: string) => any;
    storage: {
      from: (bucket: string) => {
        upload: (path: string, file: File, options?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
        createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
      };
    };
  };
}

const welcomeMessage = 'Hola 👋 Soy el asistente de ContactHub. Antes de avanzar, dime qué necesitas.';
const renewedMessage = '¡Hola! 👋 Chat renovado. ¿En qué puedo ayudarte hoy?';
const chatRetentionNote = '💬 El chat se renueva cada 24h. Los comprobantes se guardan.';

const plans: ChatPlan[] = [
  { id: 'individual', label: 'S/20 — 1 carpeta', name: 'Carpeta individual', price: 'S/20', folderText: '1 carpeta', description: 'Ideal si tienes una meta concreta y quieres empezar por una carpeta específica.' },
  { id: 'starter', label: 'S/65 — 4 carpetas', name: 'Starter', price: 'S/65', folderText: '4 carpetas', description: 'Una base práctica para comparar opciones sin ir directo al acceso total.' },
  { id: 'fast-track', label: 'S/99 — 7 carpetas', name: 'Fast Track', price: 'S/99', folderText: '7 carpetas', description: 'Para avanzar más rápido con varias carpetas relacionadas a tu objetivo.' },
  { id: 'power', label: 'S/150 — 10 carpetas', name: 'Power', price: 'S/150', folderText: '10 carpetas', description: 'Más alternativas para negocio, aprendizaje, proveedores o servicios.' },
  { id: 'elite-total', label: 'S/360 — Acceso completo', name: 'Acceso completo', price: 'S/360', folderText: 'todas las carpetas', description: 'Para quienes quieren explorar ContactHub de forma amplia y entender todas las categorias disponibles.' },
];

const legacyChatFolderCategories: ChatCategory[] = [
  { index: 1, name: 'CORPORATE & NEGOCIOS', shortName: 'CORPORATE & NEGOCIOS', description: 'Contactos y oportunidades vinculadas al mundo empresarial, servicios corporativos y crecimiento comercial.', finds: ['proveedores', 'servicios corporativos', 'contactos de negocio', 'oportunidades comerciales'], price: 'S/20' },
  { index: 2, name: 'INTELIGENCIA ARTIFICIAL & TECH', shortName: 'IA & TECH', description: 'Recursos y contactos orientados a automatización, tecnología, IA y herramientas digitales.', finds: ['herramientas IA', 'automatización', 'productividad digital', 'recursos tech'], price: 'S/20' },
  { index: 3, name: 'EDUCACIÓN, CURSOS & LIBROS', shortName: 'EDUCACIÓN, CURSOS & LIBROS', description: 'Opciones vinculadas a aprendizaje, clases, cursos, libros y formación.', finds: ['cursos', 'tutorías', 'libros y recursos', 'formación profesional'], price: 'S/20' },
  { index: 4, name: 'FITNESS, SALUD & NUTRICIÓN', shortName: 'FITNESS & SALUD', description: 'Contactos relacionados con bienestar físico, nutrición, entrenamiento y hábitos saludables.', finds: ['entrenadores', 'nutrición', 'rutinas', 'bienestar saludable'], price: 'S/20' },
  { index: 5, name: 'CREATIVIDAD, DISEÑO & FOTOGRAFÍA', shortName: 'CREATIVIDAD & DISEÑO', description: 'Recursos y contactos para diseño, fotografía, edición y creatividad visual.', finds: ['diseño', 'fotografía', 'edición', 'recursos visuales'], price: 'S/20' },
  { index: 6, name: 'GAMING, STREAMING & ENTRETENIMIENTO', shortName: 'GAMING & STREAMING', description: 'Opciones vinculadas a gaming, streaming, entretenimiento digital y comunidades online.', finds: ['streaming', 'gaming', 'comunidades', 'entretenimiento digital'], price: 'S/20' },
  { index: 7, name: 'MARKETING DIGITAL & CRECIMIENTO', shortName: 'MARKETING DIGITAL', description: 'Contactos para marketing, ventas, redes sociales, crecimiento digital y adquisición de clientes.', finds: ['marketing', 'ventas', 'redes sociales', 'crecimiento'], price: 'S/20' },
  { index: 8, name: 'DEPORTES & MANUALIDADES', shortName: 'DEPORTES & MANUALIDADES', description: 'Contactos y recursos para deportes específicos, hobbies, actividades manuales y comunidades especializadas.', finds: ['deportes', 'manualidades', 'hobbies', 'actividades guiadas'], price: 'S/20' },
  { index: 9, name: 'REPARACIONES TÉCNICAS & OFICIOS', shortName: 'REPARACIONES & OFICIOS', description: 'Contactos para reparaciones, soporte técnico, mantenimiento, oficios y soluciones prácticas.', finds: ['servicios técnicos', 'reparaciones', 'mantenimiento', 'oficios'], price: 'S/20' },
  { index: 10, name: 'ESPIRITUALIDAD, OCULTISMO & FAMILIA', shortName: 'ESPIRITUALIDAD & FAMILIA', description: 'Opciones relacionadas con orientación personal, bienestar familiar y temas afines.', finds: ['orientación', 'bienestar familiar', 'recursos de apoyo', 'espiritualidad'], price: 'S/20' },
  { index: 11, name: 'VARIOS & BONUS', shortName: 'VARIOS & BONUS', description: 'Carpeta flexible con recursos variados, oportunidades bonus y contactos útiles difíciles de clasificar.', finds: ['recursos variados', 'bonus útiles', 'oportunidades sueltas', 'contactos especiales'], price: 'S/20' },
  { index: 12, name: 'POWER MONEY & NEGOCIOS ESCALABLES', shortName: 'POWER MONEY', description: 'Contactos y oportunidades vinculadas a negocios escalables, ideas comerciales y crecimiento económico.', finds: ['ideas de negocio', 'modelos escalables', 'oportunidades', 'recursos de crecimiento'], price: 'S/20' },
  { index: 13, name: 'MENTES MAESTRAS & ALTO RENDIMIENTO', shortName: 'MENTES MAESTRAS', description: 'Recursos sobre productividad, enfoque, mentalidad, rendimiento personal y desarrollo aplicado.', finds: ['productividad', 'mentalidad', 'alto rendimiento', 'desarrollo personal'], price: 'S/20' },
  { index: 14, name: 'CONTENT KINGS & VIRAL LAB', shortName: 'CONTENT KINGS', description: 'Contactos y recursos para creación de contenido, viralidad, edición, redes y producción digital.', finds: ['creadores', 'edición', 'viralidad', 'producción digital'], price: 'S/20' },
  { index: 15, name: 'AUDIO MASTERS & MÚSICA', shortName: 'AUDIO MASTERS', description: 'Contactos para música, audio, streaming, beats, sonido, producción y recursos musicales.', finds: ['música', 'audio', 'streaming', 'producción sonora'], price: 'S/20' },
  { index: 16, name: 'GAMER ELITE & VICIOS DIGITALES', shortName: 'GAMER ELITE', description: 'Opciones de gaming avanzado, entretenimiento digital, comunidades, recursos gamer y cultura digital.', finds: ['recursos gamer', 'comunidades', 'entretenimiento digital', 'herramientas gaming'], price: 'S/20' },
  { index: 17, name: 'ESPIRITUALIDAD & PODER INTERIOR', shortName: 'PODER INTERIOR', description: 'Contactos y recursos para crecimiento interior, bienestar emocional, enfoque personal y espiritualidad.', finds: ['bienestar emocional', 'crecimiento interior', 'orientación', 'recursos espirituales'], price: 'S/20' },
  { index: 18, name: 'PROHIBIDO', shortName: 'PROHIBIDO', description: 'Carpeta restringida para clasificación interna y control de seguridad. No se recomienda como compra normal.', finds: ['control interno', 'clasificación', 'revisión', 'seguridad'] },
  { index: 19, name: 'FAMILIA, EDUCACIÓN & DESARROLLO INFANTIL', shortName: 'FAMILIA & EDUCACIÓN', description: 'Contactos para familia, educación infantil, crianza, aprendizaje temprano y desarrollo de niños.', finds: ['educación infantil', 'crianza', 'recursos familiares', 'desarrollo infantil'], price: 'S/20' },
  { index: 20, name: 'OFICIOS & HERRAMIENTAS PRO', shortName: 'OFICIOS PRO', description: 'Contactos relacionados con oficios, herramientas profesionales, servicios técnicos y soluciones de trabajo.', finds: ['herramientas pro', 'oficios', 'servicios técnicos', 'soluciones de trabajo'], price: 'S/20' },
  { index: 21, name: 'CIENCIA, TÉCNICA & CONOCIMIENTO AVANZADO', shortName: 'CIENCIA & TÉCNICA', description: 'Recursos especializados para ciencia, técnica, conocimiento avanzado, formación y aprendizaje profundo.', finds: ['conocimiento avanzado', 'recursos técnicos', 'ciencia aplicada', 'formación especializada'], price: 'S/20' },
  { index: 22, name: 'FITNESS WARRIOR', shortName: 'FITNESS WARRIOR', description: 'Contactos y recursos para entrenamiento intenso, disciplina física, rendimiento y estilo de vida activo.', finds: ['entrenamiento', 'disciplina física', 'rutinas intensas', 'rendimiento'], price: 'S/20' },
  { index: 23, name: 'CHEF PREMIUM & GASTRONOMÍA', shortName: 'CHEF PREMIUM', description: 'Contactos para cocina, gastronomía, alimentos, chef premium, insumos y oportunidades culinarias.', finds: ['chef premium', 'insumos', 'cocina', 'oportunidades gastronómicas'], price: 'S/20' },
  { index: 24, name: 'BONUS TRACK & TESOROS OCULTOS', shortName: 'BONUS TRACK', description: 'Recursos especiales, contactos bonus y oportunidades valiosas que no encajan en una sola categoría.', finds: ['contactos bonus', 'recursos especiales', 'oportunidades ocultas', 'ideas poco comunes'], price: 'S/20' },
  { index: 25, name: 'ACCESO TOTAL', shortName: 'ACCESO TOTAL', description: 'Opción premium para quienes quieren una vista amplia de ContactHub y acceso estratégico a todas las oportunidades disponibles.', finds: ['todas las carpetas', 'contactos estratégicos', 'visión completa', 'soporte de orientación'], price: 'S/360' },
];

const officialChatFolderCategories: ChatCategory[] = officialCategories.map((category) => ({
  index: category.sortOrder,
  name: category.title,
  shortName: category.subtitle,
  description: category.description,
  finds: category.whatYouCanFind,
  price: 'S/20',
}));

const mainActions: ChatAction[] = [
  { label: 'Ver precios y promos', type: 'prices' },
  { label: 'Quiero una carpeta', type: 'folders' },
  { label: 'Cómo pago', type: 'payment' },
  { label: 'Subir comprobante', type: 'uploadReceipt' },
  { label: 'No entiendo algo', type: 'help' },
  { label: 'Guía rápida', type: 'catalog', value: '/guia' },
  { label: 'Ganar contacto gratis', type: 'missions' },
  { label: 'Contactar soporte', type: 'human' },
];

const helpTopics: Record<string, string> = {
  what: 'ContactHub es un directorio organizado de contactos y oportunidades. La idea no es solo ver números, sino encontrar contactos que te acerquen a una meta: aprender, vender, trabajar, crecer o resolver algo.',
  receive: 'Recibes acceso a la carpeta o pack que elijas. Los teléfonos completos solo se muestran cuando tu acceso está activo.',
  trial: 'Puedes elegir una carpeta para ver una muestra limitada de contactos reales. La prueba se usa una sola vez.',
  unlock: 'Después del pago o recompensa aprobada, activamos tu acceso. Desde ese momento puedes ver los contactos completos de la carpeta correspondiente.',
  pay: 'Puedes pagar por Yape. Escanea el QR o copia el número si está disponible. Luego sube tu comprobante aquí mismo para revisar y activar tu acceso.',
  trust: 'Puedes explorar antes de registrarte o pagar. El correo solo guarda tus accesos, pruebas y comprobantes. No pedimos claves bancarias, codigos privados ni contrasenas de Gmail. El acceso se activa de forma manual y verificada.',
  free: 'Sí. Puedes registrarte, explorar el catálogo y ganar contactos extra completando misiones como compartir ContactHub y enviar evidencia.',
};

const autoResponses = [
  {
    keywords: ['precio', 'cuanto', 'cuánto', 'costo', 'vale', 'cobras'],
    response: `Los precios son:
- 1 carpeta: S/20
- Pack Starter (4 carpetas): S/65
- Pack Power (10 carpetas): S/150  
- Acceso completo (24 carpetas): S/360

Puedes revisar el catalogo antes de pagar. Si quieres, te ayudo a elegir segun tu meta.`,
    flow: 'prices' as ChatFlow,
  },
  {
    keywords: ['pagar', 'pago', 'yape', 'plin', 'transferencia', 'comprar'],
    response: 'Puedes pagar por Yape. Escanea el QR o usa el numero disponible solo cuando tengas claro que opcion quieres. Luego subes tu comprobante aqui mismo para revision manual y activacion.',
    flow: 'payment' as ChatFlow,
  },
  {
    keywords: ['acceso', 'activar', 'cuando', 'cuándo', 'tiempo'],
    response: `⚡ Tu acceso se activa en minutos después de verificar tu pago.
Recibirás una notificación aquí mismo en el chat.
El proceso es rápido: normalmente menos de 5 minutos. 🚀`,
    flow: 'paid' as ChatFlow,
  },
  {
    keywords: ['que hay', 'qué hay', 'que tiene', 'carpeta', 'categoria', 'categoría'],
    response: `📂 Tenemos 24 carpetas organizadas: IA, educación, negocios, gaming, diseño, fitness, música y más.

En total hay más de 800 contactos. ¿Qué tipo de oportunidad quieres explorar?`,
    flow: 'folders' as ChatFlow,
  },
  {
    keywords: ['garantia', 'garantía', 'seguro', 'confiable', 'funciona'],
    response: 'Te entiendo. Puedes explorar antes de decidir. No pedimos claves, codigos privados ni contrasenas externas. Los contactos completos solo se muestran cuando tu acceso esta activo, y tambien puedes probar contactos gratis.',
    flow: 'privacy' as ChatFlow,
  },
  {
    keywords: ['gratis', 'prueba', 'probar', 'free'],
    response: '🎁 Sí. Puedes registrarte gratis, explorar el catálogo y usar una prueba limitada de contactos reales.',
    flow: 'missions' as ChatFlow,
  },
  {
    keywords: ['hola', 'buenas', 'buenos', 'hey', 'hi'],
    response: `¡Hola! 👋 Bienvenido a ContactHub.
Tenemos más de 800 contactos directos organizados en 24 categorías.
¿Qué estás buscando? Cuéntame y te ayudo a encontrarlo. 😊`,
    flow: 'main' as ChatFlow,
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function localMessage(message: string, sender: 'user' | 'admin', kind: ChatMessage['kind'] = 'text', extras: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `${sender}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_id: null,
    session_id: 'local',
    sender,
    read: true,
    message,
    created_at: new Date().toISOString(),
    kind,
    has_attachment: false,
    attachment_path: null,
    attachment_url: null,
    attachment_type: null,
    attachment_name: null,
    attachment_size: null,
    comprobante_status: 'pendiente',
    ...extras,
  };
}

function cleanEnv(value?: string) {
  return (value ?? '').trim();
}

function getPaymentMethods(): PaymentMethod[] {
  const yapeNumber = cleanEnv(import.meta.env.NEXT_PUBLIC_YAPE_NUMBER as string | undefined);
  const yapeQrUrl = cleanEnv(import.meta.env.NEXT_PUBLIC_YAPE_QR_URL as string | undefined) || APP_CONFIG.qrYapeUrl;
  const plinNumber = cleanEnv(import.meta.env.NEXT_PUBLIC_PLIN_NUMBER as string | undefined);
  const plinQrUrl = cleanEnv(import.meta.env.NEXT_PUBLIC_PLIN_QR_URL as string | undefined);
  const methods: PaymentMethod[] = [];

  if (yapeNumber || yapeQrUrl) methods.push({ id: 'yape', title: 'Pago por Yape', number: yapeNumber, qrUrl: yapeQrUrl });
  if (plinNumber || plinQrUrl) methods.push({ id: 'plin', title: 'Pago por Plin', number: plinNumber, qrUrl: plinQrUrl });

  return methods;
}

function paymentInfoMessage() {
  return 'Puedes pagar por Yape. Escanea el QR o usa el numero disponible solo cuando ya elegiste una opcion. Luego sube tu comprobante aqui mismo para revision manual. ContactHub nunca te pedira claves bancarias, codigos privados ni contrasenas externas.';
}

function getWhatsAppUrl(message: string) {
  const number = (cleanEnv(import.meta.env.NEXT_PUBLIC_WHATSAPP_NUMBER as string | undefined) || APP_CONFIG.whatsappNumber).replace(/\D/g, '');
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function getPlanAmount(plan: ChatPlan | null) {
  if (!plan) return null;
  const amount = Number(plan.price.replace(/[^\d.]/g, ''));
  return Number.isFinite(amount) ? amount : null;
}

function findPlanFromText(text: string) {
  if (hasAny(text, ['elite total', 'elite', 'acceso total', '360', 's/360', 's360', 'de 360'])) return plans.find((plan) => plan.id === 'elite-total');
  if (hasAny(text, ['power', '150', 's/150', 's150', 'de 150'])) return plans.find((plan) => plan.id === 'power');
  if (hasAny(text, ['fast track', 'fast', '99', 's/99', 's99', 'de 99'])) return plans.find((plan) => plan.id === 'fast-track');
  if (hasAny(text, ['starter', '65', 's/65', 's65', 'de 65'])) return plans.find((plan) => plan.id === 'starter');
  if (hasAny(text, ['carpeta de 20', 's/20', 's20', '20 soles', 'de 20', '1 carpeta', 'una carpeta'])) return plans.find((plan) => plan.id === 'individual');
  return undefined;
}

function findCategoryFromText(text: string) {
  const numberMatch = text.match(/\b([1-9]|1[0-9]|2[0-5])\b/);
  if (numberMatch) return officialChatFolderCategories.find((category) => category.index === Number(numberMatch[1]));
  return officialChatFolderCategories.find((category) => {
    const haystack = normalizeText(`${category.name} ${category.shortName} ${category.finds.join(' ')}`);
    return category.name !== 'PROHIBIDO' && haystack.split(/\s+/).some((word) => word.length > 4 && text.includes(word));
  });
}

function YapeQrMessage({ paymentName }: { paymentName: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px' }}>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
        💜 Escanea este QR con tu app Yape para pagar:
      </p>
      <img
        src={APP_CONFIG.qrYapeUrl}
        alt="QR Yape - titular asociado a ContactHub"
        style={{ width: '200px', maxWidth: '100%', borderRadius: '12px', border: '2px solid #1DB47A', margin: '0 auto' }}
      />
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
        Titular asociado a ContactHub: {paymentName}
      </p>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
        Después de pagar, toca "Ya pagué" y envía el comprobante
      </p>
    </div>
  );
}

function PaymentCard({
  methods,
  paymentName,
  canOpenWhatsApp,
  copiedNumber,
  receipt,
  onCopy,
  onPaid,
  onUpload,
  onWhatsApp,
  onMain,
}: {
  methods: PaymentMethod[];
  paymentName: string;
  canOpenWhatsApp: boolean;
  copiedNumber: string | null;
  receipt: ReceiptPreview | null;
  onCopy: (number: string) => void;
  onPaid: () => void;
  onUpload: () => void;
  onWhatsApp: () => void;
  onMain: () => void;
}) {
  const primaryMethod = methods.find((method) => method.id === 'yape') ?? methods[0];
  const extraMethods = methods.filter((method) => method.id !== primaryMethod?.id);

  if (!primaryMethod) {
    return (
      <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
        Los datos de pago todavía no están configurados. Puedes continuar por el chat.
      </div>
    );
  }

  return (
    <div className="dopamine-card neon-edge rounded-3xl p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">{primaryMethod.title}</p>
          <p className="mt-1 text-sm font-semibold text-white">Titular asociado a ContactHub: {paymentName || 'Titular no configurado'}</p>
        </div>
        <span className="premium-chip rounded-full px-3 py-1 text-xs font-bold">Manual verificado</span>
      </div>

      {primaryMethod.qrUrl ? (
        <>
          <p className="mt-4 text-xs leading-5 text-gray-400">Escanea este QR para pagar por Yape.</p>
          <div className="mt-2 flex justify-center rounded-2xl border border-white/10 bg-white p-3">
            <img src={primaryMethod.qrUrl} alt="QR de Yape para ContactHub" className="max-h-[260px] w-full max-w-[240px] rounded-xl object-contain" />
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-2xl border border-line bg-ink-950/60 p-3 text-xs text-gray-300">QR no configurado todavía.</p>
      )}

      {primaryMethod.number ? (
        <div className="mt-4 rounded-2xl border border-line bg-ink-950/60 p-3">
          <p className="text-xs font-semibold text-gray-400">Número {primaryMethod.id === 'yape' ? 'Yape' : 'Plin'}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-mono text-sm font-bold text-white">{primaryMethod.number}</span>
            <button type="button" onClick={() => onCopy(primaryMethod.number)} className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1.5 text-xs font-bold text-brand-200 transition hover:bg-brand-400/15">
              <Copy className="h-3.5 w-3.5" />
              {copiedNumber === primaryMethod.number ? 'Copiado' : 'Copiar número'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-brand-400/20 bg-brand-400/10 p-3 text-xs leading-5 text-gray-300">
        Paga solo cuando tengas claro el plan o carpeta. ContactHub nunca te pedira claves bancarias, codigos privados ni contrasenas externas. La activacion se revisa manualmente.
      </div>

      {extraMethods.length ? (
        <div className="mt-3 grid gap-2">
          {extraMethods.map((method) => (
            <div key={method.id} className="rounded-2xl border border-line bg-ink-950/50 p-3">
              <p className="text-xs font-bold text-gray-300">{method.title}</p>
              {method.number ? <p className="mt-1 font-mono text-xs text-white">{method.number}</p> : null}
              {method.qrUrl ? <img src={method.qrUrl} alt={`QR de ${method.title}`} className="mt-2 max-h-36 rounded-lg bg-white object-contain p-2" /> : null}
            </div>
          ))}
        </div>
      ) : null}

      {receipt ? (
        <div className="mt-4 rounded-2xl border border-brand-400/25 bg-gradient-to-br from-brand-400/10 to-accent-violet/10 p-3">
          <p className="text-xs font-bold text-brand-200">Comprobante recibido</p>
          <p className="mt-1 break-all text-xs text-gray-300">{receipt.fileName}</p>
          {receipt.previewUrl ? <img src={receipt.previewUrl} alt="Vista previa del comprobante" className="mt-3 max-h-40 rounded-xl border border-line object-contain" /> : null}
          <p className="mt-2 text-xs leading-5 text-gray-300">
            {receipt.status === 'uploaded'
              ? 'Lo revisaremos para activar tu acceso.'
              : 'Tu comprobante está listo. Si la carga aún no está conectada, envíalo por WhatsApp para revisión.'}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        <button type="button" onClick={onUpload} className="btn-primary-glow inline-flex items-center justify-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-4 py-2.5 text-sm font-bold text-purple-100 transition hover:bg-purple-500/20">
          <UploadCloud className="h-4 w-4" />
          Subir comprobante
        </button>
        <button type="button" onClick={onPaid} className="btn-primary-glow rounded-full bg-gradient-to-r from-brand-400 to-accent-cyan px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-white">
          Ya pagué
        </button>
        {canOpenWhatsApp ? (
          <button type="button" onClick={onWhatsApp} className="rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-2.5 text-sm font-bold text-brand-200 transition hover:bg-brand-400/15">
            Enviar comprobante por WhatsApp
          </button>
        ) : null}
        <button type="button" onClick={onMain} className="rounded-full border border-line bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-brand-400/40">
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { user } = useAuth();
  const autofill = useAutofillProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([localMessage(welcomeMessage, 'admin')]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const [currentFlow, setCurrentFlow] = useState<ChatFlow>('main');
  const [selectedPlan, setSelectedPlan] = useState<ChatPlan | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<ChatCategory | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptPreview | null>(null);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);
  const [selectedReceiptPreviewUrl, setSelectedReceiptPreviewUrl] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [whatsappNoticeShown, setWhatsappNoticeShown] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);

  const paymentMethods = useMemo(() => getPaymentMethods(), []);
  const paymentName = cleanEnv(import.meta.env.NEXT_PUBLIC_PAYMENT_NAME as string | undefined) || 'Jesus Francisco Abazalo Mori';
  const hasWhatsApp = Boolean(cleanEnv(import.meta.env.NEXT_PUBLIC_WHATSAPP_NUMBER as string | undefined) || APP_CONFIG.whatsappNumber);

  const quickActions = useMemo<ChatAction[]>(() => {
    if (currentFlow === 'prices') {
      return [
        ...plans.map((plan) => ({ label: plan.label, type: 'plan' as const, value: plan.id })),
        { label: 'Ver promociones', type: 'promos' },
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'promos') {
      return [
        { label: 'Recomiéndame un plan', type: 'helpTopic', value: 'recommend' },
        { label: 'Quiero pagar', type: 'payment' },
        { label: 'Volver a precios', type: 'prices' },
        ...(hasWhatsApp ? [{ label: 'Contactar soporte', type: 'human' as const }] : []),
      ];
    }
    if (currentFlow === 'folders') {
      return [
        ...officialChatFolderCategories.map((category) => ({ label: `${String(category.index).padStart(2, '0')}. ${category.name}`, type: 'folder' as const, value: String(category.index) })),
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'folderDetail') {
      return [
        { label: 'Elegir esta carpeta', type: 'plan', value: selectedFolder?.index === 25 ? 'elite-total' : 'individual' },
        { label: 'Ver otra carpeta', type: 'folders' },
        { label: 'Cómo pago', type: 'payment' },
        { label: 'Subir comprobante', type: 'uploadReceipt' },
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'payment') {
      return [
        { label: 'Ver QR Yape', type: 'yapeQr' },
        { label: 'Subir comprobante', type: 'uploadReceipt' },
        { label: 'Ya pagué', type: 'paid' },
        ...(selectedPlan ? [{ label: 'Ver qué incluye', type: 'helpTopic' as const, value: 'planIncludes' }] : []),
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'qr') {
      return [
        ...(hasWhatsApp ? [{ label: '📸 Ya pagué — enviar comprobante', type: 'whatsapp' as const, value: 'receiptShort' }] : []),
        { label: 'Subir comprobante', type: 'uploadReceipt' },
        { label: '🔙 Volver', type: 'payment' },
      ];
    }
    if (currentFlow === 'paid') {
      return [
        { label: 'Subir comprobante', type: 'uploadReceipt' },
        ...(hasWhatsApp ? [{ label: 'Enviar comprobante por WhatsApp', type: 'whatsapp' as const, value: 'receipt' }] : []),
        { label: 'Ver mis accesos', type: 'catalog', value: '/mis-contactos' },
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'help') {
      return [
        { label: 'Qué es ContactHub', type: 'helpTopic', value: 'what' },
        { label: 'Qué recibo al pagar', type: 'helpTopic', value: 'receive' },
        { label: 'Cómo funciona la prueba gratis', type: 'helpTopic', value: 'trial' },
        { label: 'Cómo se desbloquean contactos', type: 'helpTopic', value: 'unlock' },
        { label: 'Cómo pago', type: 'payment' },
        { label: 'Puedo usarlo gratis', type: 'helpTopic', value: 'free' },
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'missions') {
      return [
        { label: 'Quiero hacer una misión', type: 'helpTopic', value: 'missionStart' },
        { label: 'Enviar evidencia', type: 'missionEvidence' },
        ...(hasWhatsApp ? [{ label: 'Enviar evidencia por WhatsApp', type: 'whatsapp' as const, value: 'evidence' }] : []),
        { label: 'Ver catálogo gratis', type: 'catalog', value: '/catalogo' },
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'privacy') {
      return [
        { label: 'Explorar sin registrarme', type: 'catalog', value: '/catalogo' },
        { label: 'Crear cuenta segura', type: 'auth', value: '/auth?mode=register' },
        { label: 'Ver catálogo', type: 'catalog', value: '/catalogo' },
        { label: 'Hablar con soporte', type: 'human' },
      ];
    }
    if (currentFlow === 'newUser') {
      return [
        { label: 'Ver mis 3 contactos gratis', type: 'catalog', value: '/?trial=1' },
        { label: 'Explorar catálogo', type: 'catalog', value: '/catalogo' },
        { label: 'Ver guía rápida', type: 'catalog', value: '/guia' },
        { label: 'Hablar con soporte', type: 'human' },
      ];
    }
    if (currentFlow === 'human') {
      return [
        ...(hasWhatsApp ? [{ label: 'Soporte ContactHub por WhatsApp', type: 'whatsapp' as const }] : []),
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    return mainActions;
  }, [currentFlow, hasWhatsApp, selectedFolder?.index, selectedPlan]);

  async function persistMessage(message: string, sender: 'user' | 'admin', read = false, extras: Partial<ChatMessage> = {}) {
    if (!user?.id || !supabase || !isSupabaseConfigured) return;
    await dynamicSupabase().from('chat_messages').insert({
      user_id: user.id,
      session_id: user.id,
      sender,
      read,
      message,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      has_attachment: extras.has_attachment ?? false,
      attachment_path: extras.attachment_path ?? null,
      attachment_url: null,
      attachment_type: extras.attachment_type ?? null,
      attachment_name: extras.attachment_name ?? null,
      attachment_size: extras.attachment_size ?? null,
      comprobante_status: extras.comprobante_status ?? 'pendiente',
    });
  }

  async function addAssistantMessage(message: string, nextFlow?: ChatFlow, kind: ChatMessage['kind'] = 'text') {
    setMessages((current) => [...current, localMessage(message, 'admin', kind)]);
    if (nextFlow) setCurrentFlow(nextFlow);
    await persistMessage(message, 'admin', false);
  }

  function addYapeQrMessage() {
    setMessages((current) => [...current, localMessage('QR Yape', 'admin', 'yapeQr')]);
    setCurrentFlow('qr');
  }

  async function addUserMessage(message: string, extras: Partial<ChatMessage> = {}) {
    const nextMessage = localMessage(message, 'user', 'text', extras);
    setMessages((current) => [...current, nextMessage]);
    await persistMessage(message, 'user', false, extras);
    return nextMessage.id;
  }

  function renderPlanMessage(plan: ChatPlan) {
    if (plan.id === 'elite-total') {
      return 'Perfecto. Elegiste acceso completo. Esta opcion habilita todas las carpetas de ContactHub cuando el pago queda revisado. El precio es S/360. Puedes pagar por Yape y luego enviar tu comprobante para activacion manual.';
    }
    return `Perfecto. Elegiste ${plan.name}. Incluye ${plan.folderText} por ${plan.price}. ${plan.description} Puedes pagar por Yape y luego enviar tu comprobante para revision manual.`;
  }

  function renderFolderMessage(folder: ChatCategory) {
    return [`Elegiste ${folder.name}.`, `Referencia interna: ${folder.shortName}.`, folder.description, `Qué puedes encontrar: ${folder.finds.join(', ')}.`, folder.price ? `Precio referencial: ${folder.price}.` : 'Esta carpeta tiene tratamiento especial y requiere revisión.', 'No mostramos teléfonos completos hasta que tengas acceso activo.'].join('\n');
  }

  function openWhatsApp(value?: string) {
    if (value === 'receiptShort') {
      const url = getWhatsAppUrl('Hola, vengo desde ContactHub. Ya realice el pago y quiero enviar mi comprobante para activar mi acceso.');
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (!whatsappNoticeShown) setWhatsappNoticeShown(true);
      return;
    }
    const whatsappMessage =
      value === 'receipt'
        ? 'Hola, vengo desde ContactHub. Ya realice el pago y quiero enviar mi comprobante para activar mi acceso.'
        : value === 'evidence'
          ? 'Hola, vengo desde ContactHub. Quiero enviar evidencia para ganar un contacto extra.'
          : 'Hola, vengo desde ContactHub. Necesito ayuda con una consulta sobre carpetas, pagos o acceso.';
    const url = getWhatsAppUrl(whatsappMessage);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!whatsappNoticeShown) setWhatsappNoticeShown(true);
  }

  async function copyPaymentNumber(number: string) {
    try {
      await navigator.clipboard.writeText(number);
      setCopiedNumber(number);
      window.setTimeout(() => setCopiedNumber(null), 1800);
    } catch {
      setCopiedNumber(null);
    }
  }

  async function signAttachmentUrl(path: string) {
    if (!path || path.startsWith('blob:') || path.startsWith('http')) return path;
    if (!supabase || !isSupabaseConfigured) return '';
    const { data, error } = await dynamicSupabase().storage.from('comprobantes').createSignedUrl(path, 60 * 60);
    if (error) {
      console.error('comprobante signed url:', error.message);
      return '';
    }
    return data?.signedUrl ?? '';
  }

  async function uploadReceiptToSupabase(file: File) {
    if (!user?.id || !supabase || !isSupabaseConfigured) return null;
    const extFromName = file.name.split('.').pop()?.toLowerCase();
    const extFromType = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const ext = extFromName && ['jpg', 'jpeg', 'png', 'webp'].includes(extFromName) ? extFromName : extFromType;
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const uploadResult = await dynamicSupabase().storage.from('comprobantes').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
    if (uploadResult.error) {
      console.error('payment receipt upload:', uploadResult.error.message);
      return null;
    }
    return { path };
  }

  function clearSelectedReceipt() {
    if (selectedReceiptPreviewUrl) URL.revokeObjectURL(selectedReceiptPreviewUrl);
    setSelectedReceiptFile(null);
    setSelectedReceiptPreviewUrl(null);
    if (receiptInputRef.current) receiptInputRef.current.value = '';
  }

  async function handleReceiptFile(inputFile?: File | null) {
    if (!inputFile) return;
    const file = inputFile;
    if (!user?.id) {
      setIsOpen(true);
      await addAssistantMessage('Para subir tu comprobante, primero inicia sesión o crea una cuenta. Así podemos vincular el pago con tu acceso.', 'payment');
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
    if (!allowed) {
      await addAssistantMessage('Puedes subir una imagen JPG, PNG o WEBP del comprobante.', 'payment');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      await addAssistantMessage('El comprobante debe pesar máximo 5MB.', 'payment');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setIsOpen(true);
    setCurrentFlow('payment');
    if (selectedReceiptPreviewUrl) URL.revokeObjectURL(selectedReceiptPreviewUrl);
    setSelectedReceiptFile(file);
    setSelectedReceiptPreviewUrl(previewUrl);
  }

  async function confirmReceiptUpload() {
    if (!selectedReceiptFile) return;
    setIsUploadingReceipt(true);
    const file = selectedReceiptFile;
    const previewUrl = selectedReceiptPreviewUrl;
    try {
      const uploaded = await uploadReceiptToSupabase(file);
      if (!uploaded) throw new Error('No se pudo subir el comprobante.');

      const localAttachmentId = await addUserMessage(`ðŸ“Ž Comprobante adjuntado: ${file.name}`, {
        has_attachment: true,
        attachment_path: uploaded.path,
        attachment_type: file.type,
        attachment_name: file.name,
        attachment_size: file.size,
        comprobante_status: 'pendiente',
      });
      if (previewUrl) setAttachmentUrls((current) => ({ ...current, [localAttachmentId]: previewUrl }));
      setReceipt({ fileName: file.name, fileType: file.type || 'imagen', previewUrl, status: 'uploaded' });
      setSelectedReceiptFile(null);
      setSelectedReceiptPreviewUrl(null);
      if (receiptInputRef.current) receiptInputRef.current.value = '';
      toast.success('âœ… Comprobante enviado correctamente');

      setIsTyping(true);
      await delay(2000);
      setIsTyping(false);
      await addAssistantMessage(
        `✅ ¡Comprobante recibido! Quedó vinculado a tu cuenta${autofill.email ? ` (${autofill.email})` : ''}.\n\nEstamos verificando tu pago. En pocos minutos activaremos tu acceso y te avisamos aquí mismo.\n\nSi tienes alguna duda, escríbenos.`,
        'paid',
      );
    } catch (error) {
      console.error('Error subiendo comprobante:', error);
      toast.error('Error al enviar. Intenta de nuevo.');
    } finally {
      setIsUploadingReceipt(false);
    }
  }

  async function handleAction(action: ChatAction) {
    setIsOpen(true);

    if (action.type === 'uploadReceipt') {
      receiptInputRef.current?.click();
      return;
    }
    if (action.type === 'whatsapp') {
      openWhatsApp(action.value);
      return;
    }
    if (action.type === 'catalog' && action.value) {
      window.location.href = action.value;
      return;
    }
    if (action.type === 'auth') {
      window.location.href = action.value ?? '/auth?mode=register';
      return;
    }

    await addUserMessage(action.label);

    if (action.type === 'main') {
      setSelectedPlan(null);
      setSelectedFolder(null);
      await addAssistantMessage(welcomeMessage, 'main');
      return;
    }
    if (action.type === 'prices') {
      await addAssistantMessage('Claro. En ContactHub puedes elegir entre carpetas individuales, packs y acceso total. Te muestro las opciones para que elijas según tu meta.', 'prices');
      return;
    }
    if (action.type === 'promos') {
      await addAssistantMessage('Por ahora las promos pueden variar. Puedes consultar una recomendacion segun lo que buscas o contactar soporte para revisar una opcion disponible.', 'promos');
      return;
    }
    if (action.type === 'folders') {
      await addAssistantMessage('Perfecto. Puedes elegir una carpeta según lo que estás buscando lograr. Te muestro las categorías disponibles.', 'folders');
      return;
    }
    if (action.type === 'folder') {
      const folder = officialChatFolderCategories.find((category) => String(category.index) === action.value);
      if (!folder) return;
      setSelectedFolder(folder);
      setSelectedPlan(null);
      await addAssistantMessage(renderFolderMessage(folder), 'folderDetail');
      return;
    }
    if (action.type === 'plan') {
      const plan = plans.find((item) => item.id === action.value) ?? plans[0];
      setSelectedPlan(plan);
      await addAssistantMessage(renderPlanMessage(plan), 'payment');
      return;
    }
    if (action.type === 'yapeQr') {
      addYapeQrMessage();
      return;
    }
    if (action.type === 'payment') {
      await addAssistantMessage(paymentInfoMessage(), 'payment');
      return;
    }
    if (action.type === 'paid') {
      await addAssistantMessage('Genial 🙌 Gracias por confiar en ContactHub. Para activar tu acceso, envía tu comprobante y dinos qué plan o carpeta elegiste.', 'paid');
      return;
    }
    if (action.type === 'help') {
      await addAssistantMessage('Tranqui, te explico paso a paso. ¿Qué parte no te quedó clara?', 'help');
      return;
    }
    if (action.type === 'helpTopic') {
      const responses: Record<string, string> = {
        ...helpTopics,
        recommend: 'Si estas empezando, te recomiendo una carpeta de S/20. Si ya sabes que necesitas varias opciones, Starter o Fast Track suelen ser mas practicos. Si quieres revisar todo el catalogo, el acceso completo puede convenirte.',
        planIncludes: selectedPlan ? `${selectedPlan.name} incluye ${selectedPlan.folderText}. ${selectedPlan.description} Los teléfonos completos se muestran cuando el acceso queda activo.` : 'Cada plan habilita la cantidad de carpetas indicada. Los teléfonos completos se muestran cuando el acceso queda activo.',
        receiptChat: 'Puedes subir tu comprobante aquí mismo con el botón “Subir comprobante”. Si necesitas enviar imagen por WhatsApp, úsalo como último recurso.',
        missionStart: 'Puedes empezar con una misión simple: comparte ContactHub en una historia o estado, invita a alguien a registrarse o deja una opinión. Luego envías evidencia para revisión.',
      };
      await addAssistantMessage(responses[action.value ?? ''] ?? 'Dime qué parte quieres revisar y lo vemos paso a paso.', currentFlow);
      return;
    }
    if (action.type === 'missions') {
      await addAssistantMessage('Si ahora no puedes pagar, igual puedes empezar. Puedes ganar contactos extra apoyando a ContactHub con misiones simples.\n\nMisiones disponibles:\n- Compartir ContactHub en una historia o estado\n- Invitar a un amigo a registrarse\n- Enviar captura como evidencia\n- Dejar una opinión o testimonio\n- Seguir la red social de ContactHub', 'missions');
      return;
    }
    if (action.type === 'missionEvidence') {
      await addAssistantMessage('Perfecto. Envía tu captura para revisión. Si todavía no está habilitada la carga aquí, puedes mandarla por WhatsApp.', 'missions');
      return;
    }
    if (action.type === 'human') {
      await addAssistantMessage('Claro. Si necesitas atencion directa, puedes contactar a soporte ContactHub por WhatsApp. Usalo para comprobantes, dudas especificas o ayuda con tu acceso.', 'human');
    }
  }

  async function handleTextIntent(message: string) {
    setIsTyping(true);
    await delay(1500);
    setIsTyping(false);
    const normalized = normalizeText(message);
    if (hasAny(normalized, ['no quiero poner mi correo', 'no quiero poner correo', 'por que me piden gmail', 'porque me piden gmail', 'por que piden correo', 'porque piden correo', 'es seguro registrarme', 'tengo miedo de poner mi correo', 'miedo de poner correo', 'gmail', 'estafa', 'me van a estafar', 'es confiable', 'es seguro', 'por que piden mi correo'])) {
      await addAssistantMessage('Te entiendo. Puedes explorar ContactHub sin registrarte. Solo pedimos correo cuando quieres guardar una prueba, desbloquear una carpeta o enviar comprobante. Tu correo funciona como llave de acceso. No pedimos claves bancarias, codigos privados ni contrasenas de Gmail.', 'privacy');
      return;
    }
    if (hasAny(normalized, ['donde veo mis 3 contactos gratis', 'mis contactos gratis', 'prueba gratis', 'como empiezo', 'no se que hacer', 'acabo de registrarme', 'recien me registre', 'recien me registré', 'recién me registre', 'recién me registré', 'que hago ahora', 'donde veo mis accesos', 'guia rapida'])) {
      await addAssistantMessage('Tranqui 👋 Si recién entraste, empieza por tu prueba gratis. Puedes elegir una carpeta y ver 3 contactos reales. También puedes explorar el catálogo antes de desbloquear algo.', 'newUser');
      return;
    }
    const plan = findPlanFromText(normalized);
    if (plan) {
      setSelectedPlan(plan);
      await addAssistantMessage(renderPlanMessage(plan), 'payment');
      return;
    }
    if (hasAny(normalized, ['ya pague', 'te envie pago', 'subir comprobante', 'enviar captura', 'adjuntar yape', 'comprobante'])) {
      await addAssistantMessage('Genial 🙌 Puedes subir tu comprobante aquí mismo. Si la carga no está conectada, usa WhatsApp como respaldo y adjunta la captura manualmente.', 'paid');
      return;
    }
    if (hasAny(normalized, ['mandame el qr', 'quiero el qr', 'ver qr', 'codigo qr', 'qr'])) {
      addYapeQrMessage();
      return;
    }
    if (hasAny(normalized, ['como pago', 'quiero pagar', 'donde pago', 'yape', 'plin', 'pago por yape'])) {
      await addAssistantMessage(paymentInfoMessage(), 'payment');
      return;
    }
    if (hasAny(normalized, ['no tengo dinero', 'no puedo pagar', 'gratis', 'ganar contacto', 'mision', 'misiones', 'puedo ver gratis'])) {
      await addAssistantMessage('Tranqui. Puedes registrarte gratis, explorar el catálogo y ganar contactos extra completando misiones simples.', 'missions');
      return;
    }
    if (hasAny(normalized, ['aprender ingles', 'ingles', 'aprender', 'curso', 'cursos', 'clase', 'libro', 'educacion'])) {
      const education = officialChatFolderCategories[2];
      setSelectedFolder(education);
      await addAssistantMessage('Entiendo. Estás buscando aprender o encontrar contactos relacionados con educación. Te recomiendo revisar EDUCACIÓN, CURSOS & LIBROS. También puedo mostrarte opciones relacionadas.', 'folderDetail');
      return;
    }
    if (hasAny(normalized, ['proveedores', 'proveedor', 'negocios', 'marketing', 'fitness', 'musica', 'tecnologia', 'trabajar', 'vender'])) {
      const folder =
        hasAny(normalized, ['marketing']) ? officialChatFolderCategories[6] :
        hasAny(normalized, ['fitness']) ? officialChatFolderCategories[3] :
        hasAny(normalized, ['musica']) ? officialChatFolderCategories[14] :
        hasAny(normalized, ['tecnologia']) ? officialChatFolderCategories[1] :
        hasAny(normalized, ['negocios', 'proveedores', 'proveedor', 'vender']) ? officialChatFolderCategories[0] :
        null;
      if (folder) {
        setSelectedFolder(folder);
        await addAssistantMessage(renderFolderMessage(folder), 'folderDetail');
        return;
      }
    }
    if (hasAny(normalized, ['precio', 'precios', 'planes', 'cuesta', 'costo', 'promos', 'promociones'])) {
      await addAssistantMessage('Claro. En ContactHub puedes elegir entre carpetas individuales, packs y acceso total. Te muestro las opciones para que elijas según tu meta.', 'prices');
      return;
    }
    if (hasAny(normalized, ['quiero una carpeta', 'carpeta', 'carpetas', 'contactos', 'contacto'])) {
      const folder = findCategoryFromText(normalized);
      if (folder) {
        setSelectedFolder(folder);
        await addAssistantMessage(renderFolderMessage(folder), 'folderDetail');
      } else {
        await addAssistantMessage('Perfecto. Puedes elegir una carpeta según lo que estás buscando lograr. Te muestro las categorías disponibles.', 'folders');
      }
      return;
    }
    if (hasAny(normalized, ['que es esto', 'no entiendo', 'que recibo', 'como funciona', 'es confiable', 'explicame', 'ayuda', 'duda'])) {
      await addAssistantMessage('Tranqui, te explico paso a paso. ¿Qué parte no te quedó clara?', 'help');
      return;
    }
    if (hasAny(normalized, ['jesus', 'persona', 'humano', 'whatsapp', 'asesor'])) {
      await addAssistantMessage('Claro. Si necesitas atencion directa, puedes contactar a soporte ContactHub por WhatsApp. Usalo para comprobantes, dudas especificas o ayuda con tu acceso.', 'human');
      return;
    }
    await addAssistantMessage('Creo que estás buscando orientación, pero necesito ubicar mejor tu meta. ¿Quieres aprender, trabajar, vender, conseguir servicios, buscar proveedores o explorar oportunidades?', 'main');
  }

  async function sendMessage(messageOverride?: string) {
    const message = sanitizeText(messageOverride ?? text, 500);
    if (!message) return;
    setText('');
    setIsOpen(true);
    await addUserMessage(message);
    window.setTimeout(() => {
      void handleTextIntent(message);
    }, 250);
  }

  async function loadMessages() {
    if (!user?.id || !supabase || !isSupabaseConfigured) return;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const client = dynamicSupabase();
    const { data, error } = await client
      .from('chat_messages')
      .select('id,user_id,message,session_id,sender,read,created_at,has_attachment,attachment_path,attachment_url,attachment_type,attachment_name,attachment_size,comprobante_status')
      .eq('user_id', user.id)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: true });
    if (error) return;
    if (!data?.length) {
      await dynamicSupabase().from('chat_messages').insert({
        user_id: user.id,
        session_id: user.id,
        sender: 'admin',
        read: false,
        message: renewedMessage,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      await loadMessages();
      return;
    }
    const nextMessages = (data ?? []) as ChatMessage[];
    const signed: Record<string, string> = {};
    await Promise.all(nextMessages.map(async (message) => {
      const attachmentPath = message.attachment_path ?? message.attachment_url;
      if (message.has_attachment && attachmentPath) {
        const signedUrl = await signAttachmentUrl(attachmentPath);
        if (signedUrl) signed[message.id] = signedUrl;
      }
    }));
    setAttachmentUrls(signed);
    setMessages(nextMessages);
    setUnread(nextMessages.filter((message) => message.sender === 'admin' && !message.read).length);
  }

  async function markAdminMessagesRead() {
    if (!user?.id || !supabase || !isSupabaseConfigured) return;
    await supabase.from('chat_messages').update({ read: true }).eq('user_id', user.id).eq('sender', 'admin').eq('read', false);
    setUnread(0);
  }

  useEffect(() => {
    void loadMessages();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !supabase || !isSupabaseConfigured) return undefined;
    const client = supabase;
    const channel = client
      .channel(`chat_messages_user_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${user.id}` }, () => void loadMessages())
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) void markAdminMessagesRead();
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isOpen, currentFlow, receipt?.fileName, isTyping]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [text, isOpen]);

  useEffect(() => {
    const openChat = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string; prefill?: string }>).detail;
      setIsOpen(true);
      const message = detail?.message ?? detail?.prefill;
      if (message) void sendMessage(message);
    };
    window.addEventListener('contacthub:open-chat', openChat);
    return () => window.removeEventListener('contacthub:open-chat', openChat);
  }, [text, user?.id]);

  return (
    <div data-contacthub-chat className="fixed bottom-5 right-5 z-50">
      <input ref={receiptInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(event) => void handleReceiptFile(event.target.files?.[0])} />
      {isOpen ? (
        <div className="dopamine-card neon-edge fixed inset-x-3 bottom-24 flex h-[min(88vh,760px)] flex-col overflow-hidden rounded-3xl sm:static sm:mb-4 sm:h-[740px] sm:w-[490px] sm:max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between border-b border-brand-400/15 bg-gradient-to-r from-brand-400/10 via-white/[0.03] to-accent-violet/10 px-5 py-4">
            <div>
              <p className="font-display text-lg font-bold text-white">Soporte ContactHub</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-brand-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400 shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
                Guía de precios, carpetas, pagos y acceso
              </p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-line bg-white/5 p-2 text-white transition hover:border-brand-400/40 hover:bg-brand-400/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={messagesRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5 scroll-smooth">
            <p className="rounded-2xl border border-brand-400/15 bg-white/[0.035] px-3 py-2 text-center text-[11px] leading-5 text-gray-400">{chatRetentionNote}</p>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl border px-4 py-3 text-[15px] leading-6 shadow-sm ${message.sender === 'user' ? 'rounded-br-md border-brand-400/30 bg-gradient-to-br from-[#1a4a32] to-[#113423] text-white' : 'rounded-bl-md border-brand-400/15 bg-gradient-to-br from-[#0d2a1f] to-[#091612] text-white'}`}>
                  {message.has_attachment && (attachmentUrls[message.id] || message.attachment_url) ? (
                    <div className="mb-2">
                      <img src={attachmentUrls[message.id] ?? message.attachment_url ?? ''} alt="Comprobante enviado" className="max-h-48 max-w-[220px] rounded-xl border border-brand-400/25 object-contain" />
                      <div className="mt-2 text-[11px] text-white/50">📎 Comprobante enviado</div>
                    </div>
                  ) : null}
                  {message.kind === 'yapeQr' ? <YapeQrMessage paymentName={paymentName} /> : <p className="whitespace-pre-wrap">{message.message}</p>}
                  <p className="mt-2 text-[10px] opacity-65">{new Date(message.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            {isTyping ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-brand-400/15 bg-[#0d2a1f] px-4 py-3 text-sm text-gray-300">
                  Soporte esta escribiendo<span className="animate-pulse">...</span>
                </div>
              </div>
            ) : null}

            {currentFlow === 'payment' || currentFlow === 'paid' ? (
              <PaymentCard
                methods={paymentMethods}
                paymentName={paymentName}
                canOpenWhatsApp={hasWhatsApp}
                copiedNumber={copiedNumber}
                receipt={receipt}
                onCopy={(number) => void copyPaymentNumber(number)}
                onPaid={() => void handleAction({ label: 'Ya pagué', type: 'paid' })}
                onUpload={() => void handleAction({ label: 'Subir comprobante', type: 'uploadReceipt' })}
                onWhatsApp={() => openWhatsApp('receipt')}
                onMain={() => void handleAction({ label: 'Volver al inicio', type: 'main' })}
              />
            ) : null}

            {!hasWhatsApp && whatsappNoticeShown ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-50">
                WhatsApp todavía no está configurado. Puedes continuar por el chat.
              </div>
            ) : null}
          </div>

          <div className="border-t border-brand-400/15 bg-ink-950/60 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
              {currentFlow === 'main'
                ? 'Elige una opción rápida'
                : `Opciones de ${currentFlow === 'folderDetail' ? 'carpeta' : currentFlow === 'privacy' ? 'privacidad' : currentFlow === 'newUser' ? 'inicio' : currentFlow}`}
            </p>
            <div className="mb-4 max-h-48 overflow-y-auto rounded-2xl border border-line bg-white/[0.03] p-3">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={`${action.type}-${action.value ?? action.label}`}
                    type="button"
                    onClick={() => void handleAction(action)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-brand-400/10 ${
                      action.type === 'whatsapp' ? 'border-brand-400/35 bg-brand-400/10 text-brand-200' : 'border-line bg-white/5 text-gray-200'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedReceiptFile && selectedReceiptPreviewUrl ? (
              <div className="mb-3 rounded-2xl border border-purple-400/30 bg-purple-500/10 p-3">
                <div className="flex items-center gap-3">
                  <img src={selectedReceiptPreviewUrl} alt="Vista previa del comprobante" className="h-20 w-20 rounded-xl border border-purple-400/40 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{selectedReceiptFile.name}</p>
                    <p className="mt-1 text-xs text-purple-100/70">Revisa la imagen antes de enviarla.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void confirmReceiptUpload()}
                        disabled={isUploadingReceipt}
                        className="rounded-full bg-brand-400 px-3 py-1.5 text-xs font-black text-ink-950 transition hover:bg-white disabled:opacity-60"
                      >
                        {isUploadingReceipt ? 'Enviando...' : 'Enviar comprobante'}
                      </button>
                      <button
                        type="button"
                        onClick={clearSelectedReceipt}
                        disabled={isUploadingReceipt}
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={clearSelectedReceipt} className="rounded-full border border-white/15 p-1.5 text-white/70 transition hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => receiptInputRef.current?.click()}
              className="btn-primary-glow mb-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-400/35 bg-purple-500/15 px-4 py-2.5 text-sm font-black text-purple-100 transition hover:border-purple-300/60 hover:bg-purple-500/20"
            >
              <UploadCloud className="h-4 w-4" />
              Enviar comprobante Yape/Plin
            </button>

            <div className="flex items-end gap-2 rounded-2xl border border-brand-400/15 bg-ink-950/70 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <button type="button" onClick={() => receiptInputRef.current?.click()} className="focus-ring inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line bg-white/5 text-gray-200 transition hover:border-purple-400/50 hover:text-purple-200">
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(event) => setText(event.target.value.slice(0, 500))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Cuéntame qué necesitas"
                rows={1}
                className="chat-textarea focus-ring max-h-[132px] min-h-11 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-white placeholder:text-gray-500"
              />
              <button type="button" onClick={() => void sendMessage()} className="focus-ring btn-primary-glow inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-accent-cyan text-ink-950 transition hover:bg-white active:scale-95">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button type="button" onClick={() => setIsOpen((current) => !current)} className="badge-pulse relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 via-accent-cyan to-brand-500 text-ink-950 shadow-glow transition hover:scale-105 active:scale-95">
        <MessageCircle className="h-6 w-6" />
        {unread ? <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unread}</span> : null}
      </button>
    </div>
  );
}
