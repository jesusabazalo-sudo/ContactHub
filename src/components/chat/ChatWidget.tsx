import { MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
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
};

type ChatFlow = 'main' | 'prices' | 'promos' | 'folders' | 'folderDetail' | 'payment' | 'paid' | 'help' | 'missions' | 'human';
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
    | 'help'
    | 'helpTopic'
    | 'missions'
    | 'missionEvidence'
    | 'catalog'
    | 'human'
    | 'whatsapp'
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

const welcomeMessage = 'Hola 👋 Soy el asistente de ContactHub. Antes de avanzar, dime qué necesitas.';

const plans: ChatPlan[] = [
  {
    id: 'individual',
    label: 'S/20 — 1 carpeta',
    name: 'Carpeta individual',
    price: 'S/20',
    folderText: '1 carpeta',
    description: 'Ideal si tienes una meta concreta y quieres empezar por una carpeta específica.',
  },
  {
    id: 'starter',
    label: 'S/65 — 4 carpetas',
    name: 'Starter',
    price: 'S/65',
    folderText: '4 carpetas',
    description: 'Una base práctica para comparar opciones sin ir directo al acceso total.',
  },
  {
    id: 'fast-track',
    label: 'S/99 — 7 carpetas',
    name: 'Fast Track',
    price: 'S/99',
    folderText: '7 carpetas',
    description: 'Para avanzar más rápido con varias carpetas relacionadas a tu objetivo.',
  },
  {
    id: 'power',
    label: 'S/150 — 10 carpetas',
    name: 'Power',
    price: 'S/150',
    folderText: '10 carpetas',
    description: 'Más alternativas para negocio, aprendizaje, proveedores o servicios.',
  },
  {
    id: 'elite-total',
    label: 'S/360 — Acceso total',
    name: 'Elite Total',
    price: 'S/360',
    folderText: 'acceso total',
    description: 'Para quienes quieren desbloquear todo ContactHub y explorar la plataforma completa.',
  },
];

