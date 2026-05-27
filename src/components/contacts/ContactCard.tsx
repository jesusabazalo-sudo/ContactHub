import { Clipboard, LockKeyhole, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getPhoneDisplay, phoneToWhatsapp } from '../../utils/phone';

type ContactCardContact = {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  phoneMasked?: string | null;
  phone_masked?: string | null;
  countryFlag?: string | null;
  country_flag?: string | null;
  tags?: string[] | null;
};

type ContactCardProps = {
  contact: ContactCardContact;
  canSeeFullPhone: boolean;
  canContactDirect?: boolean;
  accessLevel?: 0 | 1 | 2;
  isAdmin?: boolean;
  isTrialUnlocked?: boolean;
  isRewardUnlocked?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDeactivate?: () => void;
};

function displayPhone(contact: ContactCardContact, accessLevel: 0 | 1 | 2) {
  const maskedPhone = contact.phoneMasked ?? contact.phone_masked;
  const sourcePhone = contact.phone ?? maskedPhone;
  return getPhoneDisplay(sourcePhone, accessLevel);
}

function getWhatsAppMessage(contactName: string) {
  const messages = [
    `Hola, vi tu oferta de "${contactName}" y me interesa saber más. ¿Podrías darme los detalles?`,
    `Buenas, estaba buscando algo como lo que ofreces en "${contactName}". ¿Cuánto cuesta y cómo funciona?`,
    `Hola! Me apareció tu oferta de "${contactName}" y quería consultarte algo. ¿Tienes un momento?`,
    `Hola, vi que ofreces "${contactName}". ¿Aún está disponible? ¿Cómo puedo obtenerlo?`,
    `Buenas! Tengo interés en "${contactName}". ¿Me puedes dar más información?`,
    `Hola, encontré tu contacto y me interesa lo que ofreces: "${contactName}". ¿Cómo trabajamos?`,
    `Hola! Quería preguntarte sobre "${contactName}". ¿Sigue disponible y cuál es el precio?`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function openWhatsApp(phone: string | null | undefined, contactName: string) {
  const cleanPhone = phoneToWhatsapp(phone);
  if (!cleanPhone) {
    toast.error('Este contacto no tiene un número válido.');
    return;
  }

  const message = encodeURIComponent(getWhatsAppMessage(contactName));
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url = isMobile ? `whatsapp://send?phone=${cleanPhone}&text=${message}` : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${message}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function ContactCard({
  contact,
  canSeeFullPhone,
  canContactDirect,
  accessLevel,
  isAdmin = false,
  isTrialUnlocked = false,
  isRewardUnlocked = false,
  onEdit,
  onDelete,
  onDeactivate,
}: ContactCardProps) {
  const navigate = useNavigate();
  const tags = contact.tags ?? [];
  const resolvedAccessLevel: 0 | 1 | 2 = accessLevel ?? (canSeeFullPhone ? 2 : 1);
  const visiblePhone = displayPhone(contact, resolvedAccessLevel);
  const countryFlag = contact.countryFlag ?? contact.country_flag ?? '';
  const showDirectActions = Boolean(canContactDirect ?? resolvedAccessLevel === 2);

  async function copyPhone() {
    if (!showDirectActions || !contact.phone) return;
    await navigator.clipboard.writeText(contact.phone);
    toast.success('Número copiado');
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-panel p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400/35">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold leading-snug text-white">{contact.name}</h3>
            {isTrialUnlocked ? <span className="rounded-full bg-brand-400 px-2 py-1 text-[10px] font-black text-ink-950">PRUEBA GRATIS</span> : null}
            {isRewardUnlocked ? <span className="rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-ink-950">RECOMPENSA</span> : null}
          </div>
          {contact.description ? <p className="mt-2 text-sm leading-6 text-gray-400">{contact.description}</p> : null}
        </div>
        {!showDirectActions ? <LockKeyhole className="mt-1 h-5 w-5 flex-none text-brand-400" /> : null}
      </div>

      {tags.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-400">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto border-t border-line pt-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Teléfono</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold text-white">
                {countryFlag ? `${countryFlag} ` : ''}
                {visiblePhone}
              </span>
              {isAdmin ? <span className="rounded-full border border-brand-400/30 bg-brand-400/15 px-2 py-1 text-[10px] font-black text-brand-200">ADMIN</span> : null}
              {!showDirectActions ? <span className="rounded-full border border-line bg-white/5 px-2 py-1 text-[10px] font-black text-gray-400">🔒 Bloqueado</span> : null}
            </div>
            {!showDirectActions ? <p className="mt-1 text-xs text-gray-500">Número completo disponible al desbloquear.</p> : null}
          </div>

          {showDirectActions ? (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => openWhatsApp(contact.phone, contact.name)}
                className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white transition duration-200 hover:bg-[#1db857] active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                Escribir por WhatsApp
              </button>
              <button
                type="button"
                onClick={() => void copyPhone()}
                className="focus-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-4 text-xs font-semibold text-white/70 transition duration-150 hover:border-brand-400/35 hover:text-white active:scale-[0.98]"
              >
                <Clipboard className="h-4 w-4" />
                Copiar número
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate(resolvedAccessLevel === 0 ? '/auth' : '/precios')}
              className={`focus-ring inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-xs font-bold transition ${
                resolvedAccessLevel === 0
                  ? 'border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                  : 'border border-brand-400/30 bg-brand-400/15 text-brand-300 hover:bg-brand-400/20'
              }`}
            >
              {resolvedAccessLevel === 0 ? '👤 Regístrate gratis para ver más' : '🔒 Desbloquea esta carpeta para contactar'}
            </button>
          )}

          {isAdmin && (onEdit || onDeactivate || onDelete) ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {onEdit ? (
                <button type="button" onClick={onEdit} className="focus-ring rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white hover:border-brand-400/35">
                  Editar
                </button>
              ) : null}
              {onDeactivate ? (
                <button type="button" onClick={onDeactivate} className="focus-ring rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-bold text-white hover:border-brand-400/35">
                  Desactivar
                </button>
              ) : null}
              {onDelete ? (
                <button type="button" onClick={onDelete} className="focus-ring rounded-full border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-100">
                  Eliminar
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
