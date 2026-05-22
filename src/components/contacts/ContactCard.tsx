import { Clipboard, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { formatPhone, maskPhone } from '../../utils/phone';

type ContactCardContact = {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  phoneMasked?: string | null;
  tags?: string[] | null;
};

type ContactCardProps = {
  contact: ContactCardContact;
  canSeeFullPhone: boolean;
  isAdmin?: boolean;
  isTrialUnlocked?: boolean;
  isRewardUnlocked?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDeactivate?: () => void;
};

export default function ContactCard({
  contact,
  canSeeFullPhone,
  isAdmin = false,
  isTrialUnlocked = false,
  isRewardUnlocked = false,
  onEdit,
  onDelete,
  onDeactivate,
}: ContactCardProps) {
  const tags = contact.tags ?? [];
  const visiblePhone = canSeeFullPhone ? formatPhone(contact.phone) : maskPhone(contact.phone ?? contact.phoneMasked);

  async function copyPhone() {
    if (!canSeeFullPhone || !contact.phone) return;
    await navigator.clipboard.writeText(formatPhone(contact.phone));
    toast.success('Número copiado.');
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-panel p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400/35">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold leading-snug text-white">{contact.name}</h3>
            {isTrialUnlocked ? <span className="rounded-full bg-brand-400 px-2 py-1 text-[10px] font-black text-ink-950">PRUEBA GRATIS</span> : null}
            {isRewardUnlocked ? <span className="rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-ink-950">RECOMPENSA</span> : null}
            {isAdmin ? <span className="rounded-full border border-line bg-white/5 px-2 py-1 text-[10px] font-black text-gray-300">ADMIN</span> : null}
          </div>
          {contact.description ? <p className="mt-2 text-sm leading-6 text-gray-400">{contact.description}</p> : null}
        </div>
        {!canSeeFullPhone ? <LockKeyhole className="mt-1 h-5 w-5 flex-none text-brand-400" /> : null}
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
            <p className="mt-1 font-mono text-base font-bold text-white">{visiblePhone}</p>
            {!canSeeFullPhone ? <p className="mt-1 text-xs text-gray-500">Número completo disponible al desbloquear.</p> : null}
          </div>

          {canSeeFullPhone ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyPhone()}
                className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-4 text-xs font-bold text-white transition duration-150 hover:scale-[1.02] hover:border-brand-400/35 active:scale-95"
              >
                <Clipboard className="h-4 w-4" />
                Copiar
              </button>
            </div>
          ) : null}

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
