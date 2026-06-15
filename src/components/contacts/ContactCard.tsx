import { Clipboard, LockKeyhole, MessageCircle } from 'lucide-react';
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
    <article
      style={{
        background: 'rgba(29,180,122,0.05)',
        border: '0.5px solid rgba(29,180,122,0.15)',
        borderRadius: '12px',
        padding: '16px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = 'rgba(29,180,122,0.5)';
        event.currentTarget.style.transform = 'translateY(-2px)';
        event.currentTarget.style.boxShadow = '0 4px 16px rgba(29,180,122,0.1)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = 'rgba(29,180,122,0.15)';
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.boxShadow = 'none';
      }}
      className="flex h-full flex-col"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-400">{categoryName}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px', lineHeight: '1.3' }}>{contact.name}</h3>
            {isTrialUnlocked ? <span className="rounded-full bg-brand-400 px-2 py-1 text-[10px] font-black text-ink-950">PRUEBA GRATIS</span> : null}
            {isRewardUnlocked ? <span className="rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-ink-950">RECOMPENSA</span> : null}
          </div>
          {contact.description ? (
            <p style={{ fontSize: '12px', fontStyle: 'italic', fontWeight: 600, color: '#1DB47A', marginBottom: '10px', lineHeight: '1.4', borderLeft: '2px solid #1DB47A', paddingLeft: '8px' }}>
              {contact.description}
            </p>
          ) : null}
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
              <span style={{ fontSize: '13px', fontFamily: 'monospace', color: showDirectActions ? '#fff' : 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
                {countryFlag ? `${countryFlag} ` : ''}
                {visiblePhone}
              </span>
              {showDirectActions ? <span style={{ marginLeft: '8px', fontSize: '10px', background: 'rgba(29,180,122,0.2)', color: '#1DB47A', padding: '2px 6px', borderRadius: '4px', fontStyle: 'normal' }}>DESBLOQUEADO</span> : null}
              {isAdmin ? <span className="rounded-full border border-brand-400/30 bg-brand-400/15 px-2 py-1 text-[10px] font-black text-brand-200">ADMIN</span> : null}
              {!showDirectActions ? <span className="rounded-full border border-line bg-white/5 px-2 py-1 text-[10px] font-black text-gray-400">🔒 Bloqueado</span> : null}
            </div>
            {!showDirectActions ? (
              <p className="mt-1 text-xs text-gray-500">Número completo disponible al desbloquear.</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">Vista segura: este número no aparece en previews públicos.</p>
            )}
          </div>

          {showDirectActions ? (
            <div className="grid gap-2">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white transition duration-200 hover:bg-[#1db857] active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-bold text-white/35"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp no disponible
                </button>
              )}
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