const folderCategories: ChatCategory[] = [
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

const mainActions: ChatAction[] = [
  { label: 'Ver precios y promos', type: 'prices' },
  { label: 'Quiero una carpeta', type: 'folders' },
  { label: 'Cómo pago', type: 'payment' },
  { label: 'No entiendo algo', type: 'help' },
  { label: 'Ganar contacto gratis', type: 'missions' },
  { label: 'Hablar con Jesús', type: 'human' },
];

const helpTopics: Record<string, string> = {
  what: 'ContactHub es un directorio organizado de contactos y oportunidades. La idea no es solo ver números, sino encontrar contactos que te acerquen a una meta: aprender, vender, trabajar, crecer o resolver algo.',
  receive: 'Recibes acceso a la carpeta o pack que elijas. Los teléfonos completos solo se muestran cuando tu acceso está activo.',
  trial: 'Puedes elegir una carpeta para ver una muestra limitada de contactos reales. La prueba se usa una sola vez.',
  unlock: 'Después del pago o recompensa aprobada, activamos tu acceso. Desde ese momento puedes ver los contactos completos de la carpeta correspondiente.',
  pay: 'Puedes pagar por Yape o Plin. Cuando termines, envías tu comprobante y activamos tu acceso manualmente.',
  free: 'Sí. Puedes registrarte, explorar el catálogo y ganar contactos extra completando misiones como compartir ContactHub y enviar evidencia.',
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function localMessage(message: string, sender: 'user' | 'admin'): ChatMessage {
  return {
    id: `${sender}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_id: null,
    session_id: 'local',
    sender,
    read: true,
    message,
    created_at: new Date().toISOString(),
  };
}

function cleanEnv(value?: string) {
  return (value ?? '').trim();
}

function paymentInfoMessage() {
  const yape = cleanEnv(import.meta.env.NEXT_PUBLIC_YAPE_NUMBER as string | undefined);
  const plin = cleanEnv(import.meta.env.NEXT_PUBLIC_PLIN_NUMBER as string | undefined);
  const paymentName = cleanEnv(import.meta.env.NEXT_PUBLIC_PAYMENT_NAME as string | undefined);

  if (!yape && !plin && !paymentName) {
    return 'Puedes pagar por Yape o Plin. Configura tus datos de pago en las variables de entorno para mostrarlos aquí.';
  }

  return [
    'Puedes pagar por Yape o Plin. Cuando termines el pago, envías tu comprobante y activamos tu acceso manualmente.',
    yape ? `Yape: ${yape}` : null,
    plin ? `Plin: ${plin}` : null,
    paymentName ? `Titular: ${paymentName}` : null,
    'Luego envía tu captura por el chat o por WhatsApp si necesitas atención directa.',
  ].filter(Boolean).join('\n');
}

function getWhatsAppUrl(message: string) {
  const number = cleanEnv(import.meta.env.NEXT_PUBLIC_WHATSAPP_NUMBER as string | undefined).replace(/\D/g, '');
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function findPlanFromText(text: string) {
  if (hasAny(text, ['elite total', 'elite', 'acceso total', '360', 's/360', 's360'])) return plans.find((plan) => plan.id === 'elite-total');
  if (hasAny(text, ['power', '150', 's/150', 's150', '10 carpetas'])) return plans.find((plan) => plan.id === 'power');
  if (hasAny(text, ['fast track', 'fast', '99', 's/99', 's99', '7 carpetas'])) return plans.find((plan) => plan.id === 'fast-track');
  if (hasAny(text, ['starter', '65', 's/65', 's65', '4 carpetas'])) return plans.find((plan) => plan.id === 'starter');
  if (hasAny(text, ['carpeta de 20', 's/20', 's20', '20 soles', '1 carpeta', 'una carpeta'])) return plans.find((plan) => plan.id === 'individual');
  return undefined;
}

function findCategoryFromText(text: string) {
  const numberMatch = text.match(/\b([1-9]|1[0-9]|2[0-5])\b/);
  if (numberMatch) return folderCategories.find((category) => category.index === Number(numberMatch[1]));
  return folderCategories.find((category) => {
    const haystack = normalizeText(`${category.name} ${category.shortName} ${category.finds.join(' ')}`);
    return category.name !== 'PROHIBIDO' && haystack.split(/\s+/).some((word) => word.length > 4 && text.includes(word));
  });
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([localMessage(welcomeMessage, 'admin')]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const [currentFlow, setCurrentFlow] = useState<ChatFlow>('main');
  const [selectedPlan, setSelectedPlan] = useState<ChatPlan | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<ChatCategory | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
        { label: 'Hablar con Jesús', type: 'human' },
      ];
    }
    if (currentFlow === 'folders') {
      return [
        ...folderCategories.map((category) => ({
          label: `${String(category.index).padStart(2, '0')}. ${category.shortName}`,
          type: 'folder' as const,
          value: String(category.index),
        })),
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'folderDetail') {
      return [
        { label: 'Elegir esta carpeta', type: 'plan', value: selectedFolder?.index === 25 ? 'elite-total' : 'individual' },
        { label: 'Ver otra carpeta', type: 'folders' },
        { label: 'Cómo pago', type: 'payment' },
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'payment') {
      return selectedPlan
        ? [
            { label: 'Cómo pago', type: 'payment' },
            { label: 'Ya pagué', type: 'paid' },
            { label: 'Ver qué incluye', type: 'helpTopic', value: 'planIncludes' },
            { label: 'Hablar con Jesús', type: 'human' },
          ]
        : [
            { label: 'Ya pagué', type: 'paid' },
            { label: 'Quiero elegir plan', type: 'prices' },
            { label: 'Hablar con Jesús por WhatsApp', type: 'whatsapp' },
            { label: 'Volver al inicio', type: 'main' },
          ];
    }
    if (currentFlow === 'paid') {
      return [
        { label: 'Enviar por chat', type: 'helpTopic', value: 'receiptChat' },
        { label: 'Hablar con Jesús por WhatsApp', type: 'whatsapp', value: 'receipt' },
        { label: 'Ver mis accesos', type: 'catalog', value: '/mis-contactos' },
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'help') {
      return [
        { label: '¿Qué es ContactHub?', type: 'helpTopic', value: 'what' },
        { label: '¿Qué recibo al pagar?', type: 'helpTopic', value: 'receive' },
        { label: '¿Cómo funciona la prueba gratis?', type: 'helpTopic', value: 'trial' },
        { label: '¿Cómo se desbloquean los contactos?', type: 'helpTopic', value: 'unlock' },
        { label: '¿Cómo pago?', type: 'helpTopic', value: 'pay' },
        { label: '¿Puedo usarlo gratis?', type: 'helpTopic', value: 'free' },
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'missions') {
      return [
        { label: 'Quiero hacer una misión', type: 'helpTopic', value: 'missionStart' },
        { label: 'Enviar evidencia', type: 'missionEvidence' },
        { label: 'Enviar evidencia por WhatsApp', type: 'whatsapp', value: 'evidence' },
        { label: 'Ver catálogo gratis', type: 'catalog', value: '/catalogo' },
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    if (currentFlow === 'human') {
      return [
        { label: 'Abrir WhatsApp', type: 'whatsapp' },
        { label: 'Volver al inicio', type: 'main' },
      ];
    }
    return mainActions;
  }, [currentFlow, selectedFolder?.index]);

  async function persistMessage(message: string, sender: 'user' | 'admin', read = false) {
    if (!user?.id || !supabase || !isSupabaseConfigured) return;
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      session_id: user.id,
      sender,
      read,
      message,
    });
  }

  async function addAssistantMessage(message: string, nextFlow?: ChatFlow) {
    setMessages((current) => [...current, localMessage(message, 'admin')]);
    if (nextFlow) setCurrentFlow(nextFlow);
    await persistMessage(message, 'admin', false);
  }

  async function addUserMessage(message: string) {
    setMessages((current) => [...current, localMessage(message, 'user')]);
    await persistMessage(message, 'user', false);
  }

  function renderPlanMessage(plan: ChatPlan) {
    if (plan.id === 'elite-total') {
      return 'Perfecto 🔥 Elegiste Elite Total. Este acceso es para quienes quieren desbloquear todo ContactHub. El precio es S/360. Puedes pagar por Yape o Plin y luego enviar tu comprobante para activar tu acceso.';
    }
    return `Perfecto. Elegiste ${plan.name}. Incluye ${plan.folderText} por ${plan.price}. ${plan.description} Puedes pagar por Yape o Plin y luego enviar tu comprobante para activar tu acceso.`;
  }

  function renderFolderMessage(folder: ChatCategory) {
    return [
      `Elegiste ${folder.name}.`,
      folder.description,
      `Qué puedes encontrar: ${folder.finds.join(', ')}.`,
      folder.price ? `Precio referencial: ${folder.price}.` : 'Esta carpeta tiene tratamiento especial y requiere revisión.',
      'No mostramos teléfonos completos hasta que tengas acceso activo.',
    ].join('\n');
  }

  async function handleAction(action: ChatAction) {
    setIsOpen(true);

    if (action.type === 'whatsapp') {
      const whatsappMessage =
        action.value === 'receipt'
          ? 'Hola Jesús, vengo desde ContactHub. Ya realicé el pago y quiero enviar mi comprobante para activar mi acceso.'
          : action.value === 'evidence'
            ? 'Hola Jesús, vengo de ContactHub. Quiero enviar evidencia para ganar un contacto extra.'
            : 'Hola Jesús, vengo desde ContactHub. Necesito ayuda con una consulta sobre carpetas, pagos o acceso.';
      const url = getWhatsAppUrl(whatsappMessage);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else await addAssistantMessage('Configura NEXT_PUBLIC_WHATSAPP_NUMBER en las variables de entorno para habilitar WhatsApp.', 'human');
      return;
    }

    if (action.type === 'catalog' && action.value) {
      window.location.href = action.value;
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
      await addAssistantMessage('Por ahora las promos pueden variar. Puedes consultar una recomendación según lo que buscas o hablar con Jesús para una promo disponible.', 'promos');
      return;
    }

    if (action.type === 'folders') {
      await addAssistantMessage('Perfecto. Puedes elegir una carpeta según lo que estás buscando lograr. Te muestro las categorías disponibles.', 'folders');
      return;
    }

    if (action.type === 'folder') {
      const folder = folderCategories.find((category) => String(category.index) === action.value);
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

    if (action.type === 'payment') {
      await addAssistantMessage(paymentInfoMessage(), 'payment');
      return;
    }

    if (action.type === 'paid') {
      await addAssistantMessage('Genial 🙌 Gracias por confiar en ContactHub. Para activar tu acceso, envía la captura del pago y dinos qué plan o carpeta elegiste.', 'paid');
      return;
    }

    if (action.type === 'help') {
      await addAssistantMessage('Tranqui, te explico paso a paso. ¿Qué parte no te quedó clara?', 'help');
      return;
    }

    if (action.type === 'helpTopic') {
      const responses: Record<string, string> = {
        ...helpTopics,
        recommend: 'Si estás empezando, te recomiendo una carpeta de S/20. Si ya sabes que necesitas varias opciones, Starter o Fast Track suelen ser más prácticos. Si quieres todo desde el inicio, Elite Total es el camino directo.',
        planIncludes: selectedPlan
          ? `${selectedPlan.name} incluye ${selectedPlan.folderText}. ${selectedPlan.description} Los teléfonos completos se muestran cuando el acceso queda activo.`
          : 'Cada plan habilita la cantidad de carpetas indicada. Los teléfonos completos se muestran cuando el acceso queda activo.',
        receiptChat: 'Escribe aquí el plan o carpeta que pagaste y cualquier detalle del comprobante. Si necesitas enviar imagen, usa WhatsApp como último paso.',
        missionStart: 'Puedes empezar con una misión simple: comparte ContactHub en una historia o estado, invita a alguien a registrarse o deja una opinión. Luego envías evidencia para revisión.',
      };
      await addAssistantMessage(responses[action.value ?? ''] ?? 'Dime qué parte quieres revisar y lo vemos paso a paso.', currentFlow);
      return;
    }

    if (action.type === 'missions') {
      await addAssistantMessage(
        'Si ahora no puedes pagar, igual puedes empezar. Puedes ganar contactos extra apoyando a ContactHub con misiones simples.\n\nMisiones disponibles:\n- Compartir ContactHub en una historia o estado\n- Invitar a un amigo a registrarse\n- Enviar captura como evidencia\n- Dejar una opinión o testimonio\n- Seguir la red social de ContactHub',
        'missions',
      );
      return;
    }

    if (action.type === 'missionEvidence') {
      await addAssistantMessage('Perfecto. Envía tu captura para revisión. Si todavía no está habilitada la carga aquí, puedes mandarla por WhatsApp.', 'missions');
      return;
    }

    if (action.type === 'human') {
      await addAssistantMessage('Claro. Si necesitas atención directa, puedes escribirle a Jesús por WhatsApp. Úsalo para comprobantes, dudas específicas o ayuda con tu acceso.', 'human');
    }
  }

  async function handleTextIntent(message: string) {
    const normalized = normalizeText(message);
    const plan = findPlanFromText(normalized);
    if (plan) {
      setSelectedPlan(plan);
      await addAssistantMessage(renderPlanMessage(plan), 'payment');
      return;
    }

    if (hasAny(normalized, ['no tengo dinero', 'no puedo pagar', 'gratis', 'ganar contacto', 'mision', 'misiones'])) {
      await addAssistantMessage('Tranqui. Puedes registrarte gratis, explorar el catálogo y ganar contactos extra completando misiones simples.', 'missions');
      return;
    }

    if (hasAny(normalized, ['aprender ingles', 'ingles', 'aprender', 'curso', 'clase', 'libro', 'educacion'])) {
      const education = folderCategories[2];
      setSelectedFolder(education);
      await addAssistantMessage('Entiendo. Estás buscando aprender o encontrar contactos relacionados con educación. Te recomiendo revisar EDUCACIÓN, CURSOS & LIBROS. También puedo mostrarte opciones relacionadas.', 'folderDetail');
      return;
    }

    if (hasAny(normalized, ['quiero pagar', 'como pago', 'yape', 'plin', 'pago', 'pagar'])) {
      await addAssistantMessage(paymentInfoMessage(), 'payment');
      return;
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

    if (hasAny(normalized, ['no entiendo', 'explicame', 'ayuda', 'duda', 'como funciona'])) {
      await addAssistantMessage('Tranqui, te explico paso a paso. ¿Qué parte no te quedó clara?', 'help');
      return;
    }

    if (hasAny(normalized, ['jesus', 'persona', 'humano', 'whatsapp', 'asesor'])) {
      await addAssistantMessage('Claro. Si necesitas atención directa, puedes escribirle a Jesús por WhatsApp. Úsalo para comprobantes, dudas específicas o ayuda con tu acceso.', 'human');
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
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id,user_id,message,session_id,sender,read,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error) return;
    if (!data?.length) {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        session_id: user.id,
        sender: 'admin',
        read: false,
        message: welcomeMessage,
      });
      await loadMessages();
      return;
    }
    setMessages(data);
    setUnread(data.filter((message) => message.sender === 'admin' && !message.read).length);
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
  }, [messages.length, isOpen]);

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
      {isOpen ? (
        <div className="fixed inset-x-3 bottom-24 flex h-[min(85vh,720px)] flex-col overflow-hidden rounded-3xl border border-brand-400/20 bg-[#0F2027] shadow-2xl sm:static sm:mb-4 sm:h-[700px] sm:w-[460px] sm:max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between border-b border-line bg-white/[0.03] px-5 py-4">
            <div>
              <p className="font-display text-lg font-bold text-white">Asistente ContactHub</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-brand-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />
                Guía de precios, carpetas, pagos y acceso
              </p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-line bg-white/5 p-2 text-white transition hover:border-brand-400/40">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={messagesRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5 scroll-smooth">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-6 shadow-sm ${message.sender === 'user' ? 'rounded-br-md bg-brand-500 text-ink-950' : 'rounded-bl-md bg-white/10 text-white'}`}>
                  <p className="whitespace-pre-wrap">{message.message}</p>
                  <p className="mt-2 text-[10px] opacity-65">{new Date(message.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-line bg-ink-950/40 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
              {currentFlow === 'main' ? 'Elige una opción rápida' : `Opciones de ${currentFlow === 'folderDetail' ? 'carpeta' : currentFlow}`}
            </p>
            <div className="mb-4 max-h-48 overflow-y-auto rounded-2xl border border-line bg-white/[0.03] p-3">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={`${action.type}-${action.value ?? action.label}`}
                    type="button"
                    onClick={() => void handleAction(action)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition hover:border-brand-400/50 hover:bg-brand-400/10 ${
                      action.type === 'whatsapp' ? 'border-brand-400/35 bg-brand-400/10 text-brand-200' : 'border-line bg-white/5 text-gray-200'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end gap-2 rounded-2xl border border-line bg-ink-950/70 p-2">
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
              <button type="button" onClick={() => void sendMessage()} className="focus-ring inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-500 text-ink-950 transition hover:bg-white active:scale-95">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button type="button" onClick={() => setIsOpen((current) => !current)} className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1DB47A] text-ink-950 shadow-glow transition hover:scale-105 active:scale-95">
        <MessageCircle className="h-6 w-6" />
        {unread ? <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unread}</span> : null}
      </button>
    </div>
  );
}
