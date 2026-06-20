import { Check, Clipboard, Lock, MessageCircle } from 'lucide-react';
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

  async function copyPhone() {
    if (!showDirectActions || !contact.phone) return;
    await navigator.clipboard.writeText(contact.phone);
    toast.success('Número copiado');
  }

  return (
    <article className="card-hover stable-card flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text">{categoryName}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold leading-snug text-content">{contact.name}</h3>
            {isTrialUnlocked ? (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-text">
                Prueba gratis
              </span>
            ) : null}
            {isRewardUnlocked ? (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
                Recompensa
              </span>
            ) : null}
          </div>
          {contact.description ? (
            <p className="mt-2.5 border-l-2 border-brand/40 pl-3 text-[13px] leading-relaxed text-content-secondary">
              {contact.description}
            </p>
          ) : null}
        </div>
        {!showDirectActions ? (
          <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border bg-muted text-content-muted">
            <Lock className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      {tags.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-content-secondary">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto border-t border-border pt-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-content-muted">Teléfono</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`font-mono text-sm tracking-[0.04em] ${showDirectActions ? 'text-content' : 'text-content-muted'}`}
              >
                {countryFlag ? `${countryFlag} ` : ''}
                {visiblePhone}
              </span>
              {showDirectActions ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-text">
                  <Check className="h-3 w-3" />
                  Desbloqueado
                </span>
              ) : null}
              {isAdmin ? (
                <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-text">
                  Admin
                </span>
              ) : null}
            </div>
            {!showDirectActions ? (
              <p className="mt-1.5 text-xs text-content-muted">Número completo disponible al desbloquear.</p>
            ) : (
              <p className="mt-1.5 text-xs text-content-muted">Vista segura: este número no aparece en previews públicos.</p>
            )}
          </div>

          {showDirectActions ? (
            <div className="grid gap-2">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-white transition duration-200 hover:bg-[#1eb858] active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 text-sm font-semibold text-content-muted"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp no disponible
                </button>
              )}
              <button
                type="button"
                onClick={() => void copyPhone()}
                className="focus-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-xs font-semibold text-content-secondary transition duration-150 hover:border-brand/40 hover:text-content active:scale-[0.98]"
              >
                <Clipboard className="h-4 w-4" />
                Copiar número
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate(resolvedAccessLevel === 0 ? '/auth' : '/precios')}
              className={`focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-semibold transition ${
                resolvedAccessLevel === 0
                  ? 'border border-border bg-surface text-content-secondary hover:border-brand/40 hover:text-content'
                  : 'bg-brand text-brand-contrast hover:bg-brand-hover'
              }`}
            >
              {resolvedAccessLevel === 0 ? 'Regístrate gratis para ver más' : 'Desbloquea esta carpeta para contactar'}
            </button>
          )}

          {isAdmin && (onEdit || onDeactivate || onDelete) ? (
            <div className="flex flex-wrap gap-2 pt-1">
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
