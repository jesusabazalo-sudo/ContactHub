import {
  Baby,
  BadgeCheck,
  Brain,
  ChefHat,
  Clapperboard,
  Clipboard,
  Cpu,
  Dumbbell,
  FlaskConical,
  Folder,
  Gamepad2,
  GraduationCap,
  Lock,
  MessageCircle,
  Music,
  Palette,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { buildContactWhatsAppMessage, buildWhatsAppLink } from '../../lib/whatsapp';
import { getPhoneDisplay } from '../../utils/phone';

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
  categoryName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onDeactivate?: () => void;
};

// Ícono según la categoría (texto del nombre de carpeta). La primera regla que
// coincide gana; el resto cae en un ícono genérico.
const CATEGORY_ICONS: Array<[RegExp, LucideIcon]> = [
  [/negocio|proveedor|empresa|elite business|corporate/, Store],
  [/ciencia|science/, FlaskConical],
  [/educaci|curso|libro|knowledge/, GraduationCap],
  [/inteligencia artificial|ia masters|\bia\b|tech|digital/, Cpu],
  [/fitness|salud|nutric|fit kingdom|warrior/, Dumbbell],
  [/dise[ñn]|creativ|foto/, Palette],
  [/gaming|gamer|enterplay|juego|streaming/, Gamepad2],
  [/marketing|scale up|crecimiento|redes/, TrendingUp],
  [/m[uú]sica|audio|beat studio|\bdj\b/, Music],
  [/dinero|cash flow|escalable|finanz/, Wallet],
  [/mente|mind power|desarrollo personal|rendimiento/, Brain],
  [/contenido|viral|edici[oó]n/, Clapperboard],
  [/familia|infantil|crianza|family care/, Baby],
  [/oficio|herramienta|reparaci|pro tools|tech repair/, Wrench],
  [/gastronom|cocina|chef|comida/, ChefHat],
  [/espiritual|sacred|soul|bienestar/, Sparkles],
];

function getCategoryIcon(categoryName: string): LucideIcon {
  const folded = categoryName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [pattern, Icon] of CATEGORY_ICONS) if (pattern.test(folded)) return Icon;
  return Folder;
}

function displayPhone(contact: ContactCardContact, accessLevel: 0 | 1 | 2) {
  const maskedPhone = contact.phoneMasked ?? contact.phone_masked;
  const sourcePhone = contact.phone ?? maskedPhone;
  return getPhoneDisplay(sourcePhone, accessLevel);
}

export default function ContactCard({
  contact,
  canSeeFullPhone,
  canContactDirect,
  accessLevel,
  isAdmin = false,
  isTrialUnlocked = false,
  isRewardUnlocked = false,
  categoryName = 'ContactHub',
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
  const whatsappUrl = showDirectActions
    ? buildWhatsAppLink(contact.phone, buildContactWhatsAppMessage(contact.name, categoryName))
    : '';
  const CategoryIcon = getCategoryIcon(categoryName);

  async function copyPhone() {
    if (!showDirectActions || !contact.phone) return;
    await navigator.clipboard.writeText(contact.phone);
    toast.success('Número copiado');
  }

  return (
    <article className="card-hover stable-card group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card-sm">
      {/* Encabezado: ícono de categoría + nombre protagonista */}
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand/[0.12] text-brand-text transition group-hover:bg-brand/20">
          <CategoryIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text">{categoryName}</p>
          <h3 className="mt-0.5 text-[17px] font-semibold leading-snug text-content">{contact.name}</h3>
        </div>
        {!showDirectActions ? (
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border bg-muted text-content-muted">
            <Lock className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      {isTrialUnlocked || isRewardUnlocked ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {isTrialUnlocked ? (
            <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-text">
              Prueba gratis
            </span>
          ) : null}
          {isRewardUnlocked ? (
            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
              Recompensa
            </span>
          ) : null}
        </div>
      ) : null}

      {contact.description ? (
        <p className="mt-3 border-l-2 border-brand/40 pl-3 text-[13px] leading-relaxed text-content-secondary">
          {contact.description}
        </p>
      ) : null}

      {tags.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-md bg-muted px-2.5 py-1 text-xs text-content-secondary">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Bloque inferior anclado: teléfono protagonista + acciones */}
      <div className="mt-auto pt-4">
        <div className="rounded-xl border border-border bg-muted px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-content-muted">Teléfono</p>
              <p
                className={`mt-1 font-mono text-lg tracking-[0.04em] ${
                  showDirectActions ? 'text-content' : 'text-content-muted'
                }`}
              >
                {countryFlag ? `${countryFlag} ` : ''}
                {visiblePhone}
              </p>
            </div>
            <div className="flex flex-none flex-col items-end gap-1.5">
              {showDirectActions ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-text">
                  <BadgeCheck className="h-3 w-3" />
                  Desbloqueado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-content-muted">
                  <Lock className="h-3 w-3" />
                  Bloqueado
                </span>
              )}
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-text">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
              ) : null}
            </div>
          </div>
          <p className="mt-2 text-xs text-content-muted">
            {showDirectActions
              ? 'Vista segura: este número no aparece en previews públicos.'
              : 'Número completo disponible al desbloquear.'}
          </p>
        </div>

        <div className="mt-3">
          {showDirectActions ? (
            <div className="grid gap-2">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,211,102,0.25)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1eb858] hover:shadow-[0_12px_28px_rgba(37,211,102,0.45)] active:translate-y-0 active:scale-[0.98]"
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                  Consultar por WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 text-sm font-semibold text-content-muted"
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                  WhatsApp no disponible
                </button>
              )}
              <button
                type="button"
                onClick={() => void copyPhone()}
                className="focus-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-xs font-semibold text-content-secondary transition duration-150 hover:border-brand/40 hover:text-content active:scale-[0.98]"
              >
                <Clipboard className="h-4 w-4" />
                Copiar número
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate(resolvedAccessLevel === 0 ? '/auth' : '/precios')}
              className={`focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 ${
                resolvedAccessLevel === 0
                  ? 'border border-border bg-surface text-content-secondary hover:border-brand/40 hover:text-content'
                  : 'bg-brand text-brand-contrast shadow-[0_4px_14px_rgb(var(--brand)/0.22)] hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-[0_12px_28px_rgb(var(--brand)/0.34)] active:translate-y-0 active:scale-[0.98]'
              }`}
            >
              {resolvedAccessLevel === 0 ? 'Regístrate gratis para ver más' : 'Desbloquea esta carpeta para contactar'}
            </button>
          )}

          {isAdmin && (onEdit || onDeactivate || onDelete) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="focus-ring rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-content transition hover:border-brand/40"
                >
                  Editar
                </button>
              ) : null}
              {onDeactivate ? (
                <button
                  type="button"
                  onClick={onDeactivate}
                  className="focus-ring rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-content transition hover:border-brand/40"
                >
                  Desactivar
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="focus-ring rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-danger/15"
                >
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
