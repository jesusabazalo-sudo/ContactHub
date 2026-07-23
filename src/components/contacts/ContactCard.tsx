import {
  Baby,
  BadgeCheck,
  Brain,
  Check,
  ChefHat,
  Clapperboard,
  Clipboard,
  Cpu,
  Dumbbell,
  FlaskConical,
  Folder,
  Gamepad2,
  Gift,
  GraduationCap,
  Lock,
  MessageCircle,
  Music,
  Palette,
  Scissors,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
  TrendingUp,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { memo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { useRipple } from '../../hooks/useRipple';
import { recordContactAction } from '../../lib/activityTracking';
import { notify } from '../../lib/toast';
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
  [/manualidad|sports lab/, Scissors],
  [/deporte|f[uú]tbol/, Trophy],
  [/bonus|hunt|hallazgo|oportunidad/, Gift],
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

function ContactCard({
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
  const { user } = useAuth();
  const tags = contact.tags ?? [];
  const resolvedAccessLevel: 0 | 1 | 2 = accessLevel ?? (canSeeFullPhone ? 2 : 1);
  const visiblePhone = displayPhone(contact, resolvedAccessLevel);
  const countryFlag = contact.countryFlag ?? contact.country_flag ?? '';
  const showDirectActions = Boolean(canContactDirect ?? resolvedAccessLevel === 2);
  const whatsappUrl = showDirectActions
    ? buildWhatsAppLink(contact.phone, buildContactWhatsAppMessage(contact.name, categoryName))
    : '';
  const CategoryIcon = getCategoryIcon(categoryName);

  const [isCopied, setIsCopied] = useState(false);
  const [isWhatsappPulsing, setIsWhatsappPulsing] = useState(false);
  const [isLockTooltipVisible, setIsLockTooltipVisible] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const whatsappPulseTimeoutRef = useRef<number | null>(null);
  const copyRipple = useRipple<HTMLButtonElement>();
  const whatsappRipple = useRipple<HTMLAnchorElement>();
  const unlockRipple = useRipple<HTMLButtonElement>();

  async function copyPhone() {
    if (!showDirectActions || !contact.phone) return;
    await navigator.clipboard.writeText(contact.phone);
    notify.success('Número copiado');
    setIsCopied(true);
    if (copyResetTimeoutRef.current) window.clearTimeout(copyResetTimeoutRef.current);
    copyResetTimeoutRef.current = window.setTimeout(() => setIsCopied(false), 2000);
    if (user?.id) void recordContactAction(user.id, contact.id, 'copy');
  }

  function pulseWhatsapp() {
    setIsWhatsappPulsing(true);
    if (whatsappPulseTimeoutRef.current) window.clearTimeout(whatsappPulseTimeoutRef.current);
    whatsappPulseTimeoutRef.current = window.setTimeout(() => setIsWhatsappPulsing(false), 420);
    if (user?.id) void recordContactAction(user.id, contact.id, 'whatsapp');
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
          <span
            className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border bg-muted text-content-muted"
            onMouseEnter={() => setIsLockTooltipVisible(true)}
            onMouseLeave={() => setIsLockTooltipVisible(false)}
            onFocus={() => setIsLockTooltipVisible(true)}
            onBlur={() => setIsLockTooltipVisible(false)}
          >
            <Lock className="h-4 w-4" tabIndex={0} />
            <span
              role="tooltip"
              className={`copy-tooltip pointer-events-none absolute right-0 z-20 w-56 rounded-lg border border-border bg-elevated px-3 py-2 text-left text-xs leading-5 text-content-secondary shadow-lg ${isLockTooltipVisible ? 'is-visible' : ''}`}
            >
              <span className="flex items-center gap-1.5 font-semibold text-content">
                <Lock className="h-3 w-3 text-brand-text" />
                Desbloquea esta carpeta para ver el número completo →
              </span>
            </span>
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
                className={`mt-1 font-mono text-[22px] font-medium leading-tight tracking-[0.03em] ${
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
                  ref={whatsappRipple.ref}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onPointerDown={whatsappRipple.onPointerDown}
                  onClick={pulseWhatsapp}
                  className={`ripple-container focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(37,211,102,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1eb858] hover:shadow-[0_14px_32px_rgba(37,211,102,0.40)] active:translate-y-0 active:scale-[0.98] ${isWhatsappPulsing ? 'animate-whatsapp-pulse' : ''}`}
                >
                  <MessageCircle className={`h-[18px] w-[18px] ${isWhatsappPulsing ? 'animate-icon-spin' : ''}`} />
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
              <div className="relative">
                <button
                  ref={copyRipple.ref}
                  type="button"
                  onPointerDown={copyRipple.onPointerDown}
                  onClick={() => void copyPhone()}
                  className={`ripple-container focus-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition duration-150 active:scale-[0.98] ${
                    isCopied
                      ? 'border-brand/40 bg-brand/10 text-brand-text'
                      : 'border-border bg-surface text-content-secondary hover:border-brand/40 hover:text-content'
                  }`}
                >
                  {isCopied ? (
                    <Check key="check" className="h-4 w-4 animate-check-pop" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                  {isCopied ? 'Copiado ✓' : 'Copiar número'}
                </button>
                <span className={`copy-tooltip absolute left-1/2 -translate-x-1/2 rounded-lg bg-content px-3 py-1.5 text-xs font-semibold text-content-inverse shadow-lg ${isCopied ? 'is-visible' : ''}`}>
                  ¡Número copiado!
                </span>
              </div>
            </div>
          ) : (
            <button
              ref={unlockRipple.ref}
              type="button"
              onPointerDown={unlockRipple.onPointerDown}
              onClick={() => navigate(resolvedAccessLevel === 0 ? '/auth' : '/precios')}
              className={`ripple-container focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 ${
                resolvedAccessLevel === 0
                  ? 'border border-border bg-surface text-content-secondary hover:border-brand/40 hover:text-content'
                  : 'bg-brand text-brand-contrast shadow-[0_2px_12px_rgb(var(--brand)/0.16)] transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-[0_14px_32px_rgb(var(--brand)/0.34)] active:translate-y-0 active:scale-[0.98]'
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

export default memo(ContactCard);
